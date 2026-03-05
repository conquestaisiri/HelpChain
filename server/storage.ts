import { eq, and, or, desc, asc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  profiles,
  helpRequests,
  offers,
  conversations,
  messages,
  reviews,
  type User,
  type InsertUser,
  type Profile,
  type HelpRequest,
  type Offer,
  type Conversation,
  type Message,
  type Review,
} from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(userId: string, data?: Partial<Profile>): Promise<Profile>;
  updateProfile(userId: string, data: Partial<Profile>): Promise<Profile | undefined>;
  
  createHelpRequest(data: Omit<HelpRequest, "id" | "createdAt" | "updatedAt" | "completedAt" | "acceptedHelperId" | "status">): Promise<HelpRequest>;
  getHelpRequest(id: string): Promise<HelpRequest | undefined>;
  getHelpRequests(filters?: { category?: string; status?: string; requesterId?: string }): Promise<HelpRequest[]>;
  updateHelpRequestStatus(id: string, status: string, acceptedHelperId?: string): Promise<HelpRequest | undefined>;
  
  createOffer(data: Omit<Offer, "id" | "createdAt" | "respondedAt" | "status">): Promise<Offer>;
  getOffer(id: string): Promise<Offer | undefined>;
  getOffersForRequest(requestId: string): Promise<Offer[]>;
  getOffersByHelper(helperId: string): Promise<Offer[]>;
  updateOfferStatus(id: string, status: string): Promise<Offer | undefined>;
  
  getOrCreateConversation(participant1Id: string, participant2Id: string, requestId?: string): Promise<Conversation>;
  getConversationsForUser(userId: string): Promise<Conversation[]>;
  
  createMessage(data: Omit<Message, "id" | "createdAt" | "isRead">): Promise<Message>;
  getMessagesForConversation(conversationId: string): Promise<Message[]>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  
  createReview(data: Omit<Review, "id" | "createdAt">): Promise<Review>;
  getReviewsForUser(userId: string): Promise<Review[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await db.insert(users).values({
      ...user,
      password: hashedPassword,
    }).returning();
    return result[0];
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    return result[0];
  }

  async createProfile(userId: string, data?: Partial<Profile>): Promise<Profile> {
    const result = await db.insert(profiles).values({
      userId,
      ...data,
    }).returning();
    return result[0];
  }

  async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile | undefined> {
    const result = await db.update(profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return result[0];
  }

  async createHelpRequest(data: Omit<HelpRequest, "id" | "createdAt" | "updatedAt" | "completedAt" | "acceptedHelperId" | "status">): Promise<HelpRequest> {
    const result = await db.insert(helpRequests).values({
      ...data,
      status: "published",
    }).returning();
    return result[0];
  }

  async getHelpRequest(id: string): Promise<HelpRequest | undefined> {
    const result = await db.select().from(helpRequests).where(eq(helpRequests.id, id)).limit(1);
    return result[0];
  }

  async getHelpRequests(filters?: { category?: string; status?: string; requesterId?: string }): Promise<HelpRequest[]> {
    let query = db.select().from(helpRequests);
    
    const conditions = [];
    if (filters?.category) {
      conditions.push(eq(helpRequests.category, filters.category as any));
    }
    if (filters?.status) {
      conditions.push(eq(helpRequests.status, filters.status as any));
    }
    if (filters?.requesterId) {
      conditions.push(eq(helpRequests.requesterId, filters.requesterId));
    }
    
    if (conditions.length > 0) {
      return db.select().from(helpRequests).where(and(...conditions)).orderBy(desc(helpRequests.createdAt));
    }
    
    return db.select().from(helpRequests).orderBy(desc(helpRequests.createdAt));
  }

  async updateHelpRequestStatus(id: string, status: string, acceptedHelperId?: string): Promise<HelpRequest | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (acceptedHelperId) {
      updateData.acceptedHelperId = acceptedHelperId;
    }
    if (status === "completed") {
      updateData.completedAt = new Date();
    }
    const result = await db.update(helpRequests)
      .set(updateData)
      .where(eq(helpRequests.id, id))
      .returning();
    return result[0];
  }

  async createOffer(data: Omit<Offer, "id" | "createdAt" | "respondedAt" | "status">): Promise<Offer> {
    const result = await db.insert(offers).values({
      ...data,
      status: "pending",
    }).returning();
    return result[0];
  }

  async getOffer(id: string): Promise<Offer | undefined> {
    const result = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
    return result[0];
  }

  async getOffersForRequest(requestId: string): Promise<Offer[]> {
    return db.select().from(offers).where(eq(offers.requestId, requestId)).orderBy(desc(offers.createdAt));
  }

  async getOffersByHelper(helperId: string): Promise<Offer[]> {
    return db.select().from(offers).where(eq(offers.helperId, helperId)).orderBy(desc(offers.createdAt));
  }

  async updateOfferStatus(id: string, status: string): Promise<Offer | undefined> {
    const result = await db.update(offers)
      .set({ status: status as any, respondedAt: new Date() })
      .where(eq(offers.id, id))
      .returning();
    return result[0];
  }

  async getOrCreateConversation(participant1Id: string, participant2Id: string, requestId?: string): Promise<Conversation> {
    const existing = await db.select().from(conversations).where(
      or(
        and(eq(conversations.participant1Id, participant1Id), eq(conversations.participant2Id, participant2Id)),
        and(eq(conversations.participant1Id, participant2Id), eq(conversations.participant2Id, participant1Id))
      )
    ).limit(1);
    
    if (existing[0]) {
      return existing[0];
    }
    
    const result = await db.insert(conversations).values({
      participant1Id,
      participant2Id,
      requestId,
    }).returning();
    return result[0];
  }

  async getConversationsForUser(userId: string): Promise<Conversation[]> {
    return db.select().from(conversations).where(
      or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId))
    ).orderBy(desc(conversations.updatedAt));
  }

  async createMessage(data: Omit<Message, "id" | "createdAt" | "isRead">): Promise<Message> {
    const result = await db.insert(messages).values(data).returning();
    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, data.conversationId));
    return result[0];
  }

  async getMessagesForConversation(conversationId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt));
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.senderId, userId)
        )
      );
  }

  async createReview(data: Omit<Review, "id" | "createdAt">): Promise<Review> {
    const result = await db.insert(reviews).values(data).returning();
    
    const allReviews = await db.select().from(reviews).where(eq(reviews.revieweeId, data.revieweeId));
    const avgRating = Math.round(allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length);
    
    await db.update(profiles)
      .set({ rating: avgRating, ratingCount: allReviews.length })
      .where(eq(profiles.userId, data.revieweeId));
    
    return result[0];
  }

  async getReviewsForUser(userId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.revieweeId, userId)).orderBy(desc(reviews.createdAt));
  }
}

export const storage = new DatabaseStorage();
