import { getFirestoreDb } from "../firebase-admin";
import { PendingTransaction, COLLECTIONS } from "./collections";
import { creditWallet } from "./wallets";
import { notifyDeposit, notifyWithdrawal } from "./notifications";

export async function createPendingDeposit(
  userId: string,
  amount: number,
  paystackReference: string
): Promise<PendingTransaction> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const transaction: PendingTransaction = {
    userId,
    type: 'deposit',
    amount,
    paystackReference,
    status: 'pending',
    createdAt: now,
    processedAt: null,
  };
  
  const docRef = await db.collection(COLLECTIONS.PENDING_TRANSACTIONS).add(transaction);
  return { ...transaction, id: docRef.id };
}

export async function createPendingWithdrawal(
  userId: string,
  amount: number,
  paystackReference: string
): Promise<PendingTransaction> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const transaction: PendingTransaction = {
    userId,
    type: 'withdrawal',
    amount,
    paystackReference,
    status: 'pending',
    createdAt: now,
    processedAt: null,
  };
  
  const docRef = await db.collection(COLLECTIONS.PENDING_TRANSACTIONS).add(transaction);
  return { ...transaction, id: docRef.id };
}

export async function getPendingTransactionByReference(
  paystackReference: string
): Promise<PendingTransaction | null> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.PENDING_TRANSACTIONS)
    .where('paystackReference', '==', paystackReference)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as PendingTransaction;
}

export async function processDepositSuccess(
  paystackReference: string,
  amountInKobo: number
): Promise<void> {
  const db = getFirestoreDb();
  
  const pendingTxn = await getPendingTransactionByReference(paystackReference);
  if (!pendingTxn) {
    console.log(`No pending transaction found for reference: ${paystackReference}`);
    return;
  }
  
  if (pendingTxn.status !== 'pending') {
    console.log(`Transaction ${paystackReference} already processed`);
    return;
  }
  
  const amountInNaira = amountInKobo / 100;
  
  await creditWallet(
    pendingTxn.userId,
    amountInNaira,
    `deposit_${paystackReference}`,
    'Deposit via Paystack',
    paystackReference
  );
  
  await db.collection(COLLECTIONS.PENDING_TRANSACTIONS).doc(pendingTxn.id!).update({
    status: 'completed',
    processedAt: new Date(),
  });
  
  await notifyDeposit(pendingTxn.userId, amountInNaira, paystackReference);
}

export async function processWithdrawalSuccess(
  paystackReference: string
): Promise<void> {
  const db = getFirestoreDb();
  
  const pendingTxn = await getPendingTransactionByReference(paystackReference);
  if (!pendingTxn) {
    console.log(`No pending transaction found for reference: ${paystackReference}`);
    return;
  }
  
  if (pendingTxn.status !== 'pending') {
    console.log(`Transaction ${paystackReference} already processed`);
    return;
  }
  
  await db.collection(COLLECTIONS.PENDING_TRANSACTIONS).doc(pendingTxn.id!).update({
    status: 'completed',
    processedAt: new Date(),
  });
  
  const walletTxnSnapshot = await db.collection(COLLECTIONS.WALLET_TRANSACTIONS)
    .where('paystackReference', '==', paystackReference)
    .limit(1)
    .get();
  
  if (!walletTxnSnapshot.empty) {
    await walletTxnSnapshot.docs[0].ref.update({
      status: 'completed',
      completedAt: new Date(),
    });
  }
  
  await notifyWithdrawal(pendingTxn.userId, pendingTxn.amount, 'completed', paystackReference);
}

export async function processWithdrawalFailed(
  paystackReference: string
): Promise<void> {
  const db = getFirestoreDb();
  
  const pendingTxn = await getPendingTransactionByReference(paystackReference);
  if (!pendingTxn) {
    console.log(`No pending transaction found for reference: ${paystackReference}`);
    return;
  }
  
  if (pendingTxn.status !== 'pending') {
    console.log(`Transaction ${paystackReference} already processed`);
    return;
  }
  
  await creditWallet(
    pendingTxn.userId,
    pendingTxn.amount,
    `withdrawal_reversal_${paystackReference}`,
    'Withdrawal failed - funds returned',
    paystackReference
  );
  
  await db.collection(COLLECTIONS.PENDING_TRANSACTIONS).doc(pendingTxn.id!).update({
    status: 'failed',
    processedAt: new Date(),
  });
  
  const walletTxnSnapshot = await db.collection(COLLECTIONS.WALLET_TRANSACTIONS)
    .where('paystackReference', '==', paystackReference)
    .limit(1)
    .get();
  
  if (!walletTxnSnapshot.empty) {
    await walletTxnSnapshot.docs[0].ref.update({
      status: 'failed',
      completedAt: new Date(),
    });
  }
  
  await notifyWithdrawal(pendingTxn.userId, pendingTxn.amount, 'failed', paystackReference);
}
