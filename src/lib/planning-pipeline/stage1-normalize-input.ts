// ─────────────────────────────────────────────
// STAGE 1 & 2: Validate, Normalize & Resolve Location
// ─────────────────────────────────────────────

import type { ItineraryPreferences } from "@/types";
import type { NormalizedPlannerInput } from "./types";
import {
  resolveLocalityCoordinates,
  getNearestMetroStation,
  getMetroStationById,
  type MetroStationRecord,
} from "@/data/localities";

export function sanitizeTimeFormat(time?: string): string {
  if (!time || typeof time !== "string") return "10:00";
  const parts = time.trim().split(":");
  if (parts.length < 2) return "10:00";
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return "10:00";
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function normalizePlannerInput(
  prefs: ItineraryPreferences
): { normalized: NormalizedPlannerInput; warnings: string[] } {
  const warnings: string[] = [];

  // Duration
  let duration = Number(prefs.availableMinutes);
  if (isNaN(duration) || duration <= 0) {
    warnings.push("Available duration was missing or invalid; defaulting to 240 minutes (4 hours).");
    duration = 240;
  } else if (duration < 60) {
    warnings.push("Short time budget (under 1 hour). Route will be tightly restricted to immediate neighbourhood.");
  }

  // Location & Metro resolution
  let metroStation: MetroStationRecord | undefined;
  if (prefs.startingMetroStationId) {
    metroStation = getMetroStationById(prefs.startingMetroStationId);
  }
  if (!metroStation && prefs.startingLocality) {
    metroStation = getMetroStationById(prefs.startingLocality);
  }

  const coords = resolveLocalityCoordinates(
    metroStation ? metroStation.name : prefs.startingLocality,
    prefs.startingLatitude,
    prefs.startingLongitude
  );

  // If still no explicit metro station, automatically find the nearest Kolkata Metro anchor
  if (!metroStation) {
    metroStation = getNearestMetroStation(coords.latitude, coords.longitude);
  }

  const startTime = sanitizeTimeFormat(prefs.startTime);

  const pacing = prefs.pacing || "standard";
  const walkingTolerance = prefs.walkingTolerance || "moderate";

  // Target stop count: bounded reasonably between 2 and 7
  let targetStops = prefs.targetStopCount;
  if (!targetStops || isNaN(targetStops)) {
    // Sensible heuristic: 1 stop per 60 mins of available time
    targetStops = Math.min(6, Math.max(2, Math.floor(duration / 60)));
  } else {
    targetStops = Math.min(7, Math.max(2, targetStops));
  }

  const normalized: NormalizedPlannerInput = {
    startingLocality: prefs.startingLocality?.trim() || metroStation.name,
    startingCoordinates: coords,
    startingMetroStation: metroStation,
    availableMinutes: duration,
    date: prefs.date || new Date().toISOString().split("T")[0],
    startTime,
    experienceTags: Array.isArray(prefs.experienceTags) ? prefs.experienceTags : [],
    transportMode: prefs.transportMode || "metro_walking",
    includeFood: Boolean(prefs.includeFood),
    foodCategories: Array.isArray(prefs.foodCategories) ? prefs.foodCategories : [],
    dietaryRestrictions: Array.isArray(prefs.dietaryRestrictions) ? prefs.dietaryRestrictions : [],
    maxBudget: prefs.maxBudget,
    walkingTolerance,
    pacing,
    targetStopCount: targetStops,
    requiresAccessibility: Boolean(prefs.requiresAccessibility),
    lockedStopIds: Array.isArray(prefs.lockedStopIds) ? prefs.lockedStopIds : [],
    excludedPlaceIds: Array.isArray(prefs.excludedPlaceIds) ? prefs.excludedPlaceIds : [],
  };

  return { normalized, warnings };
}
