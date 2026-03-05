import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, Calendar, Star, ShieldCheck, Edit2, Wallet, 
  ArrowUpRight, ArrowDownLeft, ChevronRight, User, 
  CreditCard, FileText, Settings, LogOut, Camera, HelpCircle,
  Bell, History, Shield, Phone, Loader2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { WalletDepositModal } from "@/components/payment/wallet-deposit-modal";
import { WalletWithdrawModal } from "@/components/payment/wallet-withdraw-modal";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

function ProfilePageContent() {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const walletData = useWallet();
  const balance = walletData?.balance ?? 0;
  const transactions = walletData?.transactions ?? [];
  const isWithdrawalLocked = walletData?.isWithdrawalLocked;
  const locked = isWithdrawalLocked ? isWithdrawalLocked() : false;
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { user, getIdToken, logout } = useFirebaseAuth();
  const queryClient = useQueryClient();
  
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile', user?.uid],
    queryFn: async () => {
      const token = await getIdToken();
      if (!token) return null;
      const res = await fetch('/api/profile', { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.uid] });
      setEditOpen(false);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    },
    onError: (error) => {
      toast({ 
        title: "Update failed", 
        description: "Could not save your changes. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const displayName = profile?.fullName || user?.displayName || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  
  useEffect(() => {
    const savedProfile = localStorage.getItem("profilePicture");
    if (savedProfile) setProfileImage(savedProfile);
  }, []);

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setProfileImage(imageData);
        localStorage.setItem("profilePicture", imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const recentTransactions = transactions.slice(0, 3);

  const menuSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Personal Information", onClick: () => setEditOpen(true) },
        { icon: Shield, label: "Verification Status", badge: "Verified", badgeColor: "bg-emerald-500" },
        { icon: Bell, label: "Notifications", onClick: () => {} },
      ]
    },
    {
      title: "Wallet & Payments",
      items: [
        { icon: CreditCard, label: "Bank Accounts", onClick: () => {} },
        { icon: History, label: "Transaction History", onClick: () => setActiveSection('transactions') },
      ]
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", onClick: () => setLocation('/help') },
        { icon: Phone, label: "Contact Support", onClick: () => {} },
      ]
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-40 w-full rounded-2xl mb-4" />
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
          <Skeleton className="h-32 w-full rounded-lg mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <Navbar />
      
      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Profile Header */}
        <motion.div 
          className="pt-6 pb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar 
                className="w-20 h-20 border-4 border-white dark:border-zinc-800 shadow-lg cursor-pointer" 
                onClick={() => profileImageInputRef.current?.click()}
              >
                <AvatarImage src={profileImage || profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} />
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={() => profileImageInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full border-2 border-white dark:border-zinc-800 shadow-md"
              >
                <Camera className="w-3 h-3" />
              </button>
              <input 
                ref={profileImageInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleProfileImageUpload} 
                className="hidden" 
              />
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold truncate">{displayName}</h1>
                <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-medium">{profile?.rating?.toFixed(1) || '0.0'}</span>
                </div>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">{profile?.helpsGiven || 0} tasks completed</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary via-primary to-accent text-white border-0 shadow-xl mb-4 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  <span className="font-medium">My Wallet</span>
                </div>
                <Badge className="bg-white/20 text-white border-0">
                  Active
                </Badge>
              </div>
              
              <div className="mb-5">
                <p className="text-white/70 text-sm mb-1">Available Balance</p>
                <p className="text-3xl font-bold font-mono">₦{balance.toLocaleString()}</p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-white text-primary hover:bg-white/90 font-semibold h-11"
                  onClick={() => setDepositOpen(true)}
                >
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  Add Money
                </Button>
                <Button 
                  variant="outline"
                  className={`flex-1 border-white/30 text-white hover:bg-white/10 font-semibold h-11 ${locked ? 'opacity-50' : ''}`}
                  disabled={locked}
                  onClick={() => setWithdrawOpen(true)}
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
              </div>
              
              {locked && (
                <p className="text-sm text-white/60 mt-3 text-center">
                  Withdrawal locked during active task
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          className="grid grid-cols-3 gap-3 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {[
            { label: "Rating", value: profile?.rating?.toFixed(1) || "0.0", icon: Star, color: "text-amber-500" },
            { label: "Tasks", value: profile?.helpsGiven || 0, icon: FileText, color: "text-blue-500" },
            { label: "Reviews", value: profile?.ratingCount || 0, icon: User, color: "text-purple-500" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-sm mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Recent Activity</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary h-8 px-2"
                    onClick={() => setActiveSection('transactions')}
                  >
                    See all
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {recentTransactions.map((txn) => (
                    <div key={txn.id} className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        txn.type === 'deposit' 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' 
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                      }`}>
                        {txn.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{txn.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className={`text-sm font-bold ${
                        txn.type === 'deposit' ? 'text-emerald-600' : 'text-orange-600'
                      }`}>
                        {txn.type === 'deposit' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + sectionIndex * 0.05 }}
            className="mb-4"
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">{section.title}</h3>
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {section.items.map((item, itemIndex) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left ${
                      itemIndex < section.items.length - 1 ? 'border-b border-slate-100 dark:border-zinc-800' : ''
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800">
                      <item.icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="flex-1 font-medium text-sm">{item.label}</span>
                    {item.badge && (
                      <Badge className={`${item.badgeColor} text-white text-xs`}>
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button 
            variant="ghost" 
            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-12"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </motion.div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            updateProfileMutation.mutate({
              fullName: formData.get('fullName'),
              bio: formData.get('bio'),
              location: formData.get('location'),
            });
          }}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  name="fullName"
                  defaultValue={profile?.fullName || user?.displayName || ''} 
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  name="location"
                  placeholder="e.g., Lagos, Nigeria"
                  defaultValue={profile?.location || ''} 
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  name="bio"
                  placeholder="Tell people about yourself..."
                  defaultValue={profile?.bio || ''} 
                  className="mt-1.5 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transaction History Sheet */}
      <Dialog open={activeSection === 'transactions'} onOpenChange={() => setActiveSection(null)}>
        <DialogContent className="max-w-md mx-4 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {transactions.length > 0 ? (
              transactions.map((txn) => (
                <div key={txn.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800">
                  <div className={`p-2 rounded-full ${
                    txn.type === 'deposit' 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' 
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                  }`}>
                    {txn.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(txn.createdAt).toLocaleDateString()} at {new Date(txn.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      txn.type === 'deposit' ? 'text-emerald-600' : 'text-orange-600'
                    }`}>
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
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <WalletDepositModal isOpen={depositOpen} onClose={() => setDepositOpen(false)} />
      <WalletWithdrawModal isOpen={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
