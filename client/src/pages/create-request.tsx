import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useWallet } from "@/hooks/use-wallet";
import { Loader2, ArrowLeft, ArrowRight, MapPin, AlertCircle, Wallet, CreditCard, Navigation, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UrgencyBadge, UrgencyLevel } from "@/components/ui/urgency-badge";
import { KorapayModal } from "@/components/payment/korapay-modal";
import { useLocation } from "wouter";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const CATEGORIES = [
  { value: "physical_help", label: "Physical Help" },
  { value: "errands", label: "Errands / Groceries" },
  { value: "tech_help", label: "Tech Support" },
  { value: "guidance", label: "Guidance / Advice" },
  { value: "transportation", label: "Transportation" },
  { value: "home_repairs", label: "Home Repairs" },
  { value: "childcare", label: "Childcare" },
  { value: "pet_care", label: "Pet Care" },
  { value: "tutoring", label: "Tutoring / Education" },
  { value: "other", label: "Other" },
];

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Please provide more detail (min 20 chars)"),
  location: z.string().min(2, "Location is required"),
  category: z.string().min(1, "Please select a category"),
  otherCategory: z.string().optional(),
  urgency: z.enum(["low", "medium", "high", "urgent", "critical"] as const),
  amount: z.coerce.number().min(0, "Amount cannot be negative"),
});

function CreateRequestContent() {
  const [step, setStep] = useState(1);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [fundingSource, setFundingSource] = useState<"wallet" | "paynow">("wallet");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, getIdToken } = useFirebaseAuth();
  const { balance, initializeDeposit } = useWallet();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      category: "",
      urgency: "medium",
      amount: 0,
      otherCategory: ""
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast({
        title: "Request Posted Successfully!",
        description: "Your help request is now live and visible to helpers.",
      });
      setLocation("/discover");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const payFromWalletMutation = useMutation({
    mutationFn: async (amount: number) => {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/wallet/pay-task", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Payment failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      setLocation("/auth?mode=login");
      return;
    }
    const totalAmount = values.amount > 0 ? Math.round(values.amount * 1.06) : 0;
    
    if (values.amount > 0) {
      if (fundingSource === "wallet") {
        if (balance >= totalAmount) {
          try {
            await payFromWalletMutation.mutateAsync(totalAmount);
            handleFinalSubmission();
          } catch (error: any) {
            toast({
              title: "Payment Failed",
              description: error.message || "Could not deduct from wallet. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Insufficient Balance",
            description: `You need ₦${totalAmount.toLocaleString()} but only have ₦${balance.toLocaleString()}. Please add funds or use Pay Now.`,
            variant: "destructive",
          });
        }
      } else {
        setIsPaymentOpen(true);
      }
    } else {
      handleFinalSubmission();
    }
  };

  const handlePaymentSuccess = async () => {
    handleFinalSubmission();
  };

  const handleFinalSubmission = async () => {
    const formData = form.getValues();
    createRequestMutation.mutate({
      title: formData.title,
      description: formData.description,
      location: formData.location,
      category: formData.category,
      rewardAmount: formData.amount > 0 ? formData.amount : null,
    });
  }

  const nextStep = async () => {
    let valid = false;
    if (step === 1) valid = await form.trigger(["title", "description"]);
    if (step === 2) valid = await form.trigger(["category", "otherCategory", "urgency"]);
    if (step === 3) valid = await form.trigger(["location"]);
    if (step === 4) valid = await form.trigger(["amount"]);

    if (valid) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const watchCategory = form.watch("category");

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationCoords({ lat: latitude, lng: longitude });
        
        // Reverse geocoding to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          
          // Extract a readable address
          const address = data.address;
          let locationText = '';
          
          if (address) {
            const parts = [];
            if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
            if (address.city || address.town || address.village) parts.push(address.city || address.town || address.village);
            if (address.state) parts.push(address.state);
            locationText = parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',');
          } else {
            locationText = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          }
          
          form.setValue('location', locationText);
          toast({
            title: "Location detected",
            description: locationText,
          });
        } catch (error) {
          // Fallback to coordinates
          form.setValue('location', `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        let message = "Unable to get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Please allow location access in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out.";
        }
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <motion.div 
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20 rounded-full">
            Create Task
          </Badge>
          <h1 className="text-3xl font-bold mb-2">Post a Help Request</h1>
          <p className="text-muted-foreground">Let the community know what you need.</p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span className={step >= 1 ? "text-primary" : ""}>Details</span>
            <span className={step >= 2 ? "text-primary" : ""}>Category</span>
            <span className={step >= 3 ? "text-primary" : ""}>Location</span>
            <span className={step >= 4 ? "text-primary" : ""}>Offer</span>
            <span className={step >= 5 ? "text-primary" : ""}>Review</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${(step / 5) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <Card className="border-none shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="p-8">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-semibold">What do you need help with?</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Need groceries delivered for elderly parent" className="h-12 text-lg" {...field} />
                              </FormControl>
                              <FormDescription>Keep it short and clear.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-semibold">Describe the situation</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Provide more details about what you need..." 
                                  className="min-h-[150px] text-base resize-none" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                         <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-semibold">Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-[300px]">
                                  {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {watchCategory === "other" && (
                            <FormField
                              control={form.control}
                              name="otherCategory"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-lg font-semibold">Specify Category</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter custom category" className="h-12" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        )}

                        <FormField
                          control={form.control}
                          name="urgency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-semibold">Urgency Level</FormLabel>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                {(["low", "medium", "high", "urgent", "critical"] as UrgencyLevel[]).map((level) => (
                                  <div 
                                    key={level}
                                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${field.value === level ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-transparent bg-slate-100 dark:bg-slate-800'}`}
                                    onClick={() => field.onChange(level)}
                                  >
                                    <UrgencyBadge level={level} showIcon={true} className="mb-2" />
                                    <p className="text-xs text-muted-foreground">
                                      {level === 'critical' ? 'Life-threatening or immediate crisis.' : 
                                       level === 'urgent' ? 'Needs attention within 24 hours.' :
                                       level === 'high' ? 'Needs attention within 3 days.' :
                                       'Can wait a week or more.'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-semibold">Where is help needed?</FormLabel>
                              
                              {/* GPS Button */}
                              <Button
                                type="button"
                                variant="outline"
                                onClick={getCurrentLocation}
                                disabled={isGettingLocation}
                                className="w-full h-14 mb-3 border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5"
                              >
                                {isGettingLocation ? (
                                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                  <Navigation className="w-5 h-5 mr-2 text-primary" />
                                )}
                                {isGettingLocation ? "Getting your location..." : "Use My Current Location"}
                              </Button>
                              
                              <div className="relative flex items-center gap-4 my-3">
                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                <span className="text-xs text-muted-foreground uppercase">or enter manually</span>
                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                              </div>
                              
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                <Input placeholder="Enter address, area or city" className="pl-10 h-12 text-lg" {...field} />
                              </div>
                              
                              {/* Location confirmation */}
                              {field.value && (
                                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-green-800 dark:text-green-200">Location Set</p>
                                      <p className="text-sm text-green-600 dark:text-green-400">{field.value}</p>
                                      {locationCoords && (
                                        <p className="text-xs text-green-500 dark:text-green-500 mt-1">
                                          GPS: {locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <FormDescription className="mt-3">
                                Helpers will use this to find tasks near them. Be as specific as possible.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    )}

                    {step === 4 && (
                      <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-semibold">What's your budget? (₦)</FormLabel>
                              <FormDescription>
                                Set any amount you're comfortable with. Helpers can accept your offer or suggest a different price.
                              </FormDescription>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono text-muted-foreground">₦</span>
                                  <Input 
                                    type="number" 
                                    placeholder="0" 
                                    className="h-14 text-2xl font-mono pl-10" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              {Number(field.value) > 0 && (
                                <>
                                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex gap-3 text-sm mt-2">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>
                                      A 6% platform fee (₦{(Number(field.value) * 0.06).toLocaleString()}) will be added. 
                                      Total: ₦{(Number(field.value) * 1.06).toLocaleString()}
                                    </p>
                                  </div>
                                  
                                  <div className="mt-6">
                                    <p className="text-lg font-semibold mb-3">How would you like to pay?</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <div
                                        onClick={() => setFundingSource("wallet")}
                                        className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                                          fundingSource === "wallet" 
                                            ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                            : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                                        }`}
                                      >
                                        <div className="flex items-center gap-3 mb-2">
                                          <div className={`p-2 rounded-lg ${fundingSource === "wallet" ? "bg-primary/20" : "bg-slate-100 dark:bg-slate-800"}`}>
                                            <Wallet className={`w-5 h-5 ${fundingSource === "wallet" ? "text-primary" : "text-muted-foreground"}`} />
                                          </div>
                                          <div className="flex-1">
                                            <p className="font-semibold">Account Balance</p>
                                            <p className="text-sm text-muted-foreground">Use your wallet funds</p>
                                          </div>
                                        </div>
                                        <div className={`text-sm ${balance >= Number(field.value) * 1.06 ? "text-emerald-600" : "text-orange-600"}`}>
                                          Balance: ₦{balance.toLocaleString()}
                                          {balance < Number(field.value) * 1.06 && (
                                            <span className="ml-1 text-xs">(Insufficient)</span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div
                                        onClick={() => setFundingSource("paynow")}
                                        className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                                          fundingSource === "paynow" 
                                            ? "border-primary bg-primary/5 ring-1 ring-primary" 
                                            : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                                        }`}
                                      >
                                        <div className="flex items-center gap-3 mb-2">
                                          <div className={`p-2 rounded-lg ${fundingSource === "paynow" ? "bg-primary/20" : "bg-slate-100 dark:bg-slate-800"}`}>
                                            <CreditCard className={`w-5 h-5 ${fundingSource === "paynow" ? "text-primary" : "text-muted-foreground"}`} />
                                          </div>
                                          <div className="flex-1">
                                            <p className="font-semibold">Pay Now</p>
                                            <p className="text-sm text-muted-foreground">Card, Bank, or Crypto</p>
                                          </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          Pay ₦{(Number(field.value) * 1.06).toLocaleString()} now
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    )}

                    {step === 5 && (
                      <motion.div
                        key="step5"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl space-y-4 border">
                          <h3 className="font-bold text-xl border-b pb-4">Review Request</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm text-muted-foreground uppercase tracking-wide font-bold mb-1">Title</p>
                              <p className="font-medium text-lg">{form.getValues("title")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground uppercase tracking-wide font-bold mb-1">Category</p>
                              <Badge variant="secondary" className="text-base">
                                  {CATEGORIES.find(c => c.value === form.getValues("category"))?.label || form.getValues("category")}
                              </Badge>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm text-muted-foreground uppercase tracking-wide font-bold mb-1">Description</p>
                              <p className="text-muted-foreground bg-white dark:bg-black p-4 rounded-lg border">{form.getValues("description")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground uppercase tracking-wide font-bold mb-1">Location</p>
                              <p className="font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> {form.getValues("location")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground uppercase tracking-wide font-bold mb-1">Urgency</p>
                              <UrgencyBadge level={form.getValues("urgency")} />
                            </div>
                             <div>
                              <p className="text-sm text-muted-foreground uppercase tracking-wide font-bold mb-1">Your Budget</p>
                              <p className="font-mono text-xl font-bold">₦{Number(form.getValues("amount")).toLocaleString()}</p>
                            </div>
                            {Number(form.getValues("amount")) > 0 && (
                              <div>
                                <p className="text-sm text-muted-foreground uppercase tracking-wide font-bold mb-1">Payment Method</p>
                                <div className="flex items-center gap-2">
                                  {fundingSource === "wallet" ? (
                                    <>
                                      <Wallet className="w-4 h-4 text-primary" />
                                      <span className="font-medium">Account Balance</span>
                                    </>
                                  ) : (
                                    <>
                                      <CreditCard className="w-4 h-4 text-primary" />
                                      <span className="font-medium">Pay Now</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-900 p-6 border-t flex justify-between items-center">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={prevStep} 
                    disabled={step === 1}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  
                  {step < 5 ? (
                    <Button type="button" onClick={nextStep} className="bg-primary hover:bg-primary/90 px-8">
                      Next Step <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={createRequestMutation.isPending} className="bg-[#FFB400] hover:bg-[#e5a200] text-black font-bold px-8 shadow-lg">
                      {createRequestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {Number(form.getValues("amount")) > 0 ? "Proceed to Payment" : "Submit Request"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <KorapayModal 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        amount={Number(form.getValues("amount"))} 
        onSuccess={handlePaymentSuccess}
      />

      <Footer />
    </div>
  );
}

export default function CreateRequest() {
  return (
    <ProtectedRoute>
      <CreateRequestContent />
    </ProtectedRoute>
  );
}