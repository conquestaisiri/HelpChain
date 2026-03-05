import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useRoute, useLocation, Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, Calendar, Clock, MessageSquare, 
  CheckCircle2, CircleDot, Circle, Star, Loader2,
  ChevronLeft, User, Check, X, Play
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface HelpRequest {
  id: string;
  requesterId: string;
  title: string;
  description: string;
  category: string;
  location: string | null;
  isVirtual: boolean;
  scheduledTime: string | null;
  isFlexible: boolean;
  estimatedDuration: number | null;
  rewardAmount: number | null;
  rewardDescription: string | null;
  status: string;
  acceptedHelperId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

interface Offer {
  id: string;
  requestId: string;
  helperId: string;
  amount: number;
  message: string | null;
  status: string;
  createdAt: string;
  helperName?: string;
  helperAvatar?: string;
  helperRating?: number;
  helperRatingCount?: number;
}

interface Profile {
  id: string;
  userId: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  rating: number;
  ratingCount: number;
}

const categoryLabels: Record<string, string> = {
  physical_help: "Physical Help",
  errands: "Errands",
  tech_help: "Tech Help",
  guidance: "Guidance",
  transportation: "Transportation",
  home_repairs: "Home Repairs",
  childcare: "Childcare",
  pet_care: "Pet Care",
  tutoring: "Tutoring",
  other: "Other",
};

const statusLabels: Record<string, string> = {
  created: "Draft",
  published: "Looking for Help",
  accepted: "Helper Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  reviewed: "Reviewed",
  cancelled: "Cancelled",
};

const statusColors: Record<string, string> = {
  created: "bg-gray-100 text-gray-800",
  published: "bg-blue-100 text-blue-800",
  accepted: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  reviewed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusOrder = ["published", "accepted", "in_progress", "completed"];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  if (currentStatus === "cancelled" || currentStatus === "created") {
    return null;
  }
  
  let currentIndex = statusOrder.indexOf(currentStatus);
  if (currentIndex === -1) currentIndex = statusOrder.length - 1;
  
  return (
    <div className="flex items-center justify-between px-2">
      {statusOrder.map((status, index) => {
        const isCompleted = index < currentIndex || currentStatus === "reviewed" || currentStatus === "completed";
        const isCurrent = index === currentIndex;
        
        return (
          <div key={status} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              {index > 0 && (
                <div className={`h-0.5 flex-1 ${isCompleted || isCurrent ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                isCompleted ? 'bg-primary text-white' : 
                isCurrent ? 'bg-primary text-white ring-2 ring-primary/30' : 
                'bg-gray-200 text-gray-400'
              }`}>
                {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : 
                 isCurrent ? <CircleDot className="w-3 h-3" /> : 
                 <Circle className="w-3 h-3" />}
              </div>
              {index < statusOrder.length - 1 && (
                <div className={`h-0.5 flex-1 ${isCompleted ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
            <span className={`text-[10px] mt-1 text-center ${isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
              {statusLabels[status]?.split(' ')[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function RequestDetails() {
  const [, params] = useRoute("/request/:id");
  const [, navigate] = useLocation();
  const { user, getIdToken } = useFirebaseAuth();
  const isAuthenticated = !!user;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [offerMessage, setOfferMessage] = useState("");
  const [offerAmount, setOfferAmount] = useState<number | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  
  const requestId = params?.id;

  const { data: request, isLoading: loadingRequest } = useQuery<HelpRequest>({
    queryKey: ["request", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/requests/${requestId}`);
      if (!res.ok) throw new Error("Request not found");
      return res.json();
    },
    enabled: !!requestId,
  });

  const { data: offers = [] } = useQuery<Offer[]>({
    queryKey: ["offers", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/offers`);
      if (!res.ok) throw new Error("Failed to fetch offers");
      return res.json();
    },
    enabled: !!requestId,
  });

  const { data: requesterProfile } = useQuery<Profile>({
    queryKey: ["profile", request?.requesterId],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${request?.requesterId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!request?.requesterId,
  });

  const submitOfferMutation = useMutation({
    mutationFn: async () => {
      const token = await getIdToken();
      if (!token) throw new Error("Please sign in to submit an offer");
      const res = await fetch(`/api/requests/${requestId}/offers`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: offerMessage,
          amount: offerAmount || request?.rewardAmount || 0
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit offer");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Offer Submitted!", description: "The requester will review your offer." });
      setShowOfferDialog(false);
      setOfferMessage("");
      setOfferAmount(null);
      queryClient.invalidateQueries({ queryKey: ["offers", requestId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const acceptOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const token = await getIdToken();
      if (!token) throw new Error("Please sign in");
      const res = await fetch(`/api/offers/${offerId}/accept`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to accept offer");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Helper Accepted!", description: "Funds have been locked in escrow." });
      queryClient.invalidateQueries({ queryKey: ["offers", requestId] });
      queryClient.invalidateQueries({ queryKey: ["request", requestId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const declineOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const token = await getIdToken();
      if (!token) throw new Error("Please sign in");
      const res = await fetch(`/api/offers/${offerId}/decline`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to decline offer");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Offer Declined" });
      queryClient.invalidateQueries({ queryKey: ["offers", requestId] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const token = await getIdToken();
      if (!token) throw new Error("Please sign in");
      const res = await fetch(`/api/requests/${requestId}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status Updated!" });
      queryClient.invalidateQueries({ queryKey: ["request", requestId] });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async () => {
      const token = await getIdToken();
      if (!token) throw new Error("Please sign in");
      const res = await fetch(`/api/requests/${requestId}/complete`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to complete task");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Task Completed!", description: "Payment has been released." });
      queryClient.invalidateQueries({ queryKey: ["request", requestId] });
      setShowReviewDialog(true);
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const token = await getIdToken();
      if (!token) throw new Error("Please sign in");
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId,
          revieweeId: isRequester ? request?.acceptedHelperId : request?.requesterId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit review");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Review Submitted!", description: "Thank you for your feedback." });
      setShowReviewDialog(false);
      updateStatusMutation.mutate("reviewed");
    },
  });

  if (loadingRequest) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-6">
          <Skeleton className="h-6 w-20 mb-4" />
          <Skeleton className="h-48 w-full rounded-xl mb-4" />
          <Skeleton className="h-32 w-full rounded-xl mb-4" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-20 text-center">
          <p className="text-muted-foreground mb-4">Request not found</p>
          <Link href="/discover">
            <Button>Browse Tasks</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isRequester = user?.uid === request.requesterId;
  const isHelper = user?.uid === request.acceptedHelperId;
  const hasSubmittedOffer = offers.some(o => o.helperId === user?.uid);
  const pendingOffers = offers.filter(o => o.status === "pending");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <Navbar />
      
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Back Button */}
        <motion.div 
          className="py-4"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg mb-4">
            <CardContent className="p-4">
              {/* Status & Category */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className={statusColors[request.status]}>
                  {statusLabels[request.status]}
                </Badge>
                <Badge variant="outline">
                  {categoryLabels[request.category] || request.category}
                </Badge>
              </div>
              
              {/* Title */}
              <h1 className="text-xl font-bold mb-3">{request.title}</h1>
              
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                {request.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {request.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(request.createdAt), "MMM d")}
                </span>
              </div>
              
              {/* Price */}
              {request.rewardAmount && (
                <div className="bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-lg mb-4">
                  <p className="text-2xl font-bold text-green-600">
                    ₦{request.rewardAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600/70">Reward</p>
                </div>
              )}
              
              {/* Status Timeline */}
              {request.status !== "cancelled" && request.status !== "created" && (
                <div className="mb-4 py-3 bg-slate-50 dark:bg-zinc-900 rounded-lg">
                  <StatusTimeline currentStatus={request.status} />
                </div>
              )}
              
              {/* Description */}
              <div className="mb-4">
                <h3 className="font-semibold text-sm mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {request.description}
                </p>
              </div>
              
              {/* Scheduled Time */}
              {request.scheduledTime && (
                <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-zinc-900 p-3 rounded-lg mb-4">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{format(new Date(request.scheduledTime), "MMMM d, yyyy 'at' h:mm a")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Requester Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-sm mb-4">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">Posted by</h3>
              <Link href={`/public-profile/${request.requesterId}`}>
                <div className="flex items-center gap-3 cursor-pointer">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={requesterProfile?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                      {requesterProfile?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{requesterProfile?.fullName || 'User'}</p>
                    {requesterProfile?.rating && requesterProfile.rating > 0 && requesterProfile.ratingCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">
                          {requesterProfile.rating.toFixed(1)} ({requesterProfile.ratingCount})
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Offers Section (for requester) */}
        {isRequester && pendingOffers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-sm mb-4">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3">
                  Offers ({pendingOffers.length})
                </h3>
                <div className="space-y-3">
                  {pendingOffers.map((offer) => (
                    <div key={offer.id} className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/public-profile/${offer.helperId}`}>
                          <Avatar className="w-8 h-8 cursor-pointer">
                            <AvatarImage src={offer.helperAvatar} />
                            <AvatarFallback>
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1">
                          <Link href={`/public-profile/${offer.helperId}`}>
                            <p className="font-medium text-sm hover:text-primary cursor-pointer">{offer.helperName || 'Helper'}</p>
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{format(new Date(offer.createdAt), "MMM d")}</span>
                            {offer.helperRating && offer.helperRating > 0 && offer.helperRatingCount && offer.helperRatingCount > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                {offer.helperRating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">₦{offer.amount.toLocaleString()}</p>
                          {offer.amount !== request?.rewardAmount && request?.rewardAmount && (
                            <p className="text-xs text-muted-foreground">
                              {offer.amount > request.rewardAmount ? 'Counter-offer' : 'Lower offer'}
                            </p>
                          )}
                        </div>
                      </div>
                      {offer.message && (
                        <p className="text-sm text-muted-foreground mb-3">
                          "{offer.message}"
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => declineOfferMutation.mutate(offer.id)}
                          disabled={declineOfferMutation.isPending}
                          className="flex-1"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Decline
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => acceptOfferMutation.mutate(offer.id)}
                          disabled={acceptOfferMutation.isPending}
                          className="flex-1"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {!isAuthenticated && request.status === "published" && (
            <Button 
              className="w-full h-12"
              onClick={() => navigate("/auth?mode=login")}
            >
              Login to Offer Help
            </Button>
          )}
          
          {isAuthenticated && !isRequester && request.status === "published" && !hasSubmittedOffer && (
            <Button 
              className="w-full h-12"
              onClick={() => setShowOfferDialog(true)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Offer Help
            </Button>
          )}

          {isAuthenticated && !isRequester && hasSubmittedOffer && request.status === "published" && (
            <Button variant="secondary" className="w-full h-12" disabled>
              Offer Submitted - Waiting
            </Button>
          )}

          {(isRequester || isHelper) && request.status === "accepted" && (
            <Button 
              className="w-full h-12 bg-purple-600 hover:bg-purple-700"
              onClick={() => updateStatusMutation.mutate("in_progress")}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Start Help Session
            </Button>
          )}

          {isRequester && request.status === "in_progress" && (
            <Button 
              className="w-full h-12 bg-green-600 hover:bg-green-700"
              onClick={() => completeTaskMutation.mutate()}
              disabled={completeTaskMutation.isPending}
            >
              {completeTaskMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Mark as Completed
            </Button>
          )}

          {(isRequester || isHelper) && request.status === "completed" && (
            <Button 
              className="w-full h-12"
              onClick={() => setShowReviewDialog(true)}
            >
              <Star className="w-4 h-4 mr-2" />
              Leave a Review
            </Button>
          )}
        </motion.div>
      </div>

      {/* Offer Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Submit Your Offer</DialogTitle>
            <DialogDescription>
              Accept the posted price or suggest your own.
            </DialogDescription>
          </DialogHeader>
          
          {/* Price Section */}
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Posted Budget</p>
              <p className="text-lg font-bold text-primary">
                {request?.rewardAmount ? `₦${request.rewardAmount.toLocaleString()}` : 'No budget set'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-2">Your Price (₦)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                <input
                  type="number"
                  placeholder={request?.rewardAmount?.toString() || "0"}
                  value={offerAmount || ""}
                  onChange={(e) => setOfferAmount(e.target.value ? Number(e.target.value) : null)}
                  className="w-full pl-8 pr-4 py-2 rounded-lg border bg-background text-lg font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to accept the posted price
              </p>
            </div>
          </div>
          
          <Textarea
            placeholder="Introduce yourself and explain how you can help..."
            value={offerMessage}
            onChange={(e) => setOfferMessage(e.target.value)}
            rows={3}
          />
          <Button 
            onClick={() => submitOfferMutation.mutate()}
            disabled={submitOfferMutation.isPending}
            className="w-full"
          >
            {submitOfferMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Submit Offer {offerAmount ? `for ₦${offerAmount.toLocaleString()}` : ''}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              Share your experience with this {isRequester ? 'helper' : 'requester'}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setReviewRating(star)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= reviewRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Share your experience..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            rows={3}
          />
          <Button 
            onClick={() => submitReviewMutation.mutate()}
            disabled={submitReviewMutation.isPending}
            className="w-full"
          >
            {submitReviewMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Submit Review
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
