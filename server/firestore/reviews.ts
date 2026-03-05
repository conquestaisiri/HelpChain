import { getFirestoreDb } from "../firebase-admin";
import { Review, COLLECTIONS } from "./collections";
import { updateProfile, getProfileByUserId } from "./users";

export async function createReview(
  data: Omit<Review, 'id' | 'createdAt'>
): Promise<Review> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const review: Review = {
    ...data,
    createdAt: now,
  };
  
  const docRef = await db.collection(COLLECTIONS.REVIEWS).add(review);
  
  await updateUserRating(data.revieweeId);
  
  return { ...review, id: docRef.id };
}

export async function getReviewById(id: string): Promise<Review | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.REVIEWS).doc(id).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return { id: doc.id, ...doc.data() } as Review;
}

export async function getReviewsByUser(userId: string): Promise<Review[]> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.REVIEWS)
    .where('revieweeId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
}

export async function getReviewsByRequest(requestId: string): Promise<Review[]> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.REVIEWS)
    .where('requestId', '==', requestId)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
}

export async function hasUserReviewed(
  reviewerId: string,
  requestId: string
): Promise<boolean> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.REVIEWS)
    .where('reviewerId', '==', reviewerId)
    .where('requestId', '==', requestId)
    .limit(1)
    .get();
  
  return !snapshot.empty;
}

async function updateUserRating(userId: string): Promise<void> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.REVIEWS)
    .where('revieweeId', '==', userId)
    .get();
  
  if (snapshot.empty) {
    return;
  }
  
  const reviews = snapshot.docs.map(doc => doc.data() as Review);
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  await updateProfile(userId, {
    rating: Math.round(averageRating * 10) / 10,
    reviewCount: reviews.length,
  });
}

export async function getUserRatingStats(userId: string): Promise<{
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}> {
  const reviews = await getReviewsByUser(userId);
  
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
  
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  reviews.forEach(r => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  });
  
  return {
    averageRating: Math.round((totalRating / reviews.length) * 10) / 10,
    totalReviews: reviews.length,
    ratingDistribution: distribution,
  };
}
