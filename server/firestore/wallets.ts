import { getFirestoreDb } from "../firebase-admin";
import { Wallet, WalletTransaction, COLLECTIONS } from "./collections";
import { FieldValue } from "firebase-admin/firestore";

export async function createWallet(userId: string): Promise<Wallet> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const wallet: Wallet = {
    userId,
    availableBalance: 0,
    escrowBalance: 0,
    currency: 'NGN',
    status: 'active',
    lastUpdated: now,
    createdAt: now,
  };
  
  await db.collection(COLLECTIONS.WALLETS).doc(userId).set(wallet);
  return wallet;
}

export async function getWalletByUserId(userId: string): Promise<Wallet | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.WALLETS).doc(userId).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as Wallet;
}

export async function getOrCreateWallet(userId: string): Promise<Wallet> {
  let wallet = await getWalletByUserId(userId);
  if (!wallet) {
    wallet = await createWallet(userId);
  }
  return wallet;
}

export async function updateWalletBalance(
  userId: string,
  availableBalanceChange: number,
  escrowBalanceChange: number = 0
): Promise<Wallet> {
  const db = getFirestoreDb();
  const walletRef = db.collection(COLLECTIONS.WALLETS).doc(userId);
  
  await walletRef.update({
    availableBalance: FieldValue.increment(availableBalanceChange),
    escrowBalance: FieldValue.increment(escrowBalanceChange),
    lastUpdated: new Date(),
  });
  
  const updated = await walletRef.get();
  return updated.data() as Wallet;
}

export async function creditWallet(
  userId: string,
  amount: number,
  reference: string,
  description: string,
  paystackReference: string | null = null,
  metadata: Record<string, any> | null = null
): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
  const db = getFirestoreDb();
  
  return db.runTransaction(async (transaction) => {
    const walletRef = db.collection(COLLECTIONS.WALLETS).doc(userId);
    const walletDoc = await transaction.get(walletRef);
    
    if (!walletDoc.exists) {
      throw new Error("Wallet not found");
    }
    
    const wallet = walletDoc.data() as Wallet;
    const balanceBefore = wallet.availableBalance;
    const balanceAfter = balanceBefore + amount;
    const now = new Date();
    
    const txnRef = db.collection(COLLECTIONS.WALLET_TRANSACTIONS).doc();
    const walletTransaction: WalletTransaction = {
      walletId: userId,
      userId,
      type: 'deposit',
      amount,
      balanceBefore,
      balanceAfter,
      reference,
      description,
      status: 'completed',
      paystackReference,
      metadata,
      createdAt: now,
      completedAt: now,
    };
    
    transaction.update(walletRef, {
      availableBalance: balanceAfter,
      lastUpdated: now,
    });
    
    transaction.set(txnRef, walletTransaction);
    
    return {
      wallet: { ...wallet, availableBalance: balanceAfter, lastUpdated: now },
      transaction: { ...walletTransaction, id: txnRef.id },
    };
  });
}

export async function debitWallet(
  userId: string,
  amount: number,
  type: 'withdrawal' | 'escrow_lock' | 'fee',
  reference: string,
  description: string,
  paystackReference: string | null = null,
  metadata: Record<string, any> | null = null
): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
  const db = getFirestoreDb();
  
  return db.runTransaction(async (transaction) => {
    const walletRef = db.collection(COLLECTIONS.WALLETS).doc(userId);
    const walletDoc = await transaction.get(walletRef);
    
    if (!walletDoc.exists) {
      throw new Error("Wallet not found");
    }
    
    const wallet = walletDoc.data() as Wallet;
    
    if (wallet.availableBalance < amount) {
      throw new Error("Insufficient balance");
    }
    
    const balanceBefore = wallet.availableBalance;
    const balanceAfter = balanceBefore - amount;
    const now = new Date();
    
    const txnRef = db.collection(COLLECTIONS.WALLET_TRANSACTIONS).doc();
    const walletTransaction: WalletTransaction = {
      walletId: userId,
      userId,
      type,
      amount: -amount,
      balanceBefore,
      balanceAfter,
      reference,
      description,
      status: type === 'withdrawal' ? 'pending' : 'completed',
      paystackReference,
      metadata,
      createdAt: now,
      completedAt: type === 'withdrawal' ? null : now,
    };
    
    const updates: any = {
      availableBalance: balanceAfter,
      lastUpdated: now,
    };
    
    if (type === 'escrow_lock') {
      updates.escrowBalance = FieldValue.increment(amount);
    }
    
    transaction.update(walletRef, updates);
    transaction.set(txnRef, walletTransaction);
    
    return {
      wallet: { 
        ...wallet, 
        availableBalance: balanceAfter, 
        escrowBalance: type === 'escrow_lock' ? wallet.escrowBalance + amount : wallet.escrowBalance,
        lastUpdated: now 
      },
      transaction: { ...walletTransaction, id: txnRef.id },
    };
  });
}

export async function releaseEscrow(
  requesterId: string,
  helperId: string,
  amount: number,
  platformFee: number,
  escrowId: string,
  requestId: string
): Promise<void> {
  const db = getFirestoreDb();
  const now = new Date();
  
  await db.runTransaction(async (transaction) => {
    const requesterWalletRef = db.collection(COLLECTIONS.WALLETS).doc(requesterId);
    const helperWalletRef = db.collection(COLLECTIONS.WALLETS).doc(helperId);
    
    const [requesterDoc, helperDoc] = await Promise.all([
      transaction.get(requesterWalletRef),
      transaction.get(helperWalletRef),
    ]);
    
    if (!requesterDoc.exists || !helperDoc.exists) {
      throw new Error("Wallet not found");
    }
    
    const requesterWallet = requesterDoc.data() as Wallet;
    const helperWallet = helperDoc.data() as Wallet;
    
    if (requesterWallet.escrowBalance < amount) {
      throw new Error("Insufficient escrow balance");
    }
    
    const helperAmount = amount - platformFee;
    
    transaction.update(requesterWalletRef, {
      escrowBalance: FieldValue.increment(-amount),
      lastUpdated: now,
    });
    
    transaction.update(helperWalletRef, {
      availableBalance: FieldValue.increment(helperAmount),
      lastUpdated: now,
    });
    
    const requesterTxnRef = db.collection(COLLECTIONS.WALLET_TRANSACTIONS).doc();
    transaction.set(requesterTxnRef, {
      walletId: requesterId,
      userId: requesterId,
      type: 'escrow_release',
      amount: -amount,
      balanceBefore: requesterWallet.escrowBalance,
      balanceAfter: requesterWallet.escrowBalance - amount,
      reference: `escrow_release_${escrowId}`,
      description: `Escrow released for task ${requestId}`,
      status: 'completed',
      paystackReference: null,
      metadata: { escrowId, requestId, helperId },
      createdAt: now,
      completedAt: now,
    });
    
    const helperTxnRef = db.collection(COLLECTIONS.WALLET_TRANSACTIONS).doc();
    transaction.set(helperTxnRef, {
      walletId: helperId,
      userId: helperId,
      type: 'escrow_release',
      amount: helperAmount,
      balanceBefore: helperWallet.availableBalance,
      balanceAfter: helperWallet.availableBalance + helperAmount,
      reference: `helper_payment_${escrowId}`,
      description: `Payment received for task ${requestId}`,
      status: 'completed',
      paystackReference: null,
      metadata: { escrowId, requestId, requesterId, platformFee },
      createdAt: now,
      completedAt: now,
    });
    
    if (platformFee > 0) {
      const revenueRef = db.collection(COLLECTIONS.PLATFORM_REVENUE).doc();
      transaction.set(revenueRef, {
        requestId,
        escrowId,
        amount: platformFee,
        description: `Platform fee for task ${requestId}`,
        createdAt: now,
      });
    }
  });
}

export async function refundEscrow(
  userId: string,
  amount: number,
  escrowId: string,
  requestId: string
): Promise<void> {
  const db = getFirestoreDb();
  const now = new Date();
  
  await db.runTransaction(async (transaction) => {
    const walletRef = db.collection(COLLECTIONS.WALLETS).doc(userId);
    const walletDoc = await transaction.get(walletRef);
    
    if (!walletDoc.exists) {
      throw new Error("Wallet not found");
    }
    
    const wallet = walletDoc.data() as Wallet;
    
    if (wallet.escrowBalance < amount) {
      throw new Error("Insufficient escrow balance");
    }
    
    transaction.update(walletRef, {
      availableBalance: FieldValue.increment(amount),
      escrowBalance: FieldValue.increment(-amount),
      lastUpdated: now,
    });
    
    const txnRef = db.collection(COLLECTIONS.WALLET_TRANSACTIONS).doc();
    transaction.set(txnRef, {
      walletId: userId,
      userId,
      type: 'escrow_refund',
      amount,
      balanceBefore: wallet.availableBalance,
      balanceAfter: wallet.availableBalance + amount,
      reference: `escrow_refund_${escrowId}`,
      description: `Escrow refunded for cancelled task ${requestId}`,
      status: 'completed',
      paystackReference: null,
      metadata: { escrowId, requestId },
      createdAt: now,
      completedAt: now,
    });
  });
}

export async function getWalletTransactions(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<WalletTransaction[]> {
  const db = getFirestoreDb();
  
  const snapshot = await db.collection(COLLECTIONS.WALLET_TRANSACTIONS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .offset(offset)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction));
}

export async function getWalletTransactionsByType(
  userId: string,
  type: WalletTransaction['type'],
  limit: number = 50
): Promise<WalletTransaction[]> {
  const db = getFirestoreDb();
  
  const snapshot = await db.collection(COLLECTIONS.WALLET_TRANSACTIONS)
    .where('userId', '==', userId)
    .where('type', '==', type)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction));
}
