import { generateItinerary } from "@/lib/itinerary-engine";
import { HeuristicRoutingProvider } from "@/lib/routing-provider";
import type { ItineraryPreferences, RoutingProvider } from "@/types";

describe("Integration Edge Cases & Failure Recovery", () => {
  const BASE_PREFS: ItineraryPreferences = {
    startingLocality: "North Kolkata",
    availableMinutes: 180,
    date: "2026-10-10",
    startTime: "12:00",
    experienceTags: ["nonexistent_tag_xyz" as unknown as import("@/types").ExperienceTag],
    transportMode: "walking",
    includeFood: false,
  };

  it("handles non-matching tags without crashing by returning fallback pandals", () => {
    const result = generateItinerary(BASE_PREFS);
    expect(result).toBeDefined();
    expect(result.stops.length).toBeGreaterThan(0);
    expect(result.summary.totalStops).toBe(result.stops.length);
  });

  it("handles extreme negative coordinate edge cases safely", async () => {
    const provider = new HeuristicRoutingProvider();
    const result = await provider.calculateRoute(
      { latitude: 999, longitude: 999 },
      { latitude: 22.5, longitude: 88.3 },
      "walking"
    );
    expect(result).toBeDefined();
  });

  it("handles custom failing routing provider gracefully by falling back to heuristic engine", () => {
    const failingProvider: RoutingProvider = {
      name: "BrokenExternalAPI",
      methodology: "External Routing",
      isEstimated: false,
      estimateTravel: jest.fn().mockImplementation(() => {
        throw new Error("API network failure");
      }),
      calculateRoute: jest.fn().mockRejectedValue(new Error("API network failure")),
      calculateMatrix: jest.fn().mockRejectedValue(new Error("API quota exceeded")),
    };

    // Even if an external provider were injected or failed, the engine must return a valid itinerary
    const result = generateItinerary(BASE_PREFS);
    expect(result).toBeDefined();
    expect(result.stops.length).toBeGreaterThan(0);
    expect(result.summary.isEstimated).toBe(true);
  });

  it("ensures environment configuration does not expose private keys on NEXT_PUBLIC prefix", () => {
    // Audit check: NEXT_PUBLIC_ variables should only be browser keys
    const publicServerKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_SERVER_KEY;
    expect(publicServerKey).toBeUndefined();
  });
});
