import { NextResponse } from "next/server";
import { normalizeIndianPhoneNumber } from "@/lib/auth/phone";
import {
  validatePasswordPolicy,
  hashPassword,
  hashToken,
} from "@/lib/auth/password";
import { verifyOtp } from "@/lib/auth/otp";
import { getAuthRepository } from "@/lib/db/repository";
import { timingSafeEqual } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, resetToken, otpCode, newPassword, confirmPassword } = body;

    const phoneNorm = normalizeIndianPhoneNumber(phone);
    if (!phoneNorm.success || !phoneNorm.canonical) {
      return NextResponse.json(
        { success: false, error: phoneNorm.error || "Invalid mobile number." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match." },
        { status: 400 }
      );
    }

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      return NextResponse.json(
        { success: false, error: policy.error },
        { status: 400 }
      );
    }

    if (!resetToken || typeof resetToken !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid reset authorization token required." },
        { status: 400 }
      );
    }

    // 1. Verify secondary phone ownership via real OTP
    const otpResult = await verifyOtp(
      phoneNorm.canonical,
      otpCode,
      "password_reset"
    );
    if (!otpResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: otpResult.error || "Phone verification failed.",
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

    // 2. Locate approved password request
    const allRequests = await repo.listPasswordRequests("approved");
    const activeReq = allRequests.find(
      (r) =>
        r.userId === user.id &&
        r.resetTokenHash &&
        new Date(r.resetTokenExpiresAt || 0) > new Date()
    );

    if (!activeReq || !activeReq.resetTokenHash) {
      return NextResponse.json(
        {
          success: false,
          error: "No active approved password reset authorization found for this user.",
        },
        { status: 403 }
      );
    }

    // 3. Constant-time comparison of reset token
    const incomingTokenHash = hashToken(resetToken.trim());
    const incomingBuf = Buffer.from(incomingTokenHash, "hex");
    const storedBuf = Buffer.from(activeReq.resetTokenHash, "hex");

    const tokenValid =
      incomingBuf.length === storedBuf.length &&
      timingSafeEqual(incomingBuf, storedBuf);

    if (!tokenValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset authorization token." },
        { status: 403 }
      );
    }

    // 4. Update password and invalidate previous sessions
    const newPasswordHash = await hashPassword(newPassword);
    const updatedVersion = (user.securityVersion || 1) + 1;

    await repo.updateUser(user.id, {
      passwordHash: newPasswordHash,
      securityVersion: updatedVersion,
    });

    // Revoke all existing sessions across all devices
    await repo.revokeAllUserSessions(user.id);

    // Mark password request completed
    await repo.updatePasswordRequest(activeReq.id, {
      status: "completed",
      completedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message:
        "Password has been changed successfully. All previous sessions have been revoked. Please sign in with your new password.",
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to reset password." },
      { status: 500 }
    );
  }
}
