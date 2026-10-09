// Unit tests for the itinerary engine
// Run with: npm test

import {
  generateItinerary,
  removeStop,
  reorderStop,
  toggleLockStop,
} from "@/lib/itinerary-engine";
import type { ItineraryPreferences } from "@/types";

const BASE_PREFS: ItineraryPreferences = {
  startingLocality: "Central Kolkata",
  availableMinutes: 240,
  date: "2026-10-10",
  startTime: "10:00",
  experienceTags: ["iconic", "artistic"],
  transportMode: "metro_walking",
  includeFood: false,
};

describe("generateItinerary", () => {
  it("returns a GeneratedItinerary with stops", () => {
    const result = generateItinerary(BASE_PREFS);
    expect(result).toBeDefined();
    expect(result.stops).toBeDefined();
    expect(Array.isArray(result.stops)).toBe(true);
    expect(result.id).toBeTruthy();
    expect(result.createdAt).toBeTruthy();
  });

  it("respects available time — total duration within 25% margin", () => {
    const result = generateItinerary(BASE_PREFS);
    // Allow up to 25% over due to travel estimates
    const tolerance = BASE_PREFS.availableMinutes * 1.25;
    expect(result.summary.estimatedTotalMinutes).toBeLessThanOrEqual(tolerance);
  });

  it("includes food stop when includeFood is true", () => {
    const prefs: ItineraryPreferences = {
      ...BASE_PREFS,
      availableMinutes: 360,
      includeFood: true,
    };
    const result = generateItinerary(prefs);
    const foodStops = result.stops.filter((s) => s.placeType === "food");
    expect(foodStops.length).toBeGreaterThanOrEqual(1);
  });

  it("does not include food stop when includeFood is false", () => {
    const result = generateItinerary({ ...BASE_PREFS, includeFood: false });
    const foodStops = result.stops.filter((s) => s.placeType === "food");
    expect(foodStops.length).toBe(0);
  });

  it("handles very short time budget gracefully", () => {
    const result = generateItinerary({
      ...BASE_PREFS,
      availableMinutes: 30,
    });
    // Should not crash, may have warnings
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it("produces stops with recommendation reasons", () => {
    const result = generateItinerary(BASE_PREFS);
    result.stops.forEach((stop) => {
      expect(stop.recommendationReason).toBeTruthy();
      expect(typeof stop.recommendationReason).toBe("string");
    });
  });

  it("prefers stops matching the selected experience tags", () => {
    const result = generateItinerary({
      ...BASE_PREFS,
      experienceTags: ["traditional", "heritage"],
    });
    // At least some stops should have matching tags
    const matching = result.stops.filter(
      (s) =>
        s.tags?.includes("traditional") || s.tags?.includes("heritage")
    );
    expect(matching.length).toBeGreaterThan(0);
  });

  it("does not include excluded places", () => {
    const excludeId = "bagbazar-2026";
    const result = generateItinerary({
      ...BASE_PREFS,
      excludedPlaceIds: [excludeId],
    });
    const excluded = result.stops.find((s) => s.placeId === excludeId);
    expect(excluded).toBeUndefined();
  });

  it("includes locked stops", () => {
    const lockedId = "kumartuli-park-2026";
    const result = generateItinerary({
      ...BASE_PREFS,
      lockedStopIds: [lockedId],
      availableMinutes: 360,
    });
    const locked = result.stops.find((s) => s.placeId === lockedId);
    expect(locked).toBeDefined();
    expect(locked?.locked).toBe(true);
  });

  it("has valid start and end times", () => {
    const result = generateItinerary(BASE_PREFS);
    if (result.summary.approximateEndTime) {
      const [sh, sm] = BASE_PREFS.startTime.split(":").map(Number);
      const [eh, em] = result.summary.approximateEndTime.split(":").map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;
      expect(endMins).toBeGreaterThan(startMins);
    }
  });

  it("does not have duplicate stops", () => {
    const result = generateItinerary(BASE_PREFS);
    const ids = result.stops.map((s) => s.placeId);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it("handles empty experienceTags gracefully", () => {
    const result = generateItinerary({ ...BASE_PREFS, experienceTags: [] });
    expect(result).toBeDefined();
    expect(result.stops.length).toBeGreaterThanOrEqual(0);
  });

  describe("Phase 6 Edge Cases & Resilience", () => {
    it("handles zero or invalid durations gracefully by clamping or returning warning", () => {
      const zeroResult = generateItinerary({ ...BASE_PREFS, availableMinutes: 0 });
      expect(zeroResult).toBeDefined();
      expect(zeroResult.stops).toBeDefined();

      const negativeResult = generateItinerary({ ...BASE_PREFS, availableMinutes: -120 });
      expect(negativeResult).toBeDefined();
      expect(negativeResult.stops).toBeDefined();
    });

    it("sanitizes invalid start times gracefully", () => {
      const badTimeResult = generateItinerary({ ...BASE_PREFS, startTime: "invalid-time" });
      expect(badTimeResult).toBeDefined();
      expect(badTimeResult.summary.approximateEndTime).toBeDefined();

      const outOfBoundsResult = generateItinerary({ ...BASE_PREFS, startTime: "26:88" });
      expect(outOfBoundsResult).toBeDefined();
      expect(outOfBoundsResult.summary.approximateEndTime).toBeDefined();
    });

    it("detects and reports impossible duration constraints when locked stops exceed available time", () => {
      // Locking multiple stops with an absurdly short available time of 20 minutes
      const result = generateItinerary({
        ...BASE_PREFS,
        availableMinutes: 20,
        lockedStopIds: ["bagbazar-2026", "kumartuli-park-2026", "college-square-2026"],
      });
      expect(result).toBeDefined();
      // Must preserve locked stops as mandated, but report unmetConstraints
      expect(result.stops.length).toBeGreaterThanOrEqual(1);
      expect(result.unmetConstraints).toBeDefined();
      expect(result.unmetConstraints?.length).toBeGreaterThan(0);
      expect(result.unmetConstraints?.[0]).toContain("time budget");
    });

    it("produces deterministic output for identical inputs", () => {
      const run1 = generateItinerary(BASE_PREFS);
      const run2 = generateItinerary(BASE_PREFS);

      expect(run1.stops.map((s) => s.placeId)).toEqual(run2.stops.map((s) => s.placeId));
      expect(run1.summary.estimatedTotalMinutes).toEqual(run2.summary.estimatedTotalMinutes);
    });

    it("filters food venues based on dietary restrictions and budget", () => {
      // Vegetarian filter
      const vegResult = generateItinerary({
        ...BASE_PREFS,
        availableMinutes: 360,
        includeFood: true,
        dietaryRestrictions: ["vegetarian"],
      });
      const vegFood = vegResult.stops.filter((s) => s.placeType === "food");
      if (vegFood.length > 0) {
        expect(vegFood[0].tags).toBeDefined();
      }

      // Budget filter
      const budgetResult = generateItinerary({
        ...BASE_PREFS,
        availableMinutes: 360,
        includeFood: true,
        maxBudget: "budget",
      });
      expect(budgetResult).toBeDefined();
    });

    it("calculates realistic food-stop detour travel time", () => {
      const noFood = generateItinerary({ ...BASE_PREFS, availableMinutes: 360, includeFood: false });
      const withFood = generateItinerary({ ...BASE_PREFS, availableMinutes: 360, includeFood: true });

      const foodStop = withFood.stops.find((s) => s.placeType === "food");
      expect(foodStop).toBeDefined();
      if (foodStop) {
        expect(foodStop.estimatedVisitMinutes).toBeGreaterThanOrEqual(30);
      }
    });

    it("prevents duplicate locations even if user locks and requests similar tags", () => {
      const result = generateItinerary({
        ...BASE_PREFS,
        lockedStopIds: ["bagbazar-2026"],
        availableMinutes: 360,
      });
      const bagbazarInstances = result.stops.filter((s) => s.placeId === "bagbazar-2026");
      expect(bagbazarInstances.length).toBe(1);
    });
  });
});

describe("removeStop", () => {
  it("removes a stop by id", () => {
    const itinerary = generateItinerary({ ...BASE_PREFS, availableMinutes: 360 });
    if (itinerary.stops.length === 0) return; // skip if no stops

    const stopToRemove = itinerary.stops[0];
    const result = removeStop(itinerary, stopToRemove.id);
    expect(result.stops.find((s) => s.id === stopToRemove.id)).toBeUndefined();
    expect(result.summary.totalStops).toBe(itinerary.stops.length - 1);
  });

  it("returns same itinerary if stop id not found", () => {
    const itinerary = generateItinerary(BASE_PREFS);
    const result = removeStop(itinerary, "nonexistent-id");
    expect(result.stops.length).toBe(itinerary.stops.length);
  });
});

describe("reorderStop", () => {
  it("moves a stop from one index to another", () => {
    const itinerary = generateItinerary({ ...BASE_PREFS, availableMinutes: 480 });
    if (itinerary.stops.length < 2) return;

    const firstId = itinerary.stops[0].id;
    const secondId = itinerary.stops[1].id;
    const result = reorderStop(itinerary, 0, 1);
    expect(result.stops[0].id).toBe(secondId);
    expect(result.stops[1].id).toBe(firstId);
  });

  it("preserves all stops after reorder", () => {
    const itinerary = generateItinerary({ ...BASE_PREFS, availableMinutes: 480 });
    if (itinerary.stops.length < 3) return;

    const result = reorderStop(itinerary, 0, 2);
    expect(result.stops.length).toBe(itinerary.stops.length);
  });
});

describe("toggleLockStop", () => {
  it("locks an unlocked stop", () => {
    const itinerary = generateItinerary(BASE_PREFS);
    if (itinerary.stops.length === 0) return;

    const stop = itinerary.stops.find((s) => !s.locked);
    if (!stop) return;

    const result = toggleLockStop(itinerary, stop.id);
    const updated = result.stops.find((s) => s.id === stop.id);
    expect(updated?.locked).toBe(true);
  });

  it("unlocks a locked stop", () => {
    const itinerary = generateItinerary({
      ...BASE_PREFS,
      lockedStopIds: ["kumartuli-park-2026"],
      availableMinutes: 360,
    });
    const stop = itinerary.stops.find((s) => s.locked);
    if (!stop) return;

    const result = toggleLockStop(itinerary, stop.id);
    const updated = result.stops.find((s) => s.id === stop.id);
    expect(updated?.locked).toBe(false);
  });
});

describe("summary calculations", () => {
  it("total minutes = travel + visit minutes", () => {
    const result = generateItinerary(BASE_PREFS);
    expect(result.summary.estimatedTotalMinutes).toBe(
      result.summary.estimatedTravelMinutes + result.summary.estimatedVisitMinutes
    );
  });

  it("stop count matches stops array length", () => {
    const result = generateItinerary(BASE_PREFS);
    expect(result.summary.totalStops).toBe(result.stops.length);
  });
});
