import { create } from "zustand";

export interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "offer";
  amount: number;
  fee: number;
  status: "pending" | "completed" | "cancelled";
  description: string;
  timestamp: Date;
}

interface WalletState {
  balance: number;
  transactions: Transaction[];
  activeOffers: string[]; // IDs of active offers that lock withdrawals
  
  // Actions
  deposit: (amount: number, fee: number) => void;
  withdraw: (amount: number) => boolean; // Returns false if withdrawal is blocked
  addTransaction: (transaction: Transaction) => void;
  startOfferTransaction: (offerId: string) => void;
  completeOfferTransaction: (offerId: string) => void;
  cancelOfferTransaction: (offerId: string) => void;
  isWithdrawalLocked: () => boolean;
}

export const useWallet = create<WalletState>((set, get) => ({
  balance: 45200,
  transactions: [
    {
      id: "1",
      type: "deposit",
      amount: 50000,
      fee: 3000,
      status: "completed",
      description: "Deposit via Korapay",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: "2",
      type: "deposit",
      amount: 70000,
      fee: 4200,
      status: "completed",
      description: "Deposit via Korapay",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ],
  activeOffers: [],

  deposit: (amount, fee) => {
    set((state) => {
      const transaction: Transaction = {
        id: Date.now().toString(),
        type: "deposit",
        amount,
        fee,
        status: "completed",
        description: "Deposit via Korapay",
        timestamp: new Date(),
      };
      return {
        balance: state.balance + amount,
        transactions: [transaction, ...state.transactions],
      };
    });
  },

  withdraw: (amount) => {
    const state = get();
    // Check if withdrawal is locked due to active offers
    if (state.isWithdrawalLocked()) {
      return false;
    }
    // Check if balance is sufficient
    if (state.balance < amount) {
      return false;
    }
    set((state) => {
      const transaction: Transaction = {
        id: Date.now().toString(),
        type: "withdrawal",
        amount,
        fee: 0,
        status: "completed",
        description: "Withdrawal to bank account",
        timestamp: new Date(),
      };
      return {
        balance: state.balance - amount,
        transactions: [transaction, ...state.transactions],
      };
    });
    return true;
  },

  addTransaction: (transaction) => {
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    }));
  },

  startOfferTransaction: (offerId) => {
    set((state) => ({
      activeOffers: [...state.activeOffers, offerId],
    }));
  },

  completeOfferTransaction: (offerId) => {
    set((state) => ({
      activeOffers: state.activeOffers.filter((id) => id !== offerId),
    }));
  },

  cancelOfferTransaction: (offerId) => {
    set((state) => ({
      activeOffers: state.activeOffers.filter((id) => id !== offerId),
    }));
  },

  isWithdrawalLocked: () => {
    return get().activeOffers.length > 0;
  },
}));
