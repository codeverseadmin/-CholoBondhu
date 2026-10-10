import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getAuthRepository } from "@/lib/db/repository";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(request);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Administrator privilege required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    const repo = getAuthRepository();
    const requests = await repo.listPasswordRequests(status);

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (err: any) {
    console.error("Admin list password requests error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve password requests." },
      { status: 500 }
    );
  }
}
