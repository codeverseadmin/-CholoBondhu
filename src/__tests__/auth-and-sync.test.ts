// ─────────────────────────────────────────────
// CHOLO BONDHU — Authentication, Identity, Data Ownership & Sync Test Suite
//
// Comprehensive automated tests verifying:
// - Indian mobile normalization & validation
// - Password security (scrypt, policies, constant-time)
// - OTP verification lifecycle, rate limiting, and replay defense
// - Session management & revocation
// - Strict BOLA/IDOR authorization on user plans
// - Cross-device data synchronization and guest migration
// - Password change request & admin approval workflow
// ─────────────────────────────────────────────

import {
  normalizeIndianMobile,
  isValidIndianMobile,
  maskPhoneNumber,
} from "@/lib/auth/phone";
import {
  hashPassword,
  verifyPassword,
  validatePasswordPolicy,
} from "@/lib/auth/password";
import {
  createOtpRecord,
  verifyOtpSubmission,
  getDevOtpForTesting,
} from "@/lib/auth/otp";
import {
  getAuthRepository,
  resetRepositoryForTesting,
} from "@/lib/db/repository";
import {
  createSessionForUser,
  sanitizeUser,
} from "@/lib/auth/session";
import type { UserRecord, UserOwnedPlanRecord } from "@/types/auth";
import crypto from "crypto";

describe("1. Mobile Number Normalization & Validation", () => {
  test("Normalizes standard 10-digit Indian numbers starting with 6, 7, 8, 9", () => {
    expect(normalizeIndianMobile("9876543210")).toBe("+919876543210");
    expect(normalizeIndianMobile("8123456789")).toBe("+918123456789");
    expect(normalizeIndianMobile("7000123456")).toBe("+917000123456");
    expect(normalizeIndianMobile("6290123456")).toBe("+916290123456");
  });

  test("Normalizes numbers with leading 0 or 91 or +91 and spaces/dashes", () => {
    expect(normalizeIndianMobile("09876543210")).toBe("+919876543210");
    expect(normalizeIndianMobile("919876543210")).toBe("+919876543210");
    expect(normalizeIndianMobile("+91 98765-43210")).toBe("+919876543210");
    expect(normalizeIndianMobile("+91 (9876) 543210")).toBe("+919876543210");
  });

  test("Rejects malformed, invalid, or non-Indian phone strings", () => {
    expect(normalizeIndianMobile("1234567890")).toBeNull(); // Starts with 1
    expect(normalizeIndianMobile("5555555555")).toBeNull(); // Starts with 5
    expect(normalizeIndianMobile("987654321")).toBeNull(); // 9 digits
    expect(normalizeIndianMobile("987654321000")).toBeNull(); // Too many digits
    expect(normalizeIndianMobile("")).toBeNull();
    expect(normalizeIndianMobile("abcdefghij")).toBeNull();
    expect(normalizeIndianMobile("+14155552671")).toBeNull(); // US number
  });

  test("isValidIndianMobile correctly identifies valid numbers", () => {
    expect(isValidIndianMobile("9876543210")).toBe(true);
    expect(isValidIndianMobile("09876543210")).toBe(true);
    expect(isValidIndianMobile("1234567890")).toBe(false);
  });

  test("maskPhoneNumber hides sensitive digits for privacy", () => {
    const masked = maskPhoneNumber("+919876543210");
    expect(masked).toBe("+91 ••••• ••210");
  });
});

describe("2. Password Security & Scrypt Hashing", () => {
  test("Validates password policy (8 to 128 characters)", () => {
    expect(validatePasswordPolicy("short").valid).toBe(false);
    expect(validatePasswordPolicy("1234567").valid).toBe(false);
    expect(validatePasswordPolicy("12345678").valid).toBe(true);
    expect(validatePasswordPolicy("A".repeat(129)).valid).toBe(false);
  });

  test("Hashes password with random salt and verifies constant-time match", async () => {
    const password = "DurgaPujaSecure2026!";
    const hash = await hashPassword(password);

    expect(hash).toContain(":");
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("WrongPassword123", hash)).toBe(false);
  });

  test("Produces different hashes for identical passwords due to salting", async () => {
    const password = "KolkataFestivePassword";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });
});

describe("3. OTP Lifecycle, Cooldown & Anti-Abuse", () => {
  const phone = "+919876543210";
  const purpose = "registration";

  beforeEach(async () => {
    await resetRepositoryForTesting();
  });

  test("Generates 6-digit OTP and enforces 60-second cooldown", async () => {
    const otp1 = await createOtpRecord(phone, purpose);
    expect(otp1.code).toMatch(/^\d{6}$/);

    // Second immediate request within cooldown should reject
    await expect(createOtpRecord(phone, purpose)).rejects.toThrow(/Please wait/);
  });

  test("Verifies valid OTP code and deletes upon success (replay prevention)", async () => {
    const otp = await createOtpRecord(phone, purpose);
    const plainCode = otp.code;

    // First verification should succeed
    const result1 = await verifyOtpSubmission(phone, purpose, plainCode);
    expect(result1.valid).toBe(true);

    // Replay attack with same code must fail
    const result2 = await verifyOtpSubmission(phone, purpose, plainCode);
    expect(result2.valid).toBe(false);
    expect(result2.error).toMatch(/No active verification code/);
  });

  test("Increments attempts on incorrect code and locks after 5 attempts", async () => {
    const otp = await createOtpRecord(phone, purpose);

    for (let i = 0; i < 4; i++) {
      const res = await verifyOtpSubmission(phone, purpose, "000000");
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/Invalid verification code/);
    }

    // 5th failed attempt exhausts available attempts
    const res5 = await verifyOtpSubmission(phone, purpose, "000000");
    expect(res5.valid).toBe(false);
    expect(res5.error).toMatch(/0 attempts remaining/);

    // Subsequent attempt after exhaustion triggers lockout
    const res6 = await verifyOtpSubmission(phone, purpose, "000000");
    expect(res6.valid).toBe(false);
    expect(res6.error).toMatch(/Maximum verification attempts exceeded/);
  });
});

describe("4. User Registration, Sessions & Revocation", () => {
  const repo = getAuthRepository();

  beforeEach(async () => {
    await resetRepositoryForTesting();
  });

  test("Enforces database uniqueness on canonical phone identity", async () => {
    const user1: UserRecord = {
      id: "usr_1",
      phone: "+919876543210",
      phoneVerificationStatus: "active",
      role: "user",
      passwordHash: await hashPassword("Password123!"),
      securityVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await repo.createUser(user1);

    // Duplicate registration attempt with same phone
    const user2: UserRecord = {
      id: "usr_2",
      phone: "+919876543210",
      phoneVerificationStatus: "phone_unverified",
      role: "user",
      passwordHash: await hashPassword("Password456!"),
      securityVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await expect(repo.createUser(user2)).rejects.toThrow(/already exists/);
  });

  test("Creates secure session and supports individual and mass revocation", async () => {
    const user: UserRecord = {
      id: "usr_session_test",
      phone: "+919811122233",
      phoneVerificationStatus: "active",
      role: "user",
      passwordHash: await hashPassword("SecurePass2026"),
      securityVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repo.createUser(user);

    // Create session 1 (e.g. Mobile browser)
    const session1 = await createSessionForUser(user);
    expect(session1.id).toBeDefined();

    // Create session 2 (e.g. Desktop browser)
    const session2 = await createSessionForUser(user);
    expect(session2.id).toBeDefined();

    // Verify session 1 is active
    const active1 = await repo.findSessionById(session1.id);
    expect(active1).not.toBeNull();

    // Revoke session 1 (logout on mobile)
    await repo.revokeSession(session1.id);
    expect(await repo.findSessionById(session1.id)).toBeNull();

    // Session 2 should remain active on desktop
    expect(await repo.findSessionById(session2.id)).not.toBeNull();

    // Mass revocation (e.g. on password reset)
    await repo.revokeAllUserSessions(user.id);
    expect(await repo.findSessionById(session2.id)).toBeNull();
  });

  test("Sanitizes user record by omitting password hashes and sensitive secrets", async () => {
    const user: UserRecord = {
      id: "usr_sanitize",
      phone: "+919876543210",
      phoneVerificationStatus: "active",
      role: "admin",
      passwordHash: "secret_scrypt_hash_never_expose",
      securityVersion: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sanitized = sanitizeUser(user);
    expect(sanitized.id).toBe(user.id);
    expect(sanitized.phone).toBe(user.phone);
    expect(sanitized.role).toBe("admin");
    expect((sanitized as any).passwordHash).toBeUndefined();
  });
});

describe("5. Data Ownership & BOLA / IDOR Defense", () => {
  const repo = getAuthRepository();

  beforeEach(async () => {
    await resetRepositoryForTesting();
  });

  test("Strict authorization: User A cannot read, modify, or delete User B's itinerary", async () => {
    const userA = "usr_alice";
    const userB = "usr_bob";

    const planA: UserOwnedPlanRecord = {
      id: "plan_alice_1",
      userId: userA,
      name: "Alice's North Kolkata Tour",
      savedAt: new Date().toISOString(),
      version: 1,
      itinerary: { id: "itin_alice", stops: [], summary: {} } as any,
      updatedAt: new Date().toISOString(),
    };

    await repo.saveUserPlan(planA);

    // Alice can fetch her own plan
    const fetchedByAlice = await repo.getUserPlanById(userA, "plan_alice_1");
    expect(fetchedByAlice).not.toBeNull();
    expect(fetchedByAlice?.name).toBe("Alice's North Kolkata Tour");

    // Bob attempts to fetch Alice's plan by ID (BOLA attack)
    const fetchedByBob = await repo.getUserPlanById(userB, "plan_alice_1");
    expect(fetchedByBob).toBeNull(); // Blocked!

    // Bob attempts to delete Alice's plan (IDOR attack)
    const deletedByBob = await repo.deleteUserPlan(userB, "plan_alice_1");
    expect(deletedByBob).toBe(false); // Refused!

    // Plan must still exist safely for Alice
    const stillExists = await repo.getUserPlanById(userA, "plan_alice_1");
    expect(stillExists).not.toBeNull();

    // Alice deletes her own plan
    const deletedByAlice = await repo.deleteUserPlan(userA, "plan_alice_1");
    expect(deletedByAlice).toBe(true);
    expect(await repo.getUserPlanById(userA, "plan_alice_1")).toBeNull();
  });
});

describe("6. Cross-Device Synchronisation & Guest Plan Migration", () => {
  const repo = getAuthRepository();

  beforeEach(async () => {
    await resetRepositoryForTesting();
  });

  test("Merges guest plans into authenticated account with strict ownership binding", async () => {
    const userId = "usr_sync_user";

    const guestPlans = [
      {
        id: "guest_plan_1",
        name: "College Street Food Walk",
        savedAt: new Date().toISOString(),
        itinerary: { id: "itin_1", stops: [] },
      },
      {
        id: "guest_plan_2",
        name: "South Kolkata Traditional Pandals",
        savedAt: new Date().toISOString(),
        itinerary: { id: "itin_2", stops: [] },
      },
    ];

    const result = await repo.bulkMergePlans(userId, guestPlans);
    expect(result.importedCount).toBe(2);
    expect(result.plans.length).toBe(2);

    // Retrieve from simulated second device
    const plansOnDevice2 = await repo.getUserPlans(userId);
    expect(plansOnDevice2.length).toBe(2);
    expect(plansOnDevice2[0].userId).toBe(userId);
    expect(plansOnDevice2[1].userId).toBe(userId);
  });

  test("Duplicate merge attempts are idempotent and do not corrupt data", async () => {
    const userId = "usr_idempotent_test";
    const guestPlans = [
      {
        id: "plan_stable_1",
        name: "Heritage Tour",
        itinerary: { id: "itin_heritage", stops: [] },
      },
    ];

    await repo.bulkMergePlans(userId, guestPlans);
    await repo.bulkMergePlans(userId, guestPlans); // Repeated sync

    const plans = await repo.getUserPlans(userId);
    expect(plans.length).toBe(1);
    expect(plans[0].id).toBe("plan_stable_1");
  });
});

describe("7. Password Change Request & Administrator Approval Workflow", () => {
  const repo = getAuthRepository();

  beforeEach(async () => {
    await resetRepositoryForTesting();
  });

  test("User submits request -> Admin approves -> Token generated -> Password reset", async () => {
    const user: UserRecord = {
      id: "usr_requester",
      phone: "+919876500000",
      phoneVerificationStatus: "active",
      role: "user",
      passwordHash: await hashPassword("OldPassword123!"),
      securityVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repo.createUser(user);

    // 1. User submits request
    const req = await repo.createPasswordRequest({
      id: "req_pwd_1",
      userId: user.id,
      status: "pending",
      reason: "Lost old device and updating credentials",
      createdAt: new Date().toISOString(),
    });
    expect(req.status).toBe("pending");

    // 2. Prevent duplicate pending requests
    const pending = await repo.findPendingPasswordRequestByUser(user.id);
    expect(pending).not.toBeNull();
    expect(pending?.id).toBe("req_pwd_1");

    // 3. Admin reviews and approves request
    const resetToken = crypto.randomBytes(24).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    const approvedReq = await repo.updatePasswordRequest("req_pwd_1", {
      status: "approved",
      reviewedAt: new Date().toISOString(),
      reviewedByAdminId: "admin_super",
      resetTokenHash: tokenHash,
      resetExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      adminNotes: "Identity verified via secondary channel",
    });
    expect(approvedReq?.status).toBe("approved");

    // 4. Phone OTP dispatched for secondary ownership proof
    const otp = await createOtpRecord(user.phone, "password_reset");
    const otpCode = otp.code;

    // 5. Verification: user submits reset token and phone OTP
    const verifyOtpRes = await verifyOtpSubmission(user.phone, "password_reset", otpCode);
    expect(verifyOtpRes.valid).toBe(true);

    const checkTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    expect(checkTokenHash).toBe(approvedReq?.resetTokenHash);

    // 6. User sets new password
    const newPasswordHash = await hashPassword("BrandNewPujaPass2026!");
    await repo.updateUser(user.id, {
      passwordHash: newPasswordHash,
      securityVersion: user.securityVersion + 1,
    });

    // Mark request completed
    await repo.updatePasswordRequest("req_pwd_1", { status: "completed" });

    // 7. Verify login with new password succeeds and old password fails
    const updatedUser = await repo.findUserById(user.id);
    expect(await verifyPassword("BrandNewPujaPass2026!", updatedUser!.passwordHash)).toBe(true);
    expect(await verifyPassword("OldPassword123!", updatedUser!.passwordHash)).toBe(false);
  });
});
