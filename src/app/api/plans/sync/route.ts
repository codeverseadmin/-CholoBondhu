import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getAuthRepository } from "@/lib/db/repository";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required to synchronize plans." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { guestPlans } = body;

    const repo = getAuthRepository();

    if (Array.isArray(guestPlans) && guestPlans.length > 0) {
      const mergeResult = await repo.bulkMergePlans(session.user.id, guestPlans);
      return NextResponse.json({
        success: true,
        importedCount: mergeResult.importedCount,
        plans: mergeResult.plans,
      });
    }

    // If no guest plans, simply return the user's authoritative plans
    const plans = await repo.getUserPlans(session.user.id);
    return NextResponse.json({
      success: true,
      importedCount: 0,
      plans,
    });
  } catch (err: any) {
    console.error("Sync plans error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to synchronize plans." },
      { status: 500 }
    );
  }
}
