import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { HeartHandshake, Loader2, Mail, Lock, User, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import communityImg from "@assets/generated_images/community_help_and_mutual_aid_illustration.png";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: "login" | "signup";
}

export function AuthModal({ isOpen, onClose, initialView = "login" }: AuthModalProps) {
  const [view, setView] = useState<"login" | "signup">(initialView);
  const { login, register, isLoginPending, isRegisterPending, user } = useAuth();
  const { toast } = useToast();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ username: "", email: "", password: "" });

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
    }
  }, [isOpen, initialView]);

  useEffect(() => {
    if (user && isOpen) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email: loginForm.email, password: loginForm.password });
      toast({ title: "Welcome back!", description: "You have successfully logged in." });
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ 
        username: signupForm.username, 
        email: signupForm.email, 
        password: signupForm.password 
      });
      toast({ title: "Welcome to HelpChain!", description: "Your account has been created." });
    } catch (error: any) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    }
  };

  const benefits = [
    "Connect with verified neighbors",
    "Get help with any task",
    "Earn reputation in your community",
    "Secure & transparent coordination"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] p-0 overflow-hidden border-none bg-transparent shadow-none [&>button]:hidden">
        <div className="flex flex-col md:flex-row min-h-[550px] bg-white dark:bg-slate-950 rounded-2xl overflow-hidden shadow-2xl relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="absolute right-4 top-4 z-50 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white md:text-slate-500 md:bg-transparent md:hover:bg-slate-100 dark:md:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Left Side: Branding & Visuals */}
          <div className="hidden md:flex md:w-5/12 relative bg-primary text-white p-10 flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 z-0">
              <img 
                src={communityImg} 
                alt="Community Help" 
                className="w-full h-full object-cover opacity-50 mix-blend-multiply scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-primary/30 to-transparent" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8">
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-lg">
                  <HeartHandshake size={24} />
                </div>
                <span className="text-2xl font-bold tracking-tight">HelpChain</span>
              </div>
              
              <h2 className="text-3xl font-bold leading-tight mb-6">
                {view === "login" ? "Welcome back to your community" : "Start making a difference today"}
              </h2>

              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={benefit} 
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary-foreground/80 shrink-0" />
                    <span className="text-sm font-medium text-white/90">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative z-10 pt-8 border-t border-white/20">
              <p className="text-xs text-white/60">
                Join thousands of neighbors building a more helpful world together.
              </p>
            </div>
          </div>

          {/* Right Side: Forms */}
          <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-950">
            <div className="max-w-md mx-auto w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <DialogTitle className="text-2xl font-bold mb-2">
                    {view === "login" ? "Sign in to your account" : "Create your account"}
                  </DialogTitle>
                  <p className="text-muted-foreground mb-8">
                    {view === "login" ? (
                      <>Don't have an account? <button onClick={() => setView("signup")} className="text-primary font-semibold hover:underline">Join here</button></>
                    ) : (
                      <>Already have an account? <button onClick={() => setView("login")} className="text-primary font-semibold hover:underline">Sign in</button></>
                    )}
                  </p>

                  <div className="space-y-6">
                    {/* Social Auth Placeholders */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button variant="outline" className="h-11 font-medium border-2 hover:bg-slate-50">
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google
                      </Button>
                      <Button variant="outline" className="h-11 font-medium border-2 hover:bg-slate-50">
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        Apple
                      </Button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-slate-950 px-2 text-muted-foreground">Or continue with email</span>
                      </div>
                    </div>

                    {view === "login" ? (
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              type="email" 
                              placeholder="alex@example.com" 
                              className="pl-10 h-11 border-2 focus:border-primary transition-colors"
                              required 
                              value={loginForm.email}
                              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Password</Label>
                            <button type="button" className="text-xs text-primary font-semibold hover:underline">Forgot?</button>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              type="password" 
                              className="pl-10 h-11 border-2 focus:border-primary transition-colors"
                              required 
                              value={loginForm.password}
                              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full h-11 font-bold text-base shadow-lg shadow-primary/20" disabled={isLoginPending}>
                          {isLoginPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Sign In"}
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Username</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              placeholder="alexjohnson" 
                              className="pl-10 h-11 border-2 focus:border-primary transition-colors"
                              required 
                              value={signupForm.username}
                              onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              type="email" 
                              placeholder="alex@example.com" 
                              className="pl-10 h-11 border-2 focus:border-primary transition-colors"
                              required 
                              value={signupForm.email}
                              onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Create Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              type="password" 
                              placeholder="Min. 6 characters"
                              className="pl-10 h-11 border-2 focus:border-primary transition-colors"
                              required 
                              minLength={6}
                              value={signupForm.password}
                              onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full h-11 font-bold text-base shadow-lg shadow-primary/20" disabled={isRegisterPending}>
                          {isRegisterPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Create Account"}
                        </Button>
                      </form>
                    )}
                    
                    <p className="text-center text-[10px] text-muted-foreground mt-4 leading-relaxed">
                      By continuing, you agree to HelpChain's <button className="underline">Terms of Service</button> and <button className="underline">Privacy Policy</button>.
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
