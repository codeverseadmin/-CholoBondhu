import {
  HeuristicRoutingProvider,
  calculateUrbanTravelMinutes,
  haversineDistanceKm,
  getExternalNavigationUrl,
} from "@/lib/routing-provider";
import type { Coordinates, TransportMode } from "@/types";

describe("Routing Provider & Urban Travel Calculations", () => {
  const BAGBAZAR: Coordinates = { latitude: 22.6025, longitude: 88.3672 };
  const KUMARTULI: Coordinates = { latitude: 22.5998, longitude: 88.3622 };
  const GARIAHAT: Coordinates = { latitude: 22.518, longitude: 88.3664 };

  describe("haversineDistanceKm", () => {
    it("returns 0 for identical coordinates", () => {
      const dist = haversineDistanceKm(BAGBAZAR, BAGBAZAR);
      expect(dist).toBe(0);
    });

    it("calculates realistic distance between Bagbazar and Kumartuli (< 1 km)", () => {
      const dist = haversineDistanceKm(BAGBAZAR, KUMARTULI);
      expect(dist).toBeGreaterThan(0.3);
      expect(dist).toBeLessThan(1.0);
    });

    it("calculates realistic North to South Kolkata distance (~9-10 km straight line)", () => {
      const dist = haversineDistanceKm(BAGBAZAR, GARIAHAT);
      expect(dist).toBeGreaterThan(8.0);
      expect(dist).toBeLessThan(12.0);
    });
  });

  describe("calculateUrbanTravelMinutes", () => {
    it("incorporates 1.6x urban street factor by default", () => {
      // 10 km straight line => 16 km urban distance
      // Walking @ 4 km/h => 16 / 4 = 4 hrs = 240 mins
      const walkMins = calculateUrbanTravelMinutes(10, "walking");
      expect(walkMins).toBe(240);
    });

    it("calculates faster travel times for taxi than walking", () => {
      const walkTime = calculateUrbanTravelMinutes(5, "walking");
      const taxiTime = calculateUrbanTravelMinutes(5, "taxi");
      expect(taxiTime).toBeLessThan(walkTime);
    });

    it("adds transfer overhead for metro_walking", () => {
      // Metro adds 12 min transfer overhead
      const shortMetro = calculateUrbanTravelMinutes(1, "metro_walking");
      expect(shortMetro).toBeGreaterThan(12);
    });

    it("handles zero distance gracefully with zero minutes", () => {
      const time = calculateUrbanTravelMinutes(0, "walking");
      expect(time).toBe(0);
    });
  });

  describe("HeuristicRoutingProvider", () => {
    const provider = new HeuristicRoutingProvider();

    it("identifies provider as heuristic with explicit 1.6x street factor label", () => {
      expect(provider.name).toContain("Heuristic");
      expect(provider.methodology).toContain("1.6x");
      expect(provider.isEstimated).toBe(true);
    });

    it("computes travel estimates between two locations", async () => {
      const estimate = await provider.calculateRoute(BAGBAZAR, KUMARTULI, "walking");
      expect(estimate.origin).toEqual(BAGBAZAR);
      expect(estimate.destination).toEqual(KUMARTULI);
      expect(estimate.distanceKm).toBeGreaterThan(0);
      expect(estimate.travelMinutes).toBeGreaterThan(0);
      expect(estimate.isEstimated).toBe(true);
      expect(estimate.methodology).toContain("1.6x");
    });

    it("supports matrix calculations deterministically", async () => {
      const matrix = await provider.calculateMatrix(
        [BAGBAZAR, KUMARTULI],
        [BAGBAZAR, KUMARTULI],
        "walking"
      );
      expect(matrix).toHaveLength(2);
      expect(matrix[0]).toHaveLength(2);
      expect(matrix[0][0].travelMinutes).toBe(0);
      expect(matrix[0][1].travelMinutes).toBeGreaterThan(0);
      expect(matrix[1][0].travelMinutes).toBe(matrix[0][1].travelMinutes);
    });

    it("handles fallback gracefully when coordinates are invalid", async () => {
      const invalidCoord: Coordinates = { latitude: 0, longitude: 0 };
      const estimate = await provider.calculateRoute(invalidCoord, BAGBAZAR, "walking");
      expect(estimate).toBeDefined();
      expect(estimate.travelMinutes).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getExternalNavigationUrl", () => {
    it("generates valid Google Maps navigation link with coordinates", () => {
      const url = getExternalNavigationUrl(
        BAGBAZAR,
        "Bagbazar Sarbojanin",
        "walking"
      );
      expect(url).toContain("google.com/maps/dir");
      expect(url).toContain("22.6025");
      expect(url).toContain("88.3672");
      expect(url).toContain("walking");
    });

    it("encodes transit mode correctly for metro_walking", () => {
      const url = getExternalNavigationUrl(
        BAGBAZAR,
        "Bagbazar Sarbojanin",
        "metro_walking"
      );
      expect(url).toContain("travelmode=transit");
    });

    it("encodes driving mode correctly for taxi", () => {
      const url = getExternalNavigationUrl(
        BAGBAZAR,
        "Bagbazar Sarbojanin",
        "taxi"
      );
      expect(url).toContain("travelmode=driving");
    });
  });
});
