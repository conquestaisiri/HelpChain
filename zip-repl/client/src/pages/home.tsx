import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Search, MapPin, ArrowRight, Heart, Shield, Clock, Star, CheckCircle2, Truck, HandHeart, MessageCircle, Hammer, ShieldCheck, Users, Stethoscope, Wrench, BookOpen, Zap, Cpu, Briefcase } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UrgencyBadge } from "@/components/ui/urgency-badge";
import { useState } from "react";

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [, setLocation] = useLocation();

  const handleTagClick = (tag: string) => {
    setSearchInput(tag);
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      setLocation(`/search?query=${encodeURIComponent(searchInput)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-8 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-50/50 to-transparent dark:from-green-950/10 pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center gap-16">
            <div className="flex-1 space-y-8 text-center max-w-3xl">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Badge variant="outline" className="px-4 py-1.5 text-sm rounded-full border-primary/20 text-primary bg-primary/5 mb-8 shadow-sm">
                  <span className="mr-2">🚀</span> The #1 Platform for Community Help
                </Badge>
                <h1 className="text-5xl lg:text-7xl font-heading font-bold tracking-tight text-foreground leading-[1.1] mb-6">
                  Find the perfect <br/>
                  <span className="text-primary relative inline-block">
                    help for your needs.
                    <svg className="absolute -bottom-2 left-0 w-full h-3 text-accent opacity-80" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                    </svg>
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Connect with verified neighbors and volunteers ready to assist you today.
                  Safe, transparent, and fast.
                </p>
              </motion.div>

              {/* Hero Image / Illustration - Moved Above Search */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="relative w-full"
              >
                <div className="relative z-10 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl border-4 md:border-8 border-white dark:border-zinc-800 rotate-0 md:rotate-2 hover:rotate-0 transition-transform duration-700 ease-out">
                  <img 
                    src="https://images.unsplash.com/photo-1593113598332-cd288d649433?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80" 
                    alt="Community helping" 
                    className="w-full h-[300px] md:h-[400px] object-cover hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-10 text-white">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30">
                        <Heart className="text-red-400 fill-red-400 h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-xl">Sarah just received help</p>
                        <p className="text-white/80 text-sm font-medium">Groceries delivered • 2 mins ago</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-8 -right-4 md:-top-12 md:-right-8 bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-xl md:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-20 animate-bounce-slow border border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex -space-x-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-10 w-10 rounded-full bg-gray-200 border-4 border-white dark:border-zinc-900 overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Avatar" />
                        </div>
                      ))}
                    </div>
                    <div>
                       <span className="font-bold text-primary text-lg block leading-none">+2,400</span>
                       <span className="text-xs text-muted-foreground font-medium">Helpers Online</span>
                    </div>
                  </div>
                  <Link href="/auth">
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs rounded-lg">Join them</Button>
                  </Link>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                  <div className="relative w-full max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-primary transition-colors" />
                    <Input 
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="What kind of help do you need?" 
                      className="pl-12 h-14 text-base rounded-2xl shadow-lg border-transparent bg-white dark:bg-zinc-900 focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <Button size="lg" onClick={handleSearch} className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-bold text-lg w-full sm:w-auto transition-transform active:scale-95">
                    Search
                  </Button>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Popular:</span>
                  {["Groceries", "Moving Help", "Rides", "Chat", "Tutoring"].map((tag) => (
                    <Badge key={tag} variant="secondary" onClick={() => handleTagClick(tag)} className="rounded-full px-3 py-1 hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors border-transparent hover:border-primary/20 border">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y bg-gradient-to-b from-white to-green-50 dark:from-zinc-900 dark:to-green-950/30 py-10">
         <div className="container mx-auto px-4">
            <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-widest">Trusted by Communities Everywhere</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 grayscale opacity-70 hover:opacity-100 transition-opacity duration-500">
               <div className="flex items-center gap-2 font-bold text-xl"><ShieldCheck className="w-8 h-8" /> SAFE_NEIGHBOR</div>
               <div className="flex items-center gap-2 font-bold text-xl"><HandHeart className="w-8 h-8" /> GoodDeed</div>
               <div className="flex items-center gap-2 font-bold text-xl"><CheckCircle2 className="w-8 h-8" /> Verify+</div>
               <div className="flex items-center gap-2 font-bold text-xl"><Users className="w-8 h-8" /> CommunityOne</div>
            </div>
         </div>
      </section>

      {/* Explore Categories */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
           <h2 className="text-3xl font-heading font-bold mb-12">Explore Categories</h2>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                 { icon: Hammer, label: "Physical Labor", desc: "Moving, lifting, chores", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30" },
                 { icon: Truck, label: "Supplies", desc: "Food, clothes, tools", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30" },
                 { icon: MapPin, label: "Transportation", desc: "Rides, deliveries", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30" },
                 { icon: MessageCircle, label: "Emotional", desc: "Chat, company, advice", color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30" },
                 { icon: Stethoscope, label: "Medical", desc: "Appointments, wellness", color: "bg-red-100 text-red-600 dark:bg-red-900/30" },
                 { icon: Wrench, label: "Home Repair", desc: "Fixing, building, repairs", color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30" },
                 { icon: BookOpen, label: "Education", desc: "Tutoring, learning, coaching", color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30" },
                 { icon: Heart, label: "Pet Care", desc: "Walking, sitting, boarding", color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30" },
                 { icon: Cpu, label: "Tech Support", desc: "Fixing, setup, guidance", color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30" },
                 { icon: Briefcase, label: "Business", desc: "Legal, financial, consulting", color: "bg-slate-100 text-slate-600 dark:bg-slate-900/30" }
              ].map((cat, i) => (
                 <Link key={i} href="/search">
                    <Card className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group h-full">
                       <CardContent className="p-5 flex flex-col items-start h-full">
                          <div className={`w-12 h-12 ${cat.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                             <cat.icon className="w-6 h-6" />
                          </div>
                          <h3 className="font-bold text-base mb-1">{cat.label}</h3>
                          <p className="text-xs text-muted-foreground leading-snug">{cat.desc}</p>
                       </CardContent>
                    </Card>
                 </Link>
              ))}
           </div>
        </div>
      </section>

      {/* Recent Requests */}
      <section className="py-24 bg-slate-50 dark:bg-zinc-950/50">
        <div className="container mx-auto px-4">
           <div className="flex justify-between items-end mb-12">
              <div>
                 <h2 className="text-3xl font-heading font-bold mb-2">Recent Requests</h2>
                 <p className="text-muted-foreground text-lg">People near you need help right now.</p>
              </div>
              <Link href="/search">
                 <Button variant="ghost" className="hidden md:flex group">
                    View all requests <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </Button>
              </Link>
           </div>

           <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Groceries for elderly neighbor",
                  desc: "My neighbor Mrs. Jenkins is 82 and can't leave her house due to the icy roads. She needs milk, bread...",
                  urgency: "medium",
                  loc: "Brooklyn, NY",
                  dist: "0.5 miles away",
                  time: "2 hours ago",
                  author: "Sarah M.",
                  verified: true
                },
                {
                  title: "Urgent medication pickup",
                  desc: "I have the flu and can't drive to the pharmacy to pick up my prescription. It's ready for pickup at...",
                  urgency: "critical",
                  loc: "Queens, NY",
                  dist: "1.2 miles away",
                  time: "15 mins ago",
                  author: "James R.",
                  verified: true
                },
                {
                  title: "Winter coat for child",
                  desc: "My son has outgrown his winter coat and it's getting very cold. Size 6-7. Any condition is fine...",
                  urgency: "low",
                  loc: "Jersey City, NJ",
                  dist: "3.5 miles away",
                  time: "1 day ago",
                  author: "Maria L.",
                  verified: false
                }
              ].map((req, i) => (
                 <Card key={i} className="hover:shadow-lg transition-all hover:-translate-y-1 border-none shadow-md flex flex-col">
                    <CardContent className="p-6 flex-1">
                       <div className="flex justify-between items-start mb-4">
                          <Badge variant="outline">{req.title.includes("Groceries") ? "Supplies" : req.title.includes("medication") ? "Physical" : "Donation"}</Badge>
                          <UrgencyBadge level={req.urgency as any} />
                       </div>
                       <h3 className="font-bold text-xl mb-2 line-clamp-1">{req.title}</h3>
                       <p className="text-muted-foreground text-sm line-clamp-3 mb-6">
                          {req.desc}
                       </p>
                       
                       <div className="flex items-center justify-between mt-auto pt-4 border-t border-dashed">
                          <div className="flex items-center gap-2">
                             <Avatar 
                                className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setLocation(`/public-profile/user-${i}`)}
                                role="button"
                             >
                                <AvatarImage src={`https://i.pravatar.cc/150?u=${i+30}`} />
                                <AvatarFallback>U</AvatarFallback>
                             </Avatar>
                             <div className="text-xs">
                                <p className="font-bold flex items-center gap-1">
                                   <span onClick={() => setLocation(`/public-profile/user-${i}`)} className="hover:text-primary cursor-pointer" role="button">{req.author}</span>
                                   {req.verified && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                                </p>
                             </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                             <p>{req.loc}</p>
                             <p>{req.dist}</p>
                          </div>
                       </div>
                    </CardContent>
                    <CardFooter className="p-4 bg-slate-50 dark:bg-zinc-900/50">
                       <Link href="/search" className="w-full">
                          <Button variant="outline" className="w-full">View Details</Button>
                       </Link>
                    </CardFooter>
                 </Card>
              ))}
           </div>
           
           <div className="mt-8 text-center md:hidden">
              <Link href="/search">
                 <Button className="w-full">View all requests</Button>
              </Link>
           </div>
        </div>
      </section>

      {/* Features Section (Original) - Kept but styled to fit */}
      <section className="py-24 bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-heading font-bold mb-4">Why Choose HelpChain?</h2>
            <p className="text-muted-foreground text-lg">
              We built a platform that prioritizes safety, speed, and transparency above all else.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Trust & Safety First",
                desc: "Every helper is identity-verified. Payments are held in escrow until the help is completed."
              },
              {
                icon: Clock,
                title: "Fast Response Time",
                desc: "Urgent requests get highlighted. Connect with local helpers in minutes, not days."
              },
              {
                icon: Star,
                title: "Community Rated",
                desc: "Transparent review system ensures quality. Helpers build reputation through actual deeds."
              }
            ].map((feature, i) => (
              <Card key={i} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-slate-50 dark:bg-zinc-900/50">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                    <feature.icon size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-b from-green-600 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10 text-white">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Ready to join the movement?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Whether you need a hand or have one to lend, HelpChain is the place where community happens.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create-request">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100 h-14 px-8 text-lg font-bold rounded-xl shadow-xl transition-transform hover:scale-105">
                I Need Help
              </Button>
            </Link>
            <Link href="/search">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 h-14 px-8 text-lg font-bold rounded-xl transition-transform hover:scale-105">
                I Want to Help
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}