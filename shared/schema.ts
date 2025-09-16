import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal, jsonb, uuid, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Valid status and outcome values (enforced in application logic)
export const CHALLENGE_STATUSES = ['open','full','in_progress','completed','cancelled','disputed'] as const;
export const CHALLENGE_OUTCOMES = ['host_won','opponent_won','draw','cancelled'] as const;

export type ChallengeStatus = typeof CHALLENGE_STATUSES[number];
export type ChallengeOutcome = typeof CHALLENGE_OUTCOMES[number];

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  homeCity: text("home_city"),
  ratingScore: decimal("rating_score", { precision: 3, scale: 2 }).default('0.00'),
  ratingCount: integer("rating_count").default(0),
  role: text("role").default('user'), // user, venue_admin, super_admin
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  address: text("address").notNull(),
  lat: decimal("lat", { precision: 10, scale: 8 }).notNull(),
  lng: decimal("lng", { precision: 11, scale: 8 }).notNull(),
  city: text("city").notNull(),
  openingHours: jsonb("opening_hours_json"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  verified: boolean("verified").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default('0.00'),
  ratingCount: integer("rating_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  hostId: uuid("host_id").notNull().references(() => users.id),
  venueId: uuid("venue_id").notNull().references(() => venues.id),
  title: text("title").notNull(),
  preset: text("preset").notNull(),
  customRules: text("custom_rules"),
  description: text("description"),
  skillLevel: text("skill_level").notNull(), // beginner, intermediate, advanced
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at"),
  status: text("status").default('open').notNull(), // open, full, in_progress, completed, cancelled, disputed
  maxParticipants: integer("max_participants").default(2),
  visibility: text("visibility").default('public'), // public, private
  hostReport: text("host_report"), // host_won, opponent_won, draw, cancelled
  opponentReport: text("opponent_report"), // host_won, opponent_won, draw, cancelled  
  finalOutcome: text("final_outcome"), // host_won, opponent_won, draw, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  idx_status_start: index().on(t.status, t.startAt),
  idx_venue_start: index().on(t.venueId, t.startAt)
}));

export const challengeParticipants = pgTable("challenge_participants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: uuid("challenge_id").notNull().references(() => challenges.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: text("role").default('participant'), // host, participant
  state: text("state").default('pending'), // pending, approved, rejected, checked_in
  checkinAt: timestamp("checkin_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: uuid("challenge_id").notNull().references(() => challenges.id),
  senderId: uuid("sender_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const results = pgTable("results", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: uuid("challenge_id").notNull().references(() => challenges.id),
  scores: jsonb("scores_json").notNull(),
  winnerUserId: uuid("winner_user_id").references(() => users.id),
  reportedByUserId: uuid("reported_by_user_id").notNull().references(() => users.id),
  confirmationState: text("confirmation_state").default('pending'), // pending, confirmed, disputed
  confirmations: jsonb("confirmations").default('[]'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewerId: uuid("reviewer_id").notNull().references(() => users.id),
  revieweeId: uuid("reviewee_id").notNull().references(() => users.id),
  challengeId: uuid("challenge_id").notNull().references(() => challenges.id),
  rating: text("rating").notNull(), // thumbs_up, thumbs_down
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: uuid("reporter_id").notNull().references(() => users.id),
  reportedUserId: uuid("reported_user_id").notNull().references(() => users.id),
  challengeId: uuid("challenge_id").references(() => challenges.id),
  reason: text("reason").notNull(),
  notes: text("notes"),
  status: text("status").default('pending'), // pending, resolved, dismissed
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const promotions = pgTable("promotions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: uuid("venue_id").notNull().references(() => venues.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  status: text("status").default('active'), // active, inactive, expired
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  hostedChallenges: many(challenges),
  participations: many(challengeParticipants),
  messages: many(messages),
  givenReviews: many(reviews, { relationName: "reviewer" }),
  receivedReviews: many(reviews, { relationName: "reviewee" }),
  reports: many(reports, { relationName: "reporter" }),
  reportsAgainst: many(reports, { relationName: "reportedUser" }),
}));

export const venuesRelations = relations(venues, ({ many }) => ({
  challenges: many(challenges),
  promotions: many(promotions),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  host: one(users, {
    fields: [challenges.hostId],
    references: [users.id],
  }),
  venue: one(venues, {
    fields: [challenges.venueId],
    references: [venues.id],
  }),
  participants: many(challengeParticipants),
  messages: many(messages),
  results: many(results),
  reviews: many(reviews),
  reports: many(reports),
}));

export const challengeParticipantsRelations = relations(challengeParticipants, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeParticipants.challengeId],
    references: [challenges.id],
  }),
  user: one(users, {
    fields: [challengeParticipants.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  challenge: one(challenges, {
    fields: [messages.challengeId],
    references: [challenges.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  challenge: one(challenges, {
    fields: [results.challengeId],
    references: [challenges.id],
  }),
  winner: one(users, {
    fields: [results.winnerUserId],
    references: [users.id],
  }),
  reportedBy: one(users, {
    fields: [results.reportedByUserId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
    relationName: "reviewer",
  }),
  reviewee: one(users, {
    fields: [reviews.revieweeId],
    references: [users.id],
    relationName: "reviewee",
  }),
  challenge: one(challenges, {
    fields: [reviews.challengeId],
    references: [challenges.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
    relationName: "reporter",
  }),
  reportedUser: one(users, {
    fields: [reports.reportedUserId],
    references: [users.id],
    relationName: "reportedUser",
  }),
  challenge: one(challenges, {
    fields: [reports.challengeId],
    references: [challenges.id],
  }),
}));

export const promotionsRelations = relations(promotions, ({ one }) => ({
  venue: one(venues, {
    fields: [promotions.venueId],
    references: [venues.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  ratingScore: true,
  ratingCount: true,
  role: true,
  isVerified: true,
  createdAt: true,
});

export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true,
  verified: true,
  rating: true,
  ratingCount: true,
  createdAt: true,
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startAt: z.string().transform(str => new Date(str)),
  endAt: z.string().optional().transform(str => str ? new Date(str) : undefined)
});

export const insertChallengeParticipantSchema = createInsertSchema(challengeParticipants).omit({
  id: true,
  state: true,
  checkinAt: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertResultSchema = createInsertSchema(results).omit({
  id: true,
  confirmationState: true,
  confirmations: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  status: true,
  resolution: true,
  createdAt: true,
});

export const insertPromotionSchema = createInsertSchema(promotions).omit({
  id: true,
  status: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;

export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = z.infer<typeof insertChallengeParticipantSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Result = typeof results.$inferSelect;
export type InsertResult = z.infer<typeof insertResultSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;

// Game presets constant
export const GAME_PRESETS = [
  "Chess",
  "Checkers / Draughts",
  "Backgammon",
  "Go",
  "Ludo",
  "Monopoly",
  "Settlers of Catan",
  "Risk",
  "Poker (Texas Hold'em)",
  "Blackjack",
  "Uno",
  "Bridge",
  "Magic: The Gathering",
  "8-Ball Pool",
  "9-Ball Pool",
  "Snooker",
  "Carom Billiards",
  "Nintendo Switch: Mario Kart",
  "Nintendo Switch: Super Smash Bros",
  "FIFA",
  "NBA 2K",
  "Call of Duty (LAN/local multiplayer)",
  "Table Tennis",
  "Foosball",
  "Air Hockey",
  "Darts",
  "Mini-Golf",
  "Bowling",
  "Badminton",
  "Tennis (Singles)",
  "Tennis (Doubles)",
  "Padel",
  "5-kamp",
  "Trivia Night",
  "Karaoke Battle",
  "Arm Wrestling",
  "Rock-Paper-Scissors",
  "Custom Challenge"
] as const;

export type GamePreset = typeof GAME_PRESETS[number];
