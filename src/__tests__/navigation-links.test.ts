import {
  buildSingleDestinationNavUrl,
  buildMultiStopNavUrl,
  buildLegNavUrl,
  mapToGoogleTravelMode,
  formatCoordinates,
  MAX_GOOGLE_MAPS_WAYPOINTS,
} from "@/lib/navigation-links";

describe("Zero-Credential External Navigation Links", () => {
  const KUMARTULI = { latitude: 22.5947, longitude: 88.3677, name: "Kumartuli Park Sarbojanin" };
  const BAGBAZAR = { latitude: 22.5985, longitude: 88.3697, name: "Bagbazar Sarbojanin" };
  const COLLEGE_SQ = { latitude: 22.5746, longitude: 88.3638, name: "College Square" };
  const EKDALIA = { latitude: 22.5218, longitude: 88.3672, name: "Ekdalia Evergreen" };

  describe("buildSingleDestinationNavUrl", () => {
    it("generates a valid Google Maps Directions URL targeting official named place POI entity", () => {
      const url = buildSingleDestinationNavUrl(KUMARTULI);

      expect(url).toContain("https://www.google.com/maps/dir/?api=1");
      expect(url).toContain(`destination=${encodeURIComponent("Kumartuli Park Sarbojanin, Kolkata")}`);
      expect(url).toContain("travelmode=walking");
      expect(url).not.toContain("key=");
      expect(url).not.toContain("AIza");
    });

    it("falls back cleanly to coordinate pairs when no place name is provided", () => {
      const anonymousTarget = { latitude: 22.5947, longitude: 88.3677 };
      const url = buildSingleDestinationNavUrl(anonymousTarget);

      expect(url).toContain(`destination=${encodeURIComponent("22.594700,88.367700")}`);
      expect(url).toContain("travelmode=walking");
    });

    it("includes origin coordinates when specified", () => {
      const url = buildSingleDestinationNavUrl(BAGBAZAR, { latitude: 22.5992, longitude: 88.3698 }, "walking");

      expect(url).toContain(`origin=${encodeURIComponent("22.599200,88.369800")}`);
      expect(url).toContain(`destination=${encodeURIComponent("Bagbazar Sarbojanin, Kolkata")}`);
    });

    it("includes locality in destination query when provided", () => {
      const url = buildSingleDestinationNavUrl({
        latitude: 22.5218,
        longitude: 88.3672,
        name: "Ekdalia Evergreen",
        locality: "Gariahat",
      });

      expect(url).toContain(`destination=${encodeURIComponent("Ekdalia Evergreen, Gariahat, Kolkata")}`);
    });

    it("maps travel modes correctly to Google Maps URL parameters", () => {
      const walkUrl = buildSingleDestinationNavUrl(KUMARTULI, undefined, "walking");
      const taxiUrl = buildSingleDestinationNavUrl(KUMARTULI, undefined, "taxi");
      const transitUrl = buildSingleDestinationNavUrl(KUMARTULI, undefined, "metro_walking");

      expect(walkUrl).toContain("travelmode=walking");
      expect(taxiUrl).toContain("travelmode=driving");
      expect(transitUrl).toContain("travelmode=transit");
    });
  });

  describe("buildMultiStopNavUrl", () => {
    it("generates multi-stop route with waypoints", () => {
      const stops = [KUMARTULI, BAGBAZAR, COLLEGE_SQ, EKDALIA];
      const result = buildMultiStopNavUrl(stops, undefined, "walking");

      expect(result.provider).toBe("google_maps");
      expect(result.isTruncated).toBe(false);
      expect(result.totalStops).toBe(4);
      // Origin is stops[0] (Kumartuli), destination is stops[3] (Ekdalia), waypoints are Bagbazar & College Sq (2)
      expect(result.waypointsIncluded).toBe(2);
      expect(result.url).toContain("waypoints=");
      expect(result.url).toContain(encodeURIComponent("22.598500,88.369700"));
      expect(result.url).toContain(encodeURIComponent("22.574600,88.363800"));
    });

    it("safely truncates waypoints when itinerary exceeds Google Maps limit", () => {
      // Create 15 stops
      const manyStops = Array.from({ length: 15 }, (_, i) => ({
        latitude: 22.5000 + i * 0.005,
        longitude: 88.3500 + i * 0.005,
        name: `Stop ${i + 1}`,
      }));

      const result = buildMultiStopNavUrl(manyStops, undefined, "walking");

      expect(result.isTruncated).toBe(true);
      expect(result.waypointsIncluded).toBe(MAX_GOOGLE_MAPS_WAYPOINTS); // 9 waypoints max
      expect(result.truncatedNotice).toBeDefined();
      expect(result.truncatedNotice).toContain("limits single-route directions to 9 waypoints");
    });

    it("handles single-stop and empty stop lists safely", () => {
      const emptyResult = buildMultiStopNavUrl([]);
      expect(emptyResult.totalStops).toBe(0);
      expect(emptyResult.url).toBe("https://www.google.com/maps");

      const singleResult = buildMultiStopNavUrl([KUMARTULI]);
      expect(singleResult.totalStops).toBe(1);
      expect(singleResult.url).toContain("destination=");
    });
  });

  describe("buildLegNavUrl", () => {
    it("generates leg navigation from point A to point B using named places", () => {
      const legUrl = buildLegNavUrl(KUMARTULI, BAGBAZAR, "walking");

      expect(legUrl).toContain(`origin=${encodeURIComponent("Kumartuli Park Sarbojanin, Kolkata")}`);
      expect(legUrl).toContain(`destination=${encodeURIComponent("Bagbazar Sarbojanin, Kolkata")}`);
      expect(legUrl).toContain("travelmode=walking");
    });

    it("generates leg navigation from point A to point B using coordinates when unnamed", () => {
      const anonA = { latitude: 22.5947, longitude: 88.3677 };
      const anonB = { latitude: 22.5985, longitude: 88.3697 };
      const legUrl = buildLegNavUrl(anonA, anonB, "walking");

      expect(legUrl).toContain(`origin=${encodeURIComponent("22.594700,88.367700")}`);
      expect(legUrl).toContain(`destination=${encodeURIComponent("22.598500,88.369700")}`);
      expect(legUrl).toContain("travelmode=walking");
    });
  });

  describe("formatCoordinates and mapToGoogleTravelMode", () => {
    it("formats coordinates to 6 decimal places safely", () => {
      expect(formatCoordinates(22.5, 88.3)).toBe("22.500000,88.300000");
    });

    it("maps all transport modes predictably", () => {
      expect(mapToGoogleTravelMode("walking")).toBe("walking");
      expect(mapToGoogleTravelMode("flexible")).toBe("walking");
      expect(mapToGoogleTravelMode("taxi")).toBe("driving");
      expect(mapToGoogleTravelMode("public_transport")).toBe("transit");
      expect(mapToGoogleTravelMode("metro_walking")).toBe("transit");
    });
  });
});
