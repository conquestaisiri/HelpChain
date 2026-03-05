import { getFirestoreDb } from "../firebase-admin";
import { Conversation, Message, COLLECTIONS } from "./collections";

export async function createConversation(
  participants: string[],
  requestId: string | null = null
): Promise<Conversation> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const existingConversation = await findConversation(participants, requestId);
  if (existingConversation) {
    return existingConversation;
  }
  
  const conversation: Conversation = {
    participants: participants.sort(),
    requestId,
    lastMessageAt: now,
    lastMessagePreview: '',
    createdAt: now,
  };
  
  const docRef = await db.collection(COLLECTIONS.CONVERSATIONS).add(conversation);
  return { ...conversation, id: docRef.id };
}

export async function findConversation(
  participants: string[],
  requestId: string | null = null
): Promise<Conversation | null> {
  const db = getFirestoreDb();
  const sortedParticipants = participants.sort();
  
  let query = db.collection(COLLECTIONS.CONVERSATIONS)
    .where('participants', '==', sortedParticipants);
  
  if (requestId) {
    query = query.where('requestId', '==', requestId);
  }
  
  const snapshot = await query.limit(1).get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Conversation;
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  const db = getFirestoreDb();
  const doc = await db.collection(COLLECTIONS.CONVERSATIONS).doc(id).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return { id: doc.id, ...doc.data() } as Conversation;
}

export async function getConversationsByUser(userId: string): Promise<Conversation[]> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.CONVERSATIONS)
    .where('participants', 'array-contains', userId)
    .orderBy('lastMessageAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const db = getFirestoreDb();
  const now = new Date();
  
  const message: Message = {
    conversationId,
    senderId,
    content,
    read: false,
    createdAt: now,
  };
  
  const batch = db.batch();
  
  const messageRef = db.collection(COLLECTIONS.MESSAGES).doc();
  batch.set(messageRef, message);
  
  const conversationRef = db.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId);
  batch.update(conversationRef, {
    lastMessageAt: now,
    lastMessagePreview: content.substring(0, 100),
  });
  
  await batch.commit();
  
  return { ...message, id: messageRef.id };
}

export async function getMessagesByConversation(
  conversationId: string,
  limit: number = 100
): Promise<Message[]> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.MESSAGES)
    .where('conversationId', '==', conversationId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse();
}

export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const db = getFirestoreDb();
  const snapshot = await db.collection(COLLECTIONS.MESSAGES)
    .where('conversationId', '==', conversationId)
    .where('senderId', '!=', userId)
    .where('read', '==', false)
    .get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });
  
  await batch.commit();
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const db = getFirestoreDb();
  
  const conversations = await getConversationsByUser(userId);
  let unreadCount = 0;
  
  for (const conv of conversations) {
    const snapshot = await db.collection(COLLECTIONS.MESSAGES)
      .where('conversationId', '==', conv.id)
      .where('senderId', '!=', userId)
      .where('read', '==', false)
      .count()
      .get();
    
    unreadCount += snapshot.data().count;
  }
  
  return unreadCount;
}
