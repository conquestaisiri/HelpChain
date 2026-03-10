import { useState } from "react";
import { useLocation } from "wouter";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useProfileApi } from "@/hooks/use-profile-api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, ChevronRight, ChevronLeft, Sparkles, User, Briefcase, Check, Navigation } from "lucide-react";

const SKILL_OPTIONS = [
  "Web Development", "Mobile Apps", "Design", "Writing", "Marketing",
  "Data Entry", "Translation", "Video Editing", "Photography", "Tutoring",
  "Cleaning", "Moving", "Delivery", "Handyman", "Cooking",
  "Pet Care", "Gardening", "Errands", "Research", "Consulting",
];

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user, updateUserProfile } = useFirebaseAuth();
  const { updateProfile } = useProfileApi();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [fullName, setFullName] = useState(user?.displayName || "");
  const [bio, setBio] = useState("");
  const [location, setLocationVal] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const steps = [
    { title: "Welcome!", icon: Sparkles },
    { title: "Your Profile", icon: User },
    { title: "Your Skills", icon: Briefcase },
  ];

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      setGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || "";
          const country = data.address?.country || "";
          setLocationVal(city ? `${city}, ${country}` : country || `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
        } catch {
          setLocationVal(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        }
        setGettingLocation(false);
      },
      (err) => {
        toast({ title: "Location access denied", description: err.message, variant: "destructive" });
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await updateProfile({
        fullName: fullName || user?.displayName || "User",
        bio,
        location: location,
        skills: selectedSkills,
        email: user?.email || undefined,
      });
      if (fullName && fullName !== user?.displayName) {
        await updateUserProfile({ displayName: fullName });
      }
      localStorage.setItem("hc-onboarding-done", "true");
      toast({ title: "Profile set up! 🎉", description: "You're all set to start using HelpChain." });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-12 h-0.5 ${i < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card className="border-none shadow-2xl">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Welcome to HelpChain!</h1>
                    <p className="text-muted-foreground mt-2">Let's set up your profile so you can start posting tasks or helping others. This takes less than a minute.</p>
                  </div>
                  <Button onClick={() => setStep(1)} className="w-full h-12 text-base gap-2">
                    Get Started <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card className="border-none shadow-2xl">
                <CardContent className="p-8 space-y-5">
                  <div className="text-center mb-2">
                    <h2 className="text-xl font-bold text-foreground">Tell us about yourself</h2>
                    <p className="text-sm text-muted-foreground mt-1">This helps others find and trust you</p>
                  </div>

                  <div>
                    <Label>Full Name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="mt-1.5 h-12" />
                  </div>

                  <div>
                    <Label>Short Bio</Label>
                    <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What do you do? What are you good at?" className="mt-1.5 min-h-[80px]" maxLength={300} />
                    <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/300</p>
                  </div>

                  <div>
                    <Label>Location</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input value={location} onChange={(e) => setLocationVal(e.target.value)} placeholder="e.g., Lagos, Nigeria" className="flex-1 h-12" />
                      <Button type="button" variant="outline" className="h-12 gap-2 px-4" onClick={getCurrentLocation} disabled={gettingLocation}>
                        {gettingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                        {gettingLocation ? "" : "Detect"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => setStep(0)} className="flex-1 h-12 gap-2">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button onClick={() => setStep(2)} className="flex-1 h-12 gap-2" disabled={!fullName.trim()}>
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="skills" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card className="border-none shadow-2xl">
                <CardContent className="p-8 space-y-5">
                  <div className="text-center mb-2">
                    <h2 className="text-xl font-bold text-foreground">What are your skills?</h2>
                    <p className="text-sm text-muted-foreground mt-1">Select skills you can help others with (optional)</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map((skill) => (
                      <Badge
                        key={skill}
                        variant={selectedSkills.includes(skill) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1.5 text-sm transition-all hover:scale-105"
                        onClick={() => toggleSkill(skill)}
                      >
                        {selectedSkills.includes(skill) && <Check className="w-3 h-3 mr-1" />}
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  {selectedSkills.length > 0 && (
                    <p className="text-xs text-muted-foreground">{selectedSkills.length} skills selected</p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 gap-2">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button onClick={handleComplete} disabled={saving} className="flex-1 h-12 gap-2 bg-gradient-to-r from-primary to-accent">
                      {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Complete Setup <Sparkles className="w-4 h-4" /></>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
