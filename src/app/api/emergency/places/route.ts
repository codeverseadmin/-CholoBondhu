// ─────────────────────────────────────────────
// CHOLO BONDHU — Emergency Facilities API Handler
//
// Supports Google Places Platform emergency discovery
// with field masks, quota protection, and seamless
// verified curated dataset fallback.
// ─────────────────────────────────────────────

import { NextResponse } from "next/server";
import { getEmergencyFacilities } from "@/lib/emergency-provider";
import type { EmergencyCategory, EmergencyFacility } from "@/types/emergency";

async function resolveEmergencyFacilities(
  lat: number | undefined,
  lng: number | undefined,
  category: EmergencyCategory
) {
  const coordinates =
    lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)
      ? { latitude: lat, longitude: lng }
      : undefined;

  const apiKey =
    process.env.GOOGLE_MAPS_SERVER_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (apiKey && coordinates) {
    try {
      const placeType =
        category === "medical"
          ? "hospital"
          : category === "police" || category === "lost_person"
          ? "police"
          : category === "fire"
          ? "fire_station"
          : "hospital";

      const googleResponse = await fetch(
        "https://places.googleapis.com/v1/places:searchNearby",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.types",
          },
          body: JSON.stringify({
            includedTypes: [placeType],
            maxResultCount: 8,
            locationRestriction: {
              circle: {
                center: {
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                },
                radius: 7000.0,
              },
            },
          }),
          signal: AbortSignal.timeout(4000),
        }
      );

      if (googleResponse.ok) {
        const json = await googleResponse.json();
        if (Array.isArray(json.places) && json.places.length > 0) {
          const mappedGooglePlaces: EmergencyFacility[] = json.places.map(
            (p: any) => ({
              id: `google-${p.id}`,
              name: p.displayName?.text || "Emergency Facility",
              type: (placeType === "police"
                ? "police_station"
                : placeType === "fire_station"
                ? "fire_station"
                : "hospital") as any,
              category,
              address: p.formattedAddress || "Kolkata, West Bengal",
              locality: "Nearby Location",
              zone: "central" as const,
              coordinates: {
                latitude: p.location?.latitude || coordinates.latitude,
                longitude: p.location?.longitude || coordinates.longitude,
              },
              phone: p.nationalPhoneNumber || undefined,
              has24HourEmergency: category === "medical",
              verifiedStatus: "google_places",
              source: "Google Places Platform (New)",
            })
          );

          const curated = getEmergencyFacilities({ coordinates, category, limit: 5 });
          return {
            success: true,
            source: "google_places",
            facilities: [...mappedGooglePlaces, ...curated],
          };
        }
      }
    } catch (externalErr) {
      console.warn("Google Places query fell through to curated registry:", externalErr);
    }
  }

  const facilities = getEmergencyFacilities({ coordinates, category, limit: 12 });
  return {
    success: true,
    source: "curated_registry",
    facilities,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { lat, lng, category = "medical" } = body;
    const result = await resolveEmergencyFacilities(lat, lng, category);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Emergency API POST error:", err);
    return NextResponse.json(
      { success: false, facilities: getEmergencyFacilities({ limit: 10 }) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const category = (searchParams.get("category") || "medical") as EmergencyCategory;

    const lat = latStr ? parseFloat(latStr) : undefined;
    const lng = lngStr ? parseFloat(lngStr) : undefined;

    const result = await resolveEmergencyFacilities(lat, lng, category);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, facilities: getEmergencyFacilities({ limit: 10 }) },
      { status: 500 }
    );
  }
}
