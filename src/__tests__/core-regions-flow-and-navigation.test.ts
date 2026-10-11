import {
  CORE_PUJO_REGIONS,
  getCorePujoRegion,
  getMetroStationById,
} from "@/data/localities";
import { generateItinerary } from "@/lib/itinerary-engine";
import { buildSingleDestinationNavUrl, formatGoogleMapsDestination } from "@/lib/navigation-links";
import { FOOD_HOTSPOT_DATA } from "@/data/food";
import type { ItineraryPreferences } from "@/types";

describe("5 Core Pujo Regions Flow & Automatic Metro Starting Point", () => {
  it("defines the 5 authoritative core Pujo regions with designated starting Metro stations", () => {
    expect(CORE_PUJO_REGIONS).toHaveLength(5);

    const regionIds = CORE_PUJO_REGIONS.map((r) => r.id);
    expect(regionIds).toEqual([
      "north_kolkata",
      "central_kolkata",
      "college_square",
      "south_kolkata",
      "newtown_area",
    ]);

    // North Kolkata -> Shyambazar Metro (Blue Line, Gate 1)
    const north = getCorePujoRegion("north_kolkata")!;
    expect(north.canonicalMetroId).toBe("metro-shyambazar");
    expect(north.canonicalMetroName).toContain("Shyambazar");
    expect(north.gateGuidance).toContain("Gate 1");

    // Central Kolkata -> Esplanade Metro (Gate 5)
    const central = getCorePujoRegion("central_kolkata")!;
    expect(central.canonicalMetroId).toBe("metro-esplanade");
    expect(central.canonicalMetroName).toContain("Esplanade");
    expect(central.gateGuidance).toContain("Gate 5");

    // College Square -> MG Road Metro (Gate 1)
    const college = getCorePujoRegion("college_square")!;
    expect(college.canonicalMetroId).toBe("metro-mg-road");
    expect(college.canonicalMetroName).toContain("MG Road");
    expect(college.gateGuidance).toContain("Gate 1");

    // South Kolkata -> Kalighat Metro (Gate 3)
    const south = getCorePujoRegion("south_kolkata")!;
    expect(south.canonicalMetroId).toBe("metro-kalighat");
    expect(south.canonicalMetroName).toContain("Kalighat");
    expect(south.gateGuidance).toContain("Gate 3");

    // New Town Area -> Karunamoyee Metro (Green Line, Gate 1)
    const newtown = getCorePujoRegion("newtown_area")!;
    expect(newtown.canonicalMetroId).toBe("metro-karunamoyee");
    expect(newtown.canonicalMetroName).toContain("Karunamoyee");
    expect(newtown.gateGuidance).toContain("Gate 1");
  });

  it("getCorePujoRegion resolves flexible query strings and Bengali names", () => {
    expect(getCorePujoRegion("North Kolkata")?.id).toBe("north_kolkata");
    expect(getCorePujoRegion("college square")?.id).toBe("college_square");
    expect(getCorePujoRegion("College Square Area")?.id).toBe("college_square");
    expect(getCorePujoRegion("South Kolkata")?.id).toBe("south_kolkata");
    expect(getCorePujoRegion("New Town Area")?.id).toBe("newtown_area");
    expect(getCorePujoRegion("newtown")?.id).toBe("newtown_area");
    expect(getCorePujoRegion("Central Kolkata")?.id).toBe("central_kolkata");
  });

  it("generates an itinerary starting from the designated Metro Station when an Area is chosen", () => {
    // User chooses 'college_square' area
    const region = getCorePujoRegion("college_square")!;
    const metro = getMetroStationById(region.canonicalMetroId)!;

    const prefs: ItineraryPreferences = {
      startingLocality: region.name,
      startingMetroStationId: metro.id,
      startingMetroStationName: metro.name,
      startingLatitude: metro.center.latitude,
      startingLongitude: metro.center.longitude,
      availableMinutes: 180,
      date: "2026-10-11",
      startTime: "11:00",
      experienceTags: ["iconic", "artistic"],
      transportMode: "metro_walking",
      pacing: "standard",
      walkingTolerance: "moderate",
      targetStopCount: 3,
      includeFood: false,
    };

    const itinerary = generateItinerary(prefs);

    expect(itinerary.startingMetro).toBeDefined();
    expect(itinerary.startingMetro?.id).toBe("metro-mg-road");
    expect(itinerary.startingMetro?.name).toContain("MG Road");
    expect(itinerary.startingMetro?.gateGuidance).toContain("Gate 1");

    // First stop navigation URL starts from the designated Metro Station
    expect(itinerary.stops.length).toBeGreaterThan(0);
    const stop1 = itinerary.stops[0];
    expect(stop1.navigationUrl).toBeDefined();
    expect(stop1.navigationUrl).toContain(encodeURIComponent(`${metro.center.latitude.toFixed(6)},${metro.center.longitude.toFixed(6)}`));
  });

  it("generates an itinerary starting from Kalighat Metro when South Kolkata is chosen", () => {
    const region = getCorePujoRegion("south_kolkata")!;
    const metro = getMetroStationById(region.canonicalMetroId)!;

    const prefs: ItineraryPreferences = {
      startingLocality: region.name,
      startingMetroStationId: metro.id,
      startingMetroStationName: metro.name,
      startingLatitude: metro.center.latitude,
      startingLongitude: metro.center.longitude,
      availableMinutes: 240,
      date: "2026-10-11",
      startTime: "16:00",
      experienceTags: ["iconic"],
      transportMode: "walking",
      pacing: "standard",
      walkingTolerance: "moderate",
      targetStopCount: 4,
      includeFood: false,
    };

    const itinerary = generateItinerary(prefs);
    expect(itinerary.startingMetro?.id).toBe("metro-kalighat");
    expect(itinerary.startingMetro?.gateGuidance).toContain("Gate 3");
  });

  it("generates an itinerary starting from Karunamoyee Metro when New Town is chosen", () => {
    const region = getCorePujoRegion("newtown_area")!;
    const metro = getMetroStationById(region.canonicalMetroId)!;

    const prefs: ItineraryPreferences = {
      startingLocality: region.name,
      startingMetroStationId: metro.id,
      startingMetroStationName: metro.name,
      startingLatitude: metro.center.latitude,
      startingLongitude: metro.center.longitude,
      availableMinutes: 240,
      date: "2026-10-11",
      startTime: "17:00",
      experienceTags: ["contemporary", "artistic"],
      transportMode: "metro_walking",
      pacing: "standard",
      walkingTolerance: "moderate",
      targetStopCount: 3,
      includeFood: false,
    };

    const itinerary = generateItinerary(prefs);
    expect(itinerary.startingMetro?.id).toBe("metro-karunamoyee");
    expect(itinerary.startingMetro?.lineCode).toBe("green");
  });

  describe("Google Maps Authoritative POI Formatting", () => {
    it("ensures Chittaranjan Mistanna Bhandar is formatted with official place name and locality to avoid insurance agent reverse-geocoding errors", () => {
      const chittaranjan = FOOD_HOTSPOT_DATA.find((f) => f.id === "chittaranjan-mishti")!;
      expect(chittaranjan).toBeDefined();
      expect(chittaranjan.name).toBe("Chittaranjan Mistanna Bhandar");

      const query = formatGoogleMapsDestination({
        name: chittaranjan.name,
        locality: chittaranjan.locality,
        latitude: chittaranjan.latitude!,
        longitude: chittaranjan.longitude!,
      });

      expect(query).toBe("Chittaranjan Mistanna Bhandar, Shyambazar, Kolkata");

      const navUrl = buildSingleDestinationNavUrl({
        name: chittaranjan.name,
        locality: chittaranjan.locality,
        latitude: chittaranjan.latitude!,
        longitude: chittaranjan.longitude!,
      });

      expect(navUrl).toContain(encodeURIComponent("Chittaranjan Mistanna Bhandar, Shyambazar, Kolkata"));
      expect(navUrl).not.toContain("HDFC");
    });
  });
});
