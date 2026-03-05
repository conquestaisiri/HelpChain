import { getFirestoreDb } from "../firebase-admin";
import { User, Profile, COLLECTIONS } from "./collections";

export async function createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const user: User = {
    ...userData,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.collection(COLLECTIONS.USERS).doc(userData.uid).set(user);
  return user;
}

export async function getUserById(uid: string): Promise<User | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.USERS)
    .where('email', '==', email)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  return snapshot.docs[0].data() as User;
}

export async function updateUser(uid: string, updates: Partial<User>): Promise<void> {
  const db = getFirestoreDb();
  await db.collection(COLLECTIONS.USERS).doc(uid).update({
    ...updates,
    updatedAt: new Date(),
  });
}

export async function createProfile(profileData: Omit<Profile, 'createdAt' | 'updatedAt'>): Promise<Profile> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const profile: Profile = {
    ...profileData,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.collection(COLLECTIONS.PROFILES).doc(profileData.userId).set(profile);
  return profile;
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.PROFILES).doc(userId).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<void> {
  const db = getFirestoreDb();
  await db.collection(COLLECTIONS.PROFILES).doc(userId).update({
    ...updates,
    updatedAt: new Date(),
  });
}

export async function createUserWithProfile(
  userData: Omit<User, 'createdAt' | 'updatedAt'>,
  profileData: Omit<Profile, 'userId' | 'createdAt' | 'updatedAt'>
): Promise<{ user: User; profile: Profile }> {
  const db = getFirestoreDb();
  const batch = db.batch();
  const now = new Date();
  
  const user: User = {
    ...userData,
    createdAt: now,
    updatedAt: now,
  };
  
  const profile: Profile = {
    ...profileData,
    userId: userData.uid,
    createdAt: now,
    updatedAt: now,
  };
  
  batch.set(db.collection(COLLECTIONS.USERS).doc(userData.uid), user);
  batch.set(db.collection(COLLECTIONS.PROFILES).doc(userData.uid), profile);
  
  await batch.commit();
  
  return { user, profile };
}
