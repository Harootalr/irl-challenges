import type { Express } from "express";
import type { Request } from "express";

// Extend Express Request type to include session with userId
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertChallengeSchema, insertMessageSchema, insertResultSchema, insertReviewSchema, insertReportSchema, GAME_PRESETS } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { parse as parseUrl } from "url";
import { parse as parseCookie } from "cookie";
import { unsign } from "cookie-signature";
import { healthCheck } from "./routes/health";
import { requestIdMiddleware, requestLoggingMiddleware } from "./middleware/logging";
import { log } from "./utils/logger";

const PgSession = connectPgSimple(session);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// Create session store instance for WebSocket authentication
let sessionStore: any;

// WebSocket connections by user ID to challenge ID
const userChallengeConnections = new Map<string, { challengeId: string, ws: WebSocket }>();

// WebSocket connections by challenge ID
const challengeConnections = new Map<string, Set<WebSocket>>();

// Rate limiting for WebSocket connections
const connectionCounts = new Map<string, { count: number, lastReset: number }>();
const messageCounts = new Map<string, { count: number, lastReset: number }>();

const WEBSOCKET_CONNECTION_LIMIT = 5; // Max 5 connections per IP per minute
const WEBSOCKET_MESSAGE_LIMIT = 60; // Max 60 messages per user per minute

// Helper function to check rate limits
const checkRateLimit = (limiterMap: Map<string, { count: number, lastReset: number }>, key: string, limit: number): boolean => {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  if (!limiterMap.has(key)) {
    limiterMap.set(key, { count: 1, lastReset: now });
    return true;
  }
  
  const entry = limiterMap.get(key)!;
  
  // Reset if window has passed
  if (now - entry.lastReset > windowMs) {
    entry.count = 1;
    entry.lastReset = now;
    return true;
  }
  
  // Check if under limit
  if (entry.count >= limit) {
    return false;
  }
  
  entry.count++;
  return true;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Request ID and logging middleware
  app.use(requestIdMiddleware);
  app.use(requestLoggingMiddleware);
  
  // CORS configuration - Restrict origins in production
  const isProduction = process.env.NODE_ENV === 'production';
  app.use(cors({
    origin: isProduction 
      ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : false)
      : true, // Allow all origins in development
    credentials: true, // Allow cookies and auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200 // For legacy browser support
  }));
  
  // Security middleware - Strict CSP for production
  app.use(helmet({
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          // Removed 'blob:' for security - web workers handled by worker-src
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Tailwind CSS utility classes
          "https://fonts.googleapis.com", // Google Fonts CSS
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com", // Google Fonts
          "data:", // Base64 encoded fonts
        ],
        imgSrc: [
          "'self'",
          "data:", // Base64 images and icons
          "blob:", // Generated images
          "https://tile.openstreetmap.org", // OpenStreetMap tiles (if using Leaflet)
          "https://*.tile.openstreetmap.org", // OpenStreetMap subdomains
        ],
        connectSrc: [
          "'self'",
          // WebSocket connections allowed via 'self' - localhost removed for production security
          ...(process.env.ALLOWED_ORIGIN ? [`wss://${process.env.ALLOWED_ORIGIN.replace(/^https?:\/\//, '')}`] : []),
        ],
        workerSrc: [
          "'self'",
          "blob:", // Web workers from blobs
        ],
        frameAncestors: ["'none'"], // Prevent clickjacking (correct directive)
        frameSrc: ["'none'"], // No iframes allowed
        objectSrc: ["'none'"], // Prevent plugin execution
        baseUri: ["'self'"], // Prevent base tag hijacking
        formAction: ["'self'"], // Only allow forms to submit to same origin
        upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS in production
      },
    } : false, // Disable CSP in development to prevent blocking
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Limit each IP to 300 requests per windowMs
    message: {
      error: "Too many requests from this IP, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Health check endpoints
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });
  
  // Comprehensive health check with database
  app.get("/healthz", healthCheck);

  // Session middleware - Use PostgreSQL for persistent sessions
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  
  // Create session store instance for both Express and WebSocket use
  sessionStore = new PgSession({
    conString: DATABASE_URL,
    tableName: 'session', // Table name for sessions
    createTableIfMissing: true, // Automatically create session table if it doesn't exist
    pruneSessionInterval: 60 * 60 * 24 * 7, // Prune expired sessions weekly (in seconds)
    errorLog: (msg: string) => log.error('Session store error', { message: msg }) // Structured logging for database errors
  });
  
  app.use(session({
    store: sessionStore,
    secret: JWT_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS-only cookies in production
      httpOnly: true, // Prevent XSS attacks via client-side JavaScript access
      maxAge: 24 * 60 * 60 * 1000, // 24 hours default session duration
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // CSRF protection in production
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined, // Set domain for production
    }
  }));

  // Auth middleware
  const requireAuth = (req: Request, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Seed data on startup
  await storage.seedGothenburgData();


  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      req.session.userId = user.id;
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      
      // Set session duration based on rememberMe option
      if (rememberMe) {
        // 30 days for remember me
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
      } else {
        // 24 hours for regular login
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
      }
      
      res.json({ 
        user: { ...user, password: undefined },
        rememberMe: rememberMe || false
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // User profile routes
  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Ensure user can only update their own profile
      if (id !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate input data
      const allowedFields = ['name', 'email', 'phone', 'homeCity', 'bio', 'dateOfBirth', 'avatarUrl'];
      const updates = Object.keys(req.body)
        .filter(key => allowedFields.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      // Check if email is being changed and if it's already taken
      if (updates.email) {
        const existingUser = await storage.getUserByEmail(updates.email);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      // Check if phone is being changed and if it's already taken
      if (updates.phone) {
        const existingUser = await storage.getUserByPhone(updates.phone);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Phone number already in use" });
        }
      }

      const updatedUser = await storage.updateUser(id, updates);
      res.json({ ...updatedUser, password: undefined });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Change password endpoint
  app.put("/api/users/:id/password", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;
      
      // Ensure user can only change their own password
      if (id !== req.session.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      // Get current user to verify password
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await storage.updateUser(id, { password: hashedNewPassword });
      
      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Game presets
  app.get("/api/game-presets", (req, res) => {
    res.json(GAME_PRESETS);
  });

  // Venues
  app.get("/api/venues", async (req, res) => {
    try {
      const { city, lat, lng, radius } = req.query;
      let venues;

      if (lat && lng && radius) {
        venues = await storage.getVenuesNear(
          parseFloat(lat as string),
          parseFloat(lng as string),
          parseFloat(radius as string)
        );
      } else {
        venues = await storage.getVenues(city as string, true);
      }

      res.json(venues);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/venues/:id", async (req, res) => {
    try {
      const venue = await storage.getVenue(req.params.id);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      res.json(venue);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Challenges
  app.get("/api/challenges", async (req, res) => {
    try {
      const { status, venueId, hostId, city, detailed } = req.query;
      
      const filters = {
        status: status as string,
        venueId: venueId as string,
        hostId: hostId as string,
        city: city as string
      };

      let challenges;
      if (detailed === 'true') {
        challenges = await storage.getChallengesWithDetails(filters);
      } else {
        challenges = await storage.getChallenges(filters);
      }

      res.json(challenges);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/challenges/:id", async (req, res) => {
    try {
      const challenge = await storage.getChallenge(req.params.id);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      res.json(challenge);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/challenges", requireAuth, async (req, res) => {
    try {
      const challengeData = insertChallengeSchema.parse({
        ...req.body,
        hostId: req.session.userId
      });
      
      const challenge = await storage.createChallenge(challengeData);
      res.json(challenge);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/challenges/:id", requireAuth, async (req, res) => {
    try {
      const challenge = await storage.getChallenge(req.params.id);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      if (challenge.hostId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to update this challenge" });
      }

      const updatedChallenge = await storage.updateChallenge(req.params.id, req.body);
      res.json(updatedChallenge);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Challenge participants
  app.get("/api/challenges/:id/participants", async (req, res) => {
    try {
      const participants = await storage.getChallengeParticipantsWithUsers(req.params.id);
      res.json(participants);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/challenges/:id/join", requireAuth, async (req, res) => {
    try {
      const challengeId = req.params.id;
      const userId = req.session.userId;

      // Check if challenge exists and is open
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      if (challenge.status !== 'open') {
        return res.status(400).json({ message: "Challenge is not open for joining" });
      }

      // Check if user is already a participant
      const existingParticipants = await storage.getChallengeParticipants(challengeId);
      const isAlreadyParticipant = existingParticipants.some(p => p.userId === userId);
      
      if (isAlreadyParticipant) {
        return res.status(400).json({ message: "Already a participant" });
      }

      // Check if challenge is full
      const approvedCount = existingParticipants.filter(p => p.state === 'approved').length;
      if (approvedCount >= (challenge.maxParticipants || 2)) {
        return res.status(400).json({ message: "Challenge is full" });
      }

      const participant = await storage.addParticipant({
        challengeId,
        userId: userId!,
        role: 'participant'
      });

      res.json(participant);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/challenges/:id/participants/:userId", requireAuth, async (req, res) => {
    try {
      const { id: challengeId, userId: participantUserId } = req.params;
      const { state } = req.body;

      // Check if current user is the host
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      if (challenge.hostId !== req.session.userId) {
        return res.status(403).json({ message: "Only host can manage participants" });
      }

      const updatedParticipant = await storage.updateParticipant(challengeId, participantUserId, { state });
      res.json(updatedParticipant);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Check-in
  app.post("/api/challenges/:id/checkin", requireAuth, async (req, res) => {
    try {
      const challengeId = req.params.id;
      const userId = req.session.userId;
      const { lat, lng, qrCode } = req.body;

      // Verify user is an approved participant
      const participants = await storage.getChallengeParticipants(challengeId);
      const participant = participants.find(p => p.userId === userId && p.state === 'approved');
      
      if (!participant) {
        return res.status(403).json({ message: "Not an approved participant" });
      }

      // Get challenge and venue details
      const challenge = await storage.getChallenge(challengeId);
      const venue = await storage.getVenue(challenge!.venueId);

      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }

      // Verify location (within 100m) if GPS provided
      if (lat && lng) {
        const venueLat = parseFloat(venue.lat);
        const venueLng = parseFloat(venue.lng);
        const distance = calculateDistance(lat, lng, venueLat, venueLng);
        
        if (distance > 0.1) { // 100 meters
          return res.status(400).json({ message: "You must be within 100m of the venue to check in" });
        }
      }

      // For demo purposes, accept QR code check-in
      if (qrCode && qrCode === venue.id) {
        // Valid QR code
      } else if (!lat || !lng) {
        return res.status(400).json({ message: "GPS location or valid QR code required" });
      }

      // Update participant check-in status
      const updatedParticipant = await storage.updateParticipant(challengeId, userId!, {
        state: 'checked_in',
        checkinAt: new Date()
      });

      res.json(updatedParticipant);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Messages
  app.get("/api/challenges/:id/messages", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getMessagesWithUsers(req.params.id);
      res.json(messages);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Results
  app.get("/api/challenges/:id/results", async (req, res) => {
    try {
      const results = await storage.getResults(req.params.id);
      res.json(results);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/challenges/:id/results", requireAuth, async (req, res) => {
    try {
      const resultData = insertResultSchema.parse({
        ...req.body,
        challengeId: req.params.id,
        reportedByUserId: req.session.userId
      });

      const result = await storage.createResult(resultData);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Reviews
  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: req.session.userId
      });

      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Reports
  app.post("/api/reports", requireAuth, async (req, res) => {
    try {
      const reportData = insertReportSchema.parse({
        ...req.body,
        reporterId: req.session.userId
      });

      const report = await storage.createReport(reportData);
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    try {
      // Check if user is admin
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/reports", requireAuth, async (req, res) => {
    try {
      // Check if user is admin (simplified check)
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const reports = await storage.getReports(req.query.status as string);
      res.json(reports);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin venue management
  app.post("/api/admin/venues", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const venue = await storage.createVenue(req.body);
      res.json(venue);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/venues/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const venue = await storage.updateVenue(req.params.id, req.body);
      res.json(venue);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/venues/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.deleteVenue(req.params.id);
      res.json({ message: "Venue deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin user management
  app.patch("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const updatedUser = await storage.updateUser(req.params.id, req.body);
      res.json({ ...updatedUser, password: undefined });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin challenge management
  app.get("/api/admin/challenges", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const challenges = await storage.getChallengesWithDetails({});
      res.json(challenges);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/challenges/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const challenge = await storage.updateChallenge(req.params.id, req.body);
      res.json(challenge);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/challenges/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.deleteChallenge(req.params.id);
      res.json({ message: "Challenge deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin password reset (without requiring current password)
  app.patch("/api/admin/reset-password/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.params.id, { password: hashedPassword });

      res.json({ message: "Password reset successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin analytics endpoint
  app.get("/api/admin/analytics", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin export data endpoint
  app.get("/api/admin/export", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { type, format } = req.query;
      const exportData = await storage.getExportData(type as string);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`);
        res.send(storage.convertToCSV(exportData, type as string));
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-export.json"`);
        res.json(exportData);
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin reports management
  app.patch("/api/admin/reports/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const report = await storage.updateReport(req.params.id, req.body);
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  // Report challenge result
  app.post("/api/report-result", requireAuth, async (req, res) => {
    try {
      const { challenge_id, user_id, reported_outcome } = req.body ?? {};
      
      if (!challenge_id || !user_id || !reported_outcome) {
        return res.status(400).json({ message: "Missing required fields: challenge_id, user_id, reported_outcome" });
      }
      
      // Enforce authorization - users can only report for themselves unless admin
      if (req.session.userId !== user_id) {
        const requestingUser = await storage.getUser(req.session.userId!);
        if (requestingUser?.role !== 'super_admin') {
          return res.status(403).json({ message: "You can only report results for yourself" });
        }
      }

      // Validate outcome values
      const validOutcomes = ['host_won', 'opponent_won', 'draw', 'cancelled'];
      if (!validOutcomes.includes(reported_outcome)) {
        return res.status(400).json({ 
          message: "Invalid outcome. Must be: host_won, opponent_won, draw, or cancelled" 
        });
      }

      const updated = await storage.reportResult(challenge_id, user_id, reported_outcome);
      
      return res.json({ 
        success: true, 
        challenge: updated, 
        message: getResultMessage(updated) 
      });
      
    } catch (error: any) {
      log.error('Report result error', { err: error as Error, requestId: req.requestId });
      const msg = String(error.message || error);
      const code = /finalized|not a participant/.test(msg) ? 409 : 400;
      return res.status(code).json({ message: msg });
    }
  });

  // Helper function to generate appropriate response messages
  function getResultMessage(challenge: any): string {
    if (challenge.status === 'completed') {
      return `Result confirmed! Final outcome: ${challenge.finalOutcome}`;
    } else if (challenge.status === 'disputed') {
      return `Results conflict. Host reported: ${challenge.hostReport}, Opponent reported: ${challenge.opponentReport}. Admin review required.`;
    } else {
      return `Your result has been recorded. Waiting for the other participant to report their result.`;
    }
  }

  // Function to authenticate WebSocket connections with proper session verification
  const authenticateWebSocket = (req: any): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        // Check Origin header for CSRF protection
        const origin = req.headers.origin;
        const allowedOrigins = [
          'http://localhost:5000',
          'https://localhost:5000',
          process.env.ALLOWED_ORIGIN, // Allow environment-specific origin
        ].filter(Boolean);

        if (origin && !allowedOrigins.includes(origin)) {
          log.warn('WebSocket connection rejected: Invalid origin', { origin, ip: req.socket.remoteAddress });
          return resolve(null);
        }

        const cookies = req.headers.cookie;
        if (!cookies) {
          return resolve(null);
        }

        const parsedCookies = parseCookie(cookies);
        const sessionCookie = parsedCookies['connect.sid']; // Default express-session cookie name
        
        if (!sessionCookie) {
          return resolve(null);
        }

        // Properly verify signed cookie using cookie-signature
        let sessionId: string;
        try {
          if (sessionCookie.startsWith('s:')) {
            // Use cookie-signature library to properly unsign the cookie
            // JWT_SECRET is guaranteed to be non-null due to check at file top
            const unsignedSessionId = unsign(sessionCookie.slice(2), JWT_SECRET!);
            
            if (unsignedSessionId === false) {
              log.warn('WebSocket connection rejected: Invalid session signature', { ip: req.socket.remoteAddress });
              return resolve(null);
            }
            
            sessionId = unsignedSessionId as string;
          } else {
            // Unsigned cookie (should not happen in production)
            sessionId = sessionCookie;
          }
        } catch (error) {
          log.error('Session cookie verification failed', { err: error as Error, ip: req.socket.remoteAddress });
          return resolve(null);
        }
        
        // Get session from store
        sessionStore.get(sessionId, (err: any, sessionData: any) => {
          if (err || !sessionData || !sessionData.userId) {
            return resolve(null);
          }
          resolve(sessionData.userId);
        });
      } catch (error) {
        log.error('WebSocket auth error', { err: error as Error, ip: req.socket.remoteAddress });
        resolve(null);
      }
    });
  };

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/api/ws' });

  wss.on('connection', async (ws: WebSocket, req) => {
    // Get client IP for rate limiting
    const clientIP = req.socket.remoteAddress || 'unknown';
    
    // Check connection rate limit
    if (!checkRateLimit(connectionCounts, clientIP, WEBSOCKET_CONNECTION_LIMIT)) {
      ws.close(1008, 'Too many connections from this IP');
      return;
    }

    // Authenticate the WebSocket connection
    const userId = await authenticateWebSocket(req);
    
    if (!userId) {
      ws.close(1008, 'Authentication required');
      return;
    }
    
    // TypeScript assertion: userId is guaranteed to be non-null after the above check
    const authenticatedUserId: string = userId;
    
    ws.on('message', async (data) => {
      try {
        // Check message rate limit
        if (!checkRateLimit(messageCounts, authenticatedUserId, WEBSOCKET_MESSAGE_LIMIT)) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Message rate limit exceeded. Please slow down.' 
          }));
          return;
        }

        const message = JSON.parse(data.toString());
        
        if (message.type === 'join_challenge') {
          const challengeId = message.challengeId;
          
          if (!challengeId || typeof challengeId !== 'string') {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Invalid challenge ID' 
            }));
            return;
          }
          
          // Verify user is participant in the challenge with proper state validation
          try {
            const challenge = await storage.getChallenge(challengeId);
            if (!challenge) {
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Challenge not found' 
              }));
              return;
            }
            
            // Get participants with detailed state information
            const participants = await storage.getChallengeParticipants(challengeId);
            const isHost = challenge.hostId === authenticatedUserId;
            const participantRecord = participants.find(p => p.userId === authenticatedUserId);
            
            // Enhanced authorization - check participant state
            const isAuthorizedParticipant = isHost || 
              (participantRecord && ['approved', 'checked_in'].includes(participantRecord.state as string));
            
            if (!isAuthorizedParticipant) {
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'You are not an authorized participant in this challenge' 
              }));
              return;
            }

            // Prevent duplicate connections for the same user
            const existingConnection = userChallengeConnections.get(authenticatedUserId);
            if (existingConnection) {
              // Close existing connection
              if (existingConnection.ws.readyState === WebSocket.OPEN) {
                existingConnection.ws.close(1000, 'New connection established');
              }
            }
            
            // Add to challenge connections
            if (!challengeConnections.has(challengeId)) {
              challengeConnections.set(challengeId, new Set());
            }
            challengeConnections.get(challengeId)!.add(ws);
            
            // Track user connection
            userChallengeConnections.set(authenticatedUserId, { challengeId, ws });
            
            ws.send(JSON.stringify({ 
              type: 'joined', 
              challengeId,
              role: isHost ? 'host' : 'participant'
            }));
          } catch (error) {
            log.error('Challenge verification error', { err: error as Error, userId: authenticatedUserId, challengeId });
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Challenge verification failed' 
            }));
            return;
          }
        }
        
        if (message.type === 'send_message') {
          const { challengeId, body } = message;
          
          // Validate message content
          if (!challengeId || !body || typeof body !== 'string') {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Invalid message format' 
            }));
            return;
          }

          // Limit message length
          if (body.length > 1000) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Message too long (max 1000 characters)' 
            }));
            return;
          }
          
          // Validate that user is connected to this challenge
          const userConnection = userChallengeConnections.get(authenticatedUserId);
          if (!userConnection || userConnection.challengeId !== challengeId) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'You are not connected to this challenge' 
            }));
            return;
          }

          // Double-check participant authorization before allowing messages
          try {
            const challenge = await storage.getChallenge(challengeId);
            if (!challenge) {
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Challenge not found' 
              }));
              return;
            }

            const participants = await storage.getChallengeParticipants(challengeId);
            const isHost = challenge.hostId === authenticatedUserId;
            const participantRecord = participants.find(p => p.userId === authenticatedUserId);
            const isAuthorizedParticipant = isHost || 
              (participantRecord && ['approved', 'checked_in'].includes(participantRecord.state as string));
            
            if (!isAuthorizedParticipant) {
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Not authorized to send messages in this challenge' 
              }));
              return;
            }

            // Use authenticated userId as senderId instead of trusting client
            const newMessage = await storage.createMessage({
              challengeId,
              senderId: authenticatedUserId,
              body: body.trim() // Sanitize message content
            });
            
            // Broadcast to all clients in the challenge room
            const connections = challengeConnections.get(challengeId);
            if (connections) {
              const sender = await storage.getUser(authenticatedUserId);
              const messageWithSender = {
                type: 'new_message',
                message: newMessage,
                sender: { 
                  ...sender, 
                  password: undefined // Never send password data
                }
              };
              
              connections.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify(messageWithSender));
                }
              });
            }
          } catch (error) {
            log.error('Message send error', { err: error as Error, userId: authenticatedUserId, challengeId });
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Failed to send message' 
            }));
          }
        }
      } catch (error) {
        log.error('WebSocket message error', { err: error as Error, userId: authenticatedUserId });
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });

    ws.on('close', (code, reason) => {
      log.websocket('WebSocket connection closed', { userId: authenticatedUserId, code, reason });
      
      // Remove user from connection tracking
      const userConnection = userChallengeConnections.get(authenticatedUserId);
      if (userConnection && userConnection.ws === ws) {
        userChallengeConnections.delete(authenticatedUserId);
      }
      
      // Remove connection from all challenge rooms
      challengeConnections.forEach((connections, challengeId) => {
        if (connections.has(ws)) {
          connections.delete(ws);
          // Clean up empty challenge rooms
          if (connections.size === 0) {
            challengeConnections.delete(challengeId);
          }
        }
      });
    });

    ws.on('error', (error) => {
      log.error('WebSocket connection error', { err: error, userId: authenticatedUserId });
      
      // Clean up connections on error
      const userConnection = userChallengeConnections.get(authenticatedUserId);
      if (userConnection && userConnection.ws === ws) {
        userChallengeConnections.delete(authenticatedUserId);
      }
      
      challengeConnections.forEach((connections, challengeId) => {
        if (connections.has(ws)) {
          connections.delete(ws);
          if (connections.size === 0) {
            challengeConnections.delete(challengeId);
          }
        }
      });
      
      // Close connection gracefully
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1011, 'Server error');
      }
    });

    // Send ping periodically to keep connection alive and detect dead connections
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // Ping every 30 seconds

    // Clean up ping interval when connection closes
    ws.on('close', () => {
      clearInterval(pingInterval);
    });
  });

  return httpServer;
}

// Utility function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}
