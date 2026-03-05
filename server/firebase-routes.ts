import type { Express, Request, Response, NextFunction } from "express";
import { getAdminAuth } from "./firebase-admin";
import * as firestore from "./firestore";
import * as paystack from "./paystack";

async function authenticateFirebase(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error("Firebase auth error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user?.admin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export function registerFirebaseRoutes(app: Express) {
  app.post("/api/auth/sync-user", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const { uid, email, displayName, photoURL, emailVerified } = req.user;
      
      let user = await firestore.getUserById(uid);
      
      if (!user) {
        const { user: newUser, profile } = await firestore.createUserWithProfile(
          {
            uid,
            email: email || '',
            displayName: displayName || '',
            photoURL: photoURL || null,
            emailVerified: emailVerified || false,
            phoneNumber: null,
            phoneVerified: false,
            twoFactorEnabled: false,
            twoFactorSecret: null,
            kycStatus: 'none',
            role: 'user',
            status: 'active',
          },
          {
            firstName: displayName?.split(' ')[0] || '',
            lastName: displayName?.split(' ').slice(1).join(' ') || '',
            bio: null,
            location: null,
            skills: [],
            completedTasks: 0,
            helpProvided: 0,
            rating: 0,
            reviewCount: 0,
            profilePictureUrl: photoURL || null,
          }
        );
        
        await firestore.createWallet(uid);
        
        user = newUser;
      }
      
      res.json({ user });
    } catch (error) {
      console.error("Error syncing user:", error);
      res.status(500).json({ message: "Failed to sync user" });
    }
  });

  app.get("/api/users/me", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const user = await firestore.getUserById(req.user.uid);
      const profile = await firestore.getProfileByUserId(req.user.uid);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ user, profile });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/me/profile", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const updates = req.body;
      await firestore.updateProfile(req.user.uid, updates);
      const profile = await firestore.getProfileByUserId(req.user.uid);
      res.json({ profile });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/users/:id/public", async (req: Request, res: Response) => {
    try {
      const profile = await firestore.getProfileByUserId(req.params.id);
      const user = await firestore.getUserById(req.params.id);
      
      if (!profile || !user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        profile: {
          ...profile,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          kycStatus: user.kycStatus,
        },
      });
    } catch (error) {
      console.error("Error fetching public profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get("/api/wallet", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const wallet = await firestore.getOrCreateWallet(req.user.uid);
      res.json({ wallet });
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  app.get("/api/wallet/transactions", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const transactions = await firestore.getWalletTransactions(req.user.uid, limit, offset);
      res.json({ transactions });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/wallet/deposit/initialize", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount < 100) {
        return res.status(400).json({ message: "Minimum deposit is ₦100" });
      }
      
      const user = await firestore.getUserById(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const reference = paystack.generateReference("DEP");
      
      await firestore.createPendingDeposit(req.user.uid, amount, reference);
      
      const transaction = await paystack.initializeTransaction(
        user.email,
        amount,
        reference,
        undefined,
        { userId: req.user.uid, type: 'deposit' }
      );
      
      res.json({
        authorization_url: transaction.authorization_url,
        access_code: transaction.access_code,
        reference: transaction.reference,
      });
    } catch (error) {
      console.error("Error initializing deposit:", error);
      res.status(500).json({ message: "Failed to initialize deposit" });
    }
  });

  app.post("/api/wallet/deposit/verify", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const { reference } = req.body;
      
      if (!reference) {
        return res.status(400).json({ message: "Reference is required" });
      }
      
      const transaction = await paystack.verifyTransaction(reference);
      
      if (transaction.status === 'success') {
        await firestore.processDepositSuccess(reference, transaction.amount);
        const wallet = await firestore.getOrCreateWallet(req.user.uid);
        res.json({ success: true, wallet });
      } else {
        res.status(400).json({ message: "Transaction not successful" });
      }
    } catch (error) {
      console.error("Error verifying deposit:", error);
      res.status(500).json({ message: "Failed to verify deposit" });
    }
  });

  app.get("/api/banks", async (req: Request, res: Response) => {
    try {
      const banks = await paystack.listBanks();
      res.json({ banks });
    } catch (error) {
      console.error("Error fetching banks:", error);
      res.status(500).json({ message: "Failed to fetch banks" });
    }
  });

  app.post("/api/banks/resolve", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const { accountNumber, bankCode } = req.body;
      
      if (!accountNumber || !bankCode) {
        return res.status(400).json({ message: "Account number and bank code are required" });
      }
      
      const account = await paystack.resolveAccountNumber(accountNumber, bankCode);
      res.json({ account });
    } catch (error) {
      console.error("Error resolving account:", error);
      res.status(500).json({ message: "Failed to resolve account" });
    }
  });

  app.get("/api/bank-accounts", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const accounts = await firestore.getBankAccountsByUser(req.user.uid);
      res.json({ accounts });
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      res.status(500).json({ message: "Failed to fetch bank accounts" });
    }
  });

  app.post("/api/bank-accounts", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const { bankCode, bankName, accountNumber, accountName } = req.body;
      
      if (!bankCode || !bankName || !accountNumber || !accountName) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      const account = await firestore.addBankAccount(
        req.user.uid,
        bankCode,
        bankName,
        accountNumber,
        accountName
      );
      
      res.json({ account });
    } catch (error) {
      console.error("Error adding bank account:", error);
      res.status(500).json({ message: "Failed to add bank account" });
    }
  });

  app.delete("/api/bank-accounts/:id", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const account = await firestore.getBankAccountById(req.params.id);
      
      if (!account) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      if (account.userId !== req.user.uid) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await firestore.deleteBankAccount(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bank account:", error);
      res.status(500).json({ message: "Failed to delete bank account" });
    }
  });

  app.post("/api/wallet/withdraw", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const { amount, bankAccountId, totpCode } = req.body;
      
      if (!amount || amount < 500) {
        return res.status(400).json({ message: "Minimum withdrawal is ₦500" });
      }
      
      const user = await firestore.getUserById(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.kycStatus !== 'verified') {
        return res.status(400).json({ message: "Please complete KYC verification to withdraw" });
      }
      
      const wallet = await firestore.getOrCreateWallet(req.user.uid);
      if (wallet.availableBalance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      const bankAccount = bankAccountId
        ? await firestore.getBankAccountById(bankAccountId)
        : await firestore.getDefaultBankAccount(req.user.uid);
      
      if (!bankAccount) {
        return res.status(400).json({ message: "Please add a bank account first" });
      }
      
      if (bankAccount.userId !== req.user.uid) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const reference = paystack.generateReference("WTH");
      
      await firestore.debitWallet(
        req.user.uid,
        amount,
        'withdrawal',
        reference,
        `Withdrawal to ${bankAccount.bankName} - ${bankAccount.accountNumber}`,
        reference
      );
      
      await firestore.createPendingWithdrawal(req.user.uid, amount, reference);
      
      await paystack.initiateTransfer(
        amount,
        bankAccount.paystackRecipientCode,
        reference,
        `Withdrawal to ${bankAccount.accountName}`
      );
      
      res.json({ success: true, reference });
    } catch (error: any) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ message: error.message || "Failed to process withdrawal" });
    }
  });

  app.post("/api/paystack/webhook", async (req: Request, res: Response) => {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const payload = JSON.stringify(req.body);
      
      if (!paystack.verifyWebhookSignature(payload, signature)) {
        return res.status(400).json({ message: "Invalid signature" });
      }
      
      const event = req.body as paystack.WebhookEvent;
      
      switch (event.event) {
        case 'charge.success':
          await firestore.processDepositSuccess(
            event.data.reference,
            event.data.amount
          );
          break;
        
        case 'transfer.success':
          await firestore.processWithdrawalSuccess(event.data.reference);
          break;
        
        case 'transfer.failed':
        case 'transfer.reversed':
          await firestore.processWithdrawalFailed(event.data.reference);
          break;
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.get("/api/requests", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const location = req.query.location as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const requests = await firestore.getOpenHelpRequests(category, location, limit);
      res.json({ requests });
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.get("/api/requests/:id", async (req: Request, res: Response) => {
    try {
      const request = await firestore.getHelpRequestById(req.params.id);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      res.json({ request });
    } catch (error) {
      console.error("Error fetching request:", error);
      res.status(500).json({ message: "Failed to fetch request" });
    }
  });

  app.post("/api/requests", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const { title, description, category, location, rewardAmount, urgency, images } = req.body;
      
      if (!title || !description || !category || !location) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const user = await firestore.getUserById(req.user.uid);
      if (!user?.emailVerified) {
        return res.status(400).json({ message: "Please verify your email first" });
      }
      
      const platformFee = rewardAmount ? Math.round(rewardAmount * 0.06) : 0;
      const totalAmount = rewardAmount ? rewardAmount + platformFee : 0;
      
      if (rewardAmount > 0) {
        const wallet = await firestore.getOrCreateWallet(req.user.uid);
        if (wallet.availableBalance < totalAmount) {
          return res.status(400).json({ 
            message: `Insufficient balance. You need ₦${totalAmount.toLocaleString()} but have ₦${wallet.availableBalance.toLocaleString()}` 
          });
        }
      }
      
      const request = await firestore.createHelpRequest({
        userId: req.user.uid,
        title,
        description,
        category,
        location,
        rewardAmount: rewardAmount || 0,
        platformFee,
        totalAmount,
        status: 'open',
        assignedHelperId: null,
        escrowId: null,
        urgency: urgency || 'medium',
        images: images || [],
      });
      
      res.json({ request });
    } catch (error) {
      console.error("Error creating request:", error);
      res.status(500).json({ message: "Failed to create request" });
    }
  });

  app.get("/api/requests/:id/offers", async (req: Request, res: Response) => {
    try {
      const offers = await firestore.getOffersByRequest(req.params.id);
      
      // Enrich offers with helper profile info
      const enrichedOffers = await Promise.all(offers.map(async (offer) => {
        const profile = await firestore.getProfileByUserId(offer.helperId);
        const user = await firestore.getUserById(offer.helperId);
        return {
          ...offer,
          helperName: profile?.firstName || user?.displayName || 'Helper',
          helperAvatar: profile?.profilePictureUrl || null,
          helperRating: profile?.rating || 0,
          helperRatingCount: profile?.reviewCount || 0,
        };
      }));
      
      res.json(enrichedOffers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  app.post("/api/requests/:id/offers", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const { amount, message } = req.body;
      const requestId = req.params.id;
      
      const request = await firestore.getHelpRequestById(requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      if (request.status !== 'open') {
        return res.status(400).json({ message: "This request is no longer accepting offers" });
      }
      
      if (request.userId === req.user.uid) {
        return res.status(400).json({ message: "You cannot offer to help on your own request" });
      }
      
      const user = await firestore.getUserById(req.user.uid);
      if (!user?.phoneVerified) {
        return res.status(400).json({ message: "Please verify your phone number first" });
      }
      
      const offer = await firestore.createOffer({
        requestId,
        helperId: req.user.uid,
        amount: amount || request.rewardAmount,
        message: message || '',
        status: 'pending',
      });
      
      const helperProfile = await firestore.getProfileByUserId(req.user.uid);
      await firestore.notifyNewOffer(
        request.userId,
        helperProfile?.firstName || user.displayName || 'Someone',
        offer.amount,
        requestId,
        request.title
      );
      
      res.json({ offer });
    } catch (error) {
      console.error("Error creating offer:", error);
      res.status(500).json({ message: "Failed to create offer" });
    }
  });

  app.post("/api/offers/:id/accept", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const offer = await firestore.getOfferById(req.params.id);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      const request = await firestore.getHelpRequestById(offer.requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      if (request.userId !== req.user.uid) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      if (request.status !== 'open') {
        return res.status(400).json({ message: "This request already has an assigned helper" });
      }
      
      const platformFee = Math.round(offer.amount * 0.06);
      const totalAmount = offer.amount + platformFee;
      
      const wallet = await firestore.getOrCreateWallet(req.user.uid);
      if (wallet.availableBalance < totalAmount) {
        return res.status(400).json({ 
          message: `Insufficient balance. You need ₦${totalAmount.toLocaleString()} but have ₦${wallet.availableBalance.toLocaleString()}` 
        });
      }
      
      const escrow = await firestore.createEscrowRecord(
        offer.requestId,
        request.userId,
        offer.helperId,
        totalAmount,
        platformFee
      );
      
      await firestore.updateOffer(offer.id!, { status: 'accepted' });
      await firestore.assignHelper(offer.requestId, offer.helperId, escrow.id!);
      
      await firestore.notifyOfferAccepted(offer.helperId, offer.requestId, request.title);
      await firestore.notifyEscrowLock(
        request.userId,
        totalAmount,
        offer.requestId,
        request.title
      );
      
      res.json({ success: true, escrow });
    } catch (error: any) {
      console.error("Error accepting offer:", error);
      res.status(500).json({ message: error.message || "Failed to accept offer" });
    }
  });

  app.post("/api/offers/:id/decline", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const offer = await firestore.getOfferById(req.params.id);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      const request = await firestore.getHelpRequestById(offer.requestId);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      if (request.userId !== req.user.uid) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      if (offer.status !== 'pending') {
        return res.status(400).json({ message: "Can only decline pending offers" });
      }
      
      await firestore.updateOffer(offer.id!, { status: 'rejected' });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error declining offer:", error);
      res.status(500).json({ message: error.message || "Failed to decline offer" });
    }
  });

  app.post("/api/requests/:id/complete", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const request = await firestore.getHelpRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      if (request.userId !== req.user.uid) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      if (request.status !== 'assigned' && request.status !== 'in_progress') {
        return res.status(400).json({ message: "Cannot complete this request" });
      }
      
      if (!request.escrowId) {
        return res.status(400).json({ message: "No escrow found for this request" });
      }
      
      await firestore.releaseEscrow(request.escrowId);
      await firestore.completeHelpRequest(req.params.id);
      
      const escrow = await firestore.getEscrowRecordById(request.escrowId);
      if (escrow) {
        const helperAmount = escrow.amount - escrow.platformFee;
        await firestore.notifyEscrowRelease(
          escrow.helperId,
          helperAmount,
          request.id!,
          request.title
        );
      }
      
      await firestore.notifyTaskComplete(request.userId, request.id!, request.title);
      if (request.assignedHelperId) {
        await firestore.notifyTaskComplete(request.assignedHelperId, request.id!, request.title);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error completing request:", error);
      res.status(500).json({ message: error.message || "Failed to complete request" });
    }
  });

  app.post("/api/requests/:id/dispute", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const { reason, evidence } = req.body;
      const request = await firestore.getHelpRequestById(req.params.id);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      if (request.userId !== req.user.uid && request.assignedHelperId !== req.user.uid) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      if (!request.escrowId) {
        return res.status(400).json({ message: "No escrow found for this request" });
      }
      
      const dispute = await firestore.createDispute({
        escrowId: request.escrowId,
        requestId: request.id!,
        initiatorId: req.user.uid,
        reason,
        evidence: evidence || [],
      });
      
      await firestore.updateHelpRequest(request.id!, { status: 'disputed' });
      
      res.json({ dispute });
    } catch (error) {
      console.error("Error creating dispute:", error);
      res.status(500).json({ message: "Failed to create dispute" });
    }
  });

  app.get("/api/notifications", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const unreadOnly = req.query.unreadOnly === 'true';
      
      const notifications = await firestore.getNotificationsByUser(req.user.uid, limit, unreadOnly);
      const unreadCount = await firestore.getUnreadCount(req.user.uid);
      
      res.json({ notifications, unreadCount });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", authenticateFirebase, async (req: any, res: Response) => {
    try {
      await firestore.markAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/read-all", authenticateFirebase, async (req: any, res: Response) => {
    try {
      await firestore.markAllAsRead(req.user.uid);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  app.get("/api/conversations", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const conversations = await firestore.getConversationsByUser(req.user.uid);
      res.json({ conversations });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id/messages", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const conversation = await firestore.getConversationById(req.params.id);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (!conversation.participants.includes(req.user.uid)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const messages = await firestore.getMessagesByConversation(req.params.id);
      await firestore.markMessagesAsRead(req.params.id, req.user.uid);
      
      res.json({ messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      const conversation = await firestore.getConversationById(req.params.id);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (!conversation.participants.includes(req.user.uid)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const message = await firestore.sendMessage(req.params.id, req.user.uid, content);
      res.json({ message });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post("/api/conversations", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const { recipientId, requestId } = req.body;
      
      if (!recipientId) {
        return res.status(400).json({ message: "Recipient is required" });
      }
      
      const conversation = await firestore.createConversation(
        [req.user.uid, recipientId],
        requestId || null
      );
      
      res.json({ conversation });
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.post("/api/reviews", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const { requestId, revieweeId, rating, comment } = req.body;
      
      if (!requestId || !revieweeId || !rating) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      
      const request = await firestore.getHelpRequestById(requestId);
      if (!request || request.status !== 'completed') {
        return res.status(400).json({ message: "Can only review completed requests" });
      }
      
      if (request.userId !== req.user.uid && request.assignedHelperId !== req.user.uid) {
        return res.status(403).json({ message: "Not authorized to review this request" });
      }
      
      const alreadyReviewed = await firestore.hasUserReviewed(req.user.uid, requestId);
      if (alreadyReviewed) {
        return res.status(400).json({ message: "You have already reviewed this request" });
      }
      
      const review = await firestore.createReview({
        requestId,
        reviewerId: req.user.uid,
        revieweeId,
        rating,
        comment: comment || '',
      });
      
      const reviewer = await firestore.getProfileByUserId(req.user.uid);
      await firestore.notifyNewReview(
        revieweeId,
        reviewer?.firstName || 'Someone',
        rating,
        requestId
      );
      
      res.json({ review });
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get("/api/users/:id/reviews", async (req: Request, res: Response) => {
    try {
      const reviews = await firestore.getReviewsByUser(req.params.id);
      const stats = await firestore.getUserRatingStats(req.params.id);
      res.json({ reviews, stats });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/kyc/submit", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const { documentType, documentNumber, documentUrl, selfieUrl } = req.body;
      
      if (!documentType || !documentNumber || !documentUrl) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const submission = await firestore.submitKyc({
        userId: req.user.uid,
        documentType,
        documentNumber,
        documentUrl,
        selfieUrl: selfieUrl || null,
      });
      
      res.json({ submission });
    } catch (error) {
      console.error("Error submitting KYC:", error);
      res.status(500).json({ message: "Failed to submit KYC" });
    }
  });

  app.get("/api/kyc/status", authenticateFirebase, async (req: any, res: Response) => {
    try {
      const submission = await firestore.getLatestKycSubmission(req.user.uid);
      res.json({ submission });
    } catch (error) {
      console.error("Error fetching KYC status:", error);
      res.status(500).json({ message: "Failed to fetch KYC status" });
    }
  });

  app.get("/api/admin/kyc/pending", authenticateFirebase, requireAdmin, async (req: any, res: Response) => {
    try {
      const submissions = await firestore.getPendingKycSubmissions();
      res.json({ submissions });
    } catch (error) {
      console.error("Error fetching pending KYC:", error);
      res.status(500).json({ message: "Failed to fetch pending KYC" });
    }
  });

  app.post("/api/admin/kyc/:id/approve", authenticateFirebase, requireAdmin, async (req: any, res: Response) => {
    try {
      await firestore.approveKyc(req.params.id, req.user.uid);
      res.json({ success: true });
    } catch (error) {
      console.error("Error approving KYC:", error);
      res.status(500).json({ message: "Failed to approve KYC" });
    }
  });

  app.post("/api/admin/kyc/:id/reject", authenticateFirebase, requireAdmin, async (req: any, res: Response) => {
    try {
      const { reason } = req.body;
      await firestore.rejectKyc(req.params.id, req.user.uid, reason);
      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting KYC:", error);
      res.status(500).json({ message: "Failed to reject KYC" });
    }
  });

  app.get("/api/admin/disputes", authenticateFirebase, requireAdmin, async (req: any, res: Response) => {
    try {
      const disputes = await firestore.getOpenDisputes();
      res.json({ disputes });
    } catch (error) {
      console.error("Error fetching disputes:", error);
      res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });

  app.post("/api/admin/disputes/:id/resolve", authenticateFirebase, requireAdmin, async (req: any, res: Response) => {
    try {
      const { resolution, note } = req.body;
      
      if (!resolution || !['requester', 'helper'].includes(resolution)) {
        return res.status(400).json({ message: "Invalid resolution" });
      }
      
      await firestore.resolveDispute(
        req.params.id,
        resolution,
        req.user.uid,
        note || ''
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving dispute:", error);
      res.status(500).json({ message: "Failed to resolve dispute" });
    }
  });
}
