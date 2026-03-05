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
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ArrowLeft, ArrowRight, MapPin, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UrgencyBadge, UrgencyLevel } from "@/components/ui/urgency-badge";
import { KorapayModal } from "@/components/payment/korapay-modal";
import { useLocation } from "wouter";

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

export default function CreateRequest() {
  const [step, setStep] = useState(1);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
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
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      setLocation("/auth?mode=login");
      return;
    }
    if (values.amount > 0) {
      setIsPaymentOpen(true);
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-heading font-bold mb-2">Post a Help Request</h1>
          <p className="text-muted-foreground">Let the community know what you need.</p>
        </div>

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
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                <Input placeholder="Enter address or city" className="pl-10 h-12 text-lg" {...field} />
                              </div>
                              <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-lg mt-4 flex items-center justify-center border-2 border-dashed border-slate-300">
                                <p className="text-muted-foreground flex items-center gap-2">
                                  <MapPin className="w-5 h-5" /> Map Preview (Mockup)
                                </p>
                              </div>
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
                              <FormLabel className="text-lg font-semibold">Offer Amount (₦)</FormLabel>
                              <FormDescription>
                                How much are you offering to the helper? (Enter 0 for volunteer only)
                              </FormDescription>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0.00" 
                                  className="h-14 text-2xl font-mono" 
                                  {...field} 
                                />
                              </FormControl>
                              {Number(field.value) > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex gap-3 text-sm mt-2">
                                  <AlertCircle className="w-5 h-5 shrink-0" />
                                  <p>
                                    A 6% platform fee (₦{(Number(field.value) * 0.06).toLocaleString()}) will be added at checkout. 
                                    You will need to deposit the total amount (₦{(Number(field.value) * 1.06).toLocaleString()}) to post this request.
                                  </p>
                                </div>
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
                              <p className="text-sm text-muted-foreground uppercase tracking-wide font-bold mb-1">Offer Amount</p>
                              <p className="font-mono text-xl font-bold">₦{Number(form.getValues("amount")).toLocaleString()}</p>
                            </div>
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