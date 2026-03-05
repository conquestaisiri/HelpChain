import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useRoute, useLocation } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, Calendar, Clock, MessageSquare, Share2, Flag, 
  CheckCircle2, CircleDot, Circle, Play, Star, Loader2,
  ArrowLeft, User, Check, X
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

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
  message: string | null;
  status: string;
  createdAt: string;
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

const statusOrder = ["published", "accepted", "in_progress", "completed", "reviewed"];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  if (currentStatus === "cancelled" || currentStatus === "created") {
    return null;
  }
  
  let currentIndex = statusOrder.indexOf(currentStatus);
  if (currentIndex === -1) {
    currentIndex = statusOrder.length - 1;
  }
  
  return (
    <div className="flex items-center justify-between w-full">
      {statusOrder.map((status, index) => {
        const isCompleted = index < currentIndex || currentStatus === "reviewed";
        const isCurrent = index === currentIndex;
        
        return (
          <div key={status} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              {index > 0 && (
                <div className={`h-1 flex-1 ${isCompleted || isCurrent ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted ? 'bg-primary text-white' : 
                isCurrent ? 'bg-primary text-white ring-4 ring-primary/20' : 
                'bg-gray-200 text-gray-400'
              }`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isCurrent ? (
                  <CircleDot className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>
              {index < statusOrder.length - 1 && (
                <div className={`h-1 flex-1 ${isCompleted ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
            <span className={`text-xs mt-2 text-center ${isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
              {statusLabels[status]}
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
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [offerMessage, setOfferMessage] = useState("");
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

  const { data: offers = [], isLoading: loadingOffers } = useQuery<Offer[]>({
    queryKey: ["offers", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/offers/request/${requestId}`);
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
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, message: offerMessage }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit offer");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Offer Submitted!", description: "The requester will review your offer." });
      setShowOfferDialog(false);
      setOfferMessage("");
      queryClient.invalidateQueries({ queryKey: ["offers", requestId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateOfferMutation = useMutation({
    mutationFn: async ({ offerId, status }: { offerId: string; status: string }) => {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update offer");
      return res.json();
    },
    onSuccess: (_, { status }) => {
      toast({ 
        title: status === "accepted" ? "Helper Accepted!" : "Offer Declined",
        description: status === "accepted" ? "You can now chat with your helper." : "The offer has been declined."
      });
      queryClient.invalidateQueries({ queryKey: ["offers", requestId] });
      queryClient.invalidateQueries({ queryKey: ["request", requestId] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update offer", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/requests/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status Updated!", description: "The request status has been changed." });
      queryClient.invalidateQueries({ queryKey: ["request", requestId] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          revieweeId: isRequester ? request?.acceptedHelperId : request?.requesterId,
          rating: reviewRating,
          comment: reviewComment,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit review");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Review Submitted!", description: "Thank you for your feedback." });
      setShowReviewDialog(false);
      updateStatusMutation.mutate("reviewed");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit review", variant: "destructive" });
    },
  });

  if (loadingRequest) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-2">Request Not Found</h2>
          <p className="text-muted-foreground mb-4">This request may have been removed.</p>
          <Link href="/discover">
            <Button>Browse Requests</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isRequester = user?.id === request.requesterId;
  const isHelper = user?.id === request.acceptedHelperId;
  const hasSubmittedOffer = offers.some(o => o.helperId === user?.id);
  const pendingOffers = offers.filter(o => o.status === "pending");
  const acceptedOffer = offers.find(o => o.status === "accepted");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <Link href="/discover" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Discover
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusColors[request.status]}>
                        {statusLabels[request.status]}
                      </Badge>
                      <Badge variant="outline">
                        {categoryLabels[request.category] || request.category}
                      </Badge>
                    </div>
                    <h1 className="text-3xl font-bold font-heading leading-tight">
                      {request.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {request.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {request.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Posted {format(new Date(request.createdAt), "MMM d, h:mm a")}
                      </div>
                    </div>
                  </div>
                  
                  {request.rewardAmount && (
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-2xl font-bold text-green-600">${request.rewardAmount}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Reward</div>
                    </div>
                  )}
                </div>

                {request.status !== "cancelled" && request.status !== "created" && (
                  <>
                    <Separator className="my-6" />
                    <div className="py-4">
                      <h3 className="font-bold text-lg mb-4">Request Status</h3>
                      <StatusTimeline currentStatus={request.status} />
                    </div>
                  </>
                )}

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Description</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {request.description}
                  </p>
                </div>

                {(request.scheduledTime || request.estimatedDuration || request.rewardDescription) && (
                  <>
                    <Separator className="my-6" />
                    <div className="grid grid-cols-2 gap-4">
                      {request.scheduledTime && (
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                          <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" /> Scheduled Time
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(request.scheduledTime), "MMMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      )}
                      {request.estimatedDuration && (
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                          <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" /> Estimated Duration
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {request.estimatedDuration} minutes
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="mt-8 flex gap-4">
                  {!isAuthenticated && request.status === "published" && (
                    <Button 
                      size="lg" 
                      className="flex-1 bg-primary hover:bg-primary/90 text-lg shadow-xl shadow-primary/20 h-14"
                      onClick={() => navigate("/auth?mode=login")}
                    >
                      Login to Offer Help
                    </Button>
                  )}
                  
                  {isAuthenticated && !isRequester && request.status === "published" && !hasSubmittedOffer && (
                    <Button 
                      size="lg" 
                      className="flex-1 bg-primary hover:bg-primary/90 text-lg shadow-xl shadow-primary/20 h-14"
                      onClick={() => setShowOfferDialog(true)}
                    >
                      Offer Help
                    </Button>
                  )}

                  {isAuthenticated && !isRequester && hasSubmittedOffer && request.status === "published" && (
                    <Button 
                      size="lg" 
                      variant="secondary"
                      className="flex-1 h-14"
                      disabled
                    >
                      Offer Submitted - Waiting for Response
                    </Button>
                  )}

                  {(isRequester || isHelper) && request.status === "accepted" && (
                    <Button 
                      size="lg" 
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-lg h-14"
                      onClick={() => updateStatusMutation.mutate("in_progress")}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Play className="h-5 w-5 mr-2" />
                      )}
                      Start Help Session
                    </Button>
                  )}

                  {(isRequester || isHelper) && request.status === "in_progress" && (
                    <Button 
                      size="lg" 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-lg h-14"
                      onClick={() => updateStatusMutation.mutate("completed")}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                      )}
                      Mark as Completed
                    </Button>
                  )}

                  {(isRequester || isHelper) && request.status === "completed" && request.acceptedHelperId && (
                    <Button 
                      size="lg" 
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-lg h-14"
                      onClick={() => setShowReviewDialog(true)}
                    >
                      <Star className="h-5 w-5 mr-2" />
                      Leave a Review
                    </Button>
                  )}

                  <Button size="lg" variant="outline" className="h-14 px-6">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isRequester && pendingOffers.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">Pending Offers ({pendingOffers.length})</h3>
                  <div className="space-y-4">
                    {pendingOffers.map((offer) => (
                      <div key={offer.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>
                            <User className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">Helper #{offer.helperId.slice(0, 8)}</p>
                          {offer.message && (
                            <p className="text-sm text-muted-foreground mt-1">{offer.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Offered {format(new Date(offer.createdAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateOfferMutation.mutate({ offerId: offer.id, status: "accepted" })}
                            disabled={updateOfferMutation.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOfferMutation.mutate({ offerId: offer.id, status: "declined" })}
                            disabled={updateOfferMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-md">
              <CardContent className="p-6">
                <h3 className="font-bold text-sm uppercase text-muted-foreground mb-4">Request by</h3>
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-16 h-16 border-2 border-slate-100">
                    <AvatarFallback>
                      <User className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/public-profile/${request.requesterId}`}>
                      <h4 className="font-bold text-lg hover:text-primary cursor-pointer">
                        {requesterProfile?.fullName || "Anonymous User"}
                      </h4>
                    </Link>
                    {requesterProfile?.rating && requesterProfile.ratingCount > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        {(requesterProfile.rating / requesterProfile.ratingCount).toFixed(1)} ({requesterProfile.ratingCount} reviews)
                      </div>
                    )}
                  </div>
                </div>
                
                {isAuthenticated && !isRequester && (request.status === "accepted" || request.status === "in_progress") && isHelper && (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => navigate("/messages")}
                  >
                    <MessageSquare className="w-4 h-4" /> Message Requester
                  </Button>
                )}

                {requesterProfile?.location && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{requesterProfile.location}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {acceptedOffer && (
              <Card className="border-none shadow-md border-green-200 bg-green-50/50">
                <CardContent className="p-6">
                  <h3 className="font-bold text-sm uppercase text-green-800 mb-4">Accepted Helper</h3>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>
                        <User className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Helper #{acceptedOffer.helperId.slice(0, 8)}</p>
                      <Badge variant="secondary" className="mt-1">Assigned</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <Button variant="ghost" className="text-muted-foreground hover:text-destructive text-xs gap-2">
                <Flag className="w-3 h-3" /> Report this Request
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Offer Your Help</DialogTitle>
            <DialogDescription>
              Send a message to the requester explaining how you can help.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Hi! I'd love to help with this request. I have experience with..."
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              className="min-h-32"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowOfferDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => submitOfferMutation.mutate()}
                disabled={!offerMessage.trim() || submitOfferMutation.isPending}
              >
                {submitOfferMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Submit Offer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              Share your experience with this help session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= reviewRating
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Comment (optional)</label>
              <Textarea
                placeholder="Share your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="min-h-24"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowReviewDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => submitReviewMutation.mutate()}
                disabled={submitReviewMutation.isPending}
              >
                {submitReviewMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
