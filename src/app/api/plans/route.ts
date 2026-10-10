import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getAuthRepository } from "@/lib/db/repository";
import type { UserOwnedPlanRecord } from "@/types/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required to fetch saved plans." },
        { status: 401 }
      );
    }

    const repo = getAuthRepository();
    const plans = await repo.getUserPlans(session.user.id);

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (err: any) {
    console.error("Fetch plans error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user plans." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required to save plans." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { id, name, itinerary, version = 1 } = body;

    if (!itinerary || typeof itinerary !== "object") {
      return NextResponse.json(
        { success: false, error: "Valid itinerary object is required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const planId = id || `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Strict ownership enforcement: derives owner strictly from session
    const record: UserOwnedPlanRecord = {
      id: planId,
      userId: session.user.id,
      name: name?.trim() || `Pujo Plan — ${new Date().toLocaleDateString("en-IN")}`,
      savedAt: now,
      version,
      itinerary,
      updatedAt: now,
    };

    const repo = getAuthRepository();
    const saved = await repo.saveUserPlan(record);

    return NextResponse.json({
      success: true,
      plan: saved,
    });
  } catch (err: any) {
    console.error("Save plan error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save user plan." },
      { status: 500 }
    );
  }
}
