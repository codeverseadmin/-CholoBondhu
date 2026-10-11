import {
  generateItinerary,
  generateItineraryWithDiagnostics,
  runPlanningPipeline,
} from "@/lib/itinerary-engine";
import { HeuristicRoutingProvider, type RoutingProvider } from "@/lib/routing-provider";
import type { ItineraryPreferences, PandalPlace } from "@/types";
import { PANDAL_DATA } from "@/data/pandals";

describe("Provider-Independent Itinerary Planning", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GOOGLE_MAPS_SERVER_API_KEY;
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const basePrefs: ItineraryPreferences = {
    startingLocality: "Shyambazar / Kumartuli (North)",
    availableMinutes: 240,
    date: "2026-10-10",
    startTime: "10:00",
    experienceTags: ["traditional", "heritage"],
    transportMode: "walking",
    includeFood: false,
    walkingTolerance: "moderate",
    pacing: "standard",
  };

  it("1. Generates a complete, high-quality itinerary with ZERO Google API keys configured", () => {
    expect(process.env.GOOGLE_MAPS_SERVER_API_KEY).toBeUndefined();
    expect(process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY).toBeUndefined();

    const plan = generateItinerary(basePrefs);

    expect(plan).toBeDefined();
    expect(plan.stops.length).toBeGreaterThanOrEqual(2);
    expect(plan.summary.totalStops).toBe(plan.stops.length);
    expect(plan.summary.routingMethodology).toBe("urban_heuristic");
    expect(plan.summary.isEstimated).toBe(true);
    expect(plan.summary.isApproximate).toBe(true);
    expect(plan.summary.approximationExplanation).toBeDefined();
    expect(plan.summary.approximationExplanation).toContain("urban heuristics");
  });

  it("2. Distinguishes straight-line distance from road distance for each leg and in summary", () => {
    const plan = generateItinerary(basePrefs);

    // Summary reports both metrics
    expect(plan.summary.totalStraightLineDistanceKm).toBeDefined();
    expect(plan.summary.totalEstimatedRoadDistanceKm).toBeDefined();
    expect(plan.summary.totalEstimatedRoadDistanceKm!).toBeGreaterThanOrEqual(
      plan.summary.totalStraightLineDistanceKm!
    );

    // Each leg reports both distances
    const legsWithDistance = plan.stops.filter((s) => s.straightLineDistanceKmFromPrevious != null);
    expect(legsWithDistance.length).toBeGreaterThan(0);

    for (const leg of legsWithDistance) {
      expect(leg.estimatedRoadDistanceKmFromPrevious).toBeDefined();
      expect(leg.estimatedRoadDistanceKmFromPrevious!).toBeGreaterThanOrEqual(
        leg.straightLineDistanceKmFromPrevious!
      );
    }
  });

  it("3. Prevents duplicate stops when locked stops and candidate pools overlap", () => {
    const lockedPandal = PANDAL_DATA[0]; // e.g. kumartuli-park-2026
    const prefsWithLock: ItineraryPreferences = {
      ...basePrefs,
      lockedStopIds: [lockedPandal.id],
    };

    const plan = generateItinerary(prefsWithLock);
    const stopIds = plan.stops.map((s) => s.placeId);
    const uniqueStopIds = new Set(stopIds);

    expect(stopIds.length).toBe(uniqueStopIds.size);
    expect(stopIds).toContain(lockedPandal.id);
  });

  it("4. Handles empty candidate pools gracefully without crashing", () => {
    const emptyResult = runPlanningPipeline(
      basePrefs,
      undefined,
      undefined,
      [] // empty custom candidates
    );

    expect(emptyResult.itinerary).toBeDefined();
    expect(emptyResult.itinerary.stops.length).toBe(0);
    expect(emptyResult.itinerary.summary.warnings.length).toBeGreaterThan(0);
    expect(
      emptyResult.itinerary.summary.warnings.some((w) =>
        w.includes("No stops could be scheduled")
      )
    ).toBe(true);
  });

  it("5. Handles candidates with invalid, null, or out-of-range coordinates gracefully", () => {
    const corruptedCandidates: PandalPlace[] = [
      {
        ...PANDAL_DATA[0],
        id: "corrupted_1",
        latitude: NaN as any,
        longitude: undefined as any,
      },
      {
        ...PANDAL_DATA[1],
        id: "corrupted_2",
        latitude: -999,
        longitude: 999,
      },
      {
        ...PANDAL_DATA[2],
        id: "valid_stop",
      },
    ];

    const result = runPlanningPipeline(
      basePrefs,
      undefined,
      undefined,
      corruptedCandidates
    );

    expect(result.itinerary).toBeDefined();
    // Valid stops should still be processed without throwing
    expect(result.itinerary.stops.length).toBeGreaterThan(0);
  });

  it("6. Respects user time constraints between short budgets and long budgets", () => {
    const briefPlan = generateItinerary({
      ...basePrefs,
      availableMinutes: 60,
    });

    const extendedPlan = generateItinerary({
      ...basePrefs,
      availableMinutes: 360,
    });

    expect(briefPlan.stops.length).toBeLessThanOrEqual(extendedPlan.stops.length);
    expect(briefPlan.summary.estimatedTotalMinutes).toBeLessThanOrEqual(90);
  });

  it("7. Clusters stops geographically near the specified starting locality", () => {
    const northPlan = generateItinerary({
      ...basePrefs,
      startingLocality: "Shyambazar / Kumartuli (North)",
    });

    const southPlan = generateItinerary({
      ...basePrefs,
      startingLocality: "South Kolkata (Ballygunge / Ekdalia)",
    });

    // North plan stops should be primarily North of latitude 22.56
    const northStops = northPlan.stops.filter((s) => s.latitude != null);
    const southStops = southPlan.stops.filter((s) => s.latitude != null);

    const avgNorthLat = northStops.reduce((acc, s) => acc + s.latitude!, 0) / northStops.length;
    const avgSouthLat = southStops.reduce((acc, s) => acc + s.latitude!, 0) / southStops.length;

    expect(avgNorthLat).toBeGreaterThan(avgSouthLat);
  });

  it("8. Activates defensible urban heuristic fallback when routing provider fails", () => {
    class FailingProvider implements RoutingProvider {
      name = "Failing Mock Provider";
      methodology = "failing_mock";
      isEstimated = false;

      estimateTravel(): any {
        throw new Error("Provider simulated network drop");
      }
    }

    const failingProvider = new FailingProvider();
    const plan = generateItinerary(basePrefs, undefined, failingProvider);

    expect(plan).toBeDefined();
    expect(plan.stops.length).toBeGreaterThan(0);
    // Should fall back cleanly without crashing
    expect(plan.summary.routingMethodology).toBe("urban_heuristic");
  });
});
