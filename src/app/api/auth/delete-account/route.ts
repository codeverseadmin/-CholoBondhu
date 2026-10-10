import { NextResponse } from "next/server";
import { getServerSession, clearSessionCookie } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { getAuthRepository } from "@/lib/db/repository";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { password, confirmation } = body;

    if (!password || confirmation !== "DELETE_MY_ACCOUNT") {
      return NextResponse.json(
        {
          success: false,
          error: "Confirmation required. Please provide your password and confirm account deletion.",
        },
        { status: 400 }
      );
    }

    const repo = getAuthRepository();
    const user = await repo.findUserById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid password. Account deletion aborted." },
        { status: 403 }
      );
    }

    // Cascade delete user data (sessions, user-owned plans)
    await repo.deleteUser(user.id);

    const response = NextResponse.json({
      success: true,
      message: "Your account and all associated personal data have been permanently deleted.",
    });

    clearSessionCookie(response);
    return response;
  } catch (err: any) {
    console.error("Account deletion error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete account." },
      { status: 500 }
    );
  }
}
