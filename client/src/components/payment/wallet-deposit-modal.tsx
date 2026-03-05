import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, CreditCard, Building2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";

interface WalletDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletDepositModal({ isOpen, onClose }: WalletDepositModalProps) {
  const [step, setStep] = useState<"amount" | "processing">("amount");
  const [depositAmount, setDepositAmount] = useState("");
  const { initializeDeposit, balance, depositPending } = useWallet();
  const { toast } = useToast();

  const amount = parseInt(depositAmount) || 0;

  const handleDeposit = async () => {
    if (amount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit is ₦100",
        variant: "destructive",
      });
      return;
    }

    setStep("processing");
    try {
      const result = await initializeDeposit(amount);
      
      if (result.authorization_url) {
        window.location.href = result.authorization_url;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error: any) {
      toast({
        title: "Deposit Failed",
        description: error?.message || "Unable to initialize deposit. Please try again.",
        variant: "destructive",
      });
      setStep("amount");
    }
  };

  const handleClose = () => {
    if (step === "processing") return;
    onClose();
    setStep("amount");
    setDepositAmount("");
  };

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
                  Add funds securely using Paystack (Card, Bank Transfer, or USSD)
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
                    <div className="flex justify-between text-lg font-bold">
                      <span>Amount to Deposit</span>
                      <span className="text-primary">₦{amount.toLocaleString()}</span>
                    </div>
                  </motion.div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 space-y-3">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Payment Options:</p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400">
                      <CreditCard className="w-4 h-4" />
                      <span>Debit Card</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400">
                      <Building2 className="w-4 h-4" />
                      <span>Bank Transfer</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400">
                      <span className="font-bold">*</span>
                      <span>USSD</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Secured by Paystack - Nigeria's leading payment processor
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button 
                  onClick={handleDeposit} 
                  disabled={amount < 100 || depositPending} 
                  className="shadow-lg shadow-primary/20"
                >
                  {depositPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </>
                  )}
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
              <h3 className="text-xl font-bold">Redirecting to Paystack...</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                You'll be redirected to complete your payment securely.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
