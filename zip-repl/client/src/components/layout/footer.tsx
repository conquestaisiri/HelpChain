import { HeartHandshake, Twitter, Facebook, Instagram, Linkedin } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-white border-t pt-16 pb-8 dark:bg-zinc-950 dark:border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <HeartHandshake size={20} />
              </div>
              <span className="text-xl font-heading font-bold tracking-tight">
                HelpChain
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Connecting people who need help with those who can give it. 
              Safe, transparent, and community-driven.
            </p>
            <div className="flex gap-4">
              {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-6 text-foreground">Platform</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/search" className="hover:text-primary transition-colors">Browse Requests</Link></li>
              <li><Link href="/create-request" className="hover:text-primary transition-colors">Post a Need</Link></li>
              <li><Link href="/how-it-works" className="hover:text-primary transition-colors">How it Works</Link></li>
              <li><Link href="/safety" className="hover:text-primary transition-colors">Safety & Trust</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-6 text-foreground">Community</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/stories" className="hover:text-primary transition-colors">Success Stories</Link></li>
              <li><Link href="/volunteers" className="hover:text-primary transition-colors">Top Volunteers</Link></li>
              <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="/events" className="hover:text-primary transition-colors">Events</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-6 text-foreground">Support</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} HelpChain Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/sitemap" className="hover:text-primary transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}