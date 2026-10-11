import {
  savePlan,
  getSavedPlans,
  getPlanById,
  deletePlan,
  renamePlan,
  getShareableUrl,
  decodeSharedItinerary,
  STORAGE_KEY,
} from "@/lib/saved-plans";
import type { GeneratedItinerary } from "@/types";

describe("Local Browser Storage Flow — Account-Free Persistence", () => {
  let mockStore: Record<string, string> = {};

  beforeAll(() => {
    const mockLocalStorage = {
      getItem: (key: string) => mockStore[key] || null,
      setItem: (key: string, value: string) => {
        mockStore[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
    };

    Object.defineProperty(global, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
    (global as any).window = global;
    (global as any).window.location = { origin: "http://localhost:3000" };
  });

  beforeEach(() => {
    mockStore = {};
  });

  const mockItinerary: GeneratedItinerary = {
    id: "route-local-1",
    createdAt: "2026-10-12T00:00:00Z",
    preferences: {
      startingLocality: "North Kolkata",
      startingMetroStationId: "shyambazar_blue",
      startingMetroStationName: "Shyambazar Metro (Blue Line)",
      availableMinutes: 180,
      date: "2026-10-12",
      startTime: "10:00",
      experienceTags: ["iconic", "traditional"],
      transportMode: "metro_walking",
      includeFood: true,
    },
    stops: [
      {
        id: "stop-baghbazar",
        placeId: "baghbazar-sarbojanin-2026",
        placeType: "pandal",
        placeName: "Baghbazar Sarbojanin Durgotsav & Exhibition",
        placeNameBengali: "বাগবাজার সার্বজনীন দুর্গোৎসব ও প্রদর্শনী",
        locality: "Baghbazar",
        latitude: 22.6033,
        longitude: 88.3664,
        recommendationReason: "Iconic historic heritage pujo",
        estimatedVisitMinutes: 45,
        estimatedTravelMinutesFromPrevious: 10,
        locked: false,
        dataConfidence: "verified",
        tags: ["iconic", "traditional"],
      },
    ],
    summary: {
      totalStops: 1,
      estimatedTotalMinutes: 60,
      estimatedTravelMinutes: 15,
      estimatedVisitMinutes: 45,
      warnings: [],
      unmetConstraints: [],
      dataConfidence: "verified",
    },
  };

  test("1. Saves an itinerary directly to browser localStorage with no network or auth token", () => {
    const saved = savePlan(mockItinerary, "উত্তর কলকাতা পুজো পরিক্রমা");
    expect(saved).toBeDefined();
    expect(saved.id).toBe("route-local-1");
    expect(saved.name).toBe("উত্তর কলকাতা পুজো পরিক্রমা");

    const raw = mockStore[STORAGE_KEY];
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
    expect(parsed[0].id).toBe("route-local-1");
    expect(parsed[0].itinerary.stops[0].placeNameBengali).toBe("বাগবাজার সার্বজনীন দুর্গোৎসব ও প্রদর্শনী");
  });

  test("2. Retrieves all saved plans from local browser storage", () => {
    savePlan(mockItinerary, "Plan 1");
    const plans = getSavedPlans();
    expect(plans.length).toBe(1);
    expect(plans[0].name).toBe("Plan 1");
    expect(plans[0].itinerary.stops.length).toBe(1);
  });

  test("3. Renames a saved plan locally", () => {
    savePlan(mockItinerary, "Initial Name");
    const renamed = renamePlan("route-local-1", "Updated Senior Heritage Walk");
    expect(renamed).toBeDefined();
    expect(renamed?.name).toBe("Updated Senior Heritage Walk");

    const retrieved = getPlanById("route-local-1");
    expect(retrieved?.name).toBe("Updated Senior Heritage Walk");
  });

  test("4. Deletes a saved plan locally from browser storage", () => {
    savePlan(mockItinerary, "To Be Deleted");
    expect(getSavedPlans().length).toBe(1);

    const deleted = deletePlan("route-local-1");
    expect(deleted).toBe(true);
    expect(getSavedPlans().length).toBe(0);
  });

  test("5. Encodes and decodes shareable offline link preserving Bengali characters", () => {
    const shareUrl = getShareableUrl(mockItinerary);
    expect(shareUrl).toContain("share=");

    const urlParams = new URL(shareUrl).searchParams;
    const shareParam = urlParams.get("share");
    expect(shareParam).not.toBeNull();

    const decoded = decodeSharedItinerary(shareParam!);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe("route-local-1");
    expect(decoded?.stops[0].placeNameBengali).toBe("বাগবাজার সার্বজনীন দুর্গোৎসব ও প্রদর্শনী");
  });

  test("6. Gracefully handles corrupted JSON in localStorage", () => {
    mockStore[STORAGE_KEY] = "{ corrupted invalid json [[[";
    const plans = getSavedPlans();
    expect(plans).toEqual([]);
  });
});
