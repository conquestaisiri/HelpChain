import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { 
  Plus, MessageSquare, MapPin, Calendar, Briefcase, 
  ChevronRight, Star, Loader2, Clock, Search, 
  ClipboardList, Users, Wallet
} from "lucide-react";
import { Link, Redirect, useLocation } from "wouter";
import { Badge as UrgencyBadge } from "@/components/ui/badge";
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/hooks/use-wallet";
import { format } from "date-fns";

export default function Dashboard() {
  const { user, getIdToken } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const walletData = useWallet();
  const balance = walletData?.balance ?? 0;
  const [activeTab, setActiveTab] = useState<'requests' | 'offers'>('requests');
  
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.uid],
    queryFn: async () => {
      const token = await getIdToken();
      if (!token) return null;
      const res = await fetch('/api/users/me', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });

  const { data: myRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['my-requests', user?.uid],
    queryFn: async () => {
      const token = await getIdToken();
      if (!token) return [];
      const res = await fetch('/api/requests/my', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const { data: myOffers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['my-offers', user?.uid],
    queryFn: async () => {
      const token = await getIdToken();
      if (!token) return [];
      const res = await fetch('/api/offers/my', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  if (!user) {
    return <Redirect to="/auth" />;
  }

  const displayName = user.displayName || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const quickActions = [
    { icon: Plus, label: "Post Task", href: "/create-request", color: "bg-primary text-white" },
    { icon: Search, label: "Find Tasks", href: "/discover", color: "bg-blue-500 text-white" },
    { icon: MessageSquare, label: "Messages", href: "/messages", color: "bg-purple-500 text-white" },
    { icon: Wallet, label: "Wallet", href: "/profile", color: "bg-amber-500 text-white" },
  ];

  const isLoading = requestsLoading || offersLoading;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <Navbar />
      
      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Header */}
        <motion.div 
          className="pt-6 pb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Welcome back,</p>
              <h1 className="text-2xl font-bold">{displayName}</h1>
            </div>
            <Link href="/profile">
              <Avatar className="w-12 h-12 border-2 border-white shadow-lg cursor-pointer">
                <AvatarImage src={profile?.avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </motion.div>

        {/* Wallet Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary via-primary to-accent text-white border-0 shadow-xl mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Wallet Balance</p>
                  <p className="text-2xl font-bold font-mono">₦{balance.toLocaleString()}</p>
                </div>
                <Link href="/profile">
                  <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                    <Wallet className="w-4 h-4 mr-1" />
                    Manage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="grid grid-cols-4 gap-2 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href}>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white dark:hover:bg-zinc-900 transition-colors cursor-pointer">
                <div className={`p-3 rounded-full ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-center">{action.label}</span>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Stats Row */}
        <motion.div 
          className="grid grid-cols-3 gap-3 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Star className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <p className="text-lg font-bold">{profile?.rating?.toFixed(1) || '0.0'}</p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <ClipboardList className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-bold">{myRequests.length}</p>
              <p className="text-xs text-muted-foreground">My Tasks</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-purple-500" />
              <p className="text-lg font-bold">{profile?.helpsGiven || 0}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div
          className="flex gap-2 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            variant={activeTab === 'requests' ? 'default' : 'outline'}
            className={`flex-1 ${activeTab === 'requests' ? '' : 'bg-white dark:bg-zinc-900'}`}
            onClick={() => setActiveTab('requests')}
          >
            <Briefcase className="w-4 h-4 mr-2" />
            My Requests
          </Button>
          <Button
            variant={activeTab === 'offers' ? 'default' : 'outline'}
            className={`flex-1 ${activeTab === 'offers' ? '' : 'bg-white dark:bg-zinc-900'}`}
            onClick={() => setActiveTab('offers')}
          >
            <Users className="w-4 h-4 mr-2" />
            My Offers
          </Button>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : activeTab === 'requests' ? (
            <div className="space-y-3">
              {myRequests.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground mb-4">No tasks posted yet</p>
                    <Link href="/create-request">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Post Your First Task
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                myRequests.map((req: any) => (
                  <Link key={req.id} href={`/request/${req.id}`}>
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-sm line-clamp-1 flex-1 mr-2">{req.title}</h3>
                          <Badge 
                            variant={req.status === 'completed' ? 'default' : 'secondary'}
                            className="capitalize text-xs"
                          >
                            {req.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs line-clamp-2 mb-3">
                          {req.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {req.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {req.location.length > 15 ? req.location.slice(0, 15) + '...' : req.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(req.createdAt), 'MMM d')}
                            </span>
                          </div>
                          <p className="text-primary font-bold text-sm">
                            {req.rewardAmount ? `₦${req.rewardAmount.toLocaleString()}` : 'Volunteer'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {myOffers.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground mb-4">No offers made yet</p>
                    <Link href="/discover">
                      <Button>
                        <Search className="w-4 h-4 mr-2" />
                        Find Tasks to Help
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                myOffers.map((offer: any) => (
                  <Card key={offer.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm line-clamp-1 flex-1 mr-2">
                          {offer.requestTitle || 'Task Offer'}
                        </h3>
                        <Badge 
                          variant={offer.status === 'accepted' ? 'default' : 'secondary'}
                          className="capitalize text-xs"
                        >
                          {offer.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs line-clamp-2 mb-3">
                        {offer.message || 'No message'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {offer.createdAt ? format(new Date(offer.createdAt), 'MMM d, yyyy') : ''}
                        </span>
                        <p className="text-primary font-bold text-sm">
                          ₦{(offer.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </motion.div>

        {/* Floating Action Button */}
        <Link href="/create-request">
          <motion.button
            className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
