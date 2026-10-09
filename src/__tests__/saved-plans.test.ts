import {
  savePlan,
  getSavedPlans,
  getSavedPlanById,
  deletePlan,
  renamePlan,
  getShareableUrl,
  decodeSharedItinerary,
  STORAGE_KEY,
} from "@/lib/saved-plans";
import type { GeneratedItinerary } from "@/types";

describe("Saved Plans & Failure Recovery", () => {
  let storageMock: Record<string, string> = {};

  const mockLocalStorage = {
    getItem: jest.fn((key: string) => storageMock[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      storageMock[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storageMock[key];
    }),
    clear: jest.fn(() => {
      storageMock = {};
    }),
  };

  beforeAll(() => {
    (global as any).window = global;
    (global as any).localStorage = mockLocalStorage;
  });

  beforeEach(() => {
    storageMock = {};
    jest.clearAllMocks();
  });

  const sampleItinerary: GeneratedItinerary = {
    id: "itinerary-test-1",
    createdAt: "2026-10-10T10:00:00Z",
    preferences: {
      startingLocality: "North Kolkata",
      availableMinutes: 180,
      date: "2026-10-10",
      startTime: "16:00",
      experienceTags: ["traditional"],
      transportMode: "walking",
      includeFood: false,
    },
    stops: [
      {
        id: "stop-1",
        placeId: "kumartuli-park-2026",
        placeType: "pandal",
        placeName: "Kumartuli Park Sarbojanin",
        placeNameBengali: "কুমোরটুলি পার্ক সার্বজনীন",
        locality: "Kumartuli",
        latitude: 22.5998,
        longitude: 88.3622,
        estimatedVisitMinutes: 45,
        estimatedTravelMinutesFromPrevious: 0,
        tags: ["traditional", "artistic"],
        locked: false,
        recommendationReason: "Traditional idol making heritage",
        dataConfidence: "verified",
      },
    ],
    summary: {
      totalStops: 1,
      estimatedTotalMinutes: 45,
      estimatedTravelMinutes: 0,
      estimatedVisitMinutes: 45,
      approximateEndTime: "16:45",
      isEstimated: true,
      routingMethodology: "urban_heuristic",
      warnings: [],
      unmetConstraints: [],
      dataConfidence: "verified",
    },
  };

  it("saves a valid plan and includes schema version 1", () => {
    const saved = savePlan(sampleItinerary, "My North Kolkata Tour");
    expect(saved.id).toBeDefined();
    expect(saved.name).toBe("My North Kolkata Tour");
    expect(saved.version).toBe(1);
    expect(saved.savedAt).toBeDefined();

    const all = getSavedPlans();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("My North Kolkata Tour");
  });

  it("retrieves a saved plan by ID", () => {
    const saved = savePlan(sampleItinerary, "Lookup Tour");
    const retrieved = getSavedPlanById(saved.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe("Lookup Tour");
    expect(retrieved?.itinerary.stops[0].placeNameBengali).toBe("কুমোরটুলি পার্ক সার্বজনীন");
  });

  it("renames an existing plan", () => {
    const saved = savePlan(sampleItinerary, "Old Name");
    const updated = renamePlan(saved.id, "Festive Gold Evening");
    expect(updated).not.toBeNull();
    expect(updated?.name).toBe("Festive Gold Evening");

    const retrieved = getSavedPlanById(saved.id);
    expect(retrieved?.name).toBe("Festive Gold Evening");
  });

  it("deletes a plan by ID", () => {
    const saved = savePlan(sampleItinerary, "Plan to Delete");
    expect(getSavedPlans()).toHaveLength(1);

    const success = deletePlan(saved.id);
    expect(success).toBe(true);
    expect(getSavedPlans()).toHaveLength(0);
  });

  it("handles corrupted JSON in localStorage gracefully without throwing", () => {
    storageMock[STORAGE_KEY] = "{ invalid json string ";
    const plans = getSavedPlans();
    expect(plans).toEqual([]);
  });

  it("filters out invalid/corrupt individual plan objects", () => {
    storageMock[STORAGE_KEY] = JSON.stringify([
      { corruptField: true }, // missing id, itinerary, etc.
      {
        id: "valid-1",
        name: "Valid Plan",
        savedAt: "2026-10-10",
        version: 1,
        itinerary: sampleItinerary,
      },
    ]);
    const plans = getSavedPlans();
    expect(plans).toHaveLength(1);
    expect(plans[0].id).toBe("valid-1");
  });

  describe("Shareable URL encoding and decoding", () => {
    it("safely encodes itineraries containing authentic Bengali unicode text", () => {
      const shareUrl = getShareableUrl(sampleItinerary);
      expect(shareUrl).toContain("?share=");
      // It should not throw DOMException (URI malformed / btoa character bounds)
      const token = shareUrl.split("?share=")[1];
      expect(token).toBeTruthy();
    });

    it("accurately decodes shared itinerary token preserving Bengali text and stops", () => {
      const shareUrl = getShareableUrl(sampleItinerary);
      const token = shareUrl.split("?share=")[1];
      const decoded = decodeSharedItinerary(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.stops).toHaveLength(1);
      expect(decoded?.stops[0].placeNameBengali).toBe("কুমোরটুলি পার্ক সার্বজনীন");
      expect(decoded?.preferences.startingLocality).toBe("North Kolkata");
    });

    it("returns null on malformed share tokens without crashing", () => {
      const invalidDecoded = decodeSharedItinerary("NOT_A_VALID_BASE64!!!");
      expect(invalidDecoded).toBeNull();
    });
  });
});
