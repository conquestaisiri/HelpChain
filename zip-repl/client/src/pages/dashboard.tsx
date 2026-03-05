import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Plus, MessageSquare, MapPin, Calendar, Clock, Send, Image as ImageIcon, X, ChevronLeft, History, ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Link, Redirect } from "wouter";
import { UrgencyBadge } from "@/components/ui/urgency-badge";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/hooks/use-wallet";

interface Message {
  id: string;
  sender: "user" | "other";
  text: string;
  time: string;
  avatar?: string;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  online: boolean;
  messages: Message[];
  hasOffer?: boolean;
  offerAmount?: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { transactions } = useWallet();
  const [selectedChatId, setSelectedChatId] = useState<string | null>("1");
  
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/profile', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });

  const { data: myRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['my-requests', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/requests/my', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const { data: myOffers = [] } = useQuery({
    queryKey: ['my-offers', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/offers/my', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });
  const [messageInput, setMessageInput] = useState("");
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      name: "Sarah Connor",
      avatar: "https://i.pravatar.cc/150?u=51",
      lastMessage: "I can help with the pickup!",
      timestamp: "2m ago",
      online: true,
      hasOffer: true,
      offerAmount: 5000,
      messages: [
        {
          id: "1",
          sender: "other",
          text: "Hi! I saw your request for insulin pickup. I'm right near that CVS and can head over now.",
          time: "10:30 AM",
          avatar: "https://i.pravatar.cc/150?u=51"
        },
        {
          id: "2",
          sender: "user",
          text: "That would be amazing! Thank you so much. Do you need the prescription code?",
          time: "10:32 AM"
        },
        {
          id: "3",
          sender: "other",
          text: "Yes please. Also, I see you offered ₦5,000. I can send an official offer now.",
          time: "10:33 AM",
          avatar: "https://i.pravatar.cc/150?u=51"
        }
      ]
    },
    {
      id: "2",
      name: "Michael Chen",
      avatar: "https://i.pravatar.cc/150?u=52",
      lastMessage: "I'm interested in the tutor role",
      timestamp: "1h ago",
      online: false,
      messages: []
    },
    {
      id: "3",
      name: "Jennifer Smith",
      avatar: "https://i.pravatar.cc/150?u=53",
      lastMessage: "When do you need help?",
      timestamp: "3h ago",
      online: true,
      messages: []
    }
  ]);
  const [showOfferDecision, setShowOfferDecision] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const currentChat = conversations.find(c => c.id === selectedChatId);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentChat) return;

    const updatedConversations = conversations.map(conv => {
      if (conv.id === selectedChatId) {
        const newMessage: Message = {
          id: String(Date.now()),
          sender: "user",
          text: messageInput,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: messageInput,
          timestamp: "now"
        };
      }
      return conv;
    });

    setConversations(updatedConversations);
    setMessageInput("");
  };

  const handleAcceptOffer = () => {
    setShowOfferDecision(false);
    const updatedConversations = conversations.map(conv => {
      if (conv.id === selectedChatId) {
        return {
          ...conv,
          hasOffer: false
        };
      }
      return conv;
    });
    setConversations(updatedConversations);
    alert(`Offer of ₦${currentChat?.offerAmount} accepted! Transaction initiated.`);
  };

  const handleDeclineOffer = () => {
    setShowOfferDecision(false);
    const updatedConversations = conversations.map(conv => {
      if (conv.id === selectedChatId) {
        return {
          ...conv,
          hasOffer: false
        };
      }
      return conv;
    });
    setConversations(updatedConversations);
    alert("Offer declined");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const fileName = files[0].name;
      if (!currentChat) return;
      
      const newMessage: Message = {
        id: String(Date.now()),
        sender: "user",
        text: `📷 Photo uploaded: ${fileName}`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };

      const updatedConversations = conversations.map(conv => {
        if (conv.id === selectedChatId) {
          return {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessage: `📷 Photo uploaded`,
            timestamp: "now"
          };
        }
        return conv;
      });

      setConversations(updatedConversations);
      setShowUploadMenu(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Protected Route
  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.username}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/create-request">
              <Button size="lg" className="shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" />
                Post New Request
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Stats */}
          <div className="space-y-6">
            <Card className="border-none shadow-md">
              <CardContent className="p-6 text-center space-y-4">
                <Avatar className="w-24 h-24 mx-auto border-4 border-primary/10">
                  <AvatarImage src="" />
                  <AvatarFallback>{user.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{user.username}</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Verified Level 2
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{profile?.helpsGiven || 0}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Helps Given</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{profile?.rating?.toFixed(1) || '0.0'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="w-full justify-start h-12 bg-transparent border-b rounded-none px-0 mb-6">
                <TabsTrigger value="active" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6 h-full text-base">Active Requests</TabsTrigger>
                <TabsTrigger value="messages" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6 h-full text-base">Messages</TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6 h-full text-base">History</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-4">
                {requestsLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground mt-2">Loading requests...</p>
                  </div>
                ) : myRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No active requests yet.</p>
                    <Link href="/create-request">
                      <Button className="shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Post Your First Request
                      </Button>
                    </Link>
                  </div>
                ) : (
                  myRequests.map((req: any) => (
                    <Card key={req.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg font-bold">{req.title}</CardTitle>
                        </div>
                        <Badge variant={req.status === 'completed' ? 'default' : 'secondary'} className="ml-2 capitalize">{req.status}</Badge>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground text-sm">
                          {req.description}
                        </p>
                        <div className="grid grid-cols-2 gap-3 py-3 border-y">
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{req.rewardAmount ? `₦${req.rewardAmount.toLocaleString()}` : "Volunteer"}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Amount Offered</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold capitalize">{req.category?.replace('_', ' ')}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">Category</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                             <MapPin className="w-3 h-3" /> {req.location || 'No location'}
                          </div>
                          <div className="flex items-center gap-1">
                             <Calendar className="w-3 h-3" /> {new Date(req.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="messages" className="h-[600px]">
                <Card className="h-full border-none shadow-md overflow-hidden flex">
                  {/* Chat Sidebar - Always visible on desktop, toggle on mobile */}
                  <div className={`${selectedChatId ? "hidden lg:flex" : "flex"} lg:w-1/3 w-full border-r bg-slate-50 dark:bg-slate-900/50 flex-col`}>
                    <div className="p-4 border-b">
                       <h3 className="font-bold">Messages</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {conversations.map((conv) => (
                        <div 
                          key={conv.id}
                          onClick={() => setSelectedChatId(conv.id)}
                          className={`p-4 border-b cursor-pointer hover:bg-white dark:hover:bg-zinc-900 transition-colors ${selectedChatId === conv.id ? 'bg-white dark:bg-zinc-900 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                          data-testid={`chat-${conv.id}`}
                        >
                           <div className="flex items-center gap-3">
                              <Link href={`/public-profile/${conv.id}`} onClick={(e) => e.stopPropagation()}>
                                <div className="relative hover:opacity-80 transition-opacity">
                                  <Avatar className="w-10 h-10">
                                     <AvatarImage src={conv.avatar} />
                                     <AvatarFallback>{conv.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  {conv.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900"></div>}
                                </div>
                              </Link>
                              <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-center mb-1">
                                    <Link href={`/public-profile/${conv.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-primary transition-colors">
                                      <p className="font-bold text-sm truncate">{conv.name}</p>
                                    </Link>
                                    <span className="text-[10px] text-muted-foreground">{conv.timestamp}</span>
                                 </div>
                                 <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                              </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chat Area - Always visible on desktop, toggle on mobile */}
                  {currentChat && (
                  <div className={`${selectedChatId ? "flex" : "hidden lg:flex"} lg:flex-1 w-full flex-col bg-white dark:bg-zinc-950`}>
                     <div className="p-4 border-b flex justify-between items-center shadow-sm z-10">
                        <div className="flex items-center gap-3">
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="lg:hidden shrink-0" 
                              onClick={() => setSelectedChatId(null)}
                              data-testid="button-back-to-messages"
                           >
                              <ChevronLeft className="w-5 h-5" />
                           </Button>
                           <div className="relative">
                             <Avatar className="w-8 h-8">
                                 <AvatarImage src={currentChat.avatar} />
                                 <AvatarFallback>{currentChat.name.charAt(0)}</AvatarFallback>
                             </Avatar>
                             {currentChat.online && <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-zinc-900"></div>}
                           </div>
                           <div>
                              <h4 className="font-bold text-sm">{currentChat.name}</h4>
                              <p className={`text-xs flex items-center gap-1 ${currentChat.online ? 'text-green-600' : 'text-muted-foreground'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${currentChat.online ? 'bg-green-600' : 'bg-gray-400'}`}></span> 
                                {currentChat.online ? 'Online' : 'Offline'}
                              </p>
                           </div>
                        </div>
                        <Button variant="ghost" size="icon"><MessageSquare className="w-4 h-4" /></Button>
                     </div>
                     
                     <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-zinc-900/50">
                        {currentChat.messages.length === 0 ? (
                           <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                              <p>No messages yet. Start the conversation!</p>
                           </div>
                        ) : (
                           <>
                             <div className="flex justify-center">
                               <Badge variant="outline" className="text-xs bg-slate-100 text-muted-foreground border-slate-200">Today</Badge>
                             </div>
                             {currentChat.messages.map((msg) => (
                               <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'max-w-[80%] ml-auto flex-row-reverse' : 'max-w-[80%]'}`}>
                                 {msg.sender === 'other' && (
                                   <Avatar className="w-8 h-8 shrink-0">
                                       <AvatarImage src={msg.avatar} />
                                       <AvatarFallback>{currentChat.name.charAt(0)}</AvatarFallback>
                                   </Avatar>
                                 )}
                                 <div className={`p-3 rounded-2xl shadow-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white dark:bg-zinc-800 rounded-tl-none border'}`}>
                                    <p className="text-sm">{msg.text}</p>
                                    <span className={`text-[10px] mt-1 block ${msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'}`}>{msg.time}</span>
                                 </div>
                               </div>
                             ))}
                           </>
                        )}
                        
                        {/* System Message / Offer */}
                        {currentChat.hasOffer && showOfferDecision && (
                        <div className="flex justify-center my-4">
                           <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg max-w-sm w-full text-center">
                              <p className="font-bold text-yellow-900 text-sm mb-1">Official Help Offer</p>
                              <p className="text-xs text-yellow-800 mb-3">{currentChat.name} offered to help for ₦{currentChat.offerAmount?.toLocaleString()}</p>
                              <div className="flex gap-2 justify-center">
                                 <Button size="sm" variant="outline" className="border-yellow-300 bg-white hover:bg-yellow-100 text-yellow-900" onClick={handleDeclineOffer} data-testid="button-decline-offer">Decline</Button>
                                 <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleAcceptOffer} data-testid="button-accept-offer">Accept Offer</Button>
                              </div>
                           </div>
                        </div>
                        )}

                        <div ref={messagesEndRef} />
                     </div>

                     <div className="p-4 bg-white dark:bg-zinc-950 border-t">
                        <div className="flex gap-2 relative">
                           <div className="relative">
                              <Button 
                                 variant="outline" 
                                 size="icon" 
                                 className="shrink-0"
                                 onClick={() => setShowUploadMenu(!showUploadMenu)}
                                 data-testid="button-upload-menu"
                              >
                                 <Plus className="w-4 h-4" />
                              </Button>
                              
                              <AnimatePresence>
                                 {showUploadMenu && (
                                    <motion.div
                                       initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                       animate={{ opacity: 1, y: -120, scale: 1 }}
                                       exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                       transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                       className="absolute bottom-full mb-2 left-0 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg p-3 space-y-2 z-50 min-w-max"
                                    >
                                       <motion.button
                                          whileHover={{ backgroundColor: "var(--hover-bg)" }}
                                          onClick={() => fileInputRef.current?.click()}
                                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
                                          data-testid="button-upload-photo"
                                       >
                                          <ImageIcon className="w-5 h-5 text-blue-500" />
                                          <span>Upload Photo</span>
                                       </motion.button>
                                    </motion.div>
                                 )}
                              </AnimatePresence>

                              <input 
                                 ref={fileInputRef}
                                 type="file"
                                 accept="image/*"
                                 onChange={handlePhotoUpload}
                                 className="hidden"
                                 data-testid="input-file-photo"
                              />
                           </div>

                           <input 
                              className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                              placeholder="Type a message..."
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                              data-testid="input-message"
                           />
                           <Button size="icon" className="shrink-0 rounded-full" onClick={handleSendMessage} data-testid="button-send-message">
                              <Send className="w-4 h-4" />
                           </Button>
                        </div>
                     </div>
                  </div>
                  )}
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" /> Activity History
                    </h3>
                    
                    {transactions.length === 0 && myOffers.length === 0 ? (
                      <Card className="border-2 border-dashed text-center py-12">
                        <div className="text-muted-foreground">
                          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-lg font-semibold mb-2">No activity yet</p>
                          <p className="text-sm">Your transaction history and help activities will appear here</p>
                        </div>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {/* Transactions */}
                        {transactions.map((txn) => (
                          <Card key={txn.id} className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${txn.type === 'deposit' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'}`}>
                                  {txn.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{txn.description}</p>
                                  <p className="text-xs text-muted-foreground">{txn.timestamp.toLocaleDateString()} at {txn.timestamp.toLocaleTimeString()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold ${txn.type === 'deposit' ? 'text-green-600' : 'text-orange-600'}`}>
                                  {txn.type === 'deposit' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                                </p>
                                <Badge variant={txn.status === 'completed' ? 'default' : 'secondary'} className="text-xs capitalize">
                                  {txn.status === 'completed' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
                                  {txn.status}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {/* Offers Made */}
                        {myOffers.map((offer: any) => (
                          <Card key={offer.id} className="hover:shadow-sm transition-shadow border-l-4 border-l-blue-500">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                  <MessageSquare className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">Offer submitted</p>
                                  <p className="text-xs text-muted-foreground">{new Date(offer.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <Badge variant={offer.status === 'accepted' ? 'default' : offer.status === 'declined' ? 'destructive' : 'secondary'} className="capitalize">
                                {offer.status}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}