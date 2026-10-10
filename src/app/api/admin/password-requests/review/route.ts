import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getAuthRepository } from "@/lib/db/repository";
import { generateSecureToken, hashToken } from "@/lib/auth/password";
import { sendOtp } from "@/lib/auth/otp";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(request);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Administrator privilege required." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { requestId, action, adminNotes } = body;

    if (!requestId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Valid requestId and action ('approve' or 'reject') required." },
        { status: 400 }
      );
    }

    const repo = getAuthRepository();
    const reqRecord = await repo.findPasswordRequestById(requestId);

    if (!reqRecord) {
      return NextResponse.json(
        { success: false, error: "Password request not found." },
        { status: 404 }
      );
    }

    if (reqRecord.status !== "pending") {
      return NextResponse.json(
        { success: false, error: `Request already has status '${reqRecord.status}'.` },
        { status: 400 }
      );
    }

    const now = new Date();

    if (action === "reject") {
      await repo.updatePasswordRequest(requestId, {
        status: "rejected",
        reviewedAt: now.toISOString(),
        reviewedBy: session.user.id,
        adminNotes: adminNotes || "Request rejected by administrator.",
      });

      return NextResponse.json({
        success: true,
        message: "Password change request has been rejected.",
      });
    }

    // Approve workflow:
    // Generate secure time-limited reset authorization token
    const rawResetToken = generateSecureToken(32);
    const resetTokenHash = hashToken(rawResetToken);
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    await repo.updatePasswordRequest(requestId, {
      status: "approved",
      reviewedAt: now.toISOString(),
      reviewedBy: session.user.id,
      adminNotes: adminNotes || "Approved by administrator.",
      resetTokenHash,
      resetTokenExpiresAt: expiresAt,
    });

    // Send verification OTP to the user's phone for secondary ownership check
    if (reqRecord.phone) {
      await sendOtp(reqRecord.phone, "password_reset");
    }

    return NextResponse.json({
      success: true,
      message: "Request approved. Reset authorization and phone OTP dispatched.",
      resetToken: rawResetToken, // Returned to enable reset completion
    });
  } catch (err: any) {
    console.error("Admin review error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to review request." },
      { status: 500 }
    );
  }
}
