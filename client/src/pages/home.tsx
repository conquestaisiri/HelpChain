import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, ArrowRight, Shield, Clock, Star, CheckCircle2, 
  Wrench, Truck, Zap, MessageCircle, BookOpen, Heart,
  Sparkles, Users, Play, ChevronRight, Quote
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

import heroBackground from "@assets/generated_images/hero_background.png";
import deliveryImg from "@assets/generated_images/nigerian_delivery_motorcycle_rider.png";
import cleaningImg from "@assets/generated_images/nigerian_home_cleaner_working.png";
import movingImg from "@assets/generated_images/nigerian_furniture_movers_working.png";
import assemblyImg from "@assets/generated_images/nigerian_furniture_assembly_worker.png";
import errandsImg from "@assets/generated_images/nigerian_woman_running_errands.png";
import electricalImg from "@assets/generated_images/nigerian_electrician_doing_repairs.png";

const typingPhrases = [
  "furniture assembly",
  "grocery delivery", 
  "home cleaning",
  "moving help",
  "tech support",
  "tutoring"
];

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [, setLocation] = useLocation();
  const [typingText, setTypingText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = typingPhrases[phraseIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (typingText.length < currentPhrase.length) {
          setTypingText(currentPhrase.slice(0, typingText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (typingText.length > 0) {
          setTypingText(typingText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % typingPhrases.length);
        }
      }
    }, isDeleting ? 50 : 100);
    return () => clearTimeout(timeout);
  }, [typingText, isDeleting, phraseIndex]);

  const handleSearch = () => {
    if (searchInput.trim()) {
      setLocation(`/discover?query=${encodeURIComponent(searchInput)}`);
    } else {
      setLocation("/discover");
    }
  };

  const categories = [
    { label: "Delivery", image: deliveryImg, startingPrice: "1,500" },
    { label: "Home Cleaning", image: cleaningImg, startingPrice: "3,000" },
    { label: "Furniture Assembly", image: assemblyImg, startingPrice: "4,000" },
    { label: "Moving Help", image: movingImg, startingPrice: "5,000" },
    { label: "Errands", image: errandsImg, startingPrice: "2,000" },
    { label: "Electrical Help", image: electricalImg, startingPrice: "5,000" },
  ];

  const stats = [
    { value: "50K+", label: "Tasks Completed" },
    { value: "15K+", label: "Verified Helpers" },
    { value: "4.9", label: "Average Rating" },
    { value: "₦2B+", label: "Paid to Helpers" },
  ];

  const testimonials = [
    {
      name: "Adaeze Okonkwo",
      role: "Business Owner",
      avatar: "https://i.pravatar.cc/150?img=45",
      content: "HelpChain helped me find reliable delivery runners for my small business. The escrow system gives me peace of mind!",
      rating: 5
    },
    {
      name: "Chukwuemeka Nwosu",
      role: "Busy Professional",
      avatar: "https://i.pravatar.cc/150?img=52",
      content: "I found someone to help assemble my furniture within an hour. Fast, professional, and affordable.",
      rating: 5
    },
    {
      name: "Funke Adeleke",
      role: "Working Mother",
      avatar: "https://i.pravatar.cc/150?img=47",
      content: "The tutoring service is amazing! My children's grades have improved significantly. Thank you HelpChain!",
      rating: 5
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />
      
      {/* Hero section with negative margin to extend behind navbar */}
      <section className="relative min-h-screen flex items-end overflow-hidden pb-16 -mt-16">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/50" />
        
        <div className="container mx-auto px-4 md:px-8 relative z-10 pt-32 md:pt-40">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-6">
                Find the right help for
                <br />
                <span className="text-primary font-normal">{typingText}</span>
                <span className="animate-pulse font-light">|</span>
              </h1>
              
              <p className="text-lg text-white/70 mb-8 max-w-xl font-light">
                Connect with trusted local helpers for any task. Get things done quickly, safely, and affordably.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1 max-w-xl">
                  <Input 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search for any service..." 
                    className="pl-5 pr-14 h-12 text-base rounded-md bg-white border-0 shadow-lg focus:ring-2 focus:ring-primary/20"
                  />
                  <Button 
                    size="icon"
                    onClick={handleSearch}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {["Cleaning", "Moving", "Delivery", "Repairs", "Tutoring"].map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="rounded px-4 py-2 bg-slate-900/80 text-white border border-slate-700 hover:bg-slate-800 cursor-pointer transition-colors font-normal"
                    onClick={() => { setSearchInput(tag); setLocation(`/discover?query=${encodeURIComponent(tag)}`); }}
                  >
                    {tag} <ArrowRight className="w-3 h-3 ml-1.5 inline" />
                  </Badge>
                ))}
              </div>

            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-slate-50 dark:bg-slate-900 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center max-w-2xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What do you need help with?</h2>
            <p className="text-lg text-muted-foreground">
              Choose from dozens of services. Find the perfect helper for any task.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href="/discover">
                  <div className="group cursor-pointer">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 shadow-md group-hover:shadow-xl transition-all duration-300">
                      <img 
                        src={cat.image} 
                        alt={cat.label} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{cat.label}</h3>
                    <p className="text-sm text-primary font-medium">Starting at ₦{cat.startingPrice}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/discover">
              <Button variant="outline" size="lg" className="rounded-full px-8 group">
                View All Categories
                <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20 rounded-full">
                How It Works
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Get things done in 3 simple steps</h2>
              
              <div className="space-y-8">
                {[
                  { step: "1", title: "Post your task", desc: "Describe what you need done and set your budget. It takes just 2 minutes." },
                  { step: "2", title: "Get offers", desc: "Receive offers from verified helpers in your area within minutes." },
                  { step: "3", title: "Get it done", desc: "Choose your helper, complete the task, and pay securely through escrow." },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    className="flex gap-5"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-10">
                <Link href="/create-request">
                  <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 shadow-xl">
                    Post Your First Task - It's Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="space-y-4">
                <Card className="p-6 border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
                  <Shield className="w-10 h-10 text-primary mb-4" />
                  <h4 className="font-semibold mb-2">Secure Payments</h4>
                  <p className="text-sm text-muted-foreground">Payment held in escrow until you're satisfied</p>
                </Card>
                <Card className="p-6 border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mb-4" />
                  <h4 className="font-semibold mb-2">Verified Helpers</h4>
                  <p className="text-sm text-muted-foreground">All helpers go through identity verification</p>
                </Card>
              </div>
              <div className="space-y-4 pt-8">
                <Card className="p-6 border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
                  <Clock className="w-10 h-10 text-blue-500 mb-4" />
                  <h4 className="font-semibold mb-2">Quick Matching</h4>
                  <p className="text-sm text-muted-foreground">Get offers within minutes of posting</p>
                </Card>
                <Card className="p-6 border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
                  <Star className="w-10 h-10 text-yellow-500 mb-4" />
                  <h4 className="font-semibold mb-2">Rated & Reviewed</h4>
                  <p className="text-sm text-muted-foreground">Choose helpers based on real reviews</p>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center max-w-2xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 px-4 py-1.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 rounded-full">
              <Star className="w-4 h-4 mr-2 fill-current" />
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by thousands</h2>
            <p className="text-lg text-muted-foreground">
              See what our community has to say about HelpChain
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-xl transition-shadow">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={testimonial.avatar} />
                        <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')]" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to get things done?
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Join thousands of Nigerians getting everyday tasks done. Post your first task for free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create-request">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-14 px-8 text-lg font-semibold rounded-xl shadow-xl transition-transform hover:scale-105">
                  Post a Task
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/discover">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 h-14 px-8 text-lg font-semibold rounded-xl transition-transform hover:scale-105">
                  Become a Helper
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
