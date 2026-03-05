import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const requestStatusEnum = pgEnum("request_status", [
  "created",
  "published", 
  "accepted",
  "in_progress",
  "completed",
  "reviewed",
  "cancelled"
]);

export const categoryEnum = pgEnum("category", [
  "physical_help",
  "errands",
  "tech_help",
  "guidance",
  "transportation",
  "home_repairs",
  "childcare",
  "pet_care",
  "tutoring",
  "other"
]);

export const offerStatusEnum = pgEnum("offer_status", [
  "pending",
  "accepted",
  "declined",
  "withdrawn"
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "deposit",
  "withdrawal",
  "task_payment",
  "task_refund",
  "helper_earnings"
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "completed",
  "failed",
  "cancelled"
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  fullName: text("full_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  location: text("location"),
  skills: text("skills").array(),
  isAvailable: boolean("is_available").default(true),
  isHelper: boolean("is_helper").default(false),
  helpsGiven: integer("helps_given").default(0),
  helpsReceived: integer("helps_received").default(0),
  rating: integer("rating").default(0),
  ratingCount: integer("rating_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const helpRequests = pgTable("help_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: categoryEnum("category").notNull(),
  location: text("location"),
  isVirtual: boolean("is_virtual").default(false),
  scheduledTime: timestamp("scheduled_time"),
  isFlexible: boolean("is_flexible").default(true),
  estimatedDuration: integer("estimated_duration"),
  rewardAmount: integer("reward_amount"),
  rewardDescription: text("reward_description"),
  status: requestStatusEnum("status").default("created").notNull(),
  acceptedHelperId: varchar("accepted_helper_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => helpRequests.id),
  helperId: varchar("helper_id").notNull().references(() => users.id),
  message: text("message"),
  status: offerStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").references(() => helpRequests.id),
  participant1Id: varchar("participant1_id").notNull().references(() => users.id),
  participant2Id: varchar("participant2_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => helpRequests.id),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id),
  revieweeId: varchar("reviewee_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  balance: integer("balance").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull().references(() => wallets.id),
  type: transactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  status: transactionStatusEnum("status").default("pending").notNull(),
  description: text("description"),
  relatedRequestId: varchar("related_request_id").references(() => helpRequests.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, { fields: [walletTransactions.walletId], references: [wallets.id] }),
  relatedRequest: one(helpRequests, { fields: [walletTransactions.relatedRequestId], references: [helpRequests.id] }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  wallet: one(wallets, { fields: [users.id], references: [wallets.userId] }),
  requestsMade: many(helpRequests),
  offersGiven: many(offers),
  reviewsGiven: many(reviews),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const helpRequestsRelations = relations(helpRequests, ({ one, many }) => ({
  requester: one(users, { fields: [helpRequests.requesterId], references: [users.id] }),
  acceptedHelper: one(users, { fields: [helpRequests.acceptedHelperId], references: [users.id] }),
  offers: many(offers),
  reviews: many(reviews),
  conversation: one(conversations, { fields: [helpRequests.id], references: [conversations.requestId] }),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  request: one(helpRequests, { fields: [offers.requestId], references: [helpRequests.id] }),
  helper: one(users, { fields: [offers.helperId], references: [users.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  request: one(helpRequests, { fields: [conversations.requestId], references: [helpRequests.id] }),
  participant1: one(users, { fields: [conversations.participant1Id], references: [users.id] }),
  participant2: one(users, { fields: [conversations.participant2Id], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  request: one(helpRequests, { fields: [reviews.requestId], references: [helpRequests.id] }),
  reviewer: one(users, { fields: [reviews.reviewerId], references: [users.id] }),
  reviewee: one(users, { fields: [reviews.revieweeId], references: [users.id] }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHelpRequestSchema = createInsertSchema(helpRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  acceptedHelperId: true,
  status: true,
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
  status: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type HelpRequest = typeof helpRequests.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
