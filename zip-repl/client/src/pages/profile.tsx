import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Star, ShieldCheck, Clock, Edit2, Share2, Wallet, ArrowUpRight, ArrowDownLeft, Bell, MessageSquare, Check, Upload, X, Heart, TrendingUp, Users, Award, Settings, Eye, Bookmark } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { WalletDepositModal } from "@/components/payment/wallet-deposit-modal";
import { WalletWithdrawModal } from "@/components/payment/wallet-withdraw-modal";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

const SAVED_REQUESTS_MOCK = [
  {
    id: "1",
    title: "Urgent: Insulin prescription pickup",
    description: "I am unable to drive due to surgery and need someone to pick up my prescription from CVS on 5th Main St.",
    location: "Downtown, Seattle",
    urgency: "critical",
    amount: 5000,
    postedAt: "10 mins ago",
    author: { name: "Martha S.", avatar: "https://i.pravatar.cc/150?u=1", rating: 4.9, verified: true }
  },
  {
    id: "2",
    title: "Moving help needed for single mom",
    description: "Need strong hands to help move a sofa and fridge to second floor apartment. approx 2 hours work.",
    location: "Westside, Chicago",
    urgency: "high",
    amount: 15000,
    postedAt: "2 hours ago",
    author: { name: "Jennifer L.", avatar: "https://i.pravatar.cc/150?u=2", rating: 5.0, verified: true }
  }
];

export default function ProfilePage() {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [savedRequests, setSavedRequests] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("savedRequests");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [, setLocation] = useLocation();
  const { balance, transactions, isWithdrawalLocked } = useWallet();
  const locked = isWithdrawalLocked();
  
  const { user } = useAuth();
  
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/profile', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });
  
  const displayName = profile?.fullName || user?.username || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  
  useEffect(() => {
    const saved = localStorage.getItem("profileHeaderImage");
    if (saved) setHeaderImage(saved);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setHeaderImage(imageData);
        localStorage.setItem("profileHeaderImage", imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeHeaderImage = () => {
    setHeaderImage(null);
    localStorage.removeItem("profileHeaderImage");
  };
  
  const totalDeposited = transactions
    .filter(t => t.type === "deposit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalWithdrawn = transactions
    .filter(t => t.type === "withdrawal" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const stats = [
    { label: "Helps Given", value: profile?.helpsGiven || 0, icon: Heart, color: "text-rose-500" },
    { label: "Rating", value: profile?.rating?.toFixed(1) || "0.0", icon: Star, color: "text-amber-500" },
    { label: "Reviews", value: profile?.ratingCount || 0, icon: Users, color: "text-blue-500" },
    { label: "Success Rate", value: profile?.helpsGiven > 0 ? "100%" : "-", icon: TrendingUp, color: "text-emerald-500" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar />
      
      {/* Hero Banner */}
      <div 
        className="relative h-56 md:h-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-cover bg-center"
        style={headerImage ? { backgroundImage: `url(${headerImage})` } : {}}
      >
        {headerImage && <div className="absolute inset-0 bg-black/40" />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        
        <div className="relative z-10 h-full container mx-auto px-4 flex items-end pb-6">
          <div className="flex items-end gap-4 md:gap-6 w-full">
            <div className="relative -mb-16 md:-mb-20">
              <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-white dark:border-zinc-900 shadow-2xl">
                <AvatarImage src={profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} />
                <AvatarFallback className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-primary to-primary/80 text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full border-3 border-white dark:border-zinc-900 shadow-lg">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            
            <div className="flex-1 pb-2 text-white">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold drop-shadow-lg">{displayName}</h1>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">
                  Verified
                </Badge>
              </div>
              <p className="text-white/80 text-sm md:text-base">Community Helper</p>
            </div>
            
            <div className="hidden md:flex gap-2 pb-2">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm" onClick={() => setEditOpen(true)}>
                <Edit2 className="w-4 h-4 mr-1" /> Edit Profile
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                <Share2 className="w-4 h-4 mr-1" /> Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-20 md:pt-24 pb-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Stats Card */}
            <Card className="border-0 shadow-lg bg-white dark:bg-zinc-900">
              <CardContent className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, i) => (
                    <div key={i} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50">
                      <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-0 shadow-lg bg-white dark:bg-zinc-900">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{profile?.location || 'Location not set'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">Joined {new Date(profile?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Clock className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-muted-foreground">Usually responds within 1 hour</span>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-0 shadow-lg bg-white dark:bg-zinc-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" /> Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Helper", earned: profile?.helpsGiven >= 1, color: "bg-amber-500" },
                    { label: "5-Star", earned: profile?.rating >= 5, color: "bg-yellow-500" },
                    { label: "Fast", earned: true, color: "bg-blue-500" },
                    { label: "Trusted", earned: true, color: "bg-emerald-500" }
                  ].map((badge, i) => (
                    <div key={i} className={`aspect-square rounded-xl flex flex-col items-center justify-center ${badge.earned ? badge.color + '/10' : 'bg-slate-100 dark:bg-slate-800 opacity-40'}`}>
                      <Award className={`w-6 h-6 ${badge.earned ? badge.color.replace('bg-', 'text-') : 'text-slate-400'}`} />
                      <span className="text-[9px] font-medium mt-1">{badge.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mobile Actions */}
            <div className="flex gap-2 md:hidden">
              <Button className="flex-1" onClick={() => setEditOpen(true)}>
                <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
              <Button variant="outline" className="flex-1">
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8">
            <Card className="border-0 shadow-lg bg-white dark:bg-zinc-900 overflow-hidden">
              <Tabs defaultValue="wallet" className="w-full">
                <div className="border-b bg-slate-50 dark:bg-zinc-800/50">
                  <TabsList className="w-full h-auto p-0 bg-transparent justify-start overflow-x-auto">
                    {[
                      { value: "wallet", label: "Wallet", icon: Wallet },
                      { value: "about", label: "About", icon: Users },
                      { value: "reviews", label: `Reviews (${profile?.ratingCount || 0})`, icon: Star },
                      { value: "saved", label: `Saved (${savedRequests.size})`, icon: Bookmark },
                      { value: "settings", label: "Settings", icon: Settings },
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 px-4 py-3 gap-2"
                      >
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* WALLET TAB */}
                <TabsContent value="wallet" className="p-5 space-y-5 m-0">
                  {/* Balance Card */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />
                    
                    <div className="relative z-10">
                      <p className="text-slate-400 text-sm font-medium mb-1">Available Balance</p>
                      <h2 className="text-4xl font-bold font-mono mb-6">₦{balance.toLocaleString()}</h2>
                      
                      <div className="flex gap-3">
                        <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 font-semibold shadow-xl" onClick={() => setDepositOpen(true)}>
                          <ArrowDownLeft className="w-4 h-4 mr-2" /> Deposit
                        </Button>
                        <Button 
                          size="lg"
                          variant="outline"
                          className={`border-white/20 ${locked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'} text-white font-semibold`}
                          disabled={locked}
                          onClick={() => setWithdrawOpen(true)}
                        >
                          <ArrowUpRight className="w-4 h-4 mr-2" /> Withdraw
                        </Button>
                      </div>
                      
                      {locked && (
                        <p className="text-sm text-slate-400 mt-4">
                          Withdrawal locked during active transaction
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                          <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Deposited</p>
                          <p className="text-xl font-bold text-emerald-600">₦{totalDeposited.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/20">
                          <ArrowUpRight className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Withdrawn</p>
                          <p className="text-xl font-bold text-orange-600">₦{totalWithdrawn.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transactions */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Recent Transactions</h3>
                      <Button variant="ghost" size="sm" className="text-primary">View All</Button>
                    </div>
                    <div className="space-y-2">
                      {transactions.slice(0, 5).length > 0 ? (
                        transactions.slice(0, 5).map((txn) => (
                          <div key={txn.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                            <div className={`p-2 rounded-lg ${txn.type === 'deposit' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'}`}>
                              {txn.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{txn.description}</p>
                              <p className="text-xs text-muted-foreground">{txn.timestamp.toLocaleDateString()} at {txn.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${txn.type === 'deposit' ? 'text-emerald-600' : 'text-orange-600'}`}>
                                {txn.type === 'deposit' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                              </p>
                              <Badge variant="outline" className="text-xs">{txn.status}</Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>No transactions yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* ABOUT TAB */}
                <TabsContent value="about" className="p-5 space-y-6 m-0">
                  <div>
                    <h3 className="font-semibold mb-3">About Me</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {profile?.bio || 'No bio available yet. Click Edit Profile to add one!'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Skills & Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {["Driving", "Heavy Lifting", "Pet Care", "Shopping", "Tech Support", "Delivery"].map((skill) => (
                        <Badge key={skill} variant="secondary" className="px-3 py-1.5">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Verifications</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: "Identity (NIN)", verified: true },
                        { label: "Phone Number", verified: true },
                        { label: "Email Address", verified: true },
                        { label: "Background Check", verified: true }
                      ].map((item, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${item.verified ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-zinc-800'}`}>
                          <ShieldCheck className={`w-5 h-5 ${item.verified ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="font-medium text-sm">{item.label}</span>
                          {item.verified && <Check className="w-4 h-4 text-emerald-600 ml-auto" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* REVIEWS TAB */}
                <TabsContent value="reviews" className="p-5 m-0">
                  <div className="flex items-center gap-6 mb-6 p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">4.9</p>
                      <div className="flex gap-0.5 justify-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{profile?.ratingCount || 12} reviews</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <div key={stars} className="flex items-center gap-2">
                          <span className="text-xs w-4">{stars}</span>
                          <div className="flex-1 h-2 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: stars === 5 ? '80%' : stars === 4 ? '15%' : '5%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { name: "Sarah Connor", date: "2 weeks ago", rating: 5, text: "Incredibly helpful and punctual. Highly recommended!", helpful: 24 },
                      { name: "Michael Chen", date: "1 month ago", rating: 5, text: "Professional and reliable. Completed the task perfectly.", helpful: 18 },
                      { name: "Jennifer Smith", date: "1 month ago", rating: 5, text: "Outstanding service! Clear communication throughout.", helpful: 15 },
                    ].map((review, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50">
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={`https://i.pravatar.cc/150?u=review${i}`} />
                            <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{review.name}</p>
                            <p className="text-xs text-muted-foreground">{review.date}</p>
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(review.rating)].map((_, idx) => (
                              <Star key={idx} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* SAVED TAB */}
                <TabsContent value="saved" className="p-5 m-0">
                  {savedRequests.size > 0 ? (
                    <div className="space-y-3">
                      {SAVED_REQUESTS_MOCK.filter(req => savedRequests.has(req.id)).map((req) => (
                        <div key={req.id} className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border-l-4 border-l-primary hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer" onClick={() => setLocation(`/request/${req.id}`)}>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="font-semibold">{req.title}</h4>
                            <Button variant="ghost" size="sm" className="text-red-500 h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); const n = new Set(savedRequests); n.delete(req.id); setSavedRequests(n); localStorage.setItem("savedRequests", JSON.stringify(Array.from(n))); }}>
                              <Heart className="w-4 h-4 fill-red-500" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{req.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {req.location}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {req.postedAt}</span>
                            {req.amount > 0 && <Badge variant="secondary" className="ml-auto">₦{req.amount.toLocaleString()}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Bookmark className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="font-medium mb-1">No saved requests</p>
                      <p className="text-sm text-muted-foreground mb-4">Save requests from the search page to view them here</p>
                      <Button onClick={() => setLocation("/search")}>Browse Requests</Button>
                    </div>
                  )}
                </TabsContent>

                {/* SETTINGS TAB */}
                <TabsContent value="settings" className="p-5 m-0 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><Bell className="w-5 h-5" /> Notification Preferences</h3>
                    <div className="space-y-3">
                      {["New help requests in my area", "Messages from helpers", "Transaction updates", "Weekly activity summary"].map((setting) => (
                        <div key={setting} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50">
                          <Label className="cursor-pointer font-medium text-sm">{setting}</Label>
                          <Switch defaultChecked />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Alert Categories</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {["Financial Assistance", "Physical Labor", "Education", "Transportation"].map((cat) => (
                        <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50">
                          <Label className="cursor-pointer text-sm">{cat}</Label>
                          <Switch defaultChecked />
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>

      <Footer />

      {/* Edit Profile Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input defaultValue={displayName} placeholder="Your full name" />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea defaultValue={profile?.bio || ''} placeholder="Tell people about yourself..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input defaultValue={profile?.location || ''} placeholder="Your city" />
            </div>
            <div className="space-y-2">
              <Label>Profile Banner</Label>
              {headerImage ? (
                <div className="relative w-full h-24 rounded-lg overflow-hidden border">
                  <img src={headerImage} alt="Banner" className="w-full h-full object-cover" />
                  <button onClick={removeHeaderImage} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg hover:border-primary/50 cursor-pointer">
                  <div className="text-center">
                    <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-sm text-muted-foreground">Upload banner image</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => { setEditOpen(false); }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wallet Modals */}
      <WalletDepositModal isOpen={depositOpen} onClose={() => setDepositOpen(false)} />
      <WalletWithdrawModal isOpen={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </div>
  );
}
