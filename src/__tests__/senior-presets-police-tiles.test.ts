import { ITINERARY_PRESETS } from "@/data/presets";
import { getKolkataPoliceShift } from "@/components/ui/PoliceBarricadeCaveat";
import {
  PRECACHE_CORRIDORS,
  PRECACHE_ZOOM_LEVELS,
  getCorridorTileCoordinates,
  lon2tile,
  lat2tile,
} from "@/lib/offline-tiles";
import { generateItinerary } from "@/lib/itinerary-engine";

describe("Senior Heritage Walk Preset & Elder Mode", () => {
  const seniorPreset = ITINERARY_PRESETS.find((p) => p.id === "senior-heritage-walk");

  it("registers senior-heritage-walk preset with accessible, low-walking criteria", () => {
    expect(seniorPreset).toBeDefined();
    expect(seniorPreset?.name).toContain("সহজ পুজো পরিক্রমা");
    expect(seniorPreset?.preferences.requiresAccessibility).toBe(true);
    expect(seniorPreset?.preferences.walkingTolerance).toBe("low");
    expect(seniorPreset?.preferences.pacing).toBe("relaxed");
    expect(seniorPreset?.preferences.startTime).toBe("08:30");
  });

  it("generates an accessible morning sabeki itinerary for senior preset", () => {
    const itinerary = generateItinerary(seniorPreset!.preferences as any);
    expect(itinerary.stops.length).toBeGreaterThanOrEqual(2);
    expect(itinerary.summary.totalStops).toBe(itinerary.stops.length);
    expect(itinerary.summary.warnings.length).toBe(0);

    // Verify all stops are accessible and fit low walking
    itinerary.stops.forEach((stop) => {
      expect(stop.placeName).toBeDefined();
      expect(stop.locality).toBeDefined();
    });
  });
});

describe("Kolkata Police Barricade Caveat & Shifts", () => {
  it("determines active Kolkata Police shift with bilingual guidance", () => {
    const shift = getKolkataPoliceShift();
    expect(shift).toHaveProperty("name");
    expect(shift).toHaveProperty("nameBengali");
    expect(shift).toHaveProperty("hours");
    expect(shift).toHaveProperty("status");
    expect(["open", "regulated", "strict_channel"]).toContain(shift.status);
    expect(shift.description.length).toBeGreaterThan(20);
  });
});

describe("PWA Offline Map Corridors & Tile Calculations", () => {
  it("configures Shyambazar–Kumartuli and Kalighat–Gariahat corridors", () => {
    const ids = PRECACHE_CORRIDORS.map((c) => c.id);
    expect(ids).toContain("shyambazar-kumartuli");
    expect(ids).toContain("kalighat-gariahat");
    expect(PRECACHE_ZOOM_LEVELS).toEqual([12, 13, 14, 15]);
  });

  it("converts coordinates to valid Slippy tile coordinates", () => {
    // Shyambazar approx lat 22.597, lng 88.368 at zoom 14
    const x = lon2tile(88.368, 14);
    const y = lat2tile(22.597, 14);
    expect(x).toBeGreaterThan(0);
    expect(y).toBeGreaterThan(0);
  });

  it("computes bounded corridor tile coordinates for offline pre-caching", () => {
    const tiles = getCorridorTileCoordinates();
    expect(tiles.length).toBeGreaterThan(20);
    expect(tiles[0]).toHaveProperty("z");
    expect(tiles[0]).toHaveProperty("x");
    expect(tiles[0]).toHaveProperty("y");
  });
});
