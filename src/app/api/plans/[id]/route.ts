import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getAuthRepository } from "@/lib/db/repository";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { id: planId } = await params;
    if (!planId) {
      return NextResponse.json(
        { success: false, error: "Plan ID is required." },
        { status: 400 }
      );
    }

    const repo = getAuthRepository();

    // Verify ownership: only the owner can delete the plan
    const deleted = await repo.deleteUserPlan(session.user.id, planId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Plan not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully.",
    });
  } catch (err: any) {
    console.error("Delete plan error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete plan." },
      { status: 500 }
    );
  }
}
