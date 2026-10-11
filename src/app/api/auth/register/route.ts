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
    const { phone, password, confirmPassword, resendOnly } = body;

    // 1. Validate phone number
    const phoneNorm = normalizeIndianPhoneNumber(phone);
    if (!phoneNorm.success || !phoneNorm.canonical) {
      return NextResponse.json(
        { success: false, error: phoneNorm.error || "Invalid mobile number." },
        { status: 400 }
      );
    }

    const repo = getAuthRepository();

    // 2. Handle OTP resend request (from verification screen)
    if (resendOnly) {
      const existing = await repo.findUserByPhone(phoneNorm.canonical);
      if (!existing) {
        return NextResponse.json(
          {
            success: false,
            error: "No pending account found for this mobile number. Please register first.",
          },
          { status: 404 }
        );
      }
      if (existing.phoneVerificationStatus === "active") {
        return NextResponse.json(
          {
            success: false,
            error: "This mobile number is already verified. Please sign in.",
          },
          { status: 409 }
        );
      }

      const otpRes = await sendOtp(phoneNorm.canonical, "registration");
      if (!otpRes.success) {
        return NextResponse.json(
          { success: false, error: otpRes.error || "Failed to resend verification code." },
          { status: 429 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "A new verification code has been sent to your mobile number.",
      });
    }

    // 3. Validate passwords
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

    // 4. Check duplicate registration
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
      // If previous registration was unverified, update password and resend verification OTP
      const passwordHash = await hashPassword(password);
      await repo.updateUser(existing.id, {
        passwordHash,
        updatedAt: new Date().toISOString(),
      });

      const otpRes = await sendOtp(phoneNorm.canonical, "registration");
      if (!otpRes.success) {
        return NextResponse.json(
          { success: false, error: otpRes.error || "Failed to send verification code." },
          { status: 429 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Verification code sent to your mobile number.",
        user: sanitizeUser(existing),
      });
    }

    // 5. Hash password and create new user
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

    // 6. Send real verification OTP
    const otpRes = await sendOtp(phoneNorm.canonical, "registration");
    if (!otpRes.success) {
      return NextResponse.json(
        { success: false, error: otpRes.error || "Failed to send verification code." },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account created. Please verify your phone number.",
      user: sanitizeUser(newUser),
    });
  } catch (err: any) {
    console.error("Registration error:", err);
    if (
      err?.code === 11000 ||
      (typeof err?.message === "string" &&
        (err.message.includes("E11000") || err.message.includes("duplicate key")))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this mobile number already exists. Please sign in.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Registration failed." },
      { status: 500 }
    );
  }
}
