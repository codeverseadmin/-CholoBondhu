// ─────────────────────────────────────────────
// CHOLO BONDHU — Itinerary Engine
//
// Deterministic, explainable recommendation engine.
// Uses explicit scoring weights, proximity heuristics,
// and feasibility validation for festival conditions.
// ─────────────────────────────────────────────

import type {
  ItineraryPreferences,
  ItineraryStop,
  GeneratedItinerary,
  ItinerarySummary,
  PandalPlace,
  FoodHotspot,
  ExperienceTag,
  DataConfidence,
  ScoringWeights,
} from "@/types";
import { DEFAULT_SCORING_WEIGHTS } from "@/types";
import { PANDAL_DATA } from "@/data/pandals";
import { FOOD_HOTSPOT_DATA } from "@/data/food";
import { nanoid } from "@/lib/utils";
import {
  type RoutingProvider,
  defaultRoutingProvider,
  haversineDistanceKm,
  getExternalNavigationUrl,
} from "@/lib/routing-provider";

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
// SCORING
// ─────────────────────────────────────────────

function scorePandal(
  pandal: PandalPlace,
  prefs: ItineraryPreferences,
  weights: ScoringWeights,
  alreadySelectedTags: Set<string>
): number {
  let score = 0;

  // 1. Preference match
  const matchedTags = pandal.experienceTags.filter((t) =>
    prefs.experienceTags.includes(t)
  );
  const preferenceScore =
    prefs.experienceTags.length > 0
      ? matchedTags.length / prefs.experienceTags.length
      : 0.5;
  score += weights.preferenceMatch * preferenceScore;

  // 2. Festival significance (editorial rating proxy 1–5 mapped to 0–1)
  const significance = pandal.editorialRating
    ? (pandal.editorialRating - 1) / 4
    : 0.5;
  score += weights.festivalSignificance * significance;

  // 3. Editorial quality (featured flag + verified confidence boost)
  const quality =
    (pandal.featured ? 0.6 : 0.3) +
    (pandal.dataConfidence === "verified" || pandal.dataConfidence === "curated"
      ? 0.4
      : 0);
  score += weights.editorialQuality * quality;

  // 4. Diversity bonus — reward experience tags not yet present in itinerary
  const newTagCount = pandal.experienceTags.filter(
    (t) => !alreadySelectedTags.has(t)
  ).length;
  const diversityScore = Math.min(newTagCount / 3, 1);
  score += weights.diversityBonus * diversityScore;

  // 5. Accessibility requirements
  if (prefs.requiresAccessibility && !pandal.accessibilityDetails) {
    score *= 0.3; // Penalty for unconfirmed accessibility
  }

  return Math.min(score, 1);
}

// ─────────────────────────────────────────────
// PROXIMITY-BASED ORDERING (Heuristic)
//
// Greedy nearest-neighbour algorithm starting from origin.
// NOTE: This is an efficient heuristic to reduce backtracking,
// not a mathematically guaranteed global TSP optimum.
// ─────────────────────────────────────────────

function calculateTourDistance(
  tour: PandalPlace[],
  startLat?: number,
  startLng?: number
): number {
  if (tour.length <= 1) return 0;
  let total = 0;
  let curLat = startLat ?? tour[0].latitude;
  let curLng = startLng ?? tour[0].longitude;
  for (const stop of tour) {
    if (curLat != null && curLng != null && stop.latitude != null && stop.longitude != null) {
      total += haversineDistanceKm(curLat, curLng, stop.latitude, stop.longitude);
    }
    curLat = stop.latitude;
    curLng = stop.longitude;
  }
  return total;
}

function improveTourWith2Opt(
  initialTour: PandalPlace[],
  startLat?: number,
  startLng?: number
): PandalPlace[] {
  if (initialTour.length < 4) return initialTour;
  let bestTour = [...initialTour];
  let bestDist = calculateTourDistance(bestTour, startLat, startLng);
  let improved = true;
  let iterations = 0;

  while (improved && iterations < 30) {
    improved = false;
    iterations++;
    for (let i = 0; i < bestTour.length - 1; i++) {
      for (let k = i + 1; k < bestTour.length; k++) {
        // 2-opt swap: reverse slice between i and k
        const candidate = [
          ...bestTour.slice(0, i),
          ...bestTour.slice(i, k + 1).reverse(),
          ...bestTour.slice(k + 1),
        ];
        const newDist = calculateTourDistance(candidate, startLat, startLng);
        if (newDist < bestDist - 0.05) {
          bestTour = candidate;
          bestDist = newDist;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }
  return bestTour;
}

function orderStopsByProximity(
  stops: PandalPlace[],
  startLat?: number,
  startLng?: number
): PandalPlace[] {
  if (stops.length <= 1) return stops;

  const remaining = [...stops];
  const ordered: PandalPlace[] = [];
  let curLat = startLat;
  let curLng = startLng;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;

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
        // Deterministic tie-breaking by ID
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

  // Refine initial nearest-neighbour route with 2-opt backtracking reduction
  return improveTourWith2Opt(ordered, startLat, startLng);
}

// ─────────────────────────────────────────────
// FOOD STOP SELECTION
//
// Evaluates user culinary preferences, dietary needs,
// budget, and proximity to route centroid.
// ─────────────────────────────────────────────

function selectFoodStop(
  itineraryStops: PandalPlace[],
  prefs: ItineraryPreferences
): FoodHotspot | undefined {
  if (!prefs.includeFood) return undefined;
  if (FOOD_HOTSPOT_DATA.length === 0) return undefined;

  let candidates = [...FOOD_HOTSPOT_DATA];

  // 1. Filter by category preference if specified
  if (prefs.foodCategories && prefs.foodCategories.length > 0) {
    const categoryMatches = candidates.filter((f) =>
      f.foodCategory.some((cat) => prefs.foodCategories!.includes(cat))
    );
    if (categoryMatches.length > 0) {
      candidates = categoryMatches;
    }
  }

  // 2. Filter by dietary restriction if specified
  if (prefs.dietaryRestrictions && prefs.dietaryRestrictions.length > 0) {
    const dietaryMatches = candidates.filter((f) =>
      f.dietaryNotes &&
      prefs.dietaryRestrictions!.every((req) => f.dietaryNotes!.includes(req))
    );
    if (dietaryMatches.length > 0) {
      candidates = dietaryMatches;
    }
  }

  // 3. Filter by budget if specified
  if (prefs.maxBudget) {
    const budgetRank = { budget: 1, moderate: 2, premium: 3 };
    const maxRank = budgetRank[prefs.maxBudget] ?? 3;
    const budgetMatches = candidates.filter((f) => {
      if (!f.priceRange) return true;
      const rank = budgetRank[f.priceRange] ?? 2;
      return rank <= maxRank;
    });
    if (budgetMatches.length > 0) {
      candidates = budgetMatches;
    }
  }

  const allLats = itineraryStops.map((s) => s.latitude).filter(Boolean) as number[];
  const allLngs = itineraryStops.map((s) => s.longitude).filter(Boolean) as number[];

  if (allLats.length === 0) return candidates[0];

  const centerLat = allLats.reduce((a, b) => a + b, 0) / allLats.length;
  const centerLng = allLngs.reduce((a, b) => a + b, 0) / allLngs.length;

  const sorted = [...candidates].sort((a, b) => {
    const da = a.latitude != null && a.longitude != null
      ? haversineDistanceKm(centerLat, centerLng, a.latitude, a.longitude)
      : 999;
    const db = b.latitude != null && b.longitude != null
      ? haversineDistanceKm(centerLat, centerLng, b.latitude, b.longitude)
      : 999;
    if (Math.abs(da - db) > 0.001) return da - db;
    return a.id.localeCompare(b.id);
  });

  return sorted[0];
}

// ─────────────────────────────────────────────
// OVERALL CONFIDENCE CALCULATION
// ─────────────────────────────────────────────

function computeOverallConfidence(stops: ItineraryStop[]): DataConfidence {
  if (stops.length === 0) return "curated";
  if (stops.some((s) => s.dataConfidence === "unknown")) return "unknown";
  if (stops.some((s) => s.dataConfidence === "demo")) return "estimated";
  if (stops.every((s) => s.dataConfidence === "verified")) return "verified";
  return "curated";
}

// ─────────────────────────────────────────────
// MAIN ENGINE — generateItinerary
// ─────────────────────────────────────────────

export function generateItinerary(
  prefs: ItineraryPreferences,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  routingProvider: RoutingProvider = defaultRoutingProvider
): GeneratedItinerary {
  const warnings: string[] = [];
  const unmetConstraints: string[] = [];

  // Validate available time
  const availableMinutes =
    typeof prefs.availableMinutes === "number" && !isNaN(prefs.availableMinutes)
      ? Math.max(0, prefs.availableMinutes)
      : 0;

  if (availableMinutes <= 0) {
    warnings.push("Available duration must be greater than 0 minutes. Showing minimal route options.");
  }

  // 1. Filter out excluded places and duplicates
  const seenIds = new Set<string>();
  const candidates = PANDAL_DATA.filter((p) => {
    if (prefs.excludedPlaceIds?.includes(p.id)) return false;
    if (seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  });

  // 2. Handle locked stops (must-include)
  const lockedPandals = prefs.lockedStopIds
    ? candidates.filter((p) => prefs.lockedStopIds!.includes(p.id))
    : [];

  const unlockedCandidates = candidates.filter(
    (p) => !prefs.lockedStopIds?.includes(p.id)
  );

  // Validate locked stop time budget feasibility
  let lockedEstimatedMinutes = 0;
  for (const lp of lockedPandals) {
    lockedEstimatedMinutes +=
      lp.recommendedVisitMinutes + STOP_OVERHEAD_MINUTES + DEFAULT_TRAVEL_MINUTES;
  }

  if (lockedPandals.length > 0 && lockedEstimatedMinutes > availableMinutes) {
    unmetConstraints.push(
      `Your ${lockedPandals.length} locked stop(s) require ~${lockedEstimatedMinutes} mins, which exceeds your time budget (${availableMinutes} mins). All locked stops were preserved.`
    );
    warnings.push(
      `Consider extending your outing to at least ${Math.ceil(lockedEstimatedMinutes / 30) * 30} minutes or unlocking some stops.`
    );
  }

  // 3. Score unlocked candidates
  const alreadySelectedTags = new Set<string>(
    lockedPandals.flatMap((p) => p.experienceTags)
  );

  const scored = unlockedCandidates.map((pandal) => ({
    pandal,
    score: scorePandal(pandal, prefs, weights, alreadySelectedTags),
  }));

  // Deterministic sort: score descending, then ID ascending
  scored.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.001) return b.score - a.score;
    return a.pandal.id.localeCompare(b.pandal.id);
  });

  // Dynamically configure stop overhead & visit durations based on pacing
  const pacing = prefs.pacing || "standard";
  const stopOverhead =
    pacing === "relaxed" ? 18 : pacing === "packed" ? 6 : STOP_OVERHEAD_MINUTES;
  const foodDuration =
    pacing === "relaxed" ? 45 : pacing === "packed" ? 25 : FOOD_VISIT_MINUTES;
  const targetStops = Math.min(
    7,
    Math.max(2, prefs.targetStopCount ?? (pacing === "relaxed" ? 4 : 6))
  );

  // 4. Select stops within remaining time budget
  let remainingMinutes = Math.max(0, availableMinutes - lockedEstimatedMinutes);

  const selectedUnlocked: PandalPlace[] = [];
  for (const { pandal } of scored) {
    const needed =
      pandal.recommendedVisitMinutes + stopOverhead + DEFAULT_TRAVEL_MINUTES;
    if (remainingMinutes >= needed) {
      selectedUnlocked.push(pandal);
      remainingMinutes -= needed;
      pandal.experienceTags.forEach((t) => alreadySelectedTags.add(t));
      if (selectedUnlocked.length + lockedPandals.length >= targetStops) break;
    }
  }

  // 5. Merge locked + selected, order by proximity heuristic with 2-opt
  const allSelected = [...lockedPandals, ...selectedUnlocked];
  const ordered = orderStopsByProximity(
    allSelected,
    prefs.startingLatitude,
    prefs.startingLongitude
  );

  if (allSelected.length === 0) {
    if (candidates.length === 0) {
      warnings.push("No pandals available matching your non-excluded criteria.");
    } else {
      warnings.push(
        "The available time is very short. Extend your outing to at least 2 hours to visit Kolkata pandals comfortably."
      );
    }
  }

  // 6. Food stop selection
  const foodHotspot = selectFoodStop(ordered, prefs);
  const includeFoodStop = prefs.includeFood && foodHotspot != null;
  if (prefs.includeFood && !foodHotspot) {
    unmetConstraints.push(
      "Requested food stop could not be matched near your route within specified dietary or budget criteria."
    );
  }
  let foodStopInserted = false;
  const foodInsertTargetIndex = Math.max(0, Math.floor(ordered.length / 2) - 1);

  // 7. Build ItineraryStop list with provider routing
  const itineraryStops: ItineraryStop[] = [];
  const safeStartTime = sanitizeStartTime(prefs.startTime);
  if (prefs.startTime && prefs.startTime !== safeStartTime) {
    warnings.push(`Start time "${prefs.startTime}" was adjusted to valid time "${safeStartTime}".`);
  }

  let currentTime = safeStartTime;
  let prevLat: number | undefined = prefs.startingLatitude;
  let prevLng: number | undefined = prefs.startingLongitude;
  let totalTravel = 0;
  let totalVisit = 0;

  for (let i = 0; i < ordered.length; i++) {
    const pandal = ordered[i];
    const routingRes = routingProvider.estimateTravel(
      prevLat,
      prevLng,
      pandal.latitude,
      pandal.longitude,
      prefs.transportMode
    );
    const travelMins = routingRes.minutes;
    const arrivalTime = addMinutes(currentTime, travelMins);
    const visitMins =
      pandal.recommendedVisitMinutes +
      (pacing === "relaxed" ? 10 : pacing === "packed" ? -5 : 0);
    const departureTime = addMinutes(arrivalTime, visitMins);

    totalTravel += travelMins;
    totalVisit += visitMins;

    const caveats: string[] = [];
    if (pandal.dataConfidence === "demo") {
      caveats.push("This is a demo record. Verify before your visit.");
    }
    if (pandal.crowdLevel === "very_high") {
      caveats.push("Expect very large crowds. Plan extra time for queues.");
    }
    if (pandal.bestVisitTime) {
      caveats.push(`Best time: ${pandal.bestVisitTime}`);
    }
    if (prefs.walkingTolerance === "low" && travelMins > 18) {
      caveats.push(`Segment is ~${travelMins} mins; an auto-rickshaw or taxi is recommended for low walking tolerance.`);
    }
    if (prefs.requiresAccessibility) {
      if (pandal.accessibilityConfidence === "verified_accessible") {
        caveats.push("Wheelchair accessible / step-free entrance verified.");
      } else {
        caveats.push("Step-free accessibility unverified; bamboo barricades may require assistance.");
      }
    }

    // Recommendation reason
    const matchedTagLabels = pandal.experienceTags
      .filter((t) => prefs.experienceTags.includes(t as ExperienceTag))
      .map(tagLabel);

    const reason =
      matchedTagLabels.length > 0
        ? `Matches your interest in ${matchedTagLabels.join(", ")}.`
        : pandal.featured
        ? "A premier, highly-rated Kolkata Durga Puja destination."
        : "Selected to diversify your route and cultural experience.";

    itineraryStops.push({
      id: nanoid(),
      placeId: pandal.id,
      placeName: pandal.name,
      placeNameBengali: pandal.nameBengali,
      placeType: "pandal",
      locality: pandal.locality,
      latitude: pandal.latitude,
      longitude: pandal.longitude,
      recommendationReason: reason,
      estimatedVisitMinutes: visitMins,
      estimatedTravelMinutesFromPrevious: travelMins,
      routingMethodology: routingRes.methodology,
      navigationUrl: pandal.latitude && pandal.longitude
        ? getExternalNavigationUrl(pandal.latitude, pandal.longitude, prevLat, prevLng, prefs.transportMode)
        : undefined,
      approximateArrivalTime: arrivalTime,
      dataConfidence: pandal.dataConfidence,
      caveats,
      locked: prefs.lockedStopIds?.includes(pandal.id) ?? false,
      score: undefined,
      tags: pandal.experienceTags,
    });

    currentTime = departureTime;
    prevLat = pandal.latitude;
    prevLng = pandal.longitude;

    // Insert food stop roughly halfway through or at end
    if (
      includeFoodStop &&
      foodHotspot &&
      !foodStopInserted &&
      (i === foodInsertTargetIndex || i === ordered.length - 1)
    ) {
      const foodRouting = routingProvider.estimateTravel(
        prevLat,
        prevLng,
        foodHotspot.latitude,
        foodHotspot.longitude,
        prefs.transportMode
      );
      const foodTravel = foodRouting.minutes;
      const foodArrival = addMinutes(currentTime, foodTravel);
      totalTravel += foodTravel;
      totalVisit += foodDuration;

      const foodCaveats: string[] = [];
      if (foodHotspot.verificationStatus === "demo") {
        foodCaveats.push("Demo food record — verify before visiting.");
      }
      if (foodTravel > 25) {
        foodCaveats.push(`Travel to this food hotspot is ~${foodTravel} mins.`);
      }

      itineraryStops.push({
        id: nanoid(),
        placeId: foodHotspot.id,
        placeName: foodHotspot.name,
        placeNameBengali: foodHotspot.nameBengali,
        placeType: "food",
        locality: foodHotspot.locality,
        latitude: foodHotspot.latitude,
        longitude: foodHotspot.longitude,
        recommendationReason: `Food stop: ${foodHotspot.description.split(".")[0]}.`,
        estimatedVisitMinutes: foodDuration,
        estimatedTravelMinutesFromPrevious: foodTravel,
        routingMethodology: foodRouting.methodology,
        navigationUrl: foodHotspot.latitude && foodHotspot.longitude
          ? getExternalNavigationUrl(foodHotspot.latitude, foodHotspot.longitude, prevLat, prevLng, prefs.transportMode)
          : undefined,
        approximateArrivalTime: foodArrival,
        dataConfidence: foodHotspot.confidence,
        caveats: foodCaveats,
        locked: false,
        foodCategories: foodHotspot.foodCategory,
        tags: foodHotspot.foodCategory as any,
      });

      currentTime = addMinutes(foodArrival, foodDuration);
      prevLat = foodHotspot.latitude;
      prevLng = foodHotspot.longitude;
      foodStopInserted = true;
    }
  }

  // Edge case: food requested with 0 pandals
  if (ordered.length === 0 && includeFoodStop && foodHotspot && !foodStopInserted) {
    const foodRouting = routingProvider.estimateTravel(
      prevLat,
      prevLng,
      foodHotspot.latitude,
      foodHotspot.longitude,
      prefs.transportMode
    );
    const foodTravel = foodRouting.minutes;
    const foodArrival = addMinutes(currentTime, foodTravel);
    totalTravel += foodTravel;
    totalVisit += foodDuration;

    itineraryStops.push({
      id: nanoid(),
      placeId: foodHotspot.id,
      placeName: foodHotspot.name,
      placeNameBengali: foodHotspot.nameBengali,
      placeType: "food",
      locality: foodHotspot.locality,
      latitude: foodHotspot.latitude,
      longitude: foodHotspot.longitude,
      recommendationReason: `Food stop: ${foodHotspot.description.split(".")[0]}.`,
      estimatedVisitMinutes: foodDuration,
      estimatedTravelMinutesFromPrevious: foodTravel,
      routingMethodology: foodRouting.methodology,
      navigationUrl: foodHotspot.latitude && foodHotspot.longitude
        ? getExternalNavigationUrl(foodHotspot.latitude, foodHotspot.longitude, prevLat, prevLng, prefs.transportMode)
        : undefined,
      approximateArrivalTime: foodArrival,
      dataConfidence: foodHotspot.confidence,
      caveats: [],
      locked: false,
      foodCategories: foodHotspot.foodCategory,
      tags: foodHotspot.foodCategory as any,
    });
    currentTime = addMinutes(foodArrival, FOOD_VISIT_MINUTES);
  }

  // Check overall duration feasibility
  const totalMinutes = totalTravel + totalVisit;
  if (availableMinutes > 0 && totalMinutes > availableMinutes * 1.25) {
    warnings.push(
      `Total itinerary duration (~${totalMinutes} mins) exceeds your allocated time (${availableMinutes} mins). Consider dropping a stop.`
    );
  }

  if (warnings.length === 0 && itineraryStops.some((s) => s.dataConfidence === "demo")) {
    warnings.push(
      "Some locations in this itinerary are demo records. Please verify details before your visit."
    );
  }

  const summary: ItinerarySummary = {
    totalStops: itineraryStops.length,
    estimatedTotalMinutes: totalMinutes,
    estimatedTravelMinutes: totalTravel,
    estimatedVisitMinutes: totalVisit,
    approximateEndTime: currentTime,
    routingMethodology: routingProvider.name.includes("Heuristic")
      ? "urban_heuristic"
      : "provider_verified",
    isEstimated: true,
    warnings,
    unmetConstraints,
    dataConfidence: computeOverallConfidence(itineraryStops),
  };

  return {
    id: nanoid(),
    createdAt: new Date().toISOString(),
    preferences: prefs,
    stops: itineraryStops,
    summary,
    unmetConstraints,
  };
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function tagLabel(tag: string): string {
  const labels: Record<string, string> = {
    iconic: "iconic pandals",
    artistic: "artistic installations",
    traditional: "traditional Puja",
    less_crowded: "quieter experiences",
    photography: "photography",
    family_friendly: "family outings",
    street_food: "street food",
    bengali_food: "Bengali cuisine",
    group_outing: "group outings",
    accessible: "accessible travel",
    contemporary: "contemporary art",
    heritage: "heritage sites",
    spiritual: "spiritual traditions",
  };
  return labels[tag] ?? tag;
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
  if (fromIndex < 0 || fromIndex >= itinerary.stops.length || toIndex < 0 || toIndex >= itinerary.stops.length) {
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
      navigationUrl: stop.latitude && stop.longitude
        ? getExternalNavigationUrl(stop.latitude, stop.longitude, prevLat, prevLng, prefs.transportMode)
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
