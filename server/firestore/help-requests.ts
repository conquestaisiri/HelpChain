import { getFirestoreDb } from "../firebase-admin";
import { HelpRequest, Offer, COLLECTIONS } from "./collections";

export async function createHelpRequest(
  data: Omit<HelpRequest, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>
): Promise<HelpRequest> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const helpRequest: HelpRequest = {
    ...data,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
  
  const docRef = await db.collection(COLLECTIONS.HELP_REQUESTS).add(helpRequest);
  return { ...helpRequest, id: docRef.id };
}

export async function getHelpRequestById(id: string): Promise<HelpRequest | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.HELP_REQUESTS).doc(id).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return { id: doc.id, ...doc.data() } as HelpRequest;
}

export async function getHelpRequestsByUser(userId: string, limit: number = 50): Promise<HelpRequest[]> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.HELP_REQUESTS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HelpRequest));
}

export async function getOpenHelpRequests(
  category?: string,
  location?: string,
  limit: number = 50
): Promise<HelpRequest[]> {
  const db = getFirestoreDb();
  let query = db.collection(COLLECTIONS.HELP_REQUESTS)
    .where('status', '==', 'open')
    .orderBy('createdAt', 'desc');
  
  if (category) {
    query = query.where('category', '==', category);
  }
  
  const snapshot = await query.limit(limit).get();
  
  let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HelpRequest));
  
  if (location) {
    results = results.filter(r => r.location.toLowerCase().includes(location.toLowerCase()));
  }
  
  return results;
}

export async function updateHelpRequest(
  id: string,
  updates: Partial<HelpRequest>
): Promise<void> {
  const db = getFirestoreDb();
  await db.collection(COLLECTIONS.HELP_REQUESTS).doc(id).update({
    ...updates,
    updatedAt: new Date(),
  });
}

export async function assignHelper(
  requestId: string,
  helperId: string,
  escrowId: string
): Promise<void> {
  const db = getFirestoreDb();
  await db.collection(COLLECTIONS.HELP_REQUESTS).doc(requestId).update({
    status: 'assigned',
    assignedHelperId: helperId,
    escrowId,
    updatedAt: new Date(),
  });
}

export async function completeHelpRequest(requestId: string): Promise<void> {
  const db = getFirestoreDb();
  const now = new Date();
  await db.collection(COLLECTIONS.HELP_REQUESTS).doc(requestId).update({
    status: 'completed',
    updatedAt: now,
    completedAt: now,
  });
}

export async function createOffer(
  data: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Offer> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const offer: Offer = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  const docRef = await db.collection(COLLECTIONS.OFFERS).add(offer);
  return { ...offer, id: docRef.id };
}

export async function getOfferById(id: string): Promise<Offer | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.OFFERS).doc(id).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return { id: doc.id, ...doc.data() } as Offer;
}

export async function getOffersByRequest(requestId: string): Promise<Offer[]> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.OFFERS)
    .where('requestId', '==', requestId)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
}

export async function getOffersByHelper(helperId: string): Promise<Offer[]> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.OFFERS)
    .where('helperId', '==', helperId)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
}

export async function updateOffer(id: string, updates: Partial<Offer>): Promise<void> {
  const db = getFirestoreDb();
  await db.collection(COLLECTIONS.OFFERS).doc(id).update({
    ...updates,
    updatedAt: new Date(),
  });
}
