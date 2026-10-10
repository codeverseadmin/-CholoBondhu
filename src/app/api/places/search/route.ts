// ─────────────────────────────────────────────
// CHOLO BONDHU — Place Discovery API Route Handler
//
// Secure server-side endpoint for candidate place discovery.
// Never exposes GOOGLE_MAPS_SERVER_API_KEY to the client.
// Implements sliding-window rate limiting, input validation,
// and automatic fallback to curated festival datasets.
// ─────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getPlacesProvider } from "@/lib/places-provider";
import { resolveLocalityCoordinates } from "@/data/localities";

// In-memory IP rate limiter (30 requests per minute per IP)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  record.count++;
  return false;
}

export async function POST(req: Request) {
  try {
    // 1. IP extraction & rate-limit check
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait a moment before searching again.",
          provider: "rate_limiter",
        },
        { status: 429 }
      );
    }

    // 2. Validate request payload
    const body = await req.json().catch(() => ({}));
    const locality = typeof body.locality === "string" ? body.locality.trim() : "Central Kolkata";
    const experienceTag = typeof body.experienceTag === "string" ? body.experienceTag.trim() : undefined;
    const radiusMeters = typeof body.radiusMeters === "number" ? Math.min(20000, Math.max(1000, body.radiusMeters)) : 5000;

    // 3. Resolve anchor coordinates
    const coordinates = resolveLocalityCoordinates(
      locality,
      body.latitude,
      body.longitude
    );

    // 4. Discover candidate places using provider abstraction
    const provider = getPlacesProvider();
    const places = await provider.searchPlaces({
      locality,
      coordinates,
      radiusMeters,
      experienceTag,
    });

    return NextResponse.json({
      success: true,
      provider: provider.name,
      isExternal: provider.isExternal,
      locality,
      coordinates,
      count: places.length,
      places,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to process place search",
        message: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
