// ─────────────────────────────────────────────
// CHOLO BONDHU — Itinerary Engine
//
// Modular, deterministic, and explainable itinerary generation.
// Powered by a 13-stage planning pipeline, locality resolution,
// multi-factor spatial scoring, corridor food detour selection,
// and Google Routes / urban heuristic routing providers.
// ─────────────────────────────────────────────

import type {
  ItineraryPreferences,
  ItineraryStop,
  GeneratedItinerary,
  ItinerarySummary,
  ScoringWeights,
} from "@/types";
import { DEFAULT_SCORING_WEIGHTS } from "@/types";
import {
  type RoutingProvider,
  defaultRoutingProvider,
  getExternalNavigationUrl,
} from "@/lib/routing-provider";
import { buildSingleDestinationNavUrl } from "@/lib/navigation-links";
import {
  runPlanningPipeline,
  type PlanningPipelineResult,
} from "./planning-pipeline";

// Export the pipeline for direct access
export { runPlanningPipeline } from "./planning-pipeline";
export type {
  PlanningPipelineResult,
  PlanningDiagnostics,
  NormalizedPlannerInput,
  ScoredCandidate,
} from "./planning-pipeline";

// ─────────────────────────────────────────────
// CONSTANTS & BUFFERS
// ─────────────────────────────────────────────

/** Overhead per stop (entry queue, orientation, photos) in minutes */
export const STOP_OVERHEAD_MINUTES = 10;
/** Default travel buffer between stops in minutes when coordinates unavailable */
export const DEFAULT_TRAVEL_MINUTES = 20;
/** Standard sit-down meal / snack duration in minutes */
export const FOOD_VISIT_MINUTES = 35;
/** Minimum visit duration we schedule */
export const MIN_VISIT_MINUTES = 20;

// ─────────────────────────────────────────────
// TIME UTILITIES
// ─────────────────────────────────────────────

/** Sanitize start time string to valid HH:MM, defaulting to 10:00 AM */
export function sanitizeStartTime(time?: string): string {
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

/** Add minutes to HH:MM time string, wrapping safely within 24h */
export function addMinutes(time: string, minutes: number): string {
  const safeTime = sanitizeStartTime(time);
  const [h, m] = safeTime.split(":").map(Number);
  const total = Math.max(0, h * 60 + m + Math.round(minutes));
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────
// MAIN ENGINE — generateItinerary
// ─────────────────────────────────────────────

/**
 * Generates a personalized itinerary adhering to all 12 user input dimensions.
 * Backward-compatible function returning GeneratedItinerary.
 */
export function generateItinerary(
  prefs: ItineraryPreferences,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  routingProvider: RoutingProvider = defaultRoutingProvider
): GeneratedItinerary {
  const result = runPlanningPipeline(prefs, weights, routingProvider);
  return result.itinerary;
}

/**
 * Extended generator that returns both the generated itinerary and
 * structured planning diagnostics detailing which preferences influenced the plan.
 */
export function generateItineraryWithDiagnostics(
  prefs: ItineraryPreferences,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  routingProvider: RoutingProvider = defaultRoutingProvider
): PlanningPipelineResult {
  return runPlanningPipeline(prefs, weights, routingProvider);
}

// ─────────────────────────────────────────────
// ITINERARY EDITING OPERATIONS
// ─────────────────────────────────────────────

export function removeStop(
  itinerary: GeneratedItinerary,
  stopId: string,
  provider: RoutingProvider = defaultRoutingProvider
): GeneratedItinerary {
  const stops = itinerary.stops.filter((s) => s.id !== stopId);
  return recalculateTiming({ ...itinerary, stops }, provider);
}

export function reorderStop(
  itinerary: GeneratedItinerary,
  fromIndex: number,
  toIndex: number,
  provider: RoutingProvider = defaultRoutingProvider
): GeneratedItinerary {
  if (
    fromIndex < 0 ||
    fromIndex >= itinerary.stops.length ||
    toIndex < 0 ||
    toIndex >= itinerary.stops.length
  ) {
    return itinerary;
  }
  const stops = [...itinerary.stops];
  const [moved] = stops.splice(fromIndex, 1);
  stops.splice(toIndex, 0, moved);
  return recalculateTiming({ ...itinerary, stops }, provider);
}

export function toggleLockStop(
  itinerary: GeneratedItinerary,
  stopId: string
): GeneratedItinerary {
  const stops = itinerary.stops.map((s) =>
    s.id === stopId ? { ...s, locked: !s.locked } : s
  );
  return { ...itinerary, stops };
}

export function recalculateTiming(
  itinerary: GeneratedItinerary,
  provider: RoutingProvider = defaultRoutingProvider
): GeneratedItinerary {
  const prefs = itinerary.preferences;
  let currentTime = sanitizeStartTime(prefs.startTime);
  let prevLat: number | undefined = prefs.startingLatitude;
  let prevLng: number | undefined = prefs.startingLongitude;
  let totalTravel = 0;
  let totalVisit = 0;

  const stops = itinerary.stops.map((stop) => {
    const routeRes = provider.estimateTravel(
      prevLat,
      prevLng,
      stop.latitude,
      stop.longitude,
      prefs.transportMode
    );
    const travelMins = routeRes.minutes;
    const arrivalTime = addMinutes(currentTime, travelMins);
    totalTravel += travelMins;
    totalVisit += stop.estimatedVisitMinutes;
    currentTime = addMinutes(arrivalTime, stop.estimatedVisitMinutes);
    prevLat = stop.latitude;
    prevLng = stop.longitude;

    return {
      ...stop,
      estimatedTravelMinutesFromPrevious: travelMins,
      approximateArrivalTime: arrivalTime,
      routingMethodology: routeRes.methodology,
      navigationUrl:
        stop.latitude && stop.longitude
          ? buildSingleDestinationNavUrl(
              {
                latitude: stop.latitude,
                longitude: stop.longitude,
                name: stop.placeName,
                locality: stop.locality,
              },
              prevLat && prevLng ? { latitude: prevLat, longitude: prevLng } : undefined,
              prefs.transportMode
            )
          : undefined,
    };
  });

  const totalMinutes = totalTravel + totalVisit;
  const warnings = [...itinerary.summary.warnings];

  const summary: ItinerarySummary = {
    ...itinerary.summary,
    totalStops: stops.length,
    estimatedTotalMinutes: totalMinutes,
    estimatedTravelMinutes: totalTravel,
    estimatedVisitMinutes: totalVisit,
    approximateEndTime: currentTime,
    warnings,
  };

  return { ...itinerary, stops, summary };
}
