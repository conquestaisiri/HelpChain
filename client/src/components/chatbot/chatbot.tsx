import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, X, Send, Bot, User, ChevronDown, HelpCircle, FileText, Shield, DollarSign, UserPlus } from "lucide-react";
import { useLocation } from "wouter";

interface Message {
  id: string;
  content: string;
  sender: "bot" | "user";
  timestamp: Date;
  quickReplies?: string[];
}

const QUICK_TOPICS = [
  { icon: HelpCircle, label: "How it works", value: "how does helpchain work" },
  { icon: FileText, label: "Post a task", value: "how do i post a task" },
  { icon: DollarSign, label: "Pricing & fees", value: "what are the fees" },
  { icon: Shield, label: "Safety", value: "is helpchain safe" },
  { icon: UserPlus, label: "Become a helper", value: "how do i become a helper" },
];

const QUICK_REPLY_MAP: Record<string, string> = {
  "how does it work?": "how does helpchain work",
  "post a task": "how do i post a task",
  "post a task now": "how do i post a task",
  "take me to post a task": "navigate:post",
  "what are the fees?": "what are the fees",
  "is it safe?": "is helpchain safe",
  "sign up now": "navigate:signup",
  "how does escrow work?": "how does escrow work",
  "when do i pay?": "what are the fees",
  "is there a subscription?": "what are the fees",
  "what budget should i set?": "what budget should i set",
  "how long until i get offers?": "how do i post a task",
  "how do i pay?": "what are the fees",
  "how do i report an issue?": "talk to support",
  "talk to support": "talk to support",
  "how are helpers verified?": "is helpchain safe",
  "what if i'm not satisfied?": "how does escrow work",
  "how long do i have to confirm?": "how does escrow work",
  "can i negotiate?": "what budget should i set",
  "what skills are needed?": "how do i become a helper",
  "how much can i earn?": "how do i become a helper",
  "back to main menu": "greeting",
  "safety concerns": "is helpchain safe",
  "report an issue": "talk to support",
};

const KNOWLEDGE_BASE: Record<string, { response: string; quickReplies?: string[] }> = {
  "greeting": {
    response: "Hello! I'm HelpBot, your HelpChain assistant. I can help you understand how the platform works, post tasks, learn about fees, or answer any questions. What would you like to know?",
    quickReplies: ["How does it work?", "Post a task", "What are the fees?", "Is it safe?"]
  },
  "how does helpchain work": {
    response: "HelpChain connects you with trusted local helpers for everyday tasks! Here's how it works:\n\n1. **Post your task** - Describe what you need and set your budget\n2. **Get offers** - Helpers in your area will send offers (they can accept your price or suggest a different one)\n3. **Choose & deposit** - Pick a helper and deposit the agreed amount\n4. **Get it done** - Your helper completes the task\n5. **Release payment** - Once satisfied, release the payment to your helper\n\nIt's simple, safe, and secure!",
    quickReplies: ["Post a task now", "What are the fees?", "How do I pay?"]
  },
  "how do i post a task": {
    response: "Posting a task is easy! Here's what to do:\n\n1. Click **'Post a Task'** or **'Get Started'** button\n2. Choose a category (delivery, cleaning, moving, etc.)\n3. Describe what you need done\n4. Set your location and timing\n5. Enter your budget (any amount you're comfortable with)\n6. Submit and wait for offers!\n\nHelpers will see your task and send offers. You can accept or negotiate the price.",
    quickReplies: ["Take me to post a task", "What budget should I set?", "How long until I get offers?"]
  },
  "what are the fees": {
    response: "HelpChain charges a **6% platform fee** on each task. Here's how it works:\n\n- You set your budget (e.g., ₦5,000)\n- Platform fee is added (6% = ₦300)\n- You deposit total (₦5,300)\n- Helper receives your full budget (₦5,000)\n\nNo hidden fees! The fee covers payment processing, customer support, and our secure escrow system.",
    quickReplies: ["How does escrow work?", "When do I pay?", "Is there a subscription?"]
  },
  "is helpchain safe": {
    response: "Your safety is our priority! Here's how we protect you:\n\n✓ **Verified helpers** - All helpers verify their identity\n✓ **Secure escrow** - Your money is held safely until the task is done\n✓ **Reviews & ratings** - See what others say before choosing\n✓ **In-app messaging** - Keep all communication on the platform\n✓ **24/7 support** - Our team is here to help\n\nIf you ever have concerns, contact our support team immediately.",
    quickReplies: ["How do I report an issue?", "Talk to support", "How are helpers verified?"]
  },
  "how do i become a helper": {
    response: "Want to earn money helping others? Here's how to become a HelpChain helper:\n\n1. **Create an account** - Sign up for free\n2. **Complete your profile** - Add your skills and a friendly bio\n3. **Enable Helper Mode** - Go to Profile → Settings → Turn on Helper Mode\n4. **Browse tasks** - Find tasks you can help with\n5. **Make offers** - Send offers to task posters\n\nYou'll earn money for every completed task!",
    quickReplies: ["Sign up now", "What skills are needed?", "How much can I earn?"]
  },
  "how does escrow work": {
    response: "Our escrow system protects both you and the helper:\n\n1. **Task accepted** - You deposit the agreed amount\n2. **Money held safely** - Funds are in HelpChain's secure account\n3. **Task completed** - Helper finishes the work\n4. **You confirm** - Satisfied? Release the payment\n5. **Helper paid** - Money goes to the helper's wallet\n\nIf there's a dispute, our team will help resolve it fairly.",
    quickReplies: ["What if I'm not satisfied?", "How long do I have to confirm?"]
  },
  "what budget should i set": {
    response: "You can set any budget you're comfortable with! Here are typical ranges for common tasks:\n\n- **Delivery/Errands**: ₦1,500 - ₦3,000\n- **Home Cleaning**: ₦3,000 - ₦8,000\n- **Furniture Assembly**: ₦4,000 - ₦10,000\n- **Moving Help**: ₦5,000 - ₦20,000\n- **Electrical Work**: ₦5,000 - ₦15,000\n\nRemember: Helpers can accept your offer or suggest a different price!",
    quickReplies: ["Post a task now", "Can I negotiate?"]
  },
  "talk to support": {
    response: "I'm happy to help, but if you need to speak with our human support team:\n\n📧 Email: support@helpchain.ng\n📱 WhatsApp: +234 800 HELP CHAIN\n\nOur team typically responds within 1-2 hours during business hours (9 AM - 6 PM WAT, Mon-Sat).\n\nIs there anything else I can help you with?",
    quickReplies: ["Back to main menu", "Safety concerns", "Report an issue"]
  },
  "default": {
    response: "I'm not sure I understood that. Here are some things I can help with:\n\n• How HelpChain works\n• Posting a task\n• Fees and pricing\n• Safety and security\n• Becoming a helper\n\nOr type your question and I'll do my best to help!",
    quickReplies: ["How does it work?", "Post a task", "Talk to support"]
  }
};

function findBestResponse(input: string): { response: string; quickReplies?: string[] } {
  const lowerInput = input.toLowerCase().trim();
  
  if (lowerInput.match(/^(hi|hello|hey|good morning|good afternoon|good evening|help)$/i)) {
    return KNOWLEDGE_BASE["greeting"];
  }
  
  const keywords: Record<string, string[]> = {
    "how does helpchain work": ["how", "work", "what is", "explain", "about"],
    "how do i post a task": ["post", "create", "submit", "request", "task", "job"],
    "what are the fees": ["fee", "cost", "price", "charge", "pay", "money", "commission", "percentage"],
    "is helpchain safe": ["safe", "secure", "trust", "scam", "legit", "legitimate", "protection"],
    "how do i become a helper": ["helper", "earn", "make money", "become", "work for", "join as"],
    "how does escrow work": ["escrow", "hold", "funds", "deposit"],
    "what budget should i set": ["budget", "how much", "amount", "should i pay", "typical price"],
    "talk to support": ["support", "contact", "human", "agent", "call", "email", "whatsapp", "phone"],
  };
  
  let bestMatch = "";
  let bestScore = 0;
  
  for (const [key, words] of Object.entries(keywords)) {
    let score = 0;
    for (const word of words) {
      if (lowerInput.includes(word)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = key;
    }
  }
  
  if (bestScore > 0 && KNOWLEDGE_BASE[bestMatch]) {
    return KNOWLEDGE_BASE[bestMatch];
  }
  
  return KNOWLEDGE_BASE["default"];
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = KNOWLEDGE_BASE["greeting"];
      setMessages([{
        id: "1",
        content: greeting.response,
        sender: "bot",
        timestamp: new Date(),
        quickReplies: greeting.quickReplies
      }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: text,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const lowerText = text.toLowerCase().trim();
    const mappedKey = QUICK_REPLY_MAP[lowerText];
    
    if (mappedKey === "navigate:post") {
      const navMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Taking you to post a task now! You'll be able to describe what you need and set your budget.",
        sender: "bot",
        timestamp: new Date()
      };
      setIsTyping(false);
      setMessages(prev => [...prev, navMessage]);
      setTimeout(() => {
        setIsOpen(false);
        setLocation("/create-request");
      }, 500);
      return;
    }

    if (mappedKey === "navigate:signup") {
      const navMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Redirecting you to sign up! You'll be able to create your account in just a moment.",
        sender: "bot",
        timestamp: new Date()
      };
      setIsTyping(false);
      setMessages(prev => [...prev, navMessage]);
      setTimeout(() => {
        setIsOpen(false);
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    const response = mappedKey && KNOWLEDGE_BASE[mappedKey] 
      ? KNOWLEDGE_BASE[mappedKey] 
      : findBestResponse(text);
    
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: response.response,
      sender: "bot",
      timestamp: new Date(),
      quickReplies: response.quickReplies
    };

    setIsTyping(false);
    setMessages(prev => [...prev, botMessage]);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 z-50 w-[380px] max-w-[calc(100vw-32px)]"
          >
            <Card className="overflow-hidden shadow-2xl border-0">
              <div className="bg-gradient-to-r from-primary to-primary/90 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">HelpBot</h3>
                      <p className="text-xs text-white/70">Your HelpChain Assistant</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="h-[350px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.sender === "bot" && (
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="bg-primary text-white text-xs">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[80%] ${msg.sender === "user" ? "order-first" : ""}`}>
                      <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                        msg.sender === "user" 
                          ? "bg-primary text-white rounded-br-md" 
                          : "bg-white dark:bg-slate-800 text-foreground rounded-bl-md shadow-sm"
                      }`}>
                        {msg.content}
                      </div>
                      {msg.quickReplies && msg.sender === "bot" && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {msg.quickReplies.map((reply, i) => (
                            <button
                              key={i}
                              onClick={() => handleSend(reply)}
                              className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border hover:border-primary hover:text-primary transition-colors"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.sender === "user" && (
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-xs">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-2 items-start">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="bg-primary text-white text-xs">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-md shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {messages.length === 1 && (
                <div className="px-4 py-3 bg-white dark:bg-slate-800 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Quick topics:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TOPICS.map((topic, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(topic.value)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <topic.icon className="w-3 h-3" />
                        {topic.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-white dark:bg-slate-800 border-t">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 h-10 text-sm"
                  />
                  <Button type="submit" size="icon" className="h-10 w-10 shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <ChevronDown className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
