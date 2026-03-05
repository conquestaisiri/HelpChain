import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFirebaseAuth } from "./use-firebase-auth";

export interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "escrow_lock" | "escrow_release" | "escrow_refund" | "fee";
  amount: number;
  status: string;
  description: string;
  reference?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  availableBalance: number;
  escrowBalance: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function useWallet() {
  const queryClient = useQueryClient();
  const { user, getIdToken } = useFirebaseAuth();

  const getAuthHeaders = async (): Promise<HeadersInit | undefined> => {
    try {
      const token = await getIdToken();
      if (!token) {
        return undefined;
      }
      return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      };
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return undefined;
    }
  };

  const { data: walletData, isLoading: walletLoading, refetch: refetchWallet } = useQuery<{ wallet: Wallet }>({
    queryKey: ["wallet", user?.uid],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      if (!headers) {
        return { wallet: null as any };
      }
      const res = await fetch("/api/wallet", { headers });
      if (!res.ok) {
        if (res.status === 401) return { wallet: null as any };
        throw new Error("Failed to fetch wallet");
      }
      return res.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ["wallet-transactions", user?.uid],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      if (!headers) {
        return { transactions: [] };
      }
      const res = await fetch("/api/wallet/transactions", { headers });
      if (!res.ok) {
        if (res.status === 401) return { transactions: [] };
        throw new Error("Failed to fetch transactions");
      }
      return res.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const initializeDepositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const headers = await getAuthHeaders();
      if (!headers) {
        throw new Error("Please sign in to make a deposit");
      }
      const res = await fetch("/api/wallet/deposit/initialize", {
        method: "POST",
        headers,
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to initialize deposit");
      }
      return res.json();
    },
  });

  const verifyDepositMutation = useMutation({
    mutationFn: async (reference: string) => {
      const headers = await getAuthHeaders();
      if (!headers) {
        throw new Error("Please sign in to verify deposit");
      }
      const res = await fetch("/api/wallet/deposit/verify", {
        method: "POST",
        headers,
        body: JSON.stringify({ reference }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to verify deposit");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async ({ amount, bankAccountId }: { amount: number; bankAccountId?: string }) => {
      const headers = await getAuthHeaders();
      if (!headers) {
        throw new Error("Please sign in to withdraw");
      }
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers,
        body: JSON.stringify({ amount, bankAccountId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to withdraw");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });

  const initializeDeposit = async (amount: number) => {
    const result = await initializeDepositMutation.mutateAsync(amount);
    return result;
  };

  const verifyDeposit = async (reference: string) => {
    return verifyDepositMutation.mutateAsync(reference);
  };

  const withdraw = async (amount: number, bankAccountId?: string) => {
    return withdrawMutation.mutateAsync({ amount, bankAccountId });
  };

  const isWithdrawalLocked = () => {
    const wallet = walletData?.wallet;
    return wallet ? wallet.escrowBalance > 0 : false;
  };

  return {
    balance: walletData?.wallet?.availableBalance || 0,
    availableBalance: walletData?.wallet?.availableBalance || 0,
    escrowBalance: walletData?.wallet?.escrowBalance || 0,
    wallet: walletData?.wallet,
    transactions: transactionsData?.transactions || [],
    isLoading: walletLoading,
    transactionsLoading,
    initializeDeposit,
    verifyDeposit,
    withdraw,
    refetchWallet,
    isWithdrawalLocked,
    depositPending: initializeDepositMutation.isPending,
    verifyPending: verifyDepositMutation.isPending,
    withdrawPending: withdrawMutation.isPending,
  };
}
