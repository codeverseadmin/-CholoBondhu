import { NextResponse } from "next/server";
import { normalizeIndianPhoneNumber } from "@/lib/auth/phone";
import { validatePasswordPolicy, hashPassword } from "@/lib/auth/password";
import { getAuthRepository } from "@/lib/db/repository";
import { sendOtp } from "@/lib/auth/otp";
import { sanitizeUser } from "@/lib/auth/session";
import type { UserRecord } from "@/types/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, password, confirmPassword } = body;

    // 1. Validate phone number
    const phoneNorm = normalizeIndianPhoneNumber(phone);
    if (!phoneNorm.success || !phoneNorm.canonical) {
      return NextResponse.json(
        { success: false, error: phoneNorm.error || "Invalid mobile number." },
        { status: 400 }
      );
    }

    // 2. Validate passwords
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match." },
        { status: 400 }
      );
    }

    const policy = validatePasswordPolicy(password);
    if (!policy.valid) {
      return NextResponse.json(
        { success: false, error: policy.error },
        { status: 400 }
      );
    }

    const repo = getAuthRepository();

    // 3. Check duplicate registration
    const existing = await repo.findUserByPhone(phoneNorm.canonical);
    if (existing) {
      if (existing.phoneVerificationStatus === "active") {
        return NextResponse.json(
          {
            success: false,
            error: "An account with this mobile number already exists. Please sign in.",
          },
          { status: 409 }
        );
      }
      // If previous registration was unverified, allow resending verification OTP
      await sendOtp(phoneNorm.canonical, "registration");
      return NextResponse.json({
        success: true,
        message: "Verification code sent to your mobile number.",
        user: sanitizeUser(existing),
      });
    }

    // 4. Hash password
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newUser: UserRecord = {
      id: userId,
      phone: phoneNorm.canonical,
      passwordHash,
      phoneVerificationStatus: "phone_unverified",
      role: "user",
      createdAt: now,
      updatedAt: now,
      securityVersion: 1,
    };

    await repo.createUser(newUser);

    // 5. Send real verification OTP
    await sendOtp(phoneNorm.canonical, "registration");

    return NextResponse.json({
      success: true,
      message: "Account created. Please verify your phone number.",
      user: sanitizeUser(newUser),
    });
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Registration failed." },
      { status: 500 }
    );
  }
}
