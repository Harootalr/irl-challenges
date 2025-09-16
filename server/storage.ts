import { 
  users, venues, challenges, challengeParticipants, messages, results, reviews, reports, promotions,
  type User, type InsertUser, type Venue, type InsertVenue, 
  type Challenge, type InsertChallenge, type ChallengeParticipant, type InsertChallengeParticipant,
  type Message, type InsertMessage, type Result, type InsertResult,
  type Review, type InsertReview, type Report, type InsertReport,
  type Promotion, type InsertPromotion
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, or, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";
import { log } from "./utils/logger";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser & { password: string }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Venue operations
  getVenue(id: string): Promise<Venue | undefined>;
  getVenues(city?: string, verified?: boolean): Promise<Venue[]>;
  getVenuesNear(lat: number, lng: number, radiusKm: number): Promise<Venue[]>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: string, updates: Partial<Venue>): Promise<Venue>;
  deleteVenue(id: string): Promise<void>;

  // Challenge operations
  getChallenge(id: string): Promise<Challenge | undefined>;
  getChallenges(filters?: { status?: string; venueId?: string; hostId?: string; city?: string }): Promise<Challenge[]>;
  getChallengesWithDetails(filters?: { status?: string; venueId?: string; hostId?: string; city?: string }): Promise<any[]>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: string, updates: Partial<Challenge>): Promise<Challenge>;
  deleteChallenge(id: string): Promise<void>;

  // Challenge Participant operations
  getChallengeParticipants(challengeId: string): Promise<ChallengeParticipant[]>;
  getChallengeParticipantsWithUsers(challengeId: string): Promise<any[]>;
  addParticipant(participant: InsertChallengeParticipant): Promise<ChallengeParticipant>;
  updateParticipant(challengeId: string, userId: string, updates: Partial<ChallengeParticipant>): Promise<ChallengeParticipant>;
  removeParticipant(challengeId: string, userId: string): Promise<void>;

  // Message operations
  getMessages(challengeId: string): Promise<Message[]>;
  getMessagesWithUsers(challengeId: string): Promise<any[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Result operations
  getResults(challengeId: string): Promise<Result[]>;
  createResult(result: InsertResult): Promise<Result>;
  updateResult(id: string, updates: Partial<Result>): Promise<Result>;

  // Review operations
  getReviews(challengeId?: string, revieweeId?: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Report operations
  getReports(status?: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, updates: Partial<Report>): Promise<Report>;

  // Promotion operations
  getPromotions(venueId?: string, active?: boolean): Promise<Promotion[]>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: string, updates: Partial<Promotion>): Promise<Promotion>;

  // Analytics operations
  getAnalytics(): Promise<any>;

  // Export operations
  getExportData(type: string): Promise<any[]>;
  convertToCSV(data: any[], type: string): string;

  // Result reporting operations
  reportResult(challengeId: string, userId: string, reportedOutcome: string): Promise<Challenge>;

  // Seeding operations
  seedGothenburgData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.createdAt));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser & { password: string }): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue || undefined;
  }

  async getVenues(city?: string, verified?: boolean): Promise<Venue[]> {
    const conditions = [];
    if (city) conditions.push(eq(venues.city, city));
    if (verified !== undefined) conditions.push(eq(venues.verified, verified));

    return await db.select().from(venues).where(and(...conditions)).orderBy(asc(venues.name));
  }

  async getVenuesNear(lat: number, lng: number, radiusKm: number): Promise<Venue[]> {
    // Simple distance calculation - in production, use PostGIS or similar
    return await db.select().from(venues)
      .where(and(
        eq(venues.verified, true),
        sql`ABS(CAST(${venues.lat} AS DECIMAL) - ${lat}) < ${radiusKm / 111.0}`,
        sql`ABS(CAST(${venues.lng} AS DECIMAL) - ${lng}) < ${radiusKm / (111.0 * Math.cos(lat * Math.PI / 180))}`
      ))
      .orderBy(asc(venues.name));
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const [newVenue] = await db.insert(venues).values(venue).returning();
    return newVenue;
  }

  async updateVenue(id: string, updates: Partial<Venue>): Promise<Venue> {
    const [venue] = await db
      .update(venues)
      .set(updates)
      .where(eq(venues.id, id))
      .returning();
    return venue;
  }

  async deleteVenue(id: string): Promise<void> {
    await db.delete(venues).where(eq(venues.id, id));
  }

  async getChallenge(id: string): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge || undefined;
  }

  async getChallenges(filters?: { status?: string; venueId?: string; hostId?: string; city?: string }): Promise<Challenge[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(challenges.status, filters.status));
    if (filters?.venueId) conditions.push(eq(challenges.venueId, filters.venueId));
    if (filters?.hostId) conditions.push(eq(challenges.hostId, filters.hostId));

    if (filters?.city) {
      return await db.select({ challenges })
        .from(challenges)
        .leftJoin(venues, eq(challenges.venueId, venues.id))
        .where(and(eq(venues.city, filters.city), ...conditions))
        .orderBy(desc(challenges.startAt))
        .then(results => results.map(r => r.challenges));
    } else if (conditions.length > 0) {
      return await db.select().from(challenges).where(and(...conditions)).orderBy(desc(challenges.startAt));
    }

    return await db.select().from(challenges).orderBy(desc(challenges.startAt));
  }

  async getChallengesWithDetails(filters?: { status?: string; venueId?: string; hostId?: string; city?: string }): Promise<any[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(challenges.status, filters.status));
    if (filters?.venueId) conditions.push(eq(challenges.venueId, filters.venueId));
    if (filters?.hostId) conditions.push(eq(challenges.hostId, filters.hostId));
    if (filters?.city) conditions.push(eq(venues.city, filters.city));

    return await db.select({
      challenge: challenges,
      host: users,
      venue: venues,
      participantCount: sql<number>`(
        SELECT COUNT(*) FROM ${challengeParticipants} 
        WHERE ${challengeParticipants.challengeId} = ${challenges.id} 
        AND ${challengeParticipants.state} = 'approved'
      )`
    })
    .from(challenges)
    .leftJoin(users, eq(challenges.hostId, users.id))
    .leftJoin(venues, eq(challenges.venueId, venues.id))
    .where(and(...conditions))
    .orderBy(desc(challenges.startAt));
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [newChallenge] = await db.insert(challenges).values(challenge).returning();
    
    // Automatically add host as participant
    await db.insert(challengeParticipants).values({
      challengeId: newChallenge.id,
      userId: challenge.hostId,
      role: 'host',
      state: 'approved'
    });

    return newChallenge;
  }

  async updateChallenge(id: string, updates: Partial<Challenge>): Promise<Challenge> {
    const [challenge] = await db
      .update(challenges)
      .set(updates)
      .where(eq(challenges.id, id))
      .returning();
    return challenge;
  }

  async deleteChallenge(id: string): Promise<void> {
    await db.delete(challenges).where(eq(challenges.id, id));
  }

  async reportResult(challengeId: string, userId: string, reportedOutcome: string): Promise<Challenge> {
    const validOutcomes = new Set(['host_won','opponent_won','draw','cancelled']);

    if (!validOutcomes.has(reportedOutcome)) {
      throw new Error("Invalid outcome");
    }
    
    const challenge = await this.getChallenge(challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    // Block edits after finalization
    if (['completed','cancelled'].includes(challenge.status)) {
      throw new Error("Challenge already finalized");
    }

    // Must be a participant
    const participants = await this.getChallengeParticipants(challengeId);
    const me = participants.find(p => p.userId === userId);
    if (!me) {
      throw new Error("User is not a participant");
    }

    const isHost = challenge.hostId === userId;
    const updateField = isHost ? 'hostReport' : 'opponentReport';
    const otherField = isHost ? 'opponentReport' : 'hostReport';

    // Idempotency: if same report, no-op
    if (challenge[updateField] === reportedOutcome) {
      return challenge;
    }

    const updates: Partial<Challenge> = { 
      [updateField]: reportedOutcome,
      updatedAt: new Date()
    };

    const otherReport = challenge[otherField as keyof Challenge] as string | null;

    if (otherReport) {
      if (otherReport === reportedOutcome) {
        updates.finalOutcome = reportedOutcome;
        updates.status = 'completed';
      } else {
        updates.status = 'disputed';
      }
    } else {
      if (['open','full'].includes(challenge.status)) {
        updates.status = 'in_progress';
      }
    }

    // Use transaction to avoid race conditions
    return await db.transaction(async (tx) => {
      // Re-read inside transaction to avoid lost updates
      const [fresh] = await tx.select().from(challenges).where(eq(challenges.id, challengeId));
      if (!fresh) {
        throw new Error("Challenge not found");
      }
      if (['completed','cancelled'].includes(fresh.status)) {
        throw new Error("Challenge already finalized");
      }
      
      const [updated] = await tx
        .update(challenges)
        .set(updates)
        .where(eq(challenges.id, challengeId))
        .returning();
      
      return updated;
    });
  }

  async getChallengeParticipants(challengeId: string): Promise<ChallengeParticipant[]> {
    return await db.select().from(challengeParticipants)
      .where(eq(challengeParticipants.challengeId, challengeId));
  }

  async getChallengeParticipantsWithUsers(challengeId: string): Promise<any[]> {
    return await db.select({
      participant: challengeParticipants,
      user: users
    })
    .from(challengeParticipants)
    .leftJoin(users, eq(challengeParticipants.userId, users.id))
    .where(eq(challengeParticipants.challengeId, challengeId))
    .orderBy(desc(challengeParticipants.createdAt));
  }

  async addParticipant(participant: InsertChallengeParticipant): Promise<ChallengeParticipant> {
    const [newParticipant] = await db.insert(challengeParticipants).values(participant).returning();
    return newParticipant;
  }

  async updateParticipant(challengeId: string, userId: string, updates: Partial<ChallengeParticipant>): Promise<ChallengeParticipant> {
    const [participant] = await db
      .update(challengeParticipants)
      .set(updates)
      .where(and(
        eq(challengeParticipants.challengeId, challengeId),
        eq(challengeParticipants.userId, userId)
      ))
      .returning();
    return participant;
  }

  async removeParticipant(challengeId: string, userId: string): Promise<void> {
    await db.delete(challengeParticipants)
      .where(and(
        eq(challengeParticipants.challengeId, challengeId),
        eq(challengeParticipants.userId, userId)
      ));
  }

  async getMessages(challengeId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.challengeId, challengeId))
      .orderBy(asc(messages.createdAt));
  }

  async getMessagesWithUsers(challengeId: string): Promise<any[]> {
    return await db.select({
      message: messages,
      sender: users
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.challengeId, challengeId))
    .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getResults(challengeId: string): Promise<Result[]> {
    return await db.select().from(results)
      .where(eq(results.challengeId, challengeId))
      .orderBy(desc(results.createdAt));
  }

  async createResult(result: InsertResult): Promise<Result> {
    const [newResult] = await db.insert(results).values(result).returning();
    return newResult;
  }

  async updateResult(id: string, updates: Partial<Result>): Promise<Result> {
    const [result] = await db
      .update(results)
      .set(updates)
      .where(eq(results.id, id))
      .returning();
    return result;
  }

  async getReviews(challengeId?: string, revieweeId?: string): Promise<Review[]> {
    const conditions = [];
    if (challengeId) conditions.push(eq(reviews.challengeId, challengeId));
    if (revieweeId) conditions.push(eq(reviews.revieweeId, revieweeId));

    return await db.select().from(reviews)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getReports(status?: string): Promise<Report[]> {
    return await db.select().from(reports)
      .where(status ? eq(reports.status, status) : undefined)
      .orderBy(desc(reports.createdAt));
  }

  async updateReport(id: string, updates: Partial<Report>): Promise<Report> {
    const [report] = await db
      .update(reports)
      .set(updates)
      .where(eq(reports.id, id))
      .returning();
    return report;
  }

  async getAnalytics(): Promise<any> {
    // Get user analytics
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const newUsersThisMonth = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.createdAt} >= date_trunc('month', current_date)`);
    
    // Get venue analytics
    const totalVenues = await db.select({ count: sql<number>`count(*)` }).from(venues);
    const verifiedVenues = await db.select({ count: sql<number>`count(*)` })
      .from(venues)
      .where(eq(venues.verified, true));
    
    // Get challenge analytics
    const totalChallenges = await db.select({ count: sql<number>`count(*)` }).from(challenges);
    const activeChallenges = await db.select({ count: sql<number>`count(*)` })
      .from(challenges)
      .where(eq(challenges.status, 'open'));
    const completedChallenges = await db.select({ count: sql<number>`count(*)` })
      .from(challenges)
      .where(eq(challenges.status, 'completed'));
    
    // Get popular games
    const popularGames = await db.select({
      preset: challenges.preset,
      count: sql<number>`count(*)`
    })
    .from(challenges)
    .groupBy(challenges.preset)
    .orderBy(sql`count(*) desc`)
    .limit(5);

    // Get activity over time (last 30 days)
    const dailyActivity = await db.select({
      date: sql<string>`date(${challenges.createdAt})`,
      challenges: sql<number>`count(*)`
    })
    .from(challenges)
    .where(sql`${challenges.createdAt} >= current_date - interval '30 days'`)
    .groupBy(sql`date(${challenges.createdAt})`)
    .orderBy(sql`date(${challenges.createdAt})`);

    return {
      users: {
        total: totalUsers[0]?.count || 0,
        newThisMonth: newUsersThisMonth[0]?.count || 0
      },
      venues: {
        total: totalVenues[0]?.count || 0,
        verified: verifiedVenues[0]?.count || 0
      },
      challenges: {
        total: totalChallenges[0]?.count || 0,
        active: activeChallenges[0]?.count || 0,
        completed: completedChallenges[0]?.count || 0
      },
      popularGames: popularGames || [],
      dailyActivity: dailyActivity || []
    };
  }

  async getExportData(type: string): Promise<any[]> {
    switch (type) {
      case 'users':
        return await db.select().from(users).orderBy(desc(users.createdAt));
      case 'venues':
        return await db.select().from(venues).orderBy(desc(venues.createdAt));
      case 'challenges':
        return await this.getChallengesWithDetails({});
      case 'reports':
        return await db.select().from(reports).orderBy(desc(reports.createdAt));
      default:
        throw new Error('Invalid export type');
    }
  }

  convertToCSV(data: any[], type: string): string {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getPromotions(venueId?: string, active?: boolean): Promise<Promotion[]> {
    const conditions = [];
    if (venueId) conditions.push(eq(promotions.venueId, venueId));
    if (active) conditions.push(and(
      eq(promotions.status, 'active'),
      sql`${promotions.startsAt} <= NOW()`,
      sql`${promotions.endsAt} >= NOW()`
    ));

    return await db.select().from(promotions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(promotions.startsAt));
  }

  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    const [newPromotion] = await db.insert(promotions).values(promotion).returning();
    return newPromotion;
  }

  async updatePromotion(id: string, updates: Partial<Promotion>): Promise<Promotion> {
    const [promotion] = await db
      .update(promotions)
      .set(updates)
      .where(eq(promotions.id, id))
      .returning();
    return promotion;
  }

  async seedGothenburgData(): Promise<void> {
    // Create venues in Gothenburg
    const venueData = [
      {
        name: "O'Learys Göteborg",
        category: "Sports Bar",
        address: "Kungsgatan 58, 411 15 Göteborg",
        lat: "57.7072326",
        lng: "11.9670171",
        city: "Göteborg",
        verified: true,
        rating: "4.6",
        ratingCount: 234,
        openingHours: {
          monday: "15:00-01:00",
          tuesday: "15:00-01:00", 
          wednesday: "15:00-01:00",
          thursday: "15:00-02:00",
          friday: "15:00-03:00",
          saturday: "12:00-03:00",
          sunday: "12:00-01:00"
        },
        contactEmail: "goteborg@olearys.se",
        contactPhone: "+46 31 13 13 00"
      },
      {
        name: "The Chess Club",
        category: "Board Game Cafe",
        address: "Avenyn 42, 411 36 Göteborg",
        lat: "57.7000000",
        lng: "11.9744444",
        city: "Göteborg",
        verified: true,
        rating: "4.8",
        ratingCount: 156,
        openingHours: {
          monday: "16:00-22:00",
          tuesday: "16:00-22:00",
          wednesday: "16:00-22:00",
          thursday: "16:00-22:00",
          friday: "16:00-00:00",
          saturday: "14:00-00:00",
          sunday: "14:00-22:00"
        },
        contactEmail: "info@chessclubgbg.se",
        contactPhone: "+46 31 123 45 67"
      },
      {
        name: "GameHub Nordstan",
        category: "Gaming Center",
        address: "Nordstan, 411 05 Göteborg",
        lat: "57.7089169",
        lng: "11.9746417",
        city: "Göteborg",
        verified: true,
        rating: "4.4",
        ratingCount: 89,
        openingHours: {
          monday: "10:00-22:00",
          tuesday: "10:00-22:00",
          wednesday: "10:00-22:00",
          thursday: "10:00-22:00",
          friday: "10:00-23:00",
          saturday: "10:00-23:00",
          sunday: "11:00-21:00"
        },
        contactEmail: "nordstan@gamehub.se",
        contactPhone: "+46 31 987 65 43"
      }
    ];

    for (const venue of venueData) {
      await db.insert(venues).values(venue).onConflictDoNothing();
    }

    log.info("Seeded Gothenburg venues", { venueCount: venueData.length });
  }
}

export const storage = new DatabaseStorage();
