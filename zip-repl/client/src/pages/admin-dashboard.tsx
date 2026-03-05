import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useOffers } from "@/hooks/use-offers";
import { useWallet } from "@/hooks/use-wallet";
import { Check, X, DollarSign, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";

export default function AdminDashboard() {
  const { offers, approveOffer, rejectOffer } = useOffers();
  const { balance } = useWallet();
  const [, setLocation] = useLocation();
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");

  const pendingOffers = offers.filter((o) => o.status === "pending");
  const approvedOffers = offers.filter((o) => o.status === "approved");
  const rejectedOffers = offers.filter((o) => o.status === "rejected");

  const totalPTF = offers
    .filter((o) => o.status === "approved" || o.status === "completed")
    .reduce((sum, o) => sum + o.ptf, 0);

  const currentOffer = offers.find((o) => o.id === selectedOffer);

  const handleApprove = () => {
    if (selectedOffer) {
      approveOffer(selectedOffer, notes);
      setSelectedOffer(null);
      setActionType(null);
      setNotes("");
    }
  };

  const handleReject = () => {
    if (selectedOffer && notes.trim()) {
      rejectOffer(selectedOffer, notes);
      setSelectedOffer(null);
      setActionType(null);
      setNotes("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Review and manage offers, monitor platform revenue
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">Pending Review</p>
                  <p className="text-3xl font-bold">{pendingOffers.length}</p>
                  <p className="text-xs text-muted-foreground">Waiting for action</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">Approved</p>
                  <p className="text-3xl font-bold text-green-600">{approvedOffers.length}</p>
                  <p className="text-xs text-muted-foreground">Live on platform</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">PTF Revenue</p>
                  <p className="text-3xl font-bold text-primary">₦{totalPTF.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total collected</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">System Balance</p>
                  <p className="text-3xl font-bold">₦{balance.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Available funds</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Offer Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending" className="relative">
                    Pending
                    {pendingOffers.length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    Approved ({approvedOffers.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rejected ({rejectedOffers.length})
                  </TabsTrigger>
                </TabsList>

                {/* Pending Offers */}
                <TabsContent value="pending" className="space-y-4 mt-6">
                  {pendingOffers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No pending offers</p>
                    </div>
                  ) : (
                    pendingOffers.map((offer, idx) => (
                      <motion.div
                        key={offer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="border-yellow-200 dark:border-yellow-900/30 bg-yellow-50/50 dark:bg-yellow-900/10">
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                  <Avatar 
                                    className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setLocation(`/public-profile/${offer.creatorId}`)}
                                    role="button"
                                  >
                                    <AvatarImage src={offer.creatorAvatar} />
                                    <AvatarFallback>{offer.creatorName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg">{offer.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      by <span onClick={() => setLocation(`/public-profile/${offer.creatorId}`)} className="hover:text-primary cursor-pointer" role="button">{offer.creatorName}</span>
                                    </p>
                                    <p className="text-sm line-clamp-2">{offer.description}</p>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      <Badge variant="outline">{offer.category}</Badge>
                                      <Badge variant="secondary">{offer.location}</Badge>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                  <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Budget</p>
                                    <p className="font-bold">₦{offer.budget.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground mt-2">PTF: ₦{offer.ptf}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-2 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedOffer(offer.id);
                                    setActionType("reject");
                                  }}
                                >
                                  <X className="w-4 h-4 mr-2" /> Reject
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setSelectedOffer(offer.id);
                                    setActionType("approve");
                                  }}
                                >
                                  <Check className="w-4 h-4 mr-2" /> Approve
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </TabsContent>

                {/* Approved Offers */}
                <TabsContent value="approved" className="space-y-4 mt-6">
                  {approvedOffers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No approved offers</p>
                    </div>
                  ) : (
                    approvedOffers.map((offer, idx) => (
                      <motion.div
                        key={offer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-bold text-lg">{offer.title}</h3>
                                <p className="text-sm text-muted-foreground">{offer.creatorName}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="bg-green-100">{offer.category}</Badge>
                                  <span className="text-xs text-green-700">✓ Live</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Budget</p>
                                <p className="font-bold">₦{offer.budget.toLocaleString()}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </TabsContent>

                {/* Rejected Offers */}
                <TabsContent value="rejected" className="space-y-4 mt-6">
                  {rejectedOffers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No rejected offers</p>
                    </div>
                  ) : (
                    rejectedOffers.map((offer, idx) => (
                      <motion.div
                        key={offer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="border-red-200 dark:border-red-900/30 opacity-75">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-bold">{offer.title}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{offer.creatorName}</p>
                                {offer.rejectionNotes && (
                                  <p className="text-sm text-red-700 dark:text-red-400">
                                    Reason: {offer.rejectionNotes}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Budget</p>
                                <p className="font-semibold">₦{offer.budget.toLocaleString()}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />

      {/* Action Dialog */}
      <Dialog open={!!selectedOffer && !!actionType} onOpenChange={(open) => {
        if (!open) {
          setSelectedOffer(null);
          setActionType(null);
          setNotes("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Offer" : "Reject Offer"}
            </DialogTitle>
            <DialogDescription>
              {currentOffer?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Budget</span>
                <span className="font-semibold">₦{currentOffer?.budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">PTF</span>
                <span className="font-semibold">₦{currentOffer?.ptf}</span>
              </div>
              <div className="border-t" />
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="font-bold">₦{currentOffer?.totalDeposit.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                {actionType === "approve" ? "Approval Notes (Optional)" : "Rejection Reason *"}
              </Label>
              <Textarea
                id="notes"
                placeholder={actionType === "approve" ? "Any notes for the creator..." : "Why is this offer being rejected?"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedOffer(null);
                setActionType(null);
                setNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={actionType === "approve" ? handleApprove : handleReject}
              disabled={actionType === "reject" && !notes.trim()}
              className={actionType === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
