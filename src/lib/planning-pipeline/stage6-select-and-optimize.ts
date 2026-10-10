// ─────────────────────────────────────────────
// STAGE 6: Select Feasible Stops & Optimize Route Order
// ─────────────────────────────────────────────

import type { PandalPlace, Coordinates } from "@/types";
import type { NormalizedPlannerInput, ScoredCandidate } from "./types";
import { type RoutingProvider, defaultRoutingProvider, haversineDistanceKm } from "@/lib/routing-provider";

export interface SelectedStopsResult {
  orderedStops: PandalPlace[];
  orderedPandals: PandalPlace[];
  estimatedTotalTravelMinutes: number;
  estimatedTotalVisitMinutes: number;
  warnings: string[];
  unmetConstraints: string[];
  advisories: string[];
}

export function selectAndOptimizeStops(
  lockedPandals: PandalPlace[],
  scoredUnlocked: ScoredCandidate[],
  input: NormalizedPlannerInput,
  routingProvider: RoutingProvider
): SelectedStopsResult {
  const advisories: string[] = [];

  // Pacing buffers
  const pacing = input.pacing;
  const stopOverhead = pacing === "relaxed" ? 18 : pacing === "packed" ? 6 : 10;
  const visitDwellDelta = pacing === "relaxed" ? 10 : pacing === "packed" ? -5 : 0;
  const targetCount = input.targetStopCount;

  // Sort unlocked candidates deterministically by total score descending, then ID ascending
  const sortedUnlocked = [...scoredUnlocked].sort((a, b) => {
    if (Math.abs(b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore) > 0.0001) {
      return b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore;
    }
    return a.place.id.localeCompare(b.place.id);
  });

  // Calculate time required for locked stops
  let lockedTime = 0;
  for (const lp of lockedPandals) {
    const visitMins = Math.max(15, lp.recommendedVisitMinutes + visitDwellDelta);
    lockedTime += visitMins + stopOverhead + 20; // 20m nominal transit buffer
  }

  let remainingMinutes = Math.max(0, input.availableMinutes - lockedTime);
  const selectedUnlocked: PandalPlace[] = [];

  let curLat = input.startingCoordinates.latitude;
  let curLng = input.startingCoordinates.longitude;

  for (const { place } of sortedUnlocked) {
    if (selectedUnlocked.length + lockedPandals.length >= targetCount) break;

    const visitMins = Math.max(15, place.recommendedVisitMinutes + visitDwellDelta);
    let transitMinutes = 20;
    try {
      const transit = routingProvider.estimateTravel(
        curLat,
        curLng,
        place.latitude,
        place.longitude,
        input.transportMode
      );
      transitMinutes = transit.minutes;
    } catch {
      transitMinutes = defaultRoutingProvider.estimateTravel(
        curLat,
        curLng,
        place.latitude,
        place.longitude,
        input.transportMode
      ).minutes;
    }

    const needed = visitMins + stopOverhead + transitMinutes;
    if (remainingMinutes >= needed) {
      selectedUnlocked.push(place);
      remainingMinutes -= needed;
      curLat = place.latitude;
      curLng = place.longitude;
    }
  }

  const allSelected = [...lockedPandals, ...selectedUnlocked];

  if (allSelected.length === 0) {
    advisories.push(
      "Available duration was too brief to visit any pandal comfortably. Extended minimum visit options."
    );
    if (sortedUnlocked.length > 0) {
      allSelected.push(sortedUnlocked[0].place);
    }
  }

  // Optimize tour order using nearest-neighbour anchored at startingCoordinates + 2-opt
  const orderedStops = orderWithNearestNeighbourAnd2Opt(
    allSelected,
    input.startingCoordinates
  );

  return {
    orderedStops,
    orderedPandals: orderedStops,
    estimatedTotalTravelMinutes: 0, // Computed in timeline builder
    estimatedTotalVisitMinutes: 0,
    warnings: advisories,
    unmetConstraints: [],
    advisories,
  };
}

/**
 * Proximity-based order with origin anchor and 2-opt edge exchange
 */
export function orderWithNearestNeighbourAnd2Opt(
  places: PandalPlace[],
  origin: Coordinates
): PandalPlace[] {
  if (places.length <= 1) return [...places];

  const remaining = [...places];
  const ordered: PandalPlace[] = [];

  let curLat = origin.latitude;
  let curLng = origin.longitude;

  while (remaining.length > 0) {
    let bestDist = Infinity;
    let bestIdx = 0;

    for (let i = 0; i < remaining.length; i++) {
      const p = remaining[i];
      let dist = Infinity;
      if (curLat != null && curLng != null && p.latitude != null && p.longitude != null) {
        dist = haversineDistanceKm(curLat, curLng, p.latitude, p.longitude);
      }
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      } else if (dist === bestDist) {
        if (p.id.localeCompare(remaining[bestIdx].id) < 0) {
          bestIdx = i;
        }
      }
    }

    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    curLat = next.latitude;
    curLng = next.longitude;
  }

  // 2-opt pairwise improvement
  return apply2Opt(ordered, origin.latitude, origin.longitude);
}

function computeTourLength(
  tour: PandalPlace[],
  startLat: number,
  startLng: number
): number {
  if (tour.length <= 1) return 0;
  let total = 0;
  let curLat = startLat;
  let curLng = startLng;

  for (const stop of tour) {
    if (stop.latitude != null && stop.longitude != null) {
      total += haversineDistanceKm(curLat, curLng, stop.latitude, stop.longitude);
      curLat = stop.latitude;
      curLng = stop.longitude;
    }
  }
  return total;
}

function apply2Opt(
  initialTour: PandalPlace[],
  startLat: number,
  startLng: number
): PandalPlace[] {
  if (initialTour.length <= 2) return initialTour;

  let bestTour = [...initialTour];
  let bestDistance = computeTourLength(bestTour, startLat, startLng);
  let improved = true;
  let iterations = 0;
  const maxIterations = 20;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < bestTour.length - 1; i++) {
      for (let k = i + 1; k < bestTour.length; k++) {
        // Reverse subsegment between i and k
        const candidate = [
          ...bestTour.slice(0, i),
          ...bestTour.slice(i, k + 1).reverse(),
          ...bestTour.slice(k + 1),
        ];

        const candidateDist = computeTourLength(candidate, startLat, startLng);
        if (candidateDist < bestDistance - 0.001) {
          bestTour = candidate;
          bestDistance = candidateDist;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return bestTour;
}
