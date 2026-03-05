import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MapPin, Clock, Star, HeartHandshake, ChevronDown, Heart, X, LogIn, CheckCircle2 } from "lucide-react";
import { UrgencyBadge, UrgencyLevel } from "@/components/ui/urgency-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Lock } from "lucide-react";
import { useMockAuth } from "@/hooks/use-mock-auth";

interface Request {
  id: string;
  title: string;
  description: string;
  location: string;
  urgency: UrgencyLevel;
  amount: number;
  postedAt: string;
  author: {
    name: string;
    avatar: string;
    rating: number;
    verified: boolean;
    kycLevel?: number;
  };
}

// Get posted requests from localStorage
const getPostedRequests = (): Request[] => {
  if (typeof window === 'undefined') return [];
  const posted = localStorage.getItem("postedRequests");
  return posted ? JSON.parse(posted) : [];
};

// Mock requests that would be pulled from approved offers in production
const MOCK_REQUESTS: Request[] = [
  {
    id: "1",
    title: "Urgent: Insulin prescription pickup",
    description: "I am unable to drive due to surgery and need someone to pick up my prescription from CVS on 5th Main St.",
    location: "Downtown, Seattle",
    urgency: "critical",
    amount: 5000,
    postedAt: "10 mins ago",
    author: {
      name: "Martha S.",
      avatar: "https://i.pravatar.cc/150?u=1",
      rating: 4.9,
      verified: true,
      kycLevel: 100
    }
  },
  {
    id: "2",
    title: "Moving help needed for single mom",
    description: "Need strong hands to help move a sofa and fridge to second floor apartment. approx 2 hours work.",
    location: "Westside, Chicago",
    urgency: "high",
    amount: 15000,
    postedAt: "2 hours ago",
    author: {
      name: "Jennifer L.",
      avatar: "https://i.pravatar.cc/150?u=2",
      rating: 5.0,
      verified: true,
      kycLevel: 100
    }
  },
  {
    id: "3",
    title: "Algebra Tutor for Grade 10",
    description: "My son is struggling with quadratic equations. Need a patient tutor for 2 sessions this week.",
    location: "Remote / Zoom",
    urgency: "medium",
    amount: 8000,
    postedAt: "1 day ago",
    author: {
      name: "David K.",
      avatar: "https://i.pravatar.cc/150?u=3",
      rating: 4.5,
      verified: false,
      kycLevel: 50
    }
  },
  {
    id: "4",
    title: "Community Garden Cleanup",
    description: "Join us this Saturday to clean up the local park. Refreshments provided!",
    location: "Central Park, NY",
    urgency: "low",
    amount: 0,
    postedAt: "3 days ago",
    author: {
      name: "Green Earth Org",
      avatar: "https://i.pravatar.cc/150?u=4",
      rating: 4.8,
      verified: true,
      kycLevel: 75
    }
  }
];

const CATEGORIES = [
  "Financial Assistance", "Supplies", "Physical Labor", "Education", 
  "Transportation", "Pet Care", "Tech Support", "Event Planning",
  "Medical", "Legal", "Home Repair", "Cleaning", "Others"
];

export default function SearchPage() {
  const [filterUrgency, setFilterUrgency] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [distance, setDistance] = useState([50]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [messagingTo, setMessagingTo] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [savedRequests, setSavedRequests] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("savedRequests");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [location, setLocation] = useLocation();
  const { user } = useMockAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [offerMessage, setOfferMessage] = useState("");
  const [availability, setAvailability] = useState("right-now");
  const [offerSubmitted, setOfferSubmitted] = useState(false);
  
  // In production, these would be filtered from approved offers only
  // Only approved offers are visible to workers

  // Combine mock requests with posted requests
  const allRequests = [...getPostedRequests(), ...MOCK_REQUESTS];

  // Map search query to category
  const categoryMapping: { [key: string]: string } = {
    "Groceries": "Supplies",
    "Moving Help": "Physical Labor",
    "Rides": "Transportation",
    "Chat": "Others",
    "Tutoring": "Education"
  };

  // Read query parameter and auto-apply filter on mount
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const query = params.get("query");
    
    if (query) {
      setSearchTerm(query);
      // Auto-select category if it matches a known category
      const mappedCategory = categoryMapping[query];
      if (mappedCategory) {
        setFilterCategory([mappedCategory]);
      }
    }
  }, [location]);

  // Filter logic
  const filteredRequests = allRequests.filter((req) => {
    // Urgency filter
    if (filterUrgency.length > 0 && !filterUrgency.includes(req.urgency)) {
      return false;
    }
    // Price range filter
    if (req.amount > 0 && (req.amount < priceRange[0] || req.amount > priceRange[1])) {
      return false;
    }
    // Verified filter
    if (verifiedOnly && !req.author.verified) {
      return false;
    }
    // Search term filter
    if (searchTerm && !req.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const toggleUrgency = (level: string) => {
    setFilterUrgency(prev => 
      prev.includes(level) 
        ? prev.filter(u => u !== level)
        : [...prev, level]
    );
  };

  const toggleCategory = (cat: string) => {
    setFilterCategory(prev => 
      prev.includes(cat) 
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    );
  };

  // Pagination logic
  const itemsPerPage = 3;
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIdx, endIdx);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSaveRequest = (requestId: string) => {
    const newSaved = new Set(savedRequests);
    if (newSaved.has(requestId)) {
      newSaved.delete(requestId);
    } else {
      newSaved.add(requestId);
    }
    setSavedRequests(newSaved);
    localStorage.setItem("savedRequests", JSON.stringify(Array.from(newSaved)));
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Urgency Filter */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Urgency Level</h4>
        <div className="space-y-2">
          {["critical", "urgent", "high", "medium", "low"].map((level) => (
            <div key={level} className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id={`urgency-${level}`}
                checked={filterUrgency.includes(level)}
                onChange={() => toggleUrgency(level)}
                className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <label htmlFor={`urgency-${level}`} className="text-sm capitalize cursor-pointer flex-1 flex items-center gap-2">
                 {level} 
                 <UrgencyBadge level={level as UrgencyLevel} showIcon={false} className="text-[10px] px-1 py-0 h-4 ml-auto" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Category Filter */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Category</h4>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id={`cat-${cat}`} 
                checked={filterCategory.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer" 
              />
              <label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer">{cat}</label>
            </div>
          ))}
        </div>
      </div>
      
      <Separator />

      {/* Price Range Filter */}
      <div>
         <h4 className="text-sm font-semibold mb-3">Offer Amount (₦)</h4>
         <div className="mb-4">
            <Slider 
               value={priceRange}
               onValueChange={setPriceRange}
               max={100000} 
               step={1000} 
               className="mb-3"
            />
            <div className="flex justify-between text-xs font-bold text-foreground bg-primary/5 px-2 py-1 rounded">
               <span>₦{priceRange[0].toLocaleString()}</span>
               <span>₦{priceRange[1].toLocaleString()}+</span>
            </div>
         </div>
      </div>

      <Separator />

      {/* Verified Only Toggle */}
      <div className="flex items-center justify-between">
         <label htmlFor="verified-toggle" className="text-sm font-medium cursor-pointer">Verified Users Only</label>
         <input 
            type="checkbox" 
            id="verified-toggle" 
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer" 
         />
      </div>

       <Separator />

       {/* Distance Filter */}
       <div>
        <h4 className="text-sm font-semibold mb-3">Distance</h4>
        <div className="space-y-3">
           <Slider 
              value={distance}
              onValueChange={setDistance}
              max={50} 
              step={1} 
           />
           <div className="flex justify-between text-xs font-bold text-foreground bg-primary/5 px-2 py-1 rounded">
              <span>0km</span>
              <span>Within {distance[0]}km</span>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Filter Toggle Button */}
          <div className="flex items-center justify-between lg:hidden mb-4">
            <h2 className="text-2xl font-bold">Search Results</h2>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="lg"
              className="gap-2 border-2 hover:bg-primary/5"
              data-testid="button-toggle-filters"
            >
              <Filter className="w-5 h-5" />
              Filters
              {(filterUrgency.length > 0 || filterCategory.length > 0 || verifiedOnly) && (
                <Badge className="ml-2 bg-primary text-white">{filterUrgency.length + filterCategory.length + (verifiedOnly ? 1 : 0)}</Badge>
              )}
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Filters - Always visible */}
            <aside className="hidden lg:block w-72 space-y-6 shrink-0">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border sticky top-24">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Filter className="w-5 h-5" /> Filters
                </h3>
                <FilterPanel />
              </div>
            </aside>

            {/* Mobile/Tablet Filter Drawer - Animated */}
            <AnimatePresence>
              {showFilters && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowFilters(false)}
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  />
                  
                  {/* Drawer */}
                  <motion.div
                    initial={{ x: -400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -400, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-zinc-900 z-50 overflow-y-auto shadow-xl lg:hidden border-r"
                  >
                    <div className="p-6 space-y-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <Filter className="w-5 h-5" /> Filters
                        </h3>
                        <button
                          onClick={() => setShowFilters(false)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          aria-label="Close filters"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <FilterPanel />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Main Feed */}
            <div className="flex-1 space-y-6">
            {/* Search Bar & Sort */}
            <div className="flex flex-col sm:flex-row gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input 
                    placeholder="Search for requests..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-transparent shadow-sm bg-white dark:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-primary" 
                  />
               </div>
               <div className="w-full sm:w-48">
                  <select className="w-full h-12 rounded-xl border-transparent shadow-sm bg-white dark:bg-zinc-900 px-3 text-sm focus:ring-2 focus:ring-primary outline-none">
                     <option>Newest First</option>
                     <option>Most Urgent</option>
                     <option>Nearest</option>
                     <option>Highest Offer</option>
                  </select>
               </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              {paginatedRequests.length > 0 ? (
              paginatedRequests.map((req) => (
                <Card key={req.id} className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary overflow-hidden">
                  <Link href={`/request/${req.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Avatar 
                          className="w-12 h-12 border-2 border-white shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setLocation(`/public-profile/${req.id}`)}
                          role="button"
                        >
                          <AvatarImage src={req.author.avatar} />
                          <AvatarFallback>{req.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                 <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{req.title}</h3>
                                 {req.author.verified && <Badge variant="secondary" className="h-5 text-[10px] px-1 bg-blue-50 text-blue-600 border-blue-100">Verified</Badge>}
                                 {req.author.kycLevel && req.author.kycLevel === 100 && <Badge variant="secondary" className="h-5 text-[10px] px-1 bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> KYC 100%</Badge>}
                                 {req.author.kycLevel && req.author.kycLevel > 0 && req.author.kycLevel < 100 && <Badge variant="secondary" className="h-5 text-[10px] px-1 bg-amber-50 text-amber-600 border-amber-100 flex items-center gap-1"><Lock className="w-3 h-3" /> KYC {req.author.kycLevel}%</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">by <span onClick={() => setLocation(`/public-profile/${req.id}`)} className="hover:text-primary cursor-pointer font-medium" role="button">{req.author.name}</span> • <span className="text-yellow-500 font-medium">★ {req.author.rating}</span></p>
                            </div>
                            <UrgencyBadge level={req.urgency} />
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {req.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-3 mt-2 border-t border-dashed">
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                              <MapPin className="w-3 h-3" /> {req.location}
                            </div>
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                              <Clock className="w-3 h-3" /> {req.postedAt}
                            </div>
                            {req.amount > 0 ? (
                               <div className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded font-bold ml-auto shadow-sm">
                                  ₦{req.amount.toLocaleString()} Offer
                               </div>
                            ) : (
                               <div className="flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded font-bold ml-auto shadow-sm">
                                  Volunteer
                               </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                  <CardFooter className="bg-slate-50 dark:bg-zinc-900/50 p-0 h-0 group-hover:h-14 transition-all overflow-hidden flex justify-end px-6 items-center gap-2">
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       className={`text-xs gap-1 ${savedRequests.has(req.id) ? 'text-red-500' : 'text-muted-foreground'}`}
                       onClick={() => toggleSaveRequest(req.id)}
                       data-testid={`button-save-request-${req.id}`}
                     >
                       <Heart className={`w-3 h-3 ${savedRequests.has(req.id) ? 'fill-red-500' : ''}`} />
                       {savedRequests.has(req.id) ? 'Saved' : 'Save for later'}
                     </Button>
                     <Button 
                       size="sm" 
                       variant="ghost"
                       className="text-xs gap-1 text-muted-foreground hover:text-primary"
                       onClick={() => {
                         if (!user) {
                           setShowLoginPrompt(true);
                         } else {
                           setMessagingTo(req.author.name);
                         }
                       }}
                       data-testid={`button-message-author-${req.id}`}
                     >
                       <MessageSquare className="w-3 h-3" /> Message
                     </Button>
                     <Button 
                  size="sm" 
                  className="bg-primary hover:bg-primary/90 shadow-sm" 
                  data-testid={`button-offer-help-${req.id}`}
                  onClick={() => {
                    if (!user) {
                      setShowLoginPrompt(true);
                    } else {
                      setSelectedRequest(req);
                      setShowOfferForm(true);
                    }
                  }}
                >
                  Offer Help
                </Button>
                  </CardFooter>
                </Card>
              ))
              ) : (
                <Card className="border-2 border-dashed text-center py-16">
                  <div className="text-muted-foreground">
                    <p className="text-lg font-semibold mb-2">No requests found</p>
                    <p className="text-sm">Try adjusting your filters to find more requests</p>
                  </div>
                </Card>
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-8">
                <Button 
                  variant="outline" 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  data-testid="button-pagination-previous"
                >
                  Previous
                </Button>
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    className={currentPage === i + 1 ? "bg-primary text-white border-primary" : ""}
                    onClick={() => handlePageChange(i + 1)}
                    data-testid={`button-pagination-page-${i + 1}`}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button 
                  variant="outline" 
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  data-testid="button-pagination-next"
                >
                  Next
                </Button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Login Required Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginPrompt(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="space-y-2">
                  <CardTitle>You must log in to offer help</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                </CardContent>
                <CardFooter className="gap-3 flex-col">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
                    onClick={() => {
                      setShowLoginPrompt(false);
                      setLocation("/auth");
                    }}
                  >
                    Log In
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowLoginPrompt(false);
                      setLocation("/auth");
                    }}
                  >
                    Create Account
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Offer Help Form Modal */}
      <Dialog open={showOfferForm} onOpenChange={setShowOfferForm}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {!offerSubmitted ? (
              <>
                <DialogTitle>Offer Your Help</DialogTitle>

                <div className="space-y-6 py-6">
                  {/* Helper Profile Preview */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border-2 border-primary">
                        <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
                        <AvatarFallback>AJ</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">You're offering help to {selectedRequest?.author.name}</p>
                        <p className="text-xs text-muted-foreground">Your profile is visible to the requester</p>
                      </div>
                    </div>
                  </div>

                  {/* Distance Indicator */}
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">This request is 2.5 km near you</p>
                  </div>

                  {/* Message Box */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Send a message</label>
                    <Textarea
                      placeholder="Hi, I saw your request and I'd like to help. I have experience with this kind of work…"
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      className="min-h-32 resize-none"
                      data-testid="textarea-offer-message"
                    />
                    <p className="text-xs text-muted-foreground">This message will be visible only to the requester</p>
                  </div>

                  {/* Availability */}
                  <div className="space-y-2">
                    <label htmlFor="availability" className="text-sm font-semibold">When can you start?</label>
                    <Select value={availability} onValueChange={setAvailability}>
                      <SelectTrigger id="availability" data-testid="select-availability">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right-now">Right now</SelectItem>
                        <SelectItem value="30-mins">In 30 minutes</SelectItem>
                        <SelectItem value="1-hour">In 1 hour</SelectItem>
                        <SelectItem value="today">Anytime today</SelectItem>
                        <SelectItem value="schedule">Schedule a time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowOfferForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => {
                        if (offerMessage.trim()) {
                          setOfferSubmitted(true);
                        }
                      }}
                      data-testid="button-submit-offer-search"
                    >
                      Submit Offer
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <DialogTitle>Offer Pending</DialogTitle>

                <div className="space-y-6 py-6">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-2">Offer sent!</h3>
                    <p className="text-muted-foreground mb-6">Waiting for requester to review</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-3">
                    <p className="text-sm font-semibold">What happens next:</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>{selectedRequest?.author.name} will review your offer</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>They can accept or decline your help</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>You can withdraw your offer anytime</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => {
                      setShowOfferForm(false);
                      setOfferSubmitted(false);
                      setOfferMessage("");
                      setSelectedRequest(null);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Messaging Modal */}
      <AnimatePresence>
        {messagingTo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMessagingTo(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="border-b flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Send Message to {messagingTo}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Your message will be delivered securely</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setMessagingTo(null)}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Your Message</label>
                    <textarea
                      placeholder="Type your message here... (max 500 characters)"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value.slice(0, 500))}
                      className="w-full min-h-32 resize-none rounded-lg border bg-background p-3 text-sm"
                    />
                    <p className="text-xs text-muted-foreground text-right">{messageText.length}/500</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline"
                      onClick={() => setMessagingTo(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        if (messageText.trim()) {
                          alert(`Message sent to ${messagingTo}!\n\n"${messageText}"`);
                          setMessageText("");
                          setMessagingTo(null);
                        }
                      }}
                      className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                      data-testid="button-send-message-search"
                    >
                      <MessageSquare className="w-4 h-4" /> Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}