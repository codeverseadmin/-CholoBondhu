import { NextResponse } from "next/server";
import { normalizeIndianPhoneNumber } from "@/lib/auth/phone";
import { verifyPassword } from "@/lib/auth/password";
import { getAuthRepository } from "@/lib/db/repository";
import {
  createSessionForUser,
  sanitizeUser,
  getSessionCookieOptions,
} from "@/lib/auth/session";
import { sendOtp } from "@/lib/auth/otp";

// Simple IP/account rate limiter for brute-force mitigation
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, password } = body;

    const phoneNorm = normalizeIndianPhoneNumber(phone);
    if (!phoneNorm.success || !phoneNorm.canonical) {
      return NextResponse.json(
        { success: false, error: "Invalid mobile number or password." },
        { status: 401 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid mobile number or password." },
        { status: 401 }
      );
    }

    const rateKey = phoneNorm.canonical;
    const now = Date.now();
    const attemptRecord = loginAttempts.get(rateKey);

    if (attemptRecord && attemptRecord.lockedUntil > now) {
      const waitMinutes = Math.ceil((attemptRecord.lockedUntil - now) / 60000);
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed attempts. Please try again in ${waitMinutes} minutes.`,
        },
        { status: 429 }
      );
    }

    const repo = getAuthRepository();
    const user = await repo.findUserByPhone(phoneNorm.canonical);

    // Generic error response to prevent account enumeration
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid mobile number or password." },
        { status: 401 }
      );
    }

    // Verify password with constant-time equality
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      const count = (attemptRecord?.count || 0) + 1;
      if (count >= MAX_FAILED_ATTEMPTS) {
        loginAttempts.set(rateKey, { count, lockedUntil: now + LOCKOUT_MS });
      } else {
        loginAttempts.set(rateKey, { count, lockedUntil: 0 });
      }

      return NextResponse.json(
        { success: false, error: "Invalid mobile number or password." },
        { status: 401 }
      );
    }

    // Reset rate limiter on successful password entry
    loginAttempts.delete(rateKey);

    // Check account status
    if (user.phoneVerificationStatus === "phone_unverified") {
      await sendOtp(user.phone, "registration");
      return NextResponse.json(
        {
          success: false,
          unverified: true,
          error: "Your mobile number has not been verified yet. A verification code has been sent.",
        },
        { status: 403 }
      );
    }

    if (user.phoneVerificationStatus === "suspended") {
      return NextResponse.json(
        {
          success: false,
          error: "This account has been suspended. Please contact customer support.",
        },
        { status: 403 }
      );
    }

    // Create secure server session
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    const { token } = await createSessionForUser(user.id, ip, userAgent);
    const cookieOpts = getSessionCookieOptions();

    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully.",
      user: sanitizeUser(user),
    });

    response.cookies.set({
      ...cookieOpts,
      value: token,
    });

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
