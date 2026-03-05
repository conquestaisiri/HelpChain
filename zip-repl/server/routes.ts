import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { insertUserSchema, insertHelpRequestSchema, insertOfferSchema, insertMessageSchema, insertReviewSchema } from "@shared/schema";
import { z } from "zod";
import MemoryStore from "memorystore";

const MemoryStoreSession = MemoryStore(session);

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
    }
  }
}

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  const isProduction = process.env.NODE_ENV === "production";
  
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "helpchain-dev-secret-" + Math.random().toString(36),
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000,
      }),
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          const isValid = await storage.verifyPassword(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, { id: user.id, username: user.username, email: user.email });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        done(null, { id: user.id, username: user.username, email: user.email });
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const existingEmail = await storage.getUserByEmail(parsed.data.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const existingUsername = await storage.getUserByUsername(parsed.data.username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const user = await storage.createUser(parsed.data);
      await storage.createProfile(user.id, { fullName: parsed.data.username });

      req.login({ id: user.id, username: user.username, email: user.email }, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to login after registration" });
        }
        res.json({ id: user.id, username: user.username, email: user.email });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to login" });
        }
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getProfile(req.user!.id);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.get("/api/profile/:userId", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.updateProfile(req.user!.id, req.body);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/requests", isAuthenticated, async (req, res) => {
    try {
      const requestData = {
        ...req.body,
        requesterId: req.user!.id,
      };
      const request = await storage.createHelpRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Create request error:", error);
      res.status(500).json({ error: "Failed to create request" });
    }
  });

  app.get("/api/requests", async (req, res) => {
    try {
      const { category, status } = req.query;
      const requests = await storage.getHelpRequests({
        category: category as string,
        status: status as string || "published",
      });
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  app.get("/api/requests/my", isAuthenticated, async (req, res) => {
    try {
      const requests = await storage.getHelpRequests({ requesterId: req.user!.id });
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your requests" });
    }
  });

  app.get("/api/requests/:id", async (req, res) => {
    try {
      const request = await storage.getHelpRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch request" });
    }
  });

  app.patch("/api/requests/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { status, acceptedHelperId } = req.body;
      const existingRequest = await storage.getHelpRequest(req.params.id);
      if (!existingRequest) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      const isRequester = existingRequest.requesterId === req.user!.id;
      const isHelper = existingRequest.acceptedHelperId === req.user!.id;
      
      if (!isRequester && !isHelper) {
        return res.status(403).json({ error: "Not authorized to update this request" });
      }
      
      const validTransitions: Record<string, string[]> = {
        created: ["published", "cancelled"],
        published: ["accepted", "cancelled"],
        accepted: ["in_progress", "cancelled"],
        in_progress: ["completed", "cancelled"],
        completed: ["reviewed"],
      };
      
      if (!validTransitions[existingRequest.status]?.includes(status)) {
        return res.status(400).json({ error: "Invalid status transition" });
      }
      
      if ((status === "in_progress" || status === "completed") && !isHelper && !isRequester) {
        return res.status(403).json({ error: "Only the assigned helper or requester can update this status" });
      }
      
      if (status === "in_progress" && !existingRequest.acceptedHelperId) {
        return res.status(400).json({ error: "Cannot start help session without an accepted helper" });
      }
      
      const request = await storage.updateHelpRequestStatus(req.params.id, status, acceptedHelperId);
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to update request status" });
    }
  });

  app.post("/api/offers", isAuthenticated, async (req, res) => {
    try {
      const offer = await storage.createOffer({
        requestId: req.body.requestId,
        helperId: req.user!.id,
        message: req.body.message,
      });
      res.status(201).json(offer);
    } catch (error) {
      res.status(500).json({ error: "Failed to create offer" });
    }
  });

  app.get("/api/offers/request/:requestId", async (req, res) => {
    try {
      const offers = await storage.getOffersForRequest(req.params.requestId);
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.get("/api/offers/my", isAuthenticated, async (req, res) => {
    try {
      const offers = await storage.getOffersByHelper(req.user!.id);
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch your offers" });
    }
  });

  app.patch("/api/offers/:id", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const existingOffer = await storage.getOffer(req.params.id);
      if (!existingOffer) {
        return res.status(404).json({ error: "Offer not found" });
      }
      
      const request = await storage.getHelpRequest(existingOffer.requestId);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      const isRequester = request.requesterId === req.user!.id;
      const isOfferOwner = existingOffer.helperId === req.user!.id;
      
      if (status === "accepted" || status === "declined") {
        if (!isRequester) {
          return res.status(403).json({ error: "Only the request owner can accept or decline offers" });
        }
        if (existingOffer.status !== "pending") {
          return res.status(400).json({ error: "Can only accept or decline pending offers" });
        }
        if (status === "accepted" && request.acceptedHelperId) {
          return res.status(400).json({ error: "Request already has an accepted helper" });
        }
      } else if (status === "withdrawn") {
        if (!isOfferOwner) {
          return res.status(403).json({ error: "Only the offer owner can withdraw their offer" });
        }
      }
      
      const offer = await storage.updateOfferStatus(req.params.id, status);
      
      if (status === "accepted") {
        await storage.updateHelpRequestStatus(offer!.requestId, "accepted", offer!.helperId);
        await storage.getOrCreateConversation(req.user!.id, offer!.helperId, offer!.requestId);
      }
      
      res.json(offer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update offer" });
    }
  });

  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const conversations = await storage.getConversationsForUser(req.user!.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getMessagesForConversation(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const message = await storage.createMessage({
        conversationId: req.params.id,
        senderId: req.user!.id,
        content: req.body.content,
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const review = await storage.createReview({
        requestId: req.body.requestId,
        reviewerId: req.user!.id,
        revieweeId: req.body.revieweeId,
        rating: req.body.rating,
        comment: req.body.comment,
      });
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  app.get("/api/reviews/:userId", async (req, res) => {
    try {
      const reviews = await storage.getReviewsForUser(req.params.userId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  return httpServer;
}
