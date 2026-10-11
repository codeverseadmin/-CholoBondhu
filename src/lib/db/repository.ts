// ─────────────────────────────────────────────
// CHOLO BONDHU — Unified Authentication & Account Repository
//
// Clean repository abstraction supporting MongoDB with pooled connections
// and an in-memory/file fallback for local development and zero-dependency tests.
// ─────────────────────────────────────────────

import type {
  UserRecord,
  SessionRecord,
  OtpRecord,
  PasswordRequestRecord,
  UserOwnedPlanRecord,
} from "@/types/auth";
import { MongoClient, Db } from "mongodb";

export interface AuthDatabaseRepository {
  findUserById(id: string): Promise<UserRecord | null>;
  findUserByPhone(canonicalPhone: string): Promise<UserRecord | null>;
  createUser(user: UserRecord): Promise<UserRecord>;
  updateUser(id: string, updates: Partial<UserRecord>): Promise<UserRecord | null>;
  deleteUser(id: string): Promise<boolean>;

  createSession(session: SessionRecord): Promise<SessionRecord>;
  findSessionById(id: string): Promise<SessionRecord | null>;
  revokeSession(id: string): Promise<boolean>;
  revokeAllUserSessions(userId: string): Promise<number>;

  saveOtp(otp: OtpRecord): Promise<void>;
  findOtp(phone: string, purpose: string): Promise<OtpRecord | null>;
  incrementOtpAttempts(phone: string, purpose: string): Promise<number>;
  deleteOtp(phone: string, purpose: string): Promise<void>;

  createPasswordRequest(req: PasswordRequestRecord): Promise<PasswordRequestRecord>;
  findPasswordRequestById(id: string): Promise<PasswordRequestRecord | null>;
  findPendingPasswordRequestByUser(userId: string): Promise<PasswordRequestRecord | null>;
  listPasswordRequests(status?: string): Promise<PasswordRequestRecord[]>;
  updatePasswordRequest(
    id: string,
    updates: Partial<PasswordRequestRecord>
  ): Promise<PasswordRequestRecord | null>;

  saveUserPlan(plan: UserOwnedPlanRecord): Promise<UserOwnedPlanRecord>;
  getUserPlans(userId: string): Promise<UserOwnedPlanRecord[]>;
  getUserPlanById(userId: string, planId: string): Promise<UserOwnedPlanRecord | null>;
  deleteUserPlan(userId: string, planId: string): Promise<boolean>;
  bulkMergePlans(
    userId: string,
    plans: unknown[]
  ): Promise<{ importedCount: number; plans: UserOwnedPlanRecord[] }>;

  clearAllDataForTesting?(): Promise<void>;
}

// ─────────────────────────────────────────────
// 1. In-Memory / Test-Resilient Repository Adapter
// ─────────────────────────────────────────────
class MemoryAuthRepository implements AuthDatabaseRepository {
  private users = new Map<string, UserRecord>();
  private sessions = new Map<string, SessionRecord>();
  private otps = new Map<string, OtpRecord>();
  private passwordRequests = new Map<string, PasswordRequestRecord>();
  private userPlans = new Map<string, UserOwnedPlanRecord>();

  async findUserById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) || null;
  }

  async findUserByPhone(canonicalPhone: string): Promise<UserRecord | null> {
    for (const user of this.users.values()) {
      if (user.phone === canonicalPhone) {
        return user;
      }
    }
    return null;
  }

  async createUser(user: UserRecord): Promise<UserRecord> {
    // Uniqueness enforcement on canonical phone
    for (const existing of this.users.values()) {
      if (existing.phone === user.phone) {
        throw new Error(`User with phone ${user.phone} already exists.`);
      }
    }
    this.users.set(user.id, { ...user });
    return { ...user };
  }

  async updateUser(
    id: string,
    updates: Partial<UserRecord>
  ): Promise<UserRecord | null> {
    const existing = this.users.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return { ...updated };
  }

  async deleteUser(id: string): Promise<boolean> {
    const deleted = this.users.delete(id);
    if (deleted) {
      // Cascade delete sessions and plans
      for (const [token, sess] of this.sessions.entries()) {
        if (sess.userId === id) this.sessions.delete(token);
      }
      for (const [planId, plan] of this.userPlans.entries()) {
        if (plan.userId === id) this.userPlans.delete(planId);
      }
    }
    return deleted;
  }

  async createSession(session: SessionRecord): Promise<SessionRecord> {
    this.sessions.set(session.id, { ...session });
    return { ...session };
  }

  async findSessionById(id: string): Promise<SessionRecord | null> {
    const sess = this.sessions.get(id);
    if (!sess) return null;
    // Check expiry
    if (new Date(sess.expiresAt) <= new Date() || sess.revoked) {
      return null;
    }
    return { ...sess };
  }

  async revokeSession(id: string): Promise<boolean> {
    const sess = this.sessions.get(id);
    if (!sess) return false;
    sess.revoked = true;
    return true;
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    let count = 0;
    for (const sess of this.sessions.values()) {
      if (sess.userId === userId && !sess.revoked) {
        sess.revoked = true;
        count++;
      }
    }
    return count;
  }

  async saveOtp(otp: OtpRecord): Promise<void> {
    const key = `${otp.phone}:${otp.purpose}`;
    this.otps.set(key, { ...otp });
  }

  async findOtp(phone: string, purpose: string): Promise<OtpRecord | null> {
    const key = `${phone}:${purpose}`;
    const otp = this.otps.get(key);
    if (!otp) return null;
    // Check expiry
    if (new Date(otp.expiresAt) <= new Date()) {
      this.otps.delete(key);
      return null;
    }
    return { ...otp };
  }

  async incrementOtpAttempts(phone: string, purpose: string): Promise<number> {
    const key = `${phone}:${purpose}`;
    const otp = this.otps.get(key);
    if (!otp) return 0;
    otp.attempts++;
    return otp.attempts;
  }

  async deleteOtp(phone: string, purpose: string): Promise<void> {
    this.otps.delete(`${phone}:${purpose}`);
  }

  async createPasswordRequest(
    req: PasswordRequestRecord
  ): Promise<PasswordRequestRecord> {
    this.passwordRequests.set(req.id, { ...req });
    return { ...req };
  }

  async findPasswordRequestById(
    id: string
  ): Promise<PasswordRequestRecord | null> {
    return this.passwordRequests.get(id) || null;
  }

  async findPendingPasswordRequestByUser(
    userId: string
  ): Promise<PasswordRequestRecord | null> {
    for (const req of this.passwordRequests.values()) {
      if (req.userId === userId && req.status === "pending") {
        return { ...req };
      }
    }
    return null;
  }

  async listPasswordRequests(status?: string): Promise<PasswordRequestRecord[]> {
    const all = Array.from(this.passwordRequests.values());
    if (!status) return all;
    return all.filter((r) => r.status === status);
  }

  async updatePasswordRequest(
    id: string,
    updates: Partial<PasswordRequestRecord>
  ): Promise<PasswordRequestRecord | null> {
    const existing = this.passwordRequests.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.passwordRequests.set(id, updated);
    return { ...updated };
  }

  async saveUserPlan(plan: UserOwnedPlanRecord): Promise<UserOwnedPlanRecord> {
    this.userPlans.set(plan.id, { ...plan });
    return { ...plan };
  }

  async getUserPlans(userId: string): Promise<UserOwnedPlanRecord[]> {
    const plans: UserOwnedPlanRecord[] = [];
    for (const plan of this.userPlans.values()) {
      if (plan.userId === userId) {
        plans.push({ ...plan });
      }
    }
    // Sort descending by savedAt
    plans.sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
    return plans;
  }

  async getUserPlanById(
    userId: string,
    planId: string
  ): Promise<UserOwnedPlanRecord | null> {
    const plan = this.userPlans.get(planId);
    if (!plan || plan.userId !== userId) {
      return null;
    }
    return { ...plan };
  }

  async deleteUserPlan(userId: string, planId: string): Promise<boolean> {
    const plan = this.userPlans.get(planId);
    if (!plan || plan.userId !== userId) {
      return false;
    }
    return this.userPlans.delete(planId);
  }

  async bulkMergePlans(
    userId: string,
    plans: unknown[]
  ): Promise<{ importedCount: number; plans: UserOwnedPlanRecord[] }> {
    if (!Array.isArray(plans)) return { importedCount: 0, plans: [] };

    let importedCount = 0;
    const now = new Date().toISOString();

    for (const item of plans) {
      if (!item || typeof item !== "object") continue;
      const p = item as Record<string, unknown>;
      if (!p.itinerary) continue;
      const planId = (typeof p.id === "string" ? p.id : null) || `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Strict ownership assignment: overrides any client-supplied userId
      const record: UserOwnedPlanRecord = {
        id: planId,
        userId,
        name: typeof p.name === "string" ? p.name : `Pujo Plan`,
        savedAt: typeof p.savedAt === "string" ? p.savedAt : now,
        version: typeof p.version === "number" ? p.version : 1,
        itinerary: p.itinerary as UserOwnedPlanRecord["itinerary"],
        updatedAt: now,
      };

      this.userPlans.set(planId, record);
      importedCount++;
    }

    const userPlans = await this.getUserPlans(userId);
    return { importedCount, plans: userPlans };
  }

  async clearAllDataForTesting(): Promise<void> {
    this.users.clear();
    this.sessions.clear();
    this.otps.clear();
    this.passwordRequests.clear();
    this.userPlans.clear();
  }
}

// ─────────────────────────────────────────────
// 2. Production MongoDB Database Repository Adapter
// ─────────────────────────────────────────────
class MongoAuthRepository implements AuthDatabaseRepository {
  private client: MongoClient;
  private dbPromise: Promise<Db>;
  private indexesInitialized = false;

  constructor(uri: string) {
    this.client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    this.dbPromise = this.client.connect().then((c) => {
      const db = c.db("cholobondhu");
      this.ensureIndexes(db);
      return db;
    });
  }

  private async ensureIndexes(db: Db) {
    if (this.indexesInitialized) return;
    try {
      await db.collection("users").createIndex({ phone: 1 }, { unique: true });
      await db.collection("sessions").createIndex({ id: 1 }, { unique: true });
      await db.collection("sessions").createIndex({ userId: 1 });
      await db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await db.collection("otps").createIndex({ phone: 1, purpose: 1 });
      await db.collection("otps").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await db.collection("password_requests").createIndex({ userId: 1, status: 1 });
      await db.collection("user_plans").createIndex({ userId: 1, id: 1 }, { unique: true });
      this.indexesInitialized = true;
    } catch (err) {
      console.warn("MongoDB index initialization warning:", err);
    }
  }

  private async getDb(): Promise<Db> {
    return this.dbPromise;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const db = await this.getDb();
    const doc = await db.collection("users").findOne({ id });
    return doc ? (doc as unknown as UserRecord) : null;
  }

  async findUserByPhone(canonicalPhone: string): Promise<UserRecord | null> {
    const db = await this.getDb();
    const doc = await db.collection("users").findOne({ phone: canonicalPhone });
    return doc ? (doc as unknown as UserRecord) : null;
  }

  async createUser(user: UserRecord): Promise<UserRecord> {
    const db = await this.getDb();
    await db.collection("users").insertOne({ ...user });
    return user;
  }

  async updateUser(
    id: string,
    updates: Partial<UserRecord>
  ): Promise<UserRecord | null> {
    const db = await this.getDb();
    const res = await db.collection("users").findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );
    return res ? (res as unknown as UserRecord) : null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const db = await this.getDb();
    const res = await db.collection("users").deleteOne({ id });
    if (res.deletedCount > 0) {
      await db.collection("sessions").deleteMany({ userId: id });
      await db.collection("user_plans").deleteMany({ userId: id });
      return true;
    }
    return false;
  }

  async createSession(session: SessionRecord): Promise<SessionRecord> {
    const db = await this.getDb();
    await db.collection("sessions").insertOne({ ...session });
    return session;
  }

  async findSessionById(id: string): Promise<SessionRecord | null> {
    const db = await this.getDb();
    const doc = await db.collection("sessions").findOne({
      id,
      revoked: false,
      expiresAt: { $gt: new Date().toISOString() },
    });
    return doc ? (doc as unknown as SessionRecord) : null;
  }

  async revokeSession(id: string): Promise<boolean> {
    const db = await this.getDb();
    const res = await db.collection("sessions").updateOne(
      { id },
      { $set: { revoked: true } }
    );
    return res.modifiedCount > 0;
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    const db = await this.getDb();
    const res = await db.collection("sessions").updateMany(
      { userId, revoked: false },
      { $set: { revoked: true } }
    );
    return res.modifiedCount;
  }

  async saveOtp(otp: OtpRecord): Promise<void> {
    const db = await this.getDb();
    await db.collection("otps").updateOne(
      { phone: otp.phone, purpose: otp.purpose },
      { $set: { ...otp } },
      { upsert: true }
    );
  }

  async findOtp(phone: string, purpose: string): Promise<OtpRecord | null> {
    const db = await this.getDb();
    const doc = await db.collection("otps").findOne({
      phone,
      purpose,
      expiresAt: { $gt: new Date().toISOString() },
    });
    return doc ? (doc as unknown as OtpRecord) : null;
  }

  async incrementOtpAttempts(phone: string, purpose: string): Promise<number> {
    const db = await this.getDb();
    const res = await db.collection("otps").findOneAndUpdate(
      { phone, purpose },
      { $inc: { attempts: 1 } },
      { returnDocument: "after" }
    );
    return res ? (res as unknown as OtpRecord).attempts : 0;
  }

  async deleteOtp(phone: string, purpose: string): Promise<void> {
    const db = await this.getDb();
    await db.collection("otps").deleteOne({ phone, purpose });
  }

  async createPasswordRequest(
    req: PasswordRequestRecord
  ): Promise<PasswordRequestRecord> {
    const db = await this.getDb();
    await db.collection("password_requests").insertOne({ ...req });
    return req;
  }

  async findPasswordRequestById(
    id: string
  ): Promise<PasswordRequestRecord | null> {
    const db = await this.getDb();
    const doc = await db.collection("password_requests").findOne({ id });
    return doc ? (doc as unknown as PasswordRequestRecord) : null;
  }

  async findPendingPasswordRequestByUser(
    userId: string
  ): Promise<PasswordRequestRecord | null> {
    const db = await this.getDb();
    const doc = await db.collection("password_requests").findOne({
      userId,
      status: "pending",
    });
    return doc ? (doc as unknown as PasswordRequestRecord) : null;
  }

  async listPasswordRequests(status?: string): Promise<PasswordRequestRecord[]> {
    const db = await this.getDb();
    const filter = status ? { status } : {};
    const docs = await db.collection("password_requests").find(filter).toArray();
    return docs as unknown as PasswordRequestRecord[];
  }

  async updatePasswordRequest(
    id: string,
    updates: Partial<PasswordRequestRecord>
  ): Promise<PasswordRequestRecord | null> {
    const db = await this.getDb();
    const res = await db.collection("password_requests").findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    return res ? (res as unknown as PasswordRequestRecord) : null;
  }

  async saveUserPlan(plan: UserOwnedPlanRecord): Promise<UserOwnedPlanRecord> {
    const db = await this.getDb();
    await db.collection("user_plans").updateOne(
      { userId: plan.userId, id: plan.id },
      { $set: { ...plan } },
      { upsert: true }
    );
    return plan;
  }

  async getUserPlans(userId: string): Promise<UserOwnedPlanRecord[]> {
    const db = await this.getDb();
    const docs = await db
      .collection("user_plans")
      .find({ userId })
      .sort({ savedAt: -1 })
      .toArray();
    return docs as unknown as UserOwnedPlanRecord[];
  }

  async getUserPlanById(
    userId: string,
    planId: string
  ): Promise<UserOwnedPlanRecord | null> {
    const db = await this.getDb();
    const doc = await db.collection("user_plans").findOne({ userId, id: planId });
    return doc ? (doc as unknown as UserOwnedPlanRecord) : null;
  }

  async deleteUserPlan(userId: string, planId: string): Promise<boolean> {
    const db = await this.getDb();
    const res = await db.collection("user_plans").deleteOne({ userId, id: planId });
    return res.deletedCount > 0;
  }

  async bulkMergePlans(
    userId: string,
    plans: unknown[]
  ): Promise<{ importedCount: number; plans: UserOwnedPlanRecord[] }> {
    if (!Array.isArray(plans) || plans.length === 0) {
      return { importedCount: 0, plans: await this.getUserPlans(userId) };
    }

    const now = new Date().toISOString();
    let importedCount = 0;

    for (const item of plans) {
      if (!item || typeof item !== "object") continue;
      const p = item as Record<string, unknown>;
      if (!p.itinerary) continue;
      const planId = (typeof p.id === "string" ? p.id : null) || `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const record: UserOwnedPlanRecord = {
        id: planId,
        userId,
        name: typeof p.name === "string" ? p.name : `Pujo Plan`,
        savedAt: typeof p.savedAt === "string" ? p.savedAt : now,
        version: typeof p.version === "number" ? p.version : 1,
        itinerary: p.itinerary as UserOwnedPlanRecord["itinerary"],
        updatedAt: now,
      };

      await this.saveUserPlan(record);
      importedCount++;
    }

    const userPlans = await this.getUserPlans(userId);
    return { importedCount, plans: userPlans };
  }
}

// ─────────────────────────────────────────────
// Singleton Factory
// ─────────────────────────────────────────────
let instance: AuthDatabaseRepository | null = null;

export function getAuthRepository(): AuthDatabaseRepository {
  if (!instance) {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (mongoUri && !process.env.JEST_WORKER_ID) {
      instance = new MongoAuthRepository(mongoUri);
    } else {
      if (process.env.NODE_ENV === "production" && !process.env.JEST_WORKER_ID) {
        throw new Error(
          "[FATAL CONFIGURATION ERROR] MONGODB_URI is required in production environment. " +
          "Refusing to fall back to ephemeral in-memory storage to prevent silent data loss across serverless invocations."
        );
      }
      instance = new MemoryAuthRepository();
    }
  }
  return instance;
}

/**
 * Clean helper for resetting test state between unit/integration tests
 */
export async function resetRepositoryForTesting(): Promise<void> {
  const repo = getAuthRepository();
  if (repo.clearAllDataForTesting) {
    await repo.clearAllDataForTesting();
  }
}

export function _resetSingletonForTesting(): void {
  instance = null;
}
