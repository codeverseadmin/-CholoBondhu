import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(request);

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: session.user,
    });
  } catch (err) {
    console.error("Session check error:", err);
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }
}
