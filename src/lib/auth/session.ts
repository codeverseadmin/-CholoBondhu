// ─────────────────────────────────────────────
// CHOLO BONDHU — Session & Cookie Security Architecture
//
// HttpOnly, Secure, SameSite=Lax cookie-backed sessions with
// server-side database validation and strict data-ownership boundaries.
// ─────────────────────────────────────────────

import { cookies } from "next/headers";
import { generateSecureToken } from "@/lib/auth/password";
import { getAuthRepository } from "@/lib/db/repository";
import type { SessionRecord, UserRecord, SanitizedUser } from "@/types/auth";
import { normalizeIndianPhoneNumber } from "@/lib/auth/phone";

export const SESSION_COOKIE_NAME = "cholobondhu_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function sanitizeUser(user: UserRecord): SanitizedUser {
  const norm = normalizeIndianPhoneNumber(user.phone);
  return {
    id: user.id,
    phone: user.phone,
    displayPhone: norm.display || user.phone,
    phoneVerificationStatus: user.phoneVerificationStatus,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/**
 * Creates a database session and returns the secure token
 */
export async function createSessionForUser(
  userOrUserId: UserRecord | string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ token: string; session: SessionRecord; id: string }> {
  const userId = typeof userOrUserId === "string" ? userOrUserId : userOrUserId.id;
  const repo = getAuthRepository();
  const token = generateSecureToken(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);

  const session: SessionRecord = {
    id: token,
    userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    revoked: false,
    ipAddress,
    userAgent,
  };

  await repo.createSession(session);
  return { token, session, id: token };
}

/**
 * Validates a session token and returns the authenticated user if valid
 */
export async function validateSessionToken(
  token: string
): Promise<UserRecord | null> {
  if (!token || typeof token !== "string") return null;

  const repo = getAuthRepository();
  const session = await repo.findSessionById(token);
  if (!session) return null;

  const user = await repo.findUserById(session.userId);
  if (!user) return null;

  // Suspended accounts are immediately locked out
  if (user.phoneVerificationStatus === "suspended") {
    return null;
  }

  return user;
}

/**
 * Server-side session extractor for Next.js App Router route handlers
 */
export async function getServerSession(
  request?: Request
): Promise<{ user: SanitizedUser; rawUser: UserRecord } | null> {
  let token: string | undefined;

  // 1. Try reading from Request headers/cookies if provided
  if (request) {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
      if (match) {
        token = match.split("=")[1];
      }
    }
  }

  // 2. Try reading from next/headers cookies()
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // Outside request context
    }
  }

  if (!token) return null;

  const rawUser = await validateSessionToken(token);
  if (!rawUser) return null;

  return {
    user: sanitizeUser(rawUser),
    rawUser,
  };
}

/**
 * Cookie options helper for consistent security headers
 */
export function getSessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

import { NextResponse } from "next/server";

export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE_NAME);
}

