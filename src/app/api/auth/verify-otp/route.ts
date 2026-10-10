import { NextResponse } from "next/server";
import { normalizeIndianPhoneNumber } from "@/lib/auth/phone";
import { verifyOtp } from "@/lib/auth/otp";
import { getAuthRepository } from "@/lib/db/repository";
import {
  createSessionForUser,
  sanitizeUser,
  getSessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, code, purpose = "registration" } = body;

    const phoneNorm = normalizeIndianPhoneNumber(phone);
    if (!phoneNorm.success || !phoneNorm.canonical) {
      return NextResponse.json(
        { success: false, error: phoneNorm.error || "Invalid mobile number." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Verification code is required." },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpResult = await verifyOtp(phoneNorm.canonical, code, purpose);
    if (!otpResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: otpResult.error || "Invalid verification code.",
          attemptsLeft: otpResult.attemptsLeft,
        },
        { status: 400 }
      );
    }

    const repo = getAuthRepository();
    const user = await repo.findUserByPhone(phoneNorm.canonical);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User record not found." },
        { status: 404 }
      );
    }

    if (purpose === "registration") {
      // Activate user
      const updatedUser = await repo.updateUser(user.id, {
        phoneVerificationStatus: "active",
      });

      if (!updatedUser) {
        return NextResponse.json(
          { success: false, error: "Failed to activate account." },
          { status: 500 }
        );
      }

      // Establish authenticated server session
      const { token } = await createSessionForUser(user.id);
      const cookieOpts = getSessionCookieOptions();

      const response = NextResponse.json({
        success: true,
        message: "Phone verified successfully. You are now logged in.",
        user: sanitizeUser(updatedUser),
      });

      response.cookies.set({
        ...cookieOpts,
        value: token,
      });

      return response;
    }

    return NextResponse.json({
      success: true,
      message: "Phone verification successful.",
    });
  } catch (err: any) {
    console.error("OTP verification error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Verification failed." },
      { status: 500 }
    );
  }
}
