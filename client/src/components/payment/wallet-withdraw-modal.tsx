import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, CheckCircle2, ArrowUpRight, Building2, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";

interface WalletWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WithdrawMethod = "bank" | "usdt" | "btc" | "eth" | "sol";

const withdrawMethods = [
  { id: "bank" as WithdrawMethod, name: "Bank Transfer", icon: Building2, description: "Nigerian Banks (NGN)", available: true },
  { id: "usdt" as WithdrawMethod, name: "USDT", icon: Wallet, description: "Tether USD (TRC20)", available: true },
  { id: "btc" as WithdrawMethod, name: "Bitcoin", icon: Wallet, description: "BTC Network", available: true },
  { id: "eth" as WithdrawMethod, name: "Ethereum", icon: Wallet, description: "ETH Network", available: true },
  { id: "sol" as WithdrawMethod, name: "Solana", icon: Wallet, description: "SOL Network", available: true },
];

const nigerianBanks = [
  "Access Bank", "First Bank", "GT Bank", "UBA", "Zenith Bank",
  "Fidelity Bank", "Polaris Bank", "Sterling Bank", "Wema Bank", "Union Bank"
];

export function WalletWithdrawModal({ isOpen, onClose }: WalletWithdrawModalProps) {
  const [step, setStep] = useState<"amount" | "method" | "details" | "confirm" | "processing" | "success">("amount");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<WithdrawMethod>("bank");
  const [bankDetails, setBankDetails] = useState({ bank: "", accountNumber: "", accountName: "" });
  const [cryptoAddress, setCryptoAddress] = useState("");
  const { balance, isWithdrawalLocked, withdraw } = useWallet();
  const { toast } = useToast();

  const amount = parseInt(withdrawAmount) || 0;
  const locked = isWithdrawalLocked();

  const handleNext = () => {
    if (locked) {
      toast({
        title: "Withdrawal Locked",
        description: "You have an active offer transaction in progress. Complete or cancel it first.",
        variant: "destructive",
      });
      return;
    }
    if (amount < 1000) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal is ₦1,000",
        variant: "destructive",
      });
      return;
    }
    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ₦${balance.toLocaleString()} available`,
        variant: "destructive",
      });
      return;
    }
    setStep("method");
  };

  const handleMethodSelect = (method: WithdrawMethod) => {
    setSelectedMethod(method);
    setStep("details");
  };

  const handleDetailsSubmit = () => {
    if (selectedMethod === "bank") {
      if (!bankDetails.bank || !bankDetails.accountNumber || !bankDetails.accountName) {
        toast({ title: "Missing Details", description: "Please fill in all bank details", variant: "destructive" });
        return;
      }
      if (bankDetails.accountNumber.length !== 10) {
        toast({ title: "Invalid Account", description: "Account number must be 10 digits", variant: "destructive" });
        return;
      }
    } else {
      if (!cryptoAddress || cryptoAddress.length < 20) {
        toast({ title: "Invalid Address", description: "Please enter a valid wallet address", variant: "destructive" });
        return;
      }
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setStep("processing");
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await withdraw(amount);
      setStep("success");
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error: any) {
      toast({ title: "Withdrawal Failed", description: error?.message || "Unable to process withdrawal. Please try again.", variant: "destructive" });
      setStep("amount");
    }
  };

  const handleClose = () => {
    if (step === "processing") return;
    onClose();
    setStep("amount");
    setWithdrawAmount("");
    setSelectedMethod("bank");
    setBankDetails({ bank: "", accountNumber: "", accountName: "" });
    setCryptoAddress("");
  };

  const handleBack = () => {
    if (step === "method") setStep("amount");
    else if (step === "details") setStep("method");
    else if (step === "confirm") setStep("details");
  };

  const getMethodName = () => withdrawMethods.find(m => m.id === selectedMethod)?.name || "";

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
                  <span className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-xl text-white shadow-lg">
                    <ArrowUpRight className="w-5 h-5" />
                  </span>
                  Withdraw Funds
                </DialogTitle>
                <DialogDescription>
                  Transfer funds from your wallet to your bank or crypto wallet
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-5">
                {locked && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 flex gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-red-700 dark:text-red-400">Withdrawal Locked</p>
                      <p className="text-red-600 dark:text-red-500 text-xs mt-1">Complete or cancel your active offer first.</p>
                    </div>
                  </motion.div>
                )}

                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20">
                  <p className="text-sm font-medium">Available Balance</p>
                  <p className="text-2xl font-bold text-primary">₦{balance.toLocaleString()}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount" className="text-sm font-medium">Amount (₦)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="Enter amount (minimum ₦1,000)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="text-lg h-14 font-semibold"
                    min="1000"
                    max={balance}
                    disabled={locked}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Minimum: ₦1,000</span>
                    <button
                      onClick={() => setWithdrawAmount(balance.toString())}
                      disabled={locked}
                      className="text-primary font-medium hover:underline disabled:opacity-50"
                    >
                      Withdraw All
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  {[5000, 10000, 20000].map((preset) => (
                    <Button
                      key={preset}
                      variant="outline"
                      size="sm"
                      className="flex-1 font-medium"
                      onClick={() => setWithdrawAmount(Math.min(preset, balance).toString())}
                      disabled={locked || preset > balance}
                    >
                      ₦{(preset / 1000)}k
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 font-medium"
                    onClick={() => setWithdrawAmount(balance.toString())}
                    disabled={locked}
                  >
                    Max
                  </Button>
                </div>

                {amount > 0 && !locked && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 p-4 rounded-xl space-y-2 border"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Withdrawal Amount</span>
                      <span className="font-bold">₦{amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Processing Fee</span>
                      <span className="font-bold text-green-600">FREE</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between text-base font-bold">
                      <span>You'll Receive</span>
                      <span className="text-primary">₦{amount.toLocaleString()}</span>
                    </div>
                  </motion.div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleNext} disabled={amount < 1000 || locked} className="shadow-lg shadow-primary/20">
                  Choose Withdraw Method
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
                  <span className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-xl text-white shadow-lg">
                    <Wallet className="w-5 h-5" />
                  </span>
                  Select Withdrawal Method
                </DialogTitle>
                <DialogDescription>
                  Choose where to receive your funds
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  {withdrawMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handleMethodSelect(method.id)}
                      disabled={!method.available}
                      className="p-4 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed border-slate-200 dark:border-slate-700 flex items-center gap-4"
                    >
                      <div className={`p-3 rounded-lg ${method.id === 'bank' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                        <method.icon className={`w-6 h-6 ${method.id === 'bank' ? 'text-blue-600' : 'text-orange-600'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{method.name}</p>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                      <div className="text-xs text-green-600 font-medium">FREE</div>
                    </button>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleBack}>Back</Button>
              </DialogFooter>
            </motion.div>
          )}

          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <span className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-xl text-white shadow-lg">
                    {selectedMethod === "bank" ? <Building2 className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                  </span>
                  {selectedMethod === "bank" ? "Bank Details" : `${getMethodName()} Address`}
                </DialogTitle>
                <DialogDescription>
                  {selectedMethod === "bank" ? "Enter your Nigerian bank account details" : "Enter your wallet address"}
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-4">
                {selectedMethod === "bank" ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Select Bank</Label>
                      <select
                        value={bankDetails.bank}
                        onChange={(e) => setBankDetails({ ...bankDetails, bank: e.target.value })}
                        className="w-full h-12 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-background"
                      >
                        <option value="">Choose your bank</option>
                        {nigerianBanks.map((bank) => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Account Number</Label>
                      <Input
                        type="text"
                        placeholder="10-digit account number"
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        className="h-12 font-mono"
                        maxLength={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Account Name</Label>
                      <Input
                        type="text"
                        placeholder="Name on account"
                        value={bankDetails.accountName}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                        className="h-12"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{getMethodName()} Wallet Address</Label>
                    <Input
                      type="text"
                      placeholder={`Enter your ${getMethodName()} address`}
                      value={cryptoAddress}
                      onChange={(e) => setCryptoAddress(e.target.value)}
                      className="h-12 font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Make sure to enter a valid {getMethodName()} network address
                    </p>
                  </div>
                )}

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    Double-check your details. Incorrect information may result in lost funds.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleBack}>Back</Button>
                <Button onClick={handleDetailsSubmit} className="shadow-lg shadow-primary/20">Continue</Button>
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
                  Confirm Withdrawal
                </DialogTitle>
                <DialogDescription>
                  Review and confirm your withdrawal details
                </DialogDescription>
              </DialogHeader>

              <div className="py-6 space-y-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 p-5 rounded-xl space-y-4 border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Withdrawal Amount</span>
                    <span className="font-bold text-lg">₦{amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="font-semibold">{getMethodName()}</span>
                  </div>
                  {selectedMethod === "bank" ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Destination</span>
                      <span className="font-semibold text-right text-sm">
                        {bankDetails.bank}<br />
                        <span className="text-xs text-muted-foreground">{bankDetails.accountNumber}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Address</span>
                      <span className="font-mono text-xs truncate max-w-[180px]">{cryptoAddress}</span>
                    </div>
                  )}
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">You'll Receive</span>
                    <span className="text-2xl font-bold text-primary">₦{amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    {selectedMethod === "bank" 
                      ? "Bank transfers are processed within 2-3 business days"
                      : "Crypto withdrawals are processed within 1-2 hours"
                    }
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleBack}>Back</Button>
                <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg">
                  Confirm Withdrawal
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
                <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping" />
                <div className="relative bg-white dark:bg-zinc-900 p-5 rounded-full shadow-xl">
                  <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                </div>
              </div>
              <h3 className="text-xl font-bold">Processing Withdrawal...</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Transferring your funds via {getMethodName()}. Please wait.
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
                Withdrawal Initiated!
              </h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                ₦{amount.toLocaleString()} is being transferred to your {selectedMethod === "bank" ? "bank account" : `${getMethodName()} wallet`}.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 w-full">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {selectedMethod === "bank" 
                    ? "Expected arrival: 2-3 business days"
                    : "Expected arrival: 1-2 hours"
                  }
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
