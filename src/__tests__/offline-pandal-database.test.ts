import {
  PANDAL_DATA,
  getPandalById,
  getPandalBySlug,
  getPandalsByArea,
  searchPandals,
} from "@/data/pandals";
import {
  isRoutablePandal,
  validatePandalDataset,
  KOLKATA_BOUNDING_BOX,
} from "@/lib/pandal-validator";
import { runPlanningPipeline } from "@/lib/planning-pipeline";
import { applyHardConstraints } from "@/lib/planning-pipeline/stage4-hard-constraints";
import { normalizePlannerInput } from "@/lib/planning-pipeline/stage1-normalize-input";
import type { PandalPlace } from "@/types";

describe("Offline Pandal Database Integration & Safety Verification", () => {
  // ─────────────────────────────────────────────
  // 1. DATASET INTEGRITY & VALIDATION
  // ─────────────────────────────────────────────
  describe("Dataset Validation (validatePandalDataset)", () => {
    it("validates the integrated canonical dataset has no errors", () => {
      const result = validatePandalDataset(PANDAL_DATA);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.totalRecords).toBe(57);
      expect(result.duplicateIds).toHaveLength(0);
      expect(result.duplicateSlugs).toHaveLength(0);
    });

    it("verifies accurate counts of routable vs unroutable candidate records", () => {
      const result = validatePandalDataset(PANDAL_DATA);

      // 23 canonical records have verified coordinates
      expect(result.routableRecordsCount).toBe(23);
      // 34 candidate records are unroutable (pending verified field geocoding or third-party verification)
      expect(result.unroutableRecordsCount).toBe(34);
      expect(result.needsGeocodingCount).toBeGreaterThan(0);
      expect(result.reportedThemesCount).toBeGreaterThan(0);
    });

    it("flags duplicate IDs as errors", () => {
      const duplicateRecord: PandalPlace = {
        ...PANDAL_DATA[0],
        id: PANDAL_DATA[0].id,
      };
      const result = validatePandalDataset([...PANDAL_DATA, duplicateRecord]);

      expect(result.isValid).toBe(false);
      expect(result.duplicateIds).toContain(PANDAL_DATA[0].id);
      expect(result.errors.some((e) => e.field === "id")).toBe(true);
    });

    it("flags coordinates outside Kolkata bounding box as errors", () => {
      const invalidCoordPlace: PandalPlace = {
        ...PANDAL_DATA[0],
        id: "test-delhi-coords",
        slug: "test-delhi-slug",
        latitude: 28.6139, // New Delhi
        longitude: 77.2090,
      };
      const result = validatePandalDataset([invalidCoordPlace]);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.issue.includes("outside Kolkata bounding box"))).toBe(true);
    });

    it("flags NaN coordinates as errors", () => {
      const nanCoordPlace: PandalPlace = {
        ...PANDAL_DATA[0],
        id: "test-nan-coords",
        slug: "test-nan-slug",
        latitude: NaN,
        longitude: 88.36,
      };
      const result = validatePandalDataset([nanCoordPlace]);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.issue.includes("NaN"))).toBe(true);
    });

    it("flags records lacking sources with a warning", () => {
      const unsourcedPlace: PandalPlace = {
        ...PANDAL_DATA[0],
        id: "test-unsourced",
        slug: "test-unsourced-slug",
        verificationSource: undefined,
        sourceNote: undefined,
        sourceIds: [],
        dataSource: undefined,
      };
      const result = validatePandalDataset([unsourcedPlace]);

      expect(result.warnings.some((w) => w.field === "sources")).toBe(true);
    });

    it("detects conflicting theme reports as warnings", () => {
      const conflictingPlace: PandalPlace = {
        ...PANDAL_DATA[0],
        id: "test-conflict-place",
        slug: "test-conflict-slug",
        themeStatus: "reported_needs_confirmation",
        sourceNote: "Conflicting reports: source A reported 'X', source B reported 'Y'.",
      };
      const result = validatePandalDataset([conflictingPlace]);

      expect(result.warnings.some((w) => w.field === "theme_2026" && w.issue.includes("Conflicting"))).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // 2. OFFLINE SEARCH CAPABILITIES
  // ─────────────────────────────────────────────
  describe("Offline Search (searchPandals)", () => {
    it("searches by primary pandal name", () => {
      const results = searchPandals("Bagbazar");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((p) => p.name.includes("Bagbazar"))).toBe(true);
    });

    it("searches by candidate name from enriched seed dataset", () => {
      const results = searchPandals("Tala Prattoy");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((p) => p.id === "cb-009")).toBe(true);
    });

    it("searches by alias or canonical name", () => {
      const results = searchPandals("Bagbazar Sarbojanin Durgotsav");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].canonicalName).toBe("Bagbazar Sarbojanin Durgotsav");
    });

    it("searches by area name", () => {
      const bagbazarArea = searchPandals("Bagbazar");
      expect(bagbazarArea.length).toBeGreaterThanOrEqual(1);

      const maniktalaArea = searchPandals("Maniktala");
      expect(maniktalaArea.length).toBeGreaterThanOrEqual(1);

      const dumDumArea = searchPandals("Dum Dum Park");
      expect(dumDumArea.length).toBeGreaterThanOrEqual(2);
    });

    it("searches by neighbourhood name", () => {
      const results = searchPandals("Lebutala");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((p) => p.neighborhood?.includes("Lebutala"))).toBe(true);
    });

    it("searches by reported 2026 theme keywords", () => {
      const dravidianTheme = searchPandals("Dravidian");
      expect(dravidianTheme.length).toBeGreaterThanOrEqual(1);
      expect(dravidianTheme.some((p) => p.id === "ekdalia-evergreen-2026")).toBe(true);

      const biophilicTheme = searchPandals("Biophilic");
      expect(biophilicTheme.length).toBeGreaterThanOrEqual(1);
      expect(biophilicTheme.some((p) => p.id === "cb-009")).toBe(true);
    });

    it("searches by Bengali script name", () => {
      const bengaliResults = searchPandals("বাগবাজার");
      expect(bengaliResults.length).toBeGreaterThanOrEqual(1);
      expect(bengaliResults.some((p) => p.id === "bagbazar-2026")).toBe(true);
    });

    it("handles whitespace and case insensitivity gracefully", () => {
      const messyQuery = searchPandals("  KUMARTULI   ");
      expect(messyQuery.length).toBeGreaterThanOrEqual(1);
    });

    it("returns all records on empty query", () => {
      const all = searchPandals("");
      expect(all.length).toBe(PANDAL_DATA.length);
    });
  });

  // ─────────────────────────────────────────────
  // 3. AREA-WISE DISCOVERY WITHOUT GOOGLE MAPS
  // ─────────────────────────────────────────────
  describe("Area-Wise Discovery Without Google Maps", () => {
    it("filters pandals by specific area using getPandalsByArea", () => {
      const saltLake = getPandalsByArea("Salt Lake");
      expect(saltLake.length).toBeGreaterThanOrEqual(2);
      saltLake.forEach((p) => {
        const areaMatch =
          p.area?.toLowerCase() === "salt lake" ||
          p.neighborhood?.toLowerCase().includes("salt lake") ||
          p.locality.toLowerCase().includes("salt lake");
        expect(areaMatch).toBe(true);
      });
    });

    it("includes candidate pandals with missing coordinates in area discovery", () => {
      const behala = getPandalsByArea("Behala");
      expect(behala.length).toBeGreaterThanOrEqual(2);

      // Check that candidates with missing coordinates are included in list search
      const candidateWithMissingCoords = behala.find((p) => p.coordinatesStatus === "needs_verified_geocoding");
      expect(candidateWithMissingCoords).toBeDefined();
      expect(candidateWithMissingCoords?.latitude).toBeUndefined();
    });

    it("finds pandals by id using getPandalById", () => {
      const canonical = getPandalById("bagbazar-2026");
      expect(canonical).toBeDefined();
      expect(canonical?.name).toBe("Bagbazar Sarbojanin");

      const seedCandidate = getPandalById("cb-009");
      expect(seedCandidate).toBeDefined();
      expect(seedCandidate?.name).toBe("Tala Prattoy");
    });
  });

  // ─────────────────────────────────────────────
  // 4. COORDINATE ROUTABILITY & PLANNING GATING
  // ─────────────────────────────────────────────
  describe("Coordinate Routability & Planning Gating (isRoutablePandal)", () => {
    it("allows verified canonical pandals to be routable", () => {
      const bagbazar = getPandalById("bagbazar-2026");
      expect(bagbazar).toBeDefined();
      expect(isRoutablePandal(bagbazar!)).toBe(true);
    });

    it("strictly blocks records marked 'needs_verified_geocoding'", () => {
      const candidate = getPandalById("cb-005"); // Jagat Mukherjee Park candidate seed
      expect(candidate).toBeDefined();
      expect(candidate?.coordinatesStatus).toBe("needs_verified_geocoding");
      expect(isRoutablePandal(candidate!)).toBe(false);
    });

    it("strictly blocks records marked 'reported_by_third_party_directory_needs_independent_verification'", () => {
      const thirdPartySeed = getPandalById("cb-009"); // Tala Prattoy seed
      expect(thirdPartySeed).toBeDefined();
      expect(thirdPartySeed?.coordinatesStatus).toBe(
        "reported_by_third_party_directory_needs_independent_verification"
      );
      expect(isRoutablePandal(thirdPartySeed!)).toBe(false);
    });

    it("strictly blocks records with undefined coordinates", () => {
      const missingCoords: PandalPlace = {
        ...PANDAL_DATA[0],
        id: "missing-coords-pandal",
        slug: "missing-coords-slug",
        latitude: undefined,
        longitude: undefined,
      };
      expect(isRoutablePandal(missingCoords)).toBe(false);
    });

    it("ensures stage 4 hard constraints exclude unroutable pandals from route planning", () => {
      const { normalized } = normalizePlannerInput({
        startingLocality: "Shyambazar",
        startingLatitude: 22.602,
        startingLongitude: 88.371,
        availableMinutes: 240,
        transportMode: "walking",
        walkingTolerance: "moderate",
        date: "2026-10-12",
        startTime: "10:00",
        experienceTags: ["iconic"],
        includeFood: false,
      });

      // Pass all 57 pandals (both verified canonical and candidate seed records)
      const result = applyHardConstraints(PANDAL_DATA, normalized);

      // All returned candidates for routing must be routable!
      result.feasibleCandidates.forEach((candidate) => {
        expect(isRoutablePandal(candidate)).toBe(true);
      });

      // Candidate seed records with unverified or missing coordinates MUST be excluded
      const seedCandidate = result.feasibleCandidates.find((c) => c.id === "cb-009" || c.id === "cb-005");
      expect(seedCandidate).toBeUndefined();
    });

    it("excludes locked stops that lack verified coordinates with an advisory warning", () => {
      const { normalized } = normalizePlannerInput({
        startingLocality: "Shyambazar",
        startingLatitude: 22.602,
        startingLongitude: 88.371,
        availableMinutes: 240,
        transportMode: "walking",
        walkingTolerance: "moderate",
        lockedStopIds: ["cb-005"], // unroutable candidate
        date: "2026-10-12",
        startTime: "10:00",
        experienceTags: ["iconic"],
        includeFood: false,
      });

      const result = applyHardConstraints(PANDAL_DATA, normalized);

      // Locked stop was excluded from turn-by-turn routing
      expect(result.lockedPandals.some((p) => p.id === "cb-005")).toBe(false);
      // Warning recorded explaining the exclusion
      expect(result.warnings.some((w) => w.includes("cb-005") || w.includes("Jagat Mukherjee Park"))).toBe(true);
    });

    it("runs complete planning pipeline successfully without using unverified coordinates", () => {
      const { itinerary } = runPlanningPipeline({
        startingLocality: "Shyambazar",
        startingLatitude: 22.602,
        startingLongitude: 88.371,
        availableMinutes: 240,
        transportMode: "metro_walking",
        walkingTolerance: "moderate",
        pacing: "standard",
        date: "2026-10-12",
        startTime: "10:00",
        experienceTags: ["iconic"],
        includeFood: false,
      });

      expect(itinerary.stops.length).toBeGreaterThan(0);

      // Verify every pandal stop in the final itinerary has valid coordinates and is routable
      itinerary.stops.forEach((stop) => {
        if (stop.placeType === "pandal") {
          const pandal = getPandalById(stop.placeId);
          if (pandal) {
            expect(isRoutablePandal(pandal)).toBe(true);
          }
        }
      });
    });
  });

  // ─────────────────────────────────────────────
  // 5. PHOTO GALLERY & ATTRIBUTION SAFETY
  // ─────────────────────────────────────────────
  describe("Photo Gallery & Usage Attribution Safety", () => {
    it("includes photo gallery links as source page URLs without hotlinking media files", () => {
      const pandalsWithGalleries = PANDAL_DATA.filter((p) => p.photoGalleryPage);
      expect(pandalsWithGalleries.length).toBeGreaterThan(0);

      pandalsWithGalleries.forEach((p) => {
        // Must point to a web page, NOT a direct image file (.jpg, .png, .webp)
        expect(p.photoGalleryPage).toMatch(/^https?:\/\//);
        expect(p.photoGalleryPage).not.toMatch(/\.(jpg|jpeg|png|webp|gif)$/i);

        // Must include copyright/licence disclaimer note
        expect(p.photoUsageNote).toBeDefined();
        expect(p.photoUsageNote!.length).toBeGreaterThan(10);
      });
    });

    it("reports theme verification status explicitly for all 2026 themes", () => {
      const themedPandals = PANDAL_DATA.filter((p) => p.theme2026);
      expect(themedPandals.length).toBeGreaterThan(0);

      themedPandals.forEach((p) => {
        expect(["confirmed", "reported_needs_confirmation", "reported_needs_verification", "not_verified"]).toContain(
          p.themeStatus
        );
      });
    });
  });
});
