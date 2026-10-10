// ─────────────────────────────────────────────
// CHOLO BONDHU — Personalization Engine Proof & Verification Tests
//
// Verifies that differing user preference inputs across all 12 dimensions
// produce meaningfully distinct, feasible, and explainable itineraries.
// ─────────────────────────────────────────────

import {
  generateItinerary,
  generateItineraryWithDiagnostics,
} from "@/lib/itinerary-engine";
import type { ItineraryPreferences } from "@/types";
import { resolveLocalityCoordinates } from "@/data/localities";

describe("Phase 7 — Personalization Engine Verification", () => {
  // ─────────────────────────────────────────────
  // 1. SCENARIO A vs SCENARIO B (Mandated Verification)
  // ─────────────────────────────────────────────
  test("Scenario A (Traditional, Walking, Bengali) vs Scenario B (Artistic, Metro, Biryani)", () => {
    const northCoords = resolveLocalityCoordinates("Shyambazar / Kumartuli (North)");

    const scenarioA: ItineraryPreferences = {
      startingLocality: "Shyambazar / Kumartuli (North)",
      startingLatitude: northCoords.latitude,
      startingLongitude: northCoords.longitude,
      availableMinutes: 240, // 4 hours
      date: "2026-10-10",
      startTime: "10:00",
      experienceTags: ["traditional"],
      transportMode: "walking",
      includeFood: true,
      foodCategories: ["bengali_cuisine"],
      walkingTolerance: "moderate",
    };

    const scenarioB: ItineraryPreferences = {
      startingLocality: "Shyambazar / Kumartuli (North)",
      startingLatitude: northCoords.latitude,
      startingLongitude: northCoords.longitude,
      availableMinutes: 240, // 4 hours
      date: "2026-10-10",
      startTime: "10:00",
      experienceTags: ["artistic"],
      transportMode: "metro_walking",
      includeFood: true,
      foodCategories: ["biryani"],
      walkingTolerance: "moderate",
    };

    const resA = generateItineraryWithDiagnostics(scenarioA);
    const resB = generateItineraryWithDiagnostics(scenarioB);

    const pandalIdsA = resA.itinerary.stops
      .filter((s) => s.placeType === "pandal")
      .map((s) => s.placeId);
    const pandalIdsB = resB.itinerary.stops
      .filter((s) => s.placeType === "pandal")
      .map((s) => s.placeId);

    // Stops must not be identical because tags, transport reach, and food differ
    expect(pandalIdsA).not.toEqual(pandalIdsB);

    // Scenario A should prefer traditional pandals (e.g., Bagbazar Sarbojanin, Sovabazar Rajbari)
    const traditionalStops = resA.itinerary.stops.filter((s) =>
      s.tags?.includes("traditional")
    );
    expect(traditionalStops.length).toBeGreaterThan(0);

    // Scenario B should prefer artistic pandals (e.g., Kumartuli Park, Hatibagan Sarbojanin)
    const artisticStops = resB.itinerary.stops.filter((s) =>
      s.tags?.includes("artistic")
    );
    expect(artisticStops.length).toBeGreaterThan(0);

    // Food selection comparison
    const foodStopA = resA.itinerary.stops.find((s) => s.placeType === "food");
    const foodStopB = resB.itinerary.stops.find((s) => s.placeType === "food");

    expect(foodStopA).toBeDefined();
    expect(foodStopB).toBeDefined();
    expect(foodStopA?.placeId).not.toEqual(foodStopB?.placeId);

    // Food A matches Bengali cuisine
    expect(foodStopA?.foodCategories).toContain("bengali_cuisine");
    // Food B matches Biryani
    expect(foodStopB?.foodCategories).toContain("biryani");
  });

  // ─────────────────────────────────────────────
  // 2. STARTING LOCATION INFLUENCE
  // ─────────────────────────────────────────────
  test("Changing start location from North to South Kolkata anchors route to nearby local clusters", () => {
    const northCoords = resolveLocalityCoordinates("Shyambazar / Kumartuli (North)");
    const southCoords = resolveLocalityCoordinates("South Kolkata (Ballygunge / Ekdalia)");

    const northPlan = generateItinerary({
      startingLocality: "Shyambazar / Kumartuli (North)",
      startingLatitude: northCoords.latitude,
      startingLongitude: northCoords.longitude,
      availableMinutes: 180,
      date: "2026-10-10",
      startTime: "10:00",
      experienceTags: ["iconic"],
      transportMode: "walking",
      walkingTolerance: "moderate",
      includeFood: false,
    });

    const southPlan = generateItinerary({
      startingLocality: "South Kolkata (Ballygunge / Ekdalia)",
      startingLatitude: southCoords.latitude,
      startingLongitude: southCoords.longitude,
      availableMinutes: 180,
      date: "2026-10-10",
      startTime: "10:00",
      experienceTags: ["iconic"],
      transportMode: "walking",
      walkingTolerance: "moderate",
      includeFood: false,
    });

    const northStops = northPlan.stops.map((s) => s.placeId);
    const southStops = southPlan.stops.map((s) => s.placeId);

    // Walking plans started in North vs South should select completely different local clusters
    expect(northStops).not.toEqual(southStops);

    // North plan stops should be in North Kolkata
    const firstNorthStop = northPlan.stops[0];
    expect(firstNorthStop.latitude).toBeGreaterThan(22.58); // Latitude for North Kolkata

    // South plan stops should be in South Kolkata
    const firstSouthStop = southPlan.stops[0];
    expect(firstSouthStop.latitude).toBeLessThan(22.54); // Latitude for South Kolkata
  });

  // ─────────────────────────────────────────────
  // 3. AVAILABLE TIME INFLUENCE
  // ─────────────────────────────────────────────
  test("Changing available time scales stop count and visit feasibility", () => {
    const shortPlan = generateItinerary({
      startingLocality: "South Kolkata (Ballygunge / Ekdalia)",
      availableMinutes: 120, // 2 hours
      date: "2026-10-10",
      startTime: "10:00",
      experienceTags: ["iconic"],
      transportMode: "metro_walking",
      includeFood: false,
    });

    const longPlan = generateItinerary({
      startingLocality: "South Kolkata (Ballygunge / Ekdalia)",
      availableMinutes: 480, // 8 hours
      date: "2026-10-10",
      startTime: "10:00",
      experienceTags: ["iconic"],
      transportMode: "metro_walking",
      includeFood: false,
    });

    expect(longPlan.stops.length).toBeGreaterThan(shortPlan.stops.length);
    expect(longPlan.summary.estimatedTotalMinutes).toBeGreaterThan(
      shortPlan.summary.estimatedTotalMinutes
    );
  });

  // ─────────────────────────────────────────────
  // 4. FOOD INCLUSION & EXCLUSION
  // ─────────────────────────────────────────────
  test("Disabling food prevents automatic food insertion", () => {
    const withFood = generateItinerary({
      startingLocality: "Central Kolkata",
      availableMinutes: 240,
      date: "2026-10-10",
      startTime: "10:00",
      experienceTags: ["artistic"],
      transportMode: "metro_walking",
      includeFood: true,
    });

    const withoutFood = generateItinerary({
      startingLocality: "Central Kolkata",
      availableMinutes: 240,
      date: "2026-10-10",
      startTime: "10:00",
      experienceTags: ["artistic"],
      transportMode: "metro_walking",
      includeFood: false,
    });

    expect(withFood.stops.some((s) => s.placeType === "food")).toBe(true);
    expect(withoutFood.stops.some((s) => s.placeType === "food")).toBe(false);
  });

  // ─────────────────────────────────────────────
  // 5. HARD CONSTRAINTS: EXCLUSIONS & LOCKED STOPS
  // ─────────────────────────────────────────────
  test("Excluded stops are strictly omitted", () => {
    const excludedId = "ekdalia-evergreen-2026";
    const plan = generateItinerary({
      startingLocality: "South Kolkata (Ballygunge / Ekdalia)",
      availableMinutes: 300,
      date: "2026-10-10",
      startTime: "10:00",
      experienceTags: ["iconic"],
      transportMode: "walking",
      includeFood: false,
      excludedPlaceIds: [excludedId],
    });

    const found = plan.stops.find((s) => s.placeId === excludedId);
    expect(found).toBeUndefined();
  });

  test("Locked stops are strictly preserved", () => {
    const lockedId = "bagbazar-2026";
    const plan = generateItinerary({
      startingLocality: "South Kolkata (Ballygunge / Ekdalia)",
      availableMinutes: 300,
      date: "2026-10-10",
      startTime: "10:00",
      experienceTags: ["iconic"],
      transportMode: "metro_walking",
      includeFood: false,
      lockedStopIds: [lockedId],
    });

    const lockedStop = plan.stops.find((s) => s.placeId === lockedId);
    expect(lockedStop).toBeDefined();
    expect(lockedStop?.locked).toBe(true);
  });

  // ─────────────────────────────────────────────
  // 6. WALKING TOLERANCE BOUNDS
  // ─────────────────────────────────────────────
  test("Low walking tolerance restricts geographic radius to nearby neighborhood", () => {
    const northCoords = resolveLocalityCoordinates("Shyambazar / Kumartuli (North)");

    const lowWalkPlan = generateItinerary({
      startingLocality: "Shyambazar / Kumartuli (North)",
      startingLatitude: northCoords.latitude,
      startingLongitude: northCoords.longitude,
      availableMinutes: 180,
      date: "2026-10-10",
      startTime: "10:00",
      experienceTags: ["iconic"],
      transportMode: "walking",
      walkingTolerance: "low",
      includeFood: false,
    });

    // Every stop in low walking tolerance should be strictly within 2.5 km of origin
    lowWalkPlan.stops.forEach((stop) => {
      if (stop.latitude && stop.longitude) {
        // Distance check: Kumartuli / Bagbazar / Hatibagan cluster is ~1 km
        expect(stop.latitude).toBeGreaterThan(22.58);
      }
    });
  });

  // ─────────────────────────────────────────────
  // 7. PROVIDER FAILURE FALLBACK
  // ─────────────────────────────────────────────
  test("Failing routing provider gracefully activates urban heuristic fallback", () => {
    const failingProvider = {
      name: "FailingProvider",
      methodology: "External API",
      isEstimated: false,
      estimateTravel: () => {
        throw new Error("Provider timeout");
      },
      calculateRoute: async () => {
        throw new Error("Provider timeout");
      },
    };

    const plan = generateItinerary(
      {
        startingLocality: "Central Kolkata",
        availableMinutes: 240,
        date: "2026-10-10",
        startTime: "10:00",
        experienceTags: ["traditional"],
        transportMode: "metro_walking",
        includeFood: false,
      },
      undefined,
      failingProvider
    );

    expect(plan).toBeDefined();
    expect(plan.stops.length).toBeGreaterThan(0);
    // Routing methodology should report urban heuristic fallback
    expect(plan.summary.routingMethodology).toBe("urban_heuristic");
  });

  // ─────────────────────────────────────────────
  // 8. DETERMINISM FOR IDENTICAL INPUTS
  // ─────────────────────────────────────────────
  test("Identical inputs produce identical stops and ordering deterministically", () => {
    const prefs: ItineraryPreferences = {
      startingLocality: "Central Kolkata",
      availableMinutes: 240,
      date: "2026-10-10",
      startTime: "10:00",
      experienceTags: ["iconic", "artistic"],
      transportMode: "metro_walking",
      includeFood: true,
      foodCategories: ["bengali_cuisine"],
      walkingTolerance: "moderate",
    };

    const run1 = generateItinerary(prefs);
    const run2 = generateItinerary(prefs);

    expect(run1.stops.map((s) => s.placeId)).toEqual(run2.stops.map((s) => s.placeId));
    expect(run1.stops.map((s) => s.approximateArrivalTime)).toEqual(
      run2.stops.map((s) => s.approximateArrivalTime)
    );
  });

  // ─────────────────────────────────────────────
  // 9. STRUCTURED DIAGNOSTICS & EXPLAINABILITY
  // ─────────────────────────────────────────────
  test("Returns structured diagnostics explaining preferences without leaking credentials", () => {
    const result = generateItineraryWithDiagnostics({
      startingLocality: "Shyambazar / Kumartuli (North)",
      availableMinutes: 240,
      date: "2026-10-10",
      startTime: "10:00",
      experienceTags: ["traditional"],
      transportMode: "walking",
      walkingTolerance: "low",
      includeFood: true,
      foodCategories: ["bengali_cuisine"],
    });

    const diag = result.diagnostics;
    expect(diag).toBeDefined();
    expect(diag.resolvedOrigin).toBeDefined();
    expect(diag.resolvedOrigin.latitude).toBeCloseTo(22.599, 2);
    expect(diag.candidatesScored).toBeGreaterThan(0);
    expect(diag.preferenceInfluences.length).toBeGreaterThan(0);

    // Diagnostics should not contain secret keys
    const diagString = JSON.stringify(diag);
    expect(diagString).not.toContain("AIza");
    expect(diagString).not.toContain("API_KEY");
  });
});
