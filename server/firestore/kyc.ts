import { getFirestoreDb } from "../firebase-admin";
import { KycSubmission, COLLECTIONS } from "./collections";
import { updateUser } from "./users";
import { notifyVerificationStatus } from "./notifications";

export async function submitKyc(
  data: Omit<KycSubmission, 'id' | 'status' | 'rejectionReason' | 'reviewedBy' | 'submittedAt' | 'reviewedAt'>
): Promise<KycSubmission> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const submission: KycSubmission = {
    ...data,
    status: 'pending',
    rejectionReason: null,
    reviewedBy: null,
    submittedAt: now,
    reviewedAt: null,
  };
  
  await updateUser(data.userId, { kycStatus: 'pending' });
  
  const docRef = await db.collection(COLLECTIONS.KYC_SUBMISSIONS).add(submission);
  return { ...submission, id: docRef.id };
}

export async function getKycSubmissionById(id: string): Promise<KycSubmission | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.KYC_SUBMISSIONS).doc(id).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return { id: doc.id, ...doc.data() } as KycSubmission;
}

export async function getKycSubmissionsByUser(userId: string): Promise<KycSubmission[]> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.KYC_SUBMISSIONS)
    .where('userId', '==', userId)
    .orderBy('submittedAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KycSubmission));
}

export async function getLatestKycSubmission(userId: string): Promise<KycSubmission | null> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.KYC_SUBMISSIONS)
    .where('userId', '==', userId)
    .orderBy('submittedAt', 'desc')
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as KycSubmission;
}

export async function getPendingKycSubmissions(): Promise<KycSubmission[]> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.KYC_SUBMISSIONS)
    .where('status', '==', 'pending')
    .orderBy('submittedAt', 'asc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KycSubmission));
}

export async function approveKyc(
  submissionId: string,
  reviewedBy: string
): Promise<void> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const submission = await getKycSubmissionById(submissionId);
  if (!submission) {
    throw new Error("KYC submission not found");
  }
  
  await db.collection(COLLECTIONS.KYC_SUBMISSIONS).doc(submissionId).update({
    status: 'approved',
    reviewedBy,
    reviewedAt: now,
  });
  
  await updateUser(submission.userId, { kycStatus: 'verified' });
  
  await notifyVerificationStatus(submission.userId, 'kyc', 'verified');
}

export async function rejectKyc(
  submissionId: string,
  reviewedBy: string,
  reason: string
): Promise<void> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const submission = await getKycSubmissionById(submissionId);
  if (!submission) {
    throw new Error("KYC submission not found");
  }
  
  await db.collection(COLLECTIONS.KYC_SUBMISSIONS).doc(submissionId).update({
    status: 'rejected',
    rejectionReason: reason,
    reviewedBy,
    reviewedAt: now,
  });
  
  await updateUser(submission.userId, { kycStatus: 'rejected' });
  
  await notifyVerificationStatus(submission.userId, 'kyc', 'rejected');
}
