import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Star, ShieldCheck, Award, MessageSquare, Calendar, Users, Briefcase, X, Send, CheckCircle2, Lock } from "lucide-react";
import { useRoute, Redirect } from "wouter";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMockAuth } from "@/hooks/use-mock-auth";

export default function PublicProfilePage() {
  const { user } = useMockAuth();
  const [, params] = useRoute("/public-profile/:userId");
  const userId = params?.userId || "user-001";
  
  // Redirect if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }
  const [showMessaging, setShowMessaging] = useState(false);
  const [messageText, setMessageText] = useState("");

  // Mock public profile data
  const profileData = {
    id: userId,
    name: userId === "user-001" ? "Martha S." : "User",
    avatar: `https://i.pravatar.cc/150?u=${userId}`,
    rating: 4.9,
    reviewCount: 12,
    verified: true,
    joinDate: "2022",
    lastActive: "Online now",
    bio: "I'm passionate about helping my community. I love volunteering and making a difference in people's lives.",
    location: "Seattle, WA",
    worksPosted: 24,
    helpsOffered: 18,
    successRate: 98,
    kyc: {
      completed: ["nin", "bvn", "phone", "email"],
      nin: "12345678901",
      bvn: "1234567890",
      phone: "+2348123456789",
      email: "martha@helpchain.ng"
    },
    reviews: [
      {
        id: "1",
        author: "John D.",
        rating: 5,
        text: "Helped me move furniture. Very professional and reliable!",
        date: "2 weeks ago"
      },
      {
        id: "2",
        author: "Sarah M.",
        rating: 5,
        text: "Picked up groceries on short notice. Exactly what I needed!",
        date: "1 month ago"
      },
      {
        id: "3",
        author: "Michael K.",
        rating: 4,
        text: "Good service, very friendly person.",
        date: "2 months ago"
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Profile Header Card */}
          <Card className="border-none shadow-lg overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                {/* Avatar */}
                <Avatar className="w-32 h-32 border-4 border-primary/10 shrink-0">
                  <AvatarImage src={profileData.avatar} />
                  <AvatarFallback>{profileData.name.charAt(0)}</AvatarFallback>
                </Avatar>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h1 className="text-4xl font-bold">{profileData.name}</h1>
                      {profileData.verified && (
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> {profileData.location}
                    </p>
                  </div>

                  {/* Rating & Reviews */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(profileData.rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-lg">{profileData.rating}</span>
                      <span className="text-muted-foreground">({profileData.reviewCount} reviews)</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-foreground max-w-md">{profileData.bio}</p>

                  {/* Action Button */}
                  <Button size="lg" className="gap-2" onClick={() => setShowMessaging(true)} data-testid="button-contact-user">
                    <MessageSquare className="w-4 h-4" /> Send Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KYC Verification Status - Compact */}
          <div className="flex items-center gap-3">
            {[
              { key: "nin", icon: "🪪" },
              { key: "bvn", icon: "🏦" },
              { key: "phone", icon: "📱" },
              { key: "email", icon: "✉️" }
            ].map((item) => {
              const isCompleted = profileData.kyc.completed.includes(item.key);
              return (
                <div 
                  key={item.key}
                  className="relative"
                  title={isCompleted ? "Verified" : "Not verified"}
                >
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl border-2 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                    {item.icon}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold bg-slate-900 dark:bg-white">
                    {isCompleted ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-red-400">✕</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">{profileData.worksPosted}</p>
                <p className="text-xs text-muted-foreground mt-1">Works Posted</p>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-green-600">{profileData.helpsOffered}</p>
                <p className="text-xs text-muted-foreground mt-1">Helps Offered</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-purple-600">{profileData.successRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">Success Rate</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold">{profileData.joinDate}</p>
                <p className="text-xs text-muted-foreground mt-1">Member Since</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-6 text-center">
                <p className="text-sm font-semibold text-green-600">{profileData.lastActive}</p>
                <p className="text-xs text-muted-foreground mt-1">Status</p>
              </CardContent>
            </Card>
          </div>

          {/* Reviews Section */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" /> Community Reviews
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileData.reviews.map((review) => (
                <div key={review.id} className="pb-6 border-b last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{review.author}</p>
                      <div className="flex items-center gap-1 mt-1">
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
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <p className="text-foreground text-sm">{review.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Safety Info */}
          <Card className="border-none shadow-sm bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900">
            <CardContent className="p-6">
              <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5" /> Safety Tips
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2 list-disc list-inside">
                <li>Always verify the person's reviews and rating before engagement.</li>
                <li>Keep all communication within HelpChain for safety.</li>
                <li>Report any suspicious behavior immediately.</li>
              </ul>
            </CardContent>
          </Card>

        </div>
      </div>

      <Footer />

      {/* Messaging Modal */}
      <AnimatePresence>
        {showMessaging && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMessaging(false)}
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
                    <CardTitle>Send Message to {profileData.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Your message will be delivered securely</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowMessaging(false)}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Your Message</label>
                    <Textarea
                      placeholder="Type your message here... (max 500 characters)"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value.slice(0, 500))}
                      className="min-h-32 resize-none rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground text-right">{messageText.length}/500</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline"
                      onClick={() => setShowMessaging(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        if (messageText.trim()) {
                          alert(`Message sent to ${profileData.name}!\n\n"${messageText}"`);
                          setMessageText("");
                          setShowMessaging(false);
                        }
                      }}
                      className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                      data-testid="button-send-message"
                    >
                      <Send className="w-4 h-4" /> Send
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
