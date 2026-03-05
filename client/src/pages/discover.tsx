import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MapPin, Clock, Search, Filter, Calendar, Loader2, 
  Sparkles, ArrowRight, User, ChevronRight, Zap, Grid3X3, List
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

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

const categoryIcons: Record<string, string> = {
  physical_help: "from-blue-500 to-cyan-500",
  errands: "from-green-500 to-emerald-500",
  tech_help: "from-purple-500 to-violet-500",
  guidance: "from-amber-500 to-yellow-500",
  transportation: "from-orange-500 to-red-500",
  home_repairs: "from-rose-500 to-pink-500",
  childcare: "from-pink-500 to-fuchsia-500",
  pet_care: "from-teal-500 to-cyan-500",
  tutoring: "from-indigo-500 to-blue-500",
  other: "from-slate-500 to-gray-500",
};

export default function DiscoverPage() {
  const { user, getIdToken } = useFirebaseAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
      const token = await getIdToken();
      if (!token) throw new Error("Please sign in to make an offer");
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, message: "I would like to help!" }),
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

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border-b">
        <div className="container mx-auto px-4 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20 rounded-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Live Tasks
            </Badge>
            <h1 className="text-4xl font-bold mb-3">Find tasks to help with</h1>
            <p className="text-lg text-muted-foreground">
              Browse open tasks from people in your community who need help
            </p>
          </motion.div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm focus:ring-4 focus:ring-primary/10"
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-[200px] h-12 rounded-xl border-slate-200 dark:border-slate-700">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Button 
                variant={viewMode === "grid" ? "secondary" : "ghost"} 
                size="icon" 
                className="rounded-none h-12 w-12"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "list" ? "secondary" : "ghost"} 
                size="icon" 
                className="rounded-none h-12 w-12"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(categoryLabels).slice(0, 6).map(([value, label]) => (
            <Badge
              key={value}
              variant={categoryFilter === value ? "default" : "secondary"}
              className={`cursor-pointer rounded-full px-4 py-2 transition-all ${
                categoryFilter === value 
                  ? "bg-primary text-white" 
                  : "hover:bg-primary/10 hover:text-primary"
              }`}
              onClick={() => setCategoryFilter(categoryFilter === value ? "" : value)}
            >
              {label}
            </Badge>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading tasks...</p>
            </motion.div>
          ) : filteredRequests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="p-16 text-center border-dashed border-2">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Search className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">No tasks found</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {searchQuery || categoryFilter
                    ? "Try adjusting your search or filters to find more tasks"
                    : "Be the first to post a task and get help from your community!"}
                </p>
                {user && (
                  <Link href="/create-request">
                    <Button size="lg" className="rounded-full px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      Post a Task
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{filteredRequests.length}</span> tasks available
                </p>
              </div>
              
              <div className={viewMode === "grid" 
                ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {filteredRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/request/${request.id}`}>
                      <Card className={`group cursor-pointer border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 ${
                        viewMode === "grid" ? "h-full" : ""
                      }`}>
                        <CardContent className={`p-6 ${viewMode === "list" ? "flex items-center gap-6" : ""}`}>
                          <div className={viewMode === "list" ? "flex-1" : ""}>
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <Badge 
                                className={`bg-gradient-to-r ${categoryIcons[request.category] || categoryIcons.other} text-white rounded-full px-3 py-1`}
                              >
                                {categoryLabels[request.category] || request.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {getTimeAgo(request.createdAt)}
                              </span>
                            </div>
                            
                            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                              {request.title}
                            </h3>
                            
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                              {request.description}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                              {request.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {request.location}
                                </span>
                              )}
                              {request.scheduledTime && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {format(new Date(request.scheduledTime), "MMM d")}
                                </span>
                              )}
                              {request.estimatedDuration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {request.estimatedDuration}min
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                              {request.rewardAmount ? (
                                <div className="font-bold text-lg text-primary">
                                  ${request.rewardAmount}
                                </div>
                              ) : (
                                <Badge variant="secondary" className="rounded-full">
                                  <Zap className="w-3 h-3 mr-1" />
                                  Flexible
                                </Badge>
                              )}
                              
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    <User className="w-3 h-3" />
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                  View Details
                                  <ChevronRight className="w-4 h-4" />
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {viewMode === "list" && user && user.uid !== request.requesterId && (
                            <Button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOfferHelp(request.id);
                              }}
                              disabled={offerHelpMutation.isPending}
                              className="shrink-0 rounded-full px-6"
                            >
                              {offerHelpMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Make Offer"
                              )}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <Footer />
    </div>
  );
}
