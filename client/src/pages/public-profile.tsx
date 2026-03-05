import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, Star, ShieldCheck, MessageSquare, Calendar, 
  ChevronLeft, Award, Briefcase, Users
} from "lucide-react";
import { useRoute, useLocation, Link } from "wouter";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

interface PublicProfile {
  id: string;
  userId: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  rating: number;
  ratingCount: number;
  helpsGiven?: number;
  requestsPosted?: number;
  createdAt?: string;
}

interface Review {
  id: string;
  reviewerId: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerName?: string;
}

export default function PublicProfilePage() {
  const { user, getIdToken } = useFirebaseAuth();
  const [, params] = useRoute("/public-profile/:userId");
  const [, navigate] = useLocation();
  const userId = params?.userId;

  const { data: profile, isLoading } = useQuery<PublicProfile>({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${userId}`);
      if (!res.ok) throw new Error("Profile not found");
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["reviews", userId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/user/${userId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId,
  });

  const handleSendMessage = async () => {
    if (!user) {
      navigate("/auth?mode=login");
      return;
    }
    navigate(`/messages?with=${userId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-6">
          <Skeleton className="h-40 w-full rounded-xl mb-4" />
          <Skeleton className="h-24 w-full rounded-xl mb-4" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 pt-20 text-center">
          <p className="text-muted-foreground mb-4">Profile not found</p>
          <Link href="/discover">
            <Button>Back to Discover</Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile.fullName || "User";
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const joinYear = profile.createdAt ? new Date(profile.createdAt).getFullYear() : new Date().getFullYear();

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

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg mb-4 overflow-hidden">
            <div className="bg-gradient-to-br from-primary to-accent h-20" />
            <CardContent className="pt-0 pb-6 px-4 -mt-10">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-20 h-20 border-4 border-white shadow-lg mb-3">
                  <AvatarImage src={profile.avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold">{displayName}</h1>
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                </div>
                
                {profile.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" />
                    {profile.location}
                  </p>
                )}
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(profile.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold">{(profile.rating || 0).toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({profile.ratingCount || 0} reviews)
                  </span>
                </div>
                
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                    {profile.bio}
                  </p>
                )}
                
                <Button onClick={handleSendMessage} className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-3 gap-3 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Briefcase className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-bold">{profile.requestsPosted || 0}</p>
              <p className="text-xs text-muted-foreground">Tasks</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <p className="text-lg font-bold">{profile.helpsGiven || 0}</p>
              <p className="text-xs text-muted-foreground">Helped</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Calendar className="w-5 h-5 mx-auto mb-1 text-purple-500" />
              <p className="text-lg font-bold">{joinYear}</p>
              <p className="text-xs text-muted-foreground">Joined</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <h2 className="font-semibold flex items-center gap-2 mb-4">
                <Award className="w-4 h-4" />
                Reviews
              </h2>
              
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No reviews yet
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="pb-4 border-b last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{review.reviewerName || 'User'}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-slate-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
