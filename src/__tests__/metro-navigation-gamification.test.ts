import {
  KOLKATA_METRO_STATIONS,
  getNearestMetroStation,
  getMetroStationById,
  resolveLocalityCoordinates,
} from "@/data/localities";
import { generateItinerary } from "@/lib/itinerary-engine";
import {
  calculateQuestProgress,
  loadQuestProgress,
  toggleStopInQuest,
  toggleMetroInQuest,
  resetQuest,
  getLevelForXp,
  XP_PER_METRO_CHECKIN,
  XP_PER_PANDAL_VISIT,
  XP_PER_FOOD_STOP,
  XP_ALL_STOPS_BONUS,
} from "@/lib/gamification";
import { buildMultiStopNavUrl } from "@/lib/navigation-links";
import type { GeneratedItinerary, ItineraryPreferences } from "@/types";

describe("Kolkata Metro Station Registry & Navigation Anchoring", () => {
  it("provides authoritative Metro station records across Blue and Green lines", () => {
    expect(KOLKATA_METRO_STATIONS.length).toBeGreaterThanOrEqual(15);

    const shyambazar = KOLKATA_METRO_STATIONS.find((m) => m.id === "metro-shyambazar");
    expect(shyambazar).toBeDefined();
    expect(shyambazar?.name).toContain("Shyambazar");
    expect(shyambazar?.lineCode).toBe("blue");
    expect(shyambazar?.gateGuidance).toContain("Gate 1");
    expect(shyambazar?.center.latitude).toBeCloseTo(22.6006, 2);

    const sealdah = KOLKATA_METRO_STATIONS.find((m) => m.id === "metro-sealdah");
    expect(sealdah).toBeDefined();
    expect(sealdah?.lineCode).toBe("green");
    expect(sealdah?.gateGuidance).toContain("Sealdah Railway Station");
  });

  it("correctly identifies the nearest metro station for various Kolkata points", () => {
    // Kumartuli area in North Kolkata -> Shyambazar or Sovabazar Metro
    const northNearest = getNearestMetroStation(22.599, 88.369);
    expect(["metro-shyambazar", "metro-sovabazar"]).toContain(northNearest.id);

    // Deshapriya Park / Rashbehari in South Kolkata -> Kalighat Metro
    const southNearest = getNearestMetroStation(22.519, 88.353);
    expect(southNearest.id).toBe("metro-kalighat");

    // Salt Lake Sector V in East Kolkata -> Sector V or Karunamoyee
    const eastNearest = getNearestMetroStation(22.580, 88.433);
    expect(["metro-saltlake-sector-v", "metro-karunamoyee"]).toContain(eastNearest.id);
  });

  it("resolves coordinates accurately when a metro station name or ID is supplied", () => {
    const coords1 = resolveLocalityCoordinates("Shyambazar Metro (Blue Line)");
    expect(coords1.latitude).toBeCloseTo(22.6006, 2);
    expect(coords1.longitude).toBeCloseTo(88.3712, 2);

    const coords2 = resolveLocalityCoordinates("metro-kalighat");
    expect(coords2.latitude).toBeCloseTo(22.5198, 2);
    expect(coords2.longitude).toBeCloseTo(88.3467, 2);
  });

  it("anchors generated itinerary to the starting metro station", () => {
    const prefs: ItineraryPreferences = {
      startingLocality: "Shyambazar Metro (Blue Line)",
      startingMetroStationId: "metro-shyambazar",
      availableMinutes: 240,
      date: "2026-10-18",
      startTime: "11:00",
      experienceTags: ["iconic", "traditional"],
      transportMode: "metro_walking",
      includeFood: true,
      pacing: "standard",
      walkingTolerance: "moderate",
      targetStopCount: 3,
    };

    const itinerary = generateItinerary(prefs);
    expect(itinerary.startingMetro).toBeDefined();
    expect(itinerary.startingMetro?.id).toBe("metro-shyambazar");
    expect(itinerary.startingMetro?.gateGuidance).toContain("Bhupen Bose Avenue");

    // First stop must have a navigation URL starting at the Metro station
    expect(itinerary.stops.length).toBeGreaterThan(0);
    const stop1 = itinerary.stops[0];
    if (stop1.latitude && stop1.longitude) {
      expect(stop1.navigationUrl).toBeDefined();
      expect(stop1.navigationUrl).toContain(String(itinerary.startingMetro?.center.latitude));
      expect(stop1.navigationUrl).toContain(String(itinerary.startingMetro?.center.longitude));
    }

    // Multi-stop navigation URL uses the Metro origin
    const validNavStops = itinerary.stops
      .filter((s) => s.latitude && s.longitude)
      .map((s) => ({ latitude: s.latitude!, longitude: s.longitude!, name: s.placeName }));

    const multiNav = buildMultiStopNavUrl(
      validNavStops,
      itinerary.startingMetro?.center,
      "metro_walking"
    );

    expect(multiNav.url).toContain(encodeURIComponent(`${itinerary.startingMetro?.center.latitude.toFixed(6)},${itinerary.startingMetro?.center.longitude.toFixed(6)}`));
  });
});

describe("Gamified Pujo Quest Engine & Checklist State", () => {
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

  const dummyItinerary: GeneratedItinerary = {
    id: "test-quest-itin-1",
    createdAt: new Date().toISOString(),
    preferences: {
      startingLocality: "Shyambazar Metro (Blue Line)",
      startingMetroStationId: "metro-shyambazar",
      availableMinutes: 180,
      date: "2026-10-18",
      startTime: "10:00",
      experienceTags: ["iconic"],
      transportMode: "metro_walking",
      includeFood: true,
    },
    startingMetro: {
      id: "metro-shyambazar",
      name: "Shyambazar Metro (Blue Line)",
      nameBengali: "শ্যামবাজার মেট্রো",
      line: "Blue Line (North-South)",
      lineCode: "blue",
      center: { latitude: 22.6006, longitude: 88.3712 },
      gateGuidance: "Gate 1 (Bhupen Bose Ave)",
      popularNearbyPandals: ["Bagbazar Sarbojanin"],
    },
    stops: [
      {
        id: "stop-1",
        placeId: "pandal-1",
        placeName: "Bagbazar Sarbojanin",
        placeType: "pandal",
        locality: "Bagbazar",
        latitude: 22.601,
        longitude: 88.368,
        recommendationReason: "Heritage puja",
        estimatedVisitMinutes: 30,
        dataConfidence: "verified",
        locked: false,
      },
      {
        id: "stop-2",
        placeId: "food-1",
        placeName: "Mitra Cafe (Shyambazar)",
        placeType: "food",
        locality: "Shyambazar",
        latitude: 22.602,
        longitude: 88.370,
        recommendationReason: "Festive chops & cutlets",
        estimatedVisitMinutes: 30,
        dataConfidence: "verified",
        locked: false,
      },
      {
        id: "stop-3",
        placeId: "pandal-2",
        placeName: "Kumartuli Park",
        placeType: "pandal",
        locality: "Kumartuli",
        latitude: 22.598,
        longitude: 88.365,
        recommendationReason: "Artistic theme",
        estimatedVisitMinutes: 30,
        dataConfidence: "verified",
        locked: false,
      },
    ],
    summary: {
      totalStops: 3,
      estimatedTotalMinutes: 120,
      estimatedTravelMinutes: 30,
      estimatedVisitMinutes: 90,
      warnings: [],
      unmetConstraints: [],
      dataConfidence: "verified",
    },
  };

  it("calculates initial 0 XP for a newly opened itinerary", () => {
    const progress = calculateQuestProgress(dummyItinerary, [], false);
    expect(progress.totalXp).toBe(0);
    expect(progress.level).toBe(1);
    expect(progress.levelTitle).toBe("Pujo Nobin");
    expect(progress.percentComplete).toBe(0);
    expect(progress.isFullyCompleted).toBe(false);
  });

  it("awards +50 XP and Metro badge upon metro check-in", () => {
    const progress = calculateQuestProgress(dummyItinerary, [], true);
    expect(progress.totalXp).toBe(XP_PER_METRO_CHECKIN);
    expect(progress.metroOriginChecked).toBe(true);
    expect(progress.badges.some((b) => b.id === "badge-metro")).toBe(true);
  });

  it("awards +100 XP per pandal and +50 XP per food stop", () => {
    // 1 pandal checked
    const progress1 = calculateQuestProgress(dummyItinerary, ["stop-1"], false);
    expect(progress1.totalXp).toBe(XP_PER_PANDAL_VISIT);
    expect(progress1.badges.some((b) => b.id === "badge-pratham-darshan")).toBe(true);

    // 1 pandal + 1 food checked
    const progress2 = calculateQuestProgress(dummyItinerary, ["stop-1", "stop-2"], false);
    expect(progress2.totalXp).toBe(XP_PER_PANDAL_VISIT + XP_PER_FOOD_STOP);
    expect(progress2.badges.some((b) => b.id === "badge-petuk-bondhu")).toBe(true);
  });

  it("awards +150 bonus XP, levels up, and sets isFullyCompleted when 100% finished", () => {
    // All 3 stops + metro check-in
    const progress = calculateQuestProgress(
      dummyItinerary,
      ["stop-1", "stop-2", "stop-3"],
      true
    );

    // Expected: 50 (metro) + 100 (pandal) + 50 (food) + 100 (pandal) + 150 (completion bonus) = 450 XP
    expect(progress.totalXp).toBe(450);
    expect(progress.isFullyCompleted).toBe(true);
    expect(progress.percentComplete).toBe(100);
    expect(progress.badges.some((b) => b.id === "badge-shera-hopper")).toBe(true);

    const level = getLevelForXp(progress.totalXp);
    expect(level.level).toBeGreaterThanOrEqual(4); // Bonedi Parikramak
  });

  it("persists checklist state and handles toggling and reset", () => {
    // 1. Toggle metro
    const step1 = toggleMetroInQuest(dummyItinerary);
    expect(step1.metroOriginChecked).toBe(true);

    // 2. Toggle stop-1
    const step2 = toggleStopInQuest(dummyItinerary, "stop-1");
    expect(step2.completedStopIds).toContain("stop-1");

    // 3. Reload from storage
    const loaded = loadQuestProgress(dummyItinerary);
    expect(loaded.metroOriginChecked).toBe(true);
    expect(loaded.completedStopIds).toContain("stop-1");

    // 4. Untoggle stop-1
    const step3 = toggleStopInQuest(dummyItinerary, "stop-1");
    expect(step3.completedStopIds).not.toContain("stop-1");

    // 5. Reset
    const reset = resetQuest(dummyItinerary);
    expect(reset.totalXp).toBe(0);
    expect(reset.completedStopIds).toEqual([]);
    expect(reset.metroOriginChecked).toBe(false);
  });
});
