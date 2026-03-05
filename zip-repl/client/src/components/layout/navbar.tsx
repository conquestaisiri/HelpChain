import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMobileMenu } from "@/contexts/mobile-menu-context";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AuthModal } from "@/components/auth/auth-modal";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, X, Bell, HeartHandshake, LogOut, User, MessageCircle, Search, Plus, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const [location] = useLocation();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; view: "login" | "signup" }>({
    isOpen: false,
    view: "login",
  });

  const publicNavLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/discover", label: "Discover", icon: Search },
  ];

  const authNavLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/discover", label: "Discover", icon: Search },
    { href: "/create-request", label: "Create Help", icon: Plus },
    { href: "/messages", label: "Messages", icon: MessageCircle },
  ];

  const navLinks = user ? authNavLinks : publicNavLinks;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                <HeartHandshake size={20} />
              </div>
              <span className="text-xl font-heading font-bold tracking-tight text-foreground">
                HelpChain
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span className={cn(
                  "text-sm font-medium transition-colors hover:text-primary cursor-pointer flex items-center gap-2",
                  location === link.href ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  <link.icon size={16} />
                  {link.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0">
                    <div className="p-4 border-b font-semibold text-sm">
                      Notifications
                    </div>
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No new notifications
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarFallback>{user.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.username}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer w-full">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer w-full">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="font-medium"
                  onClick={() => setAuthModal({ isOpen: true, view: "login" })}
                >
                  Log in
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                  onClick={() => setAuthModal({ isOpen: true, view: "signup" })}
                >
                  Join HelpChain
                </Button>
              </>
            )}
          </div>

          <div className="flex md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-1/2 bg-background border-r z-50 md:hidden overflow-hidden"
            >
              <div className="p-6 space-y-4 h-full flex flex-col">
                <div className="flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="hover:bg-muted"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Navigate</h3>
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="py-3 px-4 rounded-xl hover:bg-muted transition-colors cursor-pointer text-sm font-medium text-foreground flex items-center gap-3"
                      >
                        <link.icon size={18} />
                        {link.label}
                      </motion.div>
                    </Link>
                  ))}
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-3">
                  {user ? (
                    <>
                      <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Account</h3>
                      <Link href="/profile">
                        <motion.div
                          whileHover={{ x: 4 }}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-muted transition-colors cursor-pointer text-sm font-medium"
                        >
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>Profile</span>
                        </motion.div>
                      </Link>
                      <motion.button
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log out</span>
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Getting Started</h3>
                      <div className="space-y-2 mt-4">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start font-medium rounded-xl"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setAuthModal({ isOpen: true, view: "login" });
                          }}
                        >
                          Log in
                        </Button>
                        <Button 
                          className="w-full justify-start bg-primary hover:bg-primary/90 text-white font-medium rounded-xl"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setAuthModal({ isOpen: true, view: "signup" });
                          }}
                        >
                          Join HelpChain
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        initialView={authModal.view}
      />
    </>
  );
}
