import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock, DollarSign, Search, Filter, HandHeart, Calendar, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
  createdAt: string;
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

const categoryColors: Record<string, string> = {
  physical_help: "bg-blue-100 text-blue-800",
  errands: "bg-green-100 text-green-800",
  tech_help: "bg-purple-100 text-purple-800",
  guidance: "bg-yellow-100 text-yellow-800",
  transportation: "bg-orange-100 text-orange-800",
  home_repairs: "bg-red-100 text-red-800",
  childcare: "bg-pink-100 text-pink-800",
  pet_care: "bg-teal-100 text-teal-800",
  tutoring: "bg-indigo-100 text-indigo-800",
  other: "bg-gray-100 text-gray-800",
};

export default function DiscoverPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<HelpRequest[]>({
    queryKey: ["requests", categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter && categoryFilter !== "all") {
        params.set("category", categoryFilter);
      }
      params.set("status", "published");
      const res = await fetch(`/api/requests?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch requests");
      return res.json();
    },
  });

  const offerHelpMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, message: "I would like to help!" }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit offer");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Offer Submitted!",
        description: "The requester will be notified of your offer to help.",
      });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredRequests = requests.filter((req) =>
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOfferHelp = (requestId: string) => {
    if (!user) {
      navigate("/auth?mode=login");
      return;
    }
    offerHelpMutation.mutate(requestId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover Help Requests</h1>
          <p className="text-muted-foreground">Find ways to help your community</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="p-12 text-center">
            <HandHeart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No requests found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || categoryFilter
                ? "Try adjusting your filters"
                : "Be the first to post a help request!"}
            </p>
            {user && (
              <Link href="/create-request">
                <Button>Create a Help Request</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge className={categoryColors[request.category] || categoryColors.other}>
                      {categoryLabels[request.category] || request.category}
                    </Badge>
                    {request.rewardAmount && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {request.rewardAmount}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{request.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{request.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {request.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{request.location}</span>
                    </div>
                  )}
                  {request.scheduledTime && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(request.scheduledTime), "MMM d, h:mm a")}</span>
                    </div>
                  )}
                  {request.estimatedDuration && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{request.estimatedDuration} min estimated</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Link href={`/request/${request.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                  {user && user.id !== request.requesterId && (
                    <Button 
                      onClick={() => handleOfferHelp(request.id)}
                      disabled={offerHelpMutation.isPending}
                      className="flex-1"
                    >
                      {offerHelpMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Offer Help"
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
