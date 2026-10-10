// ─────────────────────────────────────────────
// STAGE 4: Apply Hard Constraints
// ─────────────────────────────────────────────

import type { PandalPlace } from "@/types";
import type { NormalizedPlannerInput } from "./types";
import { haversineDistanceKm } from "@/lib/routing-provider";

export interface HardConstraintResult {
  feasibleCandidates: PandalPlace[];
  lockedPandals: PandalPlace[];
  filteredCandidates: PandalPlace[];
  unlockedCandidates: PandalPlace[];
  excludedCount: number;
  warnings: string[];
  unmetConstraints: string[];
  advisories: string[];
}

export function applyHardConstraints(
  candidates: PandalPlace[],
  input: NormalizedPlannerInput
): HardConstraintResult {
  const warnings: string[] = [];
  const unmetConstraints: string[] = [];
  const advisories: string[] = [];

  // 1. Remove explicitly excluded places
  const nonExcluded = candidates.filter(
    (p) => !input.excludedPlaceIds.includes(p.id) && !input.excludedPlaceIds.includes(p.slug)
  );
  const excludedCount = candidates.length - nonExcluded.length;

  // 2. Identify locked stops (must be included)
  const lockedPandals = nonExcluded.filter(
    (p) => input.lockedStopIds.includes(p.id) || input.lockedStopIds.includes(p.slug)
  );

  const unlocked = nonExcluded.filter(
    (p) => !input.lockedStopIds.includes(p.id) && !input.lockedStopIds.includes(p.slug)
  );

  // Validate locked stop time budget feasibility
  let lockedEstimatedMinutes = 0;
  for (const lp of lockedPandals) {
    lockedEstimatedMinutes += lp.recommendedVisitMinutes + 10 + 20; // visit + overhead + transit
  }

  if (lockedPandals.length > 0 && lockedEstimatedMinutes > input.availableMinutes) {
    unmetConstraints.push(
      `Your ${lockedPandals.length} locked stop(s) require ~${lockedEstimatedMinutes} mins, which exceeds your time budget (${input.availableMinutes} mins). All locked stops were preserved.`
    );
    warnings.push(
      `Consider extending your outing to at least ${Math.ceil(lockedEstimatedMinutes / 30) * 30} minutes or unlocking some stops.`
    );
  }

  // 3. Transport mode maximum feasible radius filter from starting point
  // Walking tolerance & transport mode determine the spatial reach
  let maxRadiusKm: number;
  const availableHours = input.availableMinutes / 60;

  switch (input.transportMode) {
    case "walking":
      // A pedestrian at 4 km/h cannot traverse 10 km round-trip in a short outing
      if (input.walkingTolerance === "low") {
        maxRadiusKm = Math.min(2.5, Math.max(1.2, availableHours * 0.8));
      } else if (input.walkingTolerance === "high") {
        maxRadiusKm = Math.min(5.5, Math.max(2.5, availableHours * 1.5));
      } else {
        maxRadiusKm = Math.min(4.0, Math.max(1.8, availableHours * 1.2));
      }
      break;

    case "metro_walking":
      maxRadiusKm = 14.0; // Metro corridor connects North to South Kolkata within 35 mins
      break;

    case "taxi":
      maxRadiusKm = 16.0;
      break;

    case "public_transport":
    case "flexible":
    default:
      maxRadiusKm = 12.0;
      break;
  }

  // Filter unlocked candidates by geographic feasibility
  const originLat = input.startingCoordinates.latitude;
  const originLng = input.startingCoordinates.longitude;

  const geographicallyFeasible = unlocked.filter((p) => {
    if (!p.latitude || !p.longitude) return true; // Keep places with unknown coords if needed
    const dist = haversineDistanceKm(originLat, originLng, p.latitude, p.longitude);
    return dist <= maxRadiusKm;
  });

  // If geographic filter was too strict (e.g. fewer than 2 candidates), gracefully expand radius
  let finalUnlocked = geographicallyFeasible;
  if (geographicallyFeasible.length < 3 && unlocked.length >= 3) {
    advisories.push(
      `Strict ${input.transportMode} radius had limited nearby options. Broadened search zone to ensure a complete itinerary.`
    );
    finalUnlocked = unlocked;
  }

  return {
    feasibleCandidates: [...lockedPandals, ...finalUnlocked],
    lockedPandals,
    filteredCandidates: finalUnlocked,
    unlockedCandidates: finalUnlocked,
    excludedCount,
    warnings,
    unmetConstraints,
    advisories,
  };
}
