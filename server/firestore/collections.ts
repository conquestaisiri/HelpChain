export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
  role: 'user' | 'admin';
  status: 'active' | 'restricted' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  userId: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  location: string | null;
  skills: string[];
  completedTasks: number;
  helpProvided: number;
  rating: number;
  reviewCount: number;
  profilePictureUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  userId: string;
  availableBalance: number;
  escrowBalance: number;
  currency: string;
  status: 'active' | 'restricted' | 'suspended';
  lastUpdated: Date;
  createdAt: Date;
}

export interface WalletTransaction {
  id?: string;
  walletId: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'escrow_lock' | 'escrow_release' | 'escrow_refund' | 'fee' | 'adjustment';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  paystackReference: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface HelpRequest {
  id?: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  rewardAmount: number;
  platformFee: number;
  totalAmount: number;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'disputed' | 'cancelled';
  assignedHelperId: string | null;
  escrowId: string | null;
  urgency: 'low' | 'medium' | 'high';
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface Offer {
  id?: string;
  requestId: string;
  helperId: string;
  amount: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: Date;
  updatedAt: Date;
}

export interface EscrowRecord {
  id?: string;
  requestId: string;
  requesterId: string;
  helperId: string;
  amount: number;
  platformFee: number;
  status: 'locked' | 'released' | 'refunded' | 'disputed';
  lockedAt: Date;
  releasedAt: Date | null;
  disputeId: string | null;
  autoReleaseAt: Date;
}

export interface Dispute {
  id?: string;
  escrowId: string;
  requestId: string;
  initiatorId: string;
  reason: string;
  evidence: string[];
  status: 'open' | 'under_review' | 'resolved_requester' | 'resolved_helper' | 'closed';
  resolution: string | null;
  resolvedBy: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface Conversation {
  id?: string;
  participants: string[];
  requestId: string | null;
  lastMessageAt: Date;
  lastMessagePreview: string;
  createdAt: Date;
}

export interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface Review {
  id?: string;
  requestId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface PendingTransaction {
  id?: string;
  userId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  paystackReference: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  processedAt: Date | null;
}

export interface BankAccount {
  id?: string;
  userId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  paystackRecipientCode: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface KycSubmission {
  id?: string;
  userId: string;
  documentType: 'bvn' | 'nin' | 'passport' | 'voters_card';
  documentNumber: string;
  documentUrl: string;
  selfieUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  reviewedBy: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
}

export interface Notification {
  id?: string;
  userId: string;
  type: 'transaction' | 'message' | 'task' | 'review' | 'verification' | 'system';
  title: string;
  message: string;
  data: Record<string, any> | null;
  read: boolean;
  createdAt: Date;
}

export interface PlatformRevenue {
  id?: string;
  requestId: string;
  escrowId: string;
  amount: number;
  description: string;
  createdAt: Date;
}

export interface VerificationToken {
  id?: string;
  userId: string;
  type: 'email' | 'phone';
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export const COLLECTIONS = {
  USERS: 'users',
  PROFILES: 'profiles',
  WALLETS: 'wallets',
  WALLET_TRANSACTIONS: 'wallet_transactions',
  HELP_REQUESTS: 'help_requests',
  OFFERS: 'offers',
  ESCROW_RECORDS: 'escrow_records',
  DISPUTES: 'disputes',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  REVIEWS: 'reviews',
  PENDING_TRANSACTIONS: 'pending_transactions',
  BANK_ACCOUNTS: 'bank_accounts',
  KYC_SUBMISSIONS: 'kyc_submissions',
  NOTIFICATIONS: 'notifications',
  PLATFORM_REVENUE: 'platform_revenue',
  VERIFICATION_TOKENS: 'verification_tokens',
} as const;
