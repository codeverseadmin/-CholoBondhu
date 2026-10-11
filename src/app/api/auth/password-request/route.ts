import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getAuthRepository } from "@/lib/db/repository";
import type { PasswordRequestRecord } from "@/types/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const repo = getAuthRepository();
    const all = await repo.listPasswordRequests();
    const userReq = all
      .filter((r) => r.userId === session.user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    return NextResponse.json({
      success: true,
      request: userReq || null,
    });
  } catch (err: any) {
    console.error("Fetch password request error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve password request status." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const repo = getAuthRepository();
    const userId = session.user.id;
    const body = await request.json().catch(() => ({}));

    // Check for existing pending request to avoid duplicates
    const existingPending = await repo.findPendingPasswordRequestByUser(userId);
    if (existingPending) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a pending password change request awaiting administrator review.",
        },
        { status: 409 }
      );
    }

    const requestId = `pwr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newRequest: PasswordRequestRecord = {
      id: requestId,
      userId,
      phone: session.user.phone,
      status: "pending",
      requestedAt: now,
      createdAt: now,
      reason: typeof body.reason === "string" ? body.reason : undefined,
    };

    await repo.createPasswordRequest(newRequest);

    return NextResponse.json({
      success: true,
      message:
        "Your password change request has been submitted for administrator approval.",
      requestId,
    });
  } catch (err: any) {
    console.error("Password request error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Request submission failed." },
      { status: 500 }
    );
  }
}
