import type { Express, Request, Response } from "express";
import { db } from "./db";
import { wallets, walletTransactions } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { isAuthenticated } from "./replit_integrations/auth/replitAuth";

export function registerWalletRoutes(app: Express) {
  app.get("/api/wallet", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      let [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
      
      if (!wallet) {
        [wallet] = await db.insert(wallets).values({ userId }).returning();
      }
      
      res.json(wallet);
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  app.get("/api/wallet/transactions", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
      
      if (!wallet) {
        return res.json([]);
      }
      
      const transactions = await db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, wallet.id))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(50);
      
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/wallet/deposit", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      let [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
      
      if (!wallet) {
        [wallet] = await db.insert(wallets).values({ userId }).returning();
      }
      
      const [transaction] = await db.insert(walletTransactions).values({
        walletId: wallet.id,
        type: "deposit",
        amount: Math.round(amount),
        status: "completed",
        description: "Deposit to wallet",
        completedAt: new Date(),
      }).returning();
      
      const [updatedWallet] = await db
        .update(wallets)
        .set({ 
          balance: wallet.balance + Math.round(amount),
          updatedAt: new Date()
        })
        .where(eq(wallets.id, wallet.id))
        .returning();
      
      res.json({ wallet: updatedWallet, transaction });
    } catch (error) {
      console.error("Error processing deposit:", error);
      res.status(500).json({ message: "Failed to process deposit" });
    }
  });

  app.post("/api/wallet/withdraw", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
      
      if (!wallet) {
        return res.status(400).json({ message: "Wallet not found" });
      }
      
      if (wallet.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      const [transaction] = await db.insert(walletTransactions).values({
        walletId: wallet.id,
        type: "withdrawal",
        amount: -Math.round(amount),
        status: "pending",
        description: "Withdrawal request",
      }).returning();
      
      const [updatedWallet] = await db
        .update(wallets)
        .set({ 
          balance: wallet.balance - Math.round(amount),
          updatedAt: new Date()
        })
        .where(eq(wallets.id, wallet.id))
        .returning();
      
      res.json({ wallet: updatedWallet, transaction });
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  app.post("/api/wallet/pay-task", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
      
      if (!wallet) {
        return res.status(400).json({ message: "Wallet not found" });
      }
      
      if (wallet.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      const [transaction] = await db.insert(walletTransactions).values({
        walletId: wallet.id,
        type: "task_payment",
        amount: -Math.round(amount),
        status: "completed",
        description: "Task payment from wallet",
        completedAt: new Date(),
      }).returning();
      
      const [updatedWallet] = await db
        .update(wallets)
        .set({ 
          balance: wallet.balance - Math.round(amount),
          updatedAt: new Date()
        })
        .where(eq(wallets.id, wallet.id))
        .returning();
      
      res.json({ wallet: updatedWallet, transaction });
    } catch (error) {
      console.error("Error processing task payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });
}
