import { getFirestoreDb } from "../firebase-admin";
import { BankAccount, COLLECTIONS } from "./collections";
import { createTransferRecipient } from "../paystack";

export async function addBankAccount(
  userId: string,
  bankCode: string,
  bankName: string,
  accountNumber: string,
  accountName: string
): Promise<BankAccount> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const existingAccounts = await getBankAccountsByUser(userId);
  const isDefault = existingAccounts.length === 0;
  
  const recipient = await createTransferRecipient(accountName, accountNumber, bankCode);
  
  const bankAccount: BankAccount = {
    userId,
    bankCode,
    bankName,
    accountNumber,
    accountName,
    paystackRecipientCode: recipient.recipient_code,
    isDefault,
    createdAt: now,
  };
  
  const docRef = await db.collection(COLLECTIONS.BANK_ACCOUNTS).add(bankAccount);
  return { ...bankAccount, id: docRef.id };
}

export async function getBankAccountsByUser(userId: string): Promise<BankAccount[]> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.BANK_ACCOUNTS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
}

export async function getBankAccountById(id: string): Promise<BankAccount | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.BANK_ACCOUNTS).doc(id).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return { id: doc.id, ...doc.data() } as BankAccount;
}

export async function getDefaultBankAccount(userId: string): Promise<BankAccount | null> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.BANK_ACCOUNTS)
    .where('userId', '==', userId)
    .where('isDefault', '==', true)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as BankAccount;
}

export async function setDefaultBankAccount(
  userId: string,
  accountId: string
): Promise<void> {
  const db = getFirestoreDb();
  
  const existingAccounts = await getBankAccountsByUser(userId);
  
  const batch = db.batch();
  
  existingAccounts.forEach(account => {
    const ref = db.collection(COLLECTIONS.BANK_ACCOUNTS).doc(account.id!);
    batch.update(ref, { isDefault: account.id === accountId });
  });
  
  await batch.commit();
}

export async function deleteBankAccount(accountId: string): Promise<void> {
  const db = getFirestoreDb();
  
  const account = await getBankAccountById(accountId);
  if (!account) {
    throw new Error("Bank account not found");
  }
  
  await db.collection(COLLECTIONS.BANK_ACCOUNTS).doc(accountId).delete();
  
  if (account.isDefault) {
    const remainingAccounts = await getBankAccountsByUser(account.userId);
    if (remainingAccounts.length > 0) {
      await setDefaultBankAccount(account.userId, remainingAccounts[0].id!);
    }
  }
}
