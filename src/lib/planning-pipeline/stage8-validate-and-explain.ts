// ─────────────────────────────────────────────
// CHOLO BONDHU — Planning Pipeline: Stage 8 & 13
// Stage 8: Validate Itinerary
// Stage 13: Explain the Result & Assemble Timeline
// ─────────────────────────────────────────────

import type {
  ItineraryStop,
  GeneratedItinerary,
  ItinerarySummary,
  PandalPlace,
  FoodHotspot,
  ExperienceTag,
  DataConfidence,
  TransportMode,
} from "@/types";
import { nanoid } from "@/lib/utils";
import type { RoutingProvider } from "@/lib/routing-provider";
import { defaultRoutingProvider, getExternalNavigationUrl } from "@/lib/routing-provider";
import type {
  NormalizedPlannerInput,
  PlanningDiagnostics,
  PlanningPipelineResult,
} from "./types";
import { addMinutes, sanitizeStartTime } from "../itinerary-engine";

function safeEstimateTravel(
  provider: RoutingProvider,
  fromLat?: number,
  fromLng?: number,
  toLat?: number,
  toLng?: number,
  mode: any = "walking"
) {
  try {
    return provider.estimateTravel(fromLat, fromLng, toLat, toLng, mode);
  } catch {
    return defaultRoutingProvider.estimateTravel(fromLat, fromLng, toLat, toLng, mode);
  }
}

function getTagLabel(tag: string): string {
  const labels: Record<string, string> = {
    iconic: "iconic pandals",
    artistic: "art installations & themes",
    traditional: "traditional Sabeki puja",
    less_crowded: "quieter, contemplative stops",
    photography: "striking visual aesthetics",
    family_friendly: "family-accessible environments",
    street_food: "local Kolkata street food",
    bengali_food: "authentic Bengali culinary stops",
    group_outing: "group festival gatherings",
    accessible: "step-free / wheelchair accessibility",
    contemporary: "contemporary experimental art",
    heritage: "heritage Bonedi Bari puja",
    spiritual: "devotional & spiritual atmosphere",
  };
  return labels[tag] ?? tag;
}

function computeConfidence(stops: ItineraryStop[]): DataConfidence {
  if (stops.length === 0) return "curated";
  if (stops.some((s) => s.dataConfidence === "unknown")) return "unknown";
  if (stops.some((s) => s.dataConfidence === "demo")) return "estimated";
  if (stops.every((s) => s.dataConfidence === "verified")) return "verified";
  return "curated";
}

export function validateAndExplainResult(
  input: NormalizedPlannerInput,
  orderedPandals: PandalPlace[],
  foodHotspot: FoodHotspot | undefined,
  foodInsertIndex: number,
  routingProvider: RoutingProvider,
  diagnosticsDraft: {
    totalConsidered: number;
    excludedCount: number;
    scoredCount: number;
    warnings: string[];
    unmetConstraints: string[];
  }
): PlanningPipelineResult {
  const warnings = [...diagnosticsDraft.warnings];
  const unmetConstraints = [...diagnosticsDraft.unmetConstraints];
  const preferenceInfluences: string[] = [];

  // Record preference influences
  preferenceInfluences.push(
    `Anchored route origin around ${input.startingLocality} (${input.startingCoordinates.latitude.toFixed(4)}, ${input.startingCoordinates.longitude.toFixed(4)})`
  );

  if (input.experienceTags.length > 0) {
    preferenceInfluences.push(
      `Prioritized ${input.experienceTags.map(getTagLabel).join(", ")}`
    );
  }

  if (input.transportMode === "walking") {
    preferenceInfluences.push(
      `Constrained travel radius to walkable perimeter with ${input.walkingTolerance} tolerance`
    );
  } else {
    preferenceInfluences.push(
      `Optimized travel transit times for ${input.transportMode.replace("_", " ")}`
    );
  }

  if (input.includeFood) {
    if (foodHotspot) {
      preferenceInfluences.push(
        `Integrated food stop "${foodHotspot.name}" along corridor matching categories: ${foodHotspot.foodCategory.join(", ")}`
      );
    } else {
      preferenceInfluences.push(
        "Food inclusion requested, but no matching hotspot found along route within distance/diet constraints"
      );
    }
  }

  if (input.requiresAccessibility) {
    preferenceInfluences.push(
      "Filtered and checked wheelchair/step-free accessibility credentials"
    );
  }

  if (input.lockedStopIds.length > 0) {
    preferenceInfluences.push(
      `Preserved ${input.lockedStopIds.length} user-locked stop(s)`
    );
  }

  // Pacing adjustments
  const pacing = input.pacing;
  const visitDelta = pacing === "relaxed" ? 10 : pacing === "packed" ? -5 : 0;
  const foodDuration = pacing === "relaxed" ? 45 : pacing === "packed" ? 25 : 35;

  const itineraryStops: ItineraryStop[] = [];
  let currentTime = sanitizeStartTime(input.startTime);
  let prevLat: number | undefined = input.startingCoordinates.latitude;
  let prevLng: number | undefined = input.startingCoordinates.longitude;
  let totalTravelMinutes = 0;
  let totalVisitMinutes = 0;
  let totalStraightDistanceKm = 0;
  let totalRoadDistanceKm = 0;
  const seenPlaceIds = new Set<string>();

  let foodInserted = false;

  for (let i = 0; i < orderedPandals.length; i++) {
    const pandal = orderedPandals[i];

    // Check if food should be inserted before or after this pandal
    if (
      input.includeFood &&
      foodHotspot &&
      !foodInserted &&
      i === foodInsertIndex
    ) {
      const foodRouting = safeEstimateTravel(
        routingProvider,
        prevLat,
        prevLng,
        foodHotspot.latitude,
        foodHotspot.longitude,
        input.transportMode
      );
      const foodTravel = foodRouting.minutes;
      const foodArrival = addMinutes(currentTime, foodTravel);
      const foodStraight = foodRouting.straightLineDistanceKm ?? 0;
      const foodRoad = foodRouting.estimatedRoadDistanceKm ?? 0;
      totalTravelMinutes += foodTravel;
      totalVisitMinutes += foodDuration;
      totalStraightDistanceKm += foodStraight;
      totalRoadDistanceKm += foodRoad;

      const foodCaveats: string[] = [];
      if (foodHotspot.verificationStatus === "demo") {
        foodCaveats.push("Demo food record — verify timings before visiting.");
      }
      if (foodTravel > 25) {
        foodCaveats.push(`Detour travel to this food stop is ~${foodTravel} mins.`);
      }

      seenPlaceIds.add(foodHotspot.id);
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
        straightLineDistanceKmFromPrevious: foodStraight,
        estimatedRoadDistanceKmFromPrevious: foodRoad,
        routingMethodology: foodRouting.methodology,
        navigationUrl:
          foodHotspot.latitude && foodHotspot.longitude
            ? getExternalNavigationUrl(
                foodHotspot.latitude,
                foodHotspot.longitude,
                prevLat,
                prevLng,
                input.transportMode
              )
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
      foodInserted = true;
    }

    // Deduplicate against already added stops
    if (seenPlaceIds.has(pandal.id)) {
      continue;
    }
    seenPlaceIds.add(pandal.id);

    // Now process the pandal stop
    const routingRes = safeEstimateTravel(
      routingProvider,
      prevLat,
      prevLng,
      pandal.latitude,
      pandal.longitude,
      input.transportMode
    );
    const travelMins = routingRes.minutes;
    const arrivalTime = addMinutes(currentTime, travelMins);
    const visitMins = Math.max(15, pandal.recommendedVisitMinutes + visitDelta);
    const departureTime = addMinutes(arrivalTime, visitMins);
    const pandalStraight = routingRes.straightLineDistanceKm ?? 0;
    const pandalRoad = routingRes.estimatedRoadDistanceKm ?? 0;

    totalTravelMinutes += travelMins;
    totalVisitMinutes += visitMins;
    totalStraightDistanceKm += pandalStraight;
    totalRoadDistanceKm += pandalRoad;

    const caveats: string[] = [];
    if (pandal.dataConfidence === "demo") {
      caveats.push("Demo record. Seasonal details may shift during Durga Puja.");
    }
    if (pandal.crowdLevel === "very_high") {
      caveats.push("Expect high crowd density. Expect queuing at sanctum entrance.");
    }
    if (pandal.bestVisitTime) {
      caveats.push(`Optimal visit window: ${pandal.bestVisitTime}`);
    }
    if (input.transportMode === "walking" && travelMins > 20) {
      caveats.push(
        `Walking segment is ~${travelMins} mins; consider an auto or rickshaw for this stretch.`
      );
    }
    if (input.requiresAccessibility) {
      if (pandal.accessibilityConfidence === "verified_accessible") {
        caveats.push("Wheelchair ramp / step-free queue confirmed.");
      } else {
        caveats.push(
          "Step-free accessibility unverified; temporary bamboo ramps may require volunteer aid."
        );
      }
    }

    // Personalized recommendation reason
    const matchedTags = pandal.experienceTags.filter((t) =>
      input.experienceTags.includes(t as ExperienceTag)
    );
    let reason = "";
    if (input.lockedStopIds.includes(pandal.id)) {
      reason = "Preserved as a locked must-visit stop.";
    } else if (matchedTags.length > 0) {
      reason = `Selected for your interest in ${matchedTags.map(getTagLabel).join(", ")}.`;
    } else if (pandal.featured) {
      reason = `Premier Kolkata Puja landmark located conveniently along your route.`;
    } else {
      reason = `Well-situated cultural venue ensuring efficient festival flow.`;
    }

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
      straightLineDistanceKmFromPrevious: pandalStraight,
      estimatedRoadDistanceKmFromPrevious: pandalRoad,
      routingMethodology: routingRes.methodology,
      navigationUrl:
        pandal.latitude && pandal.longitude
          ? getExternalNavigationUrl(
              pandal.latitude,
              pandal.longitude,
              prevLat,
              prevLng,
              input.transportMode
            )
          : undefined,
      approximateArrivalTime: arrivalTime,
      dataConfidence: pandal.dataConfidence,
      caveats,
      locked: input.lockedStopIds.includes(pandal.id),
      tags: pandal.experienceTags,
    });

    currentTime = departureTime;
    prevLat = pandal.latitude;
    prevLng = pandal.longitude;
  }

  // Handle case where food was not inserted yet (e.g. single pandal or 0 pandals)
  if (
    input.includeFood &&
    foodHotspot &&
    !foodInserted
  ) {
    const foodRouting = safeEstimateTravel(
      routingProvider,
      prevLat,
      prevLng,
      foodHotspot.latitude,
      foodHotspot.longitude,
      input.transportMode
    );
    const foodTravel = foodRouting.minutes;
    const foodArrival = addMinutes(currentTime, foodTravel);
    totalTravelMinutes += foodTravel;
    totalVisitMinutes += foodDuration;

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
      navigationUrl:
        foodHotspot.latitude && foodHotspot.longitude
          ? getExternalNavigationUrl(
              foodHotspot.latitude,
              foodHotspot.longitude,
              prevLat,
              prevLng,
              input.transportMode
            )
          : undefined,
      approximateArrivalTime: foodArrival,
      dataConfidence: foodHotspot.confidence,
      caveats: [],
      locked: false,
      foodCategories: foodHotspot.foodCategory,
      tags: foodHotspot.foodCategory as any,
    });

    currentTime = addMinutes(foodArrival, foodDuration);
  }

  const totalMinutes = totalTravelMinutes + totalVisitMinutes;

  // Validation Warnings
  if (itineraryStops.length === 0) {
    warnings.push(
      "No stops could be scheduled within your parameters. Try increasing duration or adjusting locality/filters."
    );
  } else if (totalMinutes > input.availableMinutes * 1.25) {
    warnings.push(
      `Total itinerary duration (~${totalMinutes} mins) exceeds your allocated time (${input.availableMinutes} mins). Consider dropping a stop.`
    );
  }

  const summary: ItinerarySummary = {
    totalStops: itineraryStops.length,
    estimatedTotalMinutes: totalMinutes,
    estimatedTravelMinutes: totalTravelMinutes,
    estimatedVisitMinutes: totalVisitMinutes,
    totalStraightLineDistanceKm: Number(totalStraightDistanceKm.toFixed(2)),
    totalEstimatedRoadDistanceKm: Number(totalRoadDistanceKm.toFixed(2)),
    approximateEndTime: currentTime,
    routingMethodology: routingProvider.name.includes("Google")
      ? "provider_verified"
      : "urban_heuristic",
    isEstimated: true,
    isApproximate: true,
    approximationExplanation: routingProvider.name.includes("Google")
      ? "Routes verified via external provider; timings reflect baseline conditions."
      : "Distances and travel times use defensible urban heuristics (1.6x street network expansion factor) calibrated for Kolkata festival movement. Real-world times will vary with pedestrian queue density and local police traffic diversions.",
    warnings,
    unmetConstraints,
    dataConfidence: computeConfidence(itineraryStops),
  };

  const diagnostics: PlanningDiagnostics = {
    resolvedOrigin: input.startingCoordinates,
    totalCandidatesConsidered: diagnosticsDraft.totalConsidered,
    hardExcludedCount: diagnosticsDraft.excludedCount,
    candidatesScored: diagnosticsDraft.scoredCount,
    selectedPandalCount: orderedPandals.length,
    foodIncluded: input.includeFood && foodHotspot != null,
    foodHotspotSelected: foodHotspot?.name,
    routingProviderUsed: routingProvider.name,
    durationBudgetRequested: input.availableMinutes,
    durationEstimatedTotal: totalMinutes,
    preferenceInfluences,
  };

  const itinerary: GeneratedItinerary = {
    id: nanoid(),
    createdAt: new Date().toISOString(),
    preferences: {
      startingLocality: input.startingLocality,
      startingLatitude: input.startingCoordinates.latitude,
      startingLongitude: input.startingCoordinates.longitude,
      availableMinutes: input.availableMinutes,
      date: input.date,
      startTime: input.startTime,
      experienceTags: input.experienceTags,
      transportMode: input.transportMode,
      includeFood: input.includeFood,
      foodCategories: input.foodCategories,
      dietaryRestrictions: input.dietaryRestrictions,
      maxBudget: input.maxBudget,
      walkingTolerance: input.walkingTolerance,
      pacing: input.pacing,
      targetStopCount: input.targetStopCount,
      requiresAccessibility: input.requiresAccessibility,
      lockedStopIds: input.lockedStopIds,
      excludedPlaceIds: input.excludedPlaceIds,
    },
    stops: itineraryStops,
    summary,
    unmetConstraints,
  };

  return { itinerary, diagnostics };
}
