// ─────────────────────────────────────────────
// CHOLO BONDHU — Emergency Provider Logic
// ─────────────────────────────────────────────

import type { Coordinates } from "@/types";
import type {
  EmergencyCategory,
  EmergencyFacility,
  OfficialEmergencyNumber,
} from "@/types/emergency";
import {
  OFFICIAL_EMERGENCY_NUMBERS,
  VERIFIED_KOLKATA_EMERGENCY_FACILITIES,
} from "@/data/emergency";
import { haversineDistanceKm } from "@/lib/routing-provider";

export interface EmergencyQueryOptions {
  category?: EmergencyCategory;
  coordinates?: Coordinates;
  limit?: number;
}

/**
 * Cleanly format phone numbers for tel: links
 */
export function formatTelHref(dialNumber: string): string {
  // Strip all non-numeric and non-plus characters
  const sanitized = dialNumber.replace(/[^0-9+]/g, "");
  return `tel:${sanitized}`;
}

/**
 * Build external Google Maps Directions link
 */
export function getDirectionsUrl(facility: EmergencyFacility): string {
  const { latitude, longitude } = facility.coordinates;
  const encodedName = encodeURIComponent(facility.name);
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_name=${encodedName}`;
}

/**
 * Filter and sort official emergency numbers by category
 */
export function getOfficialEmergencyNumbers(
  category?: EmergencyCategory
): OfficialEmergencyNumber[] {
  // 112 is national primary and always relevant across medical, police, fire, lost_person
  if (!category || category === "other") {
    return OFFICIAL_EMERGENCY_NUMBERS;
  }

  return OFFICIAL_EMERGENCY_NUMBERS.filter(
    (item) => item.isNationalPrimary || item.category === category
  );
}

/**
 * Retrieve verified emergency facilities, sorting by proximity if coordinates are known
 */
export function getEmergencyFacilities(
  options: EmergencyQueryOptions = {}
): EmergencyFacility[] {
  const { category, coordinates, limit = 15 } = options;

  let pool = [...VERIFIED_KOLKATA_EMERGENCY_FACILITIES];

  // Category filter
  if (category && category !== "other" && category !== "lost_person") {
    pool = pool.filter((fac) => fac.category === category);
  } else if (category === "lost_person") {
    // For lost person, police stations are the primary assistance facilities
    pool = pool.filter((fac) => fac.category === "police");
  }

  // Calculate distance if coordinates are present
  if (coordinates && coordinates.latitude && coordinates.longitude) {
    pool = pool.map((fac) => {
      const dist = haversineDistanceKm(coordinates, fac.coordinates);
      return {
        ...fac,
        distanceKm: Math.round(dist * 10) / 10, // Round to 1 decimal place
      };
    });

    // Sort ascending by distance
    pool.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  }

  return pool.slice(0, limit);
}
