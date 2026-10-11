// ─────────────────────────────────────────────
// CHOLO BONDHU — Signup & Phone Verification Integration Tests
//
// Thorough automated tests verifying the complete end-to-end flow:
// 1. Account creation & input validation
// 2. Duplicate registration prevention (active vs unverified)
// 3. OTP dispatch, cooldown, and resendOnly support
// 4. OTP verification, anti-replay, and account activation
// 5. Session token creation & secure cookie issuance
// 6. Login gating on unverified accounts
// ─────────────────────────────────────────────

import { POST as registerRoute } from "@/app/api/auth/register/route";
import { POST as verifyOtpRoute } from "@/app/api/auth/verify-otp/route";
import { POST as loginRoute } from "@/app/api/auth/login/route";
import { GET as meRoute } from "@/app/api/auth/me/route";
import {
  getAuthRepository,
  resetRepositoryForTesting,
} from "@/lib/db/repository";
import { getDevOtpForTesting } from "@/lib/auth/otp";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

function makeJsonRequest(url: string, body: any, headers: Record<string, string> = {}): Request {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("Account Creation & Signup Comprehensive Tests", () => {
  const repo = getAuthRepository();

  beforeEach(async () => {
    await resetRepositoryForTesting();
  });

  describe("1. Validation & Input Sanitization", () => {
    test("Rejects missing or invalid Indian mobile numbers", async () => {
      const invalidPhones = ["1234567890", "98765", "abcdefghij", "+14155552671", ""];
      for (const phone of invalidPhones) {
        const req = makeJsonRequest("http://localhost/api/auth/register", {
          phone,
          password: "SecurePassword123!",
          confirmPassword: "SecurePassword123!",
        });
        const res = await registerRoute(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
      }
    });

    test("Rejects mismatched passwords", async () => {
      const req = makeJsonRequest("http://localhost/api/auth/register", {
        phone: "9876543210",
        password: "SecurePassword123!",
        confirmPassword: "DifferentPassword123!",
      });
      const res = await registerRoute(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Passwords do not match.");
    });

    test("Enforces password policy (minimum 8 characters, non-whitespace)", async () => {
      const weakPasswords = ["short", "       ", "1234567"];
      for (const password of weakPasswords) {
        const req = makeJsonRequest("http://localhost/api/auth/register", {
          phone: "9876543210",
          password,
          confirmPassword: password,
        });
        const res = await registerRoute(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
      }
    });
  });

  describe("2. Full Registration Lifecycle", () => {
    const validPhone = "9830012345";
    const canonicalPhone = "+919830012345";
    const validPassword = "DurgaPujaPassword2026!";

    test("Registers a new user in unverified state and sends OTP", async () => {
      const req = makeJsonRequest("http://localhost/api/auth/register", {
        phone: validPhone,
        password: validPassword,
        confirmPassword: validPassword,
      });

      const res = await registerRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.phone).toBe(canonicalPhone);
      expect(data.user.phoneVerificationStatus).toBe("phone_unverified");
      expect(data.user.passwordHash).toBeUndefined(); // Secrets must not leak

      // Verify user exists in database with phone_unverified
      const dbUser = await repo.findUserByPhone(canonicalPhone);
      expect(dbUser).not.toBeNull();
      expect(dbUser?.phoneVerificationStatus).toBe("phone_unverified");
    });

    test("Prevents duplicate registration when account is active", async () => {
      // 1. Create and activate user
      const req1 = makeJsonRequest("http://localhost/api/auth/register", {
        phone: validPhone,
        password: validPassword,
        confirmPassword: validPassword,
      });
      await registerRoute(req1);

      const dbUser = await repo.findUserByPhone(canonicalPhone);
      await repo.updateUser(dbUser!.id, { phoneVerificationStatus: "active" });

      // 2. Try registering again with same phone
      const req2 = makeJsonRequest("http://localhost/api/auth/register", {
        phone: validPhone,
        password: "NewPassword999!",
        confirmPassword: "NewPassword999!",
      });
      const res2 = await registerRoute(req2);
      expect(res2.status).toBe(409);
      const data2 = await res2.json();
      expect(data2.success).toBe(false);
      expect(data2.error).toMatch(/already exists/i);
    });

    test("Allows re-registration if account was unverified, updating credentials", async () => {
      // 1. First registration
      const req1 = makeJsonRequest("http://localhost/api/auth/register", {
        phone: validPhone,
        password: "FirstPassword123!",
        confirmPassword: "FirstPassword123!",
      });
      await registerRoute(req1);

      // Reset repo OTP cooldown so second attempt doesn't trigger throttle
      await repo.deleteOtp(canonicalPhone, "registration");

      // 2. Second registration with updated password
      const req2 = makeJsonRequest("http://localhost/api/auth/register", {
        phone: validPhone,
        password: "UpdatedPassword456!",
        confirmPassword: "UpdatedPassword456!",
      });
      const res2 = await registerRoute(req2);
      expect(res2.status).toBe(200);
      const data2 = await res2.json();
      expect(data2.success).toBe(true);

      // Verify OTP was regenerated
      const otp = getDevOtpForTesting(canonicalPhone, "registration");
      expect(otp).toBeDefined();
    });
  });

  describe("3. Resend OTP Support (resendOnly)", () => {
    const validPhone = "9830099999";
    const canonicalPhone = "+919830099999";
    const validPassword = "DurgaPujaPassword2026!";

    test("Resends OTP without requiring password fields", async () => {
      // Register initial unverified account
      const regReq = makeJsonRequest("http://localhost/api/auth/register", {
        phone: validPhone,
        password: validPassword,
        confirmPassword: validPassword,
      });
      await registerRoute(regReq);

      // Reset OTP throttle for test
      await repo.deleteOtp(canonicalPhone, "registration");

      // Resend OTP using resendOnly flag (as done by verify-phone screen)
      const resendReq = makeJsonRequest("http://localhost/api/auth/register", {
        phone: validPhone,
        resendOnly: true,
      });
      const res = await registerRoute(resendReq);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toMatch(/verification code/i);
    });

    test("Rejects resendOnly if phone is not registered", async () => {
      const resendReq = makeJsonRequest("http://localhost/api/auth/register", {
        phone: "7000112233",
        resendOnly: true,
      });
      const res = await registerRoute(resendReq);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toMatch(/No pending account found/i);
    });

    test("Enforces 60-second rate limiting on rapid resend attempts", async () => {
      // 1. Register account (dispatches first OTP)
      const regReq = makeJsonRequest("http://localhost/api/auth/register", {
        phone: validPhone,
        password: validPassword,
        confirmPassword: validPassword,
      });
      await registerRoute(regReq);

      // 2. Immediate second resend without waiting 60s
      const resendReq = makeJsonRequest("http://localhost/api/auth/register", {
        phone: validPhone,
        resendOnly: true,
      });
      const res = await registerRoute(resendReq);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toMatch(/Please wait/i);
    });
  });

  describe("4. Phone Verification & Session Establishment", () => {
    const validPhone = "9876501234";
    const canonicalPhone = "+919876501234";
    const validPassword = "SecurePujaPass2026!";

    test("Activates user and sets session cookie upon valid OTP submission", async () => {
      // 1. Register user
      const regReq = makeJsonRequest("http://localhost/api/auth/register", {
        phone: validPhone,
        password: validPassword,
        confirmPassword: validPassword,
      });
      await registerRoute(regReq);

      const code = getDevOtpForTesting(canonicalPhone, "registration");
      expect(code).toBeDefined();

      // 2. Verify OTP
      const verifyReq = makeJsonRequest("http://localhost/api/auth/verify-otp", {
        phone: validPhone,
        code,
        purpose: "registration",
      });
      const verifyRes = await verifyOtpRoute(verifyReq);
      expect(verifyRes.status).toBe(200);
      const verifyData = await verifyRes.json();
      expect(verifyData.success).toBe(true);
      expect(verifyData.user.phoneVerificationStatus).toBe("active");

      // Verify session cookie was set
      const cookies = verifyRes.cookies.get(SESSION_COOKIE_NAME);
      expect(cookies).toBeDefined();
      expect(cookies?.value).toBeDefined();

      // Verify DB user is active
      const updatedUser = await repo.findUserByPhone(canonicalPhone);
      expect(updatedUser?.phoneVerificationStatus).toBe("active");
    });

    test("Defends against OTP replay attacks (code is single-use)", async () => {
      // Register
      const regReq = makeJsonRequest("http://localhost/api/auth/register", {
        phone: validPhone,
        password: validPassword,
        confirmPassword: validPassword,
      });
      await registerRoute(regReq);

      const code = getDevOtpForTesting(canonicalPhone, "registration");

      // First verification succeeds
      const verifyReq1 = makeJsonRequest("http://localhost/api/auth/verify-otp", {
        phone: validPhone,
        code,
        purpose: "registration",
      });
      const res1 = await verifyOtpRoute(verifyReq1);
      expect(res1.status).toBe(200);

      // Replay attack with same code fails
      const verifyReq2 = makeJsonRequest("http://localhost/api/auth/verify-otp", {
        phone: validPhone,
        code,
        purpose: "registration",
      });
      const res2 = await verifyOtpRoute(verifyReq2);
      expect(res2.status).toBe(400);
      const data2 = await res2.json();
      expect(data2.success).toBe(false);
    });

    test("Enforces maximum 5 attempts lockout on invalid code", async () => {
      // Register
      const regReq = makeJsonRequest("http://localhost/api/auth/register", {
        phone: validPhone,
        password: validPassword,
        confirmPassword: validPassword,
      });
      await registerRoute(regReq);

      // Submit wrong code 5 times
      for (let i = 0; i < 5; i++) {
        const req = makeJsonRequest("http://localhost/api/auth/verify-otp", {
          phone: validPhone,
          code: "000000",
          purpose: "registration",
        });
        const res = await verifyOtpRoute(req);
        expect(res.status).toBe(400);
      }

      // 6th attempt is locked out
      const req6 = makeJsonRequest("http://localhost/api/auth/verify-otp", {
        phone: validPhone,
        code: "000000",
        purpose: "registration",
      });
      const res6 = await verifyOtpRoute(req6);
      expect(res6.status).toBe(400);
      const data6 = await res6.json();
      expect(data6.error).toMatch(/Maximum verification attempts exceeded|No active verification code/);
    });
  });

  describe("5. Login Gating on Account Status", () => {
    const validPhone = "9820055555";
    const canonicalPhone = "+919820055555";
    const validPassword = "FestivePassword2026!";

    test("Rejects login for unverified accounts with 403 and unverified: true", async () => {
      // Register account (left unverified)
      const regReq = makeJsonRequest("http://localhost/api/auth/register", {
        phone: validPhone,
        password: validPassword,
        confirmPassword: validPassword,
      });
      await registerRoute(regReq);

      // Attempt login with correct password
      const loginReq = makeJsonRequest("http://localhost/api/auth/login", {
        phone: validPhone,
        password: validPassword,
      });
      const loginRes = await loginRoute(loginReq);
      expect(loginRes.status).toBe(403);
      const data = await loginRes.json();
      expect(data.success).toBe(false);
      expect(data.unverified).toBe(true);
      expect(data.error).toMatch(/not been verified/i);
    });

    test("Allows login once phone is verified", async () => {
      // 1. Register
      const regReq = makeJsonRequest("http://localhost/api/auth/register", {
        phone: validPhone,
        password: validPassword,
        confirmPassword: validPassword,
      });
      await registerRoute(regReq);

      // 2. Verify
      const code = getDevOtpForTesting(canonicalPhone, "registration");
      const verifyReq = makeJsonRequest("http://localhost/api/auth/verify-otp", {
        phone: validPhone,
        code,
        purpose: "registration",
      });
      await verifyOtpRoute(verifyReq);

      // 3. Login
      const loginReq = makeJsonRequest("http://localhost/api/auth/login", {
        phone: validPhone,
        password: validPassword,
      });
      const loginRes = await loginRoute(loginReq);
      expect(loginRes.status).toBe(200);
      const data = await loginRes.json();
      expect(data.success).toBe(true);
      expect(data.user.phoneVerificationStatus).toBe("active");
    });
  });
});
