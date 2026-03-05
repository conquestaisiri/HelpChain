import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, CreditCard, Building2, Wallet, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { calculatePTF } from "@/utils/calculate-ptf";

interface WalletDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentMethod = "card" | "bank" | "usdt" | "btc" | "eth" | "sol";

const paymentMethods = [
  { id: "card" as PaymentMethod, name: "Debit/Credit Card", icon: CreditCard, description: "Visa, Mastercard", available: true },
  { id: "bank" as PaymentMethod, name: "Bank Transfer", icon: Building2, description: "Nigerian Banks", available: true },
  { id: "usdt" as PaymentMethod, name: "USDT", icon: Wallet, description: "Tether USD", available: true },
  { id: "btc" as PaymentMethod, name: "Bitcoin", icon: Wallet, description: "BTC Network", available: true },
  { id: "eth" as PaymentMethod, name: "Ethereum", icon: Wallet, description: "ETH Network", available: true },
  { id: "sol" as PaymentMethod, name: "Solana", icon: Wallet, description: "SOL Network", available: true },
];

export function WalletDepositModal({ isOpen, onClose }: WalletDepositModalProps) {
  const [step, setStep] = useState<"amount" | "method" | "confirm" | "processing" | "success">("amount");
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const { deposit, balance } = useWallet();
  const { toast } = useToast();

  const amount = parseInt(depositAmount) || 0;
  const fee = amount >= 5 ? calculatePTF(amount) : 0;
  const total = amount + fee;

  const handleNext = () => {
    if (amount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit is ₦100",
        variant: "destructive",
      });
      return;
    }
    setStep("method");
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setStep("processing");
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setStep("success");
    deposit(amount, fee);
    setTimeout(() => {
      onClose();
      setStep("amount");
      setDepositAmount("");
      setSelectedMethod("card");
    }, 1500);
  };

  const handleClose = () => {
    if (step === "processing") return;
    onClose();
    setStep("amount");
    setDepositAmount("");
    setSelectedMethod("card");
  };

  const handleBack = () => {
    if (step === "method") setStep("amount");
    else if (step === "confirm") setStep("method");
  };

  const getMethodName = () => paymentMethods.find(m => m.id === selectedMethod)?.name || "";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <AnimatePresence mode="wait">
          {step === "amount" && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <span className="bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-xl text-white shadow-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  Fund Your Wallet
                </DialogTitle>
                <DialogDescription>
                  Add funds securely using your preferred payment method
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount" className="text-sm font-medium">Amount (₦)</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="Enter amount (minimum ₦100)"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="text-lg h-14 font-semibold"
                    min="100"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Minimum: ₦100</span>
                    <span>Current Balance: ₦{balance.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {[1000, 5000, 10000, 20000].map((preset) => (
                    <Button
                      key={preset}
                      variant="outline"
                      size="sm"
                      className="flex-1 font-medium"
                      onClick={() => setDepositAmount(preset.toString())}
                    >
                      ₦{(preset / 1000)}k
                    </Button>
                  ))}
                </div>

                {amount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 p-4 rounded-xl space-y-3 border"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deposit Amount</span>
                      <span className="font-semibold">₦{amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform Protection Fee</span>
                      <span className="font-semibold text-orange-600">₦{fee.toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total to Pay</span>
                      <span className="text-primary">₦{total.toLocaleString()}</span>
                    </div>
                  </motion.div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleNext} disabled={amount < 100} className="shadow-lg shadow-primary/20">
                  Choose Payment Method
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {step === "method" && (
            <motion.div
              key="method"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <span className="bg-gradient-to-br from-primary to-primary/80 p-2.5 rounded-xl text-white shadow-lg">
                    <Wallet className="w-5 h-5" />
                  </span>
                  Select Payment Method
                </DialogTitle>
                <DialogDescription>
                  Choose how you'd like to fund your wallet
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handleMethodSelect(method.id)}
                      disabled={!method.available}
                      className={`p-4 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedMethod === method.id ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <method.icon className={`w-6 h-6 mb-2 ${method.id.includes('btc') || method.id.includes('eth') || method.id.includes('sol') || method.id.includes('usdt') ? 'text-orange-500' : 'text-primary'}`} />
                      <p className="font-semibold text-sm">{method.name}</p>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </button>
                  ))}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    All payment methods are secure and encrypted. Crypto deposits are processed instantly.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleBack}>Back</Button>
              </DialogFooter>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <span className="bg-gradient-to-br from-green-500 to-green-600 p-2.5 rounded-xl text-white shadow-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  Confirm Payment
                </DialogTitle>
                <DialogDescription>
                  Review your deposit details before proceeding
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 p-5 rounded-xl space-y-4 border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount to Deposit</span>
                    <span className="font-bold text-lg">₦{amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Protection Fee</span>
                    <span className="font-bold text-orange-600">+₦{fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-semibold">{getMethodName()}</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Payment</span>
                    <span className="text-2xl font-bold text-primary">₦{total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Secure payment | Your data is encrypted and protected
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleBack}>Back</Button>
                <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg">
                  Pay ₦{total.toLocaleString()}
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div className="relative bg-white dark:bg-zinc-900 p-5 rounded-full shadow-xl">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              </div>
              <h3 className="text-xl font-bold">Processing Payment...</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Verifying your {getMethodName()} payment. Please do not close this window.
              </p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="bg-green-100 dark:bg-green-900/30 p-5 rounded-full text-green-600 mb-2">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">
                Deposit Successful!
              </h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                ₦{amount.toLocaleString()} has been added to your wallet.
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800 w-full">
                <p className="text-sm text-green-700 dark:text-green-400">
                  New Balance: <strong className="text-lg">₦{(balance + amount).toLocaleString()}</strong>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
