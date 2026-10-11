import { PANDAL_DATA } from "@/data/pandals";
import { FOOD_HOTSPOT_DATA } from "@/data/food";
import { KOLKATA_LOCALITIES } from "@/data/localities";

describe("Geospatial & Curated Data Quality Audit", () => {
  const KOLKATA_BOUNDS = {
    minLat: 22.40,
    maxLat: 22.68,
    minLng: 88.25,
    maxLng: 88.50,
  };

  describe("Pandal Dataset Quality (PANDAL_DATA)", () => {
    it("contains curated records with unique identifiers", () => {
      expect(PANDAL_DATA.length).toBeGreaterThanOrEqual(20);
      const ids = PANDAL_DATA.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it("verifies every pandal with coordinates has valid, realistic coordinates within Kolkata", () => {
      PANDAL_DATA.forEach((pandal) => {
        if (pandal.latitude !== undefined && pandal.longitude !== undefined) {
          expect(typeof pandal.latitude).toBe("number");
          expect(typeof pandal.longitude).toBe("number");
          expect(isNaN(pandal.latitude)).toBe(false);
          expect(isNaN(pandal.longitude)).toBe(false);

          expect(pandal.latitude).toBeGreaterThanOrEqual(KOLKATA_BOUNDS.minLat);
          expect(pandal.latitude).toBeLessThanOrEqual(KOLKATA_BOUNDS.maxLat);
          expect(pandal.longitude).toBeGreaterThanOrEqual(KOLKATA_BOUNDS.minLng);
          expect(pandal.longitude).toBeLessThanOrEqual(KOLKATA_BOUNDS.maxLng);
        } else {
          expect(pandal.coordinatesStatus).toBe("needs_verified_geocoding");
        }
      });
    });

    it("ensures metadata provenance and verification fields are present", () => {
      PANDAL_DATA.forEach((pandal) => {
        expect(pandal.name).toBeTruthy();
        expect(pandal.locality).toBeTruthy();
        expect(pandal.recommendedVisitMinutes).toBeGreaterThan(0);
        expect(["curated", "verified", "community", "demo", "unverified"]).toContain(
          pandal.verificationStatus
        );
        expect(["verified", "curated", "estimated", "demo", "unknown"]).toContain(
          pandal.dataConfidence
        );
        expect(pandal.seasonalValidity).toBeDefined();
        expect(pandal.seasonalValidity.year).toBeGreaterThanOrEqual(2026);
      });
    });
  });

  describe("Food Hotspot Dataset Quality (FOOD_HOTSPOT_DATA)", () => {
    it("contains curated culinary hotspots with unique identifiers", () => {
      expect(FOOD_HOTSPOT_DATA.length).toBeGreaterThan(0);
      const ids = FOOD_HOTSPOT_DATA.map((f) => f.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it("ensures all food hotspots have valid categories and localized coordinates", () => {
      FOOD_HOTSPOT_DATA.forEach((food) => {
        expect(food.name).toBeTruthy();
        expect(food.locality).toBeTruthy();
        expect(food.foodCategory.length).toBeGreaterThan(0);

        if (food.latitude != null && food.longitude != null) {
          expect(food.latitude).toBeGreaterThanOrEqual(KOLKATA_BOUNDS.minLat);
          expect(food.latitude).toBeLessThanOrEqual(KOLKATA_BOUNDS.maxLat);
          expect(food.longitude).toBeGreaterThanOrEqual(KOLKATA_BOUNDS.minLng);
          expect(food.longitude).toBeLessThanOrEqual(KOLKATA_BOUNDS.maxLng);
        }
      });
    });
  });

  describe("Kolkata Locality Registry (KOLKATA_LOCALITIES)", () => {
    it("defines authoritative zones and valid center anchors", () => {
      expect(KOLKATA_LOCALITIES.length).toBeGreaterThanOrEqual(6);

      KOLKATA_LOCALITIES.forEach((locality) => {
        expect(locality.id).toBeTruthy();
        expect(locality.name).toBeTruthy();
        expect(locality.center.latitude).toBeGreaterThanOrEqual(KOLKATA_BOUNDS.minLat);
        expect(locality.center.latitude).toBeLessThanOrEqual(KOLKATA_BOUNDS.maxLat);
        expect(locality.center.longitude).toBeGreaterThanOrEqual(KOLKATA_BOUNDS.minLng);
        expect(locality.center.longitude).toBeLessThanOrEqual(KOLKATA_BOUNDS.maxLng);
        expect(locality.aliases.length).toBeGreaterThan(0);
      });
    });
  });
});
