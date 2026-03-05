import { getFirestoreDb } from "../firebase-admin";
import { Notification, COLLECTIONS } from "./collections";

export async function createNotification(
  data: Omit<Notification, 'id' | 'read' | 'createdAt'>
): Promise<Notification> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const notification: Notification = {
    ...data,
    read: false,
    createdAt: now,
  };
  
  const docRef = await db.collection(COLLECTIONS.NOTIFICATIONS).add(notification);
  return { ...notification, id: docRef.id };
}

export async function getNotificationsByUser(
  userId: string,
  limit: number = 50,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  const db = getFirestoreDb();
  let query = db.collection(COLLECTIONS.NOTIFICATIONS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc');
  
  if (unreadOnly) {
    query = query.where('read', '==', false);
  }
  
  const snapshot = await query.limit(limit).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
}

export async function getUnreadCount(userId: string): Promise<number> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.NOTIFICATIONS)
    .where('userId', '==', userId)
    .where('read', '==', false)
    .count()
    .get();
  
  return snapshot.data().count;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const db = getFirestoreDb();
  await db.collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId).update({
    read: true,
  });
}

export async function markAllAsRead(userId: string): Promise<void> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.NOTIFICATIONS)
    .where('userId', '==', userId)
    .where('read', '==', false)
    .get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });
  
  await batch.commit();
}

export async function notifyDeposit(
  userId: string,
  amount: number,
  reference: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: 'transaction',
    title: 'Deposit Successful',
    message: `₦${amount.toLocaleString()} has been added to your wallet.`,
    data: { type: 'deposit', amount, reference },
  });
}

export async function notifyWithdrawal(
  userId: string,
  amount: number,
  status: 'completed' | 'failed',
  reference: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: 'transaction',
    title: status === 'completed' ? 'Withdrawal Successful' : 'Withdrawal Failed',
    message: status === 'completed'
      ? `₦${amount.toLocaleString()} has been sent to your bank account.`
      : `Your withdrawal of ₦${amount.toLocaleString()} could not be processed.`,
    data: { type: 'withdrawal', amount, status, reference },
  });
}

export async function notifyEscrowLock(
  userId: string,
  amount: number,
  requestId: string,
  requestTitle: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: 'transaction',
    title: 'Payment Secured',
    message: `₦${amount.toLocaleString()} has been held in escrow for "${requestTitle}".`,
    data: { type: 'escrow_lock', amount, requestId },
  });
}

export async function notifyEscrowRelease(
  helperId: string,
  amount: number,
  requestId: string,
  requestTitle: string
): Promise<Notification> {
  return createNotification({
    userId: helperId,
    type: 'transaction',
    title: 'Payment Received',
    message: `₦${amount.toLocaleString()} has been added to your wallet for completing "${requestTitle}".`,
    data: { type: 'escrow_release', amount, requestId },
  });
}

export async function notifyNewOffer(
  requesterId: string,
  helperName: string,
  amount: number,
  requestId: string,
  requestTitle: string
): Promise<Notification> {
  return createNotification({
    userId: requesterId,
    type: 'task',
    title: 'New Offer Received',
    message: `${helperName} offered to help with "${requestTitle}" for ₦${amount.toLocaleString()}.`,
    data: { type: 'new_offer', requestId, amount },
  });
}

export async function notifyOfferAccepted(
  helperId: string,
  requestId: string,
  requestTitle: string
): Promise<Notification> {
  return createNotification({
    userId: helperId,
    type: 'task',
    title: 'Offer Accepted',
    message: `Your offer for "${requestTitle}" has been accepted!`,
    data: { type: 'offer_accepted', requestId },
  });
}

export async function notifyTaskComplete(
  userId: string,
  requestId: string,
  requestTitle: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: 'task',
    title: 'Task Completed',
    message: `"${requestTitle}" has been marked as complete.`,
    data: { type: 'task_complete', requestId },
  });
}

export async function notifyNewReview(
  userId: string,
  reviewerName: string,
  rating: number,
  requestId: string
): Promise<Notification> {
  return createNotification({
    userId,
    type: 'review',
    title: 'New Review',
    message: `${reviewerName} left you a ${rating}-star review.`,
    data: { type: 'new_review', rating, requestId },
  });
}

export async function notifyVerificationStatus(
  userId: string,
  verificationType: 'email' | 'phone' | 'kyc',
  status: 'verified' | 'rejected'
): Promise<Notification> {
  const typeLabels = { email: 'Email', phone: 'Phone', kyc: 'Identity' };
  return createNotification({
    userId,
    type: 'verification',
    title: `${typeLabels[verificationType]} Verification ${status === 'verified' ? 'Complete' : 'Failed'}`,
    message: status === 'verified'
      ? `Your ${typeLabels[verificationType].toLowerCase()} has been verified.`
      : `Your ${typeLabels[verificationType].toLowerCase()} verification was unsuccessful.`,
    data: { type: verificationType, status },
  });
}
