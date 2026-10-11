// ─────────────────────────────────────────────
// CHOLO BONDHU — Pandal Dataset Validation & Routability Utility
//
// Validates curated pandals and research seed records against
// production safety rules: duplicate ID detection, bounding box
// coordinates validation, provenance/source checks, conflicting
// theme reviews, and routability gating for itinerary planning.
// ─────────────────────────────────────────────

import type { PandalPlace } from "@/types";

export const KOLKATA_BOUNDING_BOX = {
  minLat: 22.40,
  maxLat: 22.68,
  minLng: 88.25,
  maxLng: 88.50,
};

export interface ValidationErrorItem {
  id: string;
  name: string;
  field: string;
  issue: string;
  severity: "error" | "warning";
}

export interface PandalDatasetValidationResult {
  isValid: boolean;
  totalRecords: number;
  routableRecordsCount: number;
  unroutableRecordsCount: number;
  needsGeocodingCount: number;
  reportedThemesCount: number;
  duplicateIds: string[];
  duplicateSlugs: string[];
  errors: ValidationErrorItem[];
  warnings: ValidationErrorItem[];
}

/**
 * Checks whether a pandal has suitable, verified coordinates for turn-by-turn route planning.
 * Excludes records with missing coordinates or those marked 'needs_verified_geocoding'.
 */
export function isRoutablePandal(pandal: PandalPlace): boolean {
  if (
    pandal.coordinatesStatus === "needs_verified_geocoding" ||
    pandal.coordinatesStatus === "reported_by_third_party_directory_needs_independent_verification"
  ) {
    return false;
  }

  if (
    typeof pandal.latitude !== "number" ||
    typeof pandal.longitude !== "number" ||
    isNaN(pandal.latitude) ||
    isNaN(pandal.longitude)
  ) {
    return false;
  }

  // Must reside within Kolkata metropolitan bounding box
  if (
    pandal.latitude < KOLKATA_BOUNDING_BOX.minLat ||
    pandal.latitude > KOLKATA_BOUNDING_BOX.maxLat ||
    pandal.longitude < KOLKATA_BOUNDING_BOX.minLng ||
    pandal.longitude > KOLKATA_BOUNDING_BOX.maxLng
  ) {
    return false;
  }

  return true;
}

/**
 * Validates a dataset of pandal records for structural and safety integrity.
 */
export function validatePandalDataset(pandals: PandalPlace[]): PandalDatasetValidationResult {
  const errors: ValidationErrorItem[] = [];
  const warnings: ValidationErrorItem[] = [];

  const seenIds = new Set<string>();
  const duplicateIds: string[] = [];

  const seenSlugs = new Set<string>();
  const duplicateSlugs: string[] = [];

  let routableCount = 0;
  let needsGeocodingCount = 0;
  let reportedThemesCount = 0;

  for (const p of pandals) {
    // 1. Check duplicate IDs
    if (!p.id) {
      errors.push({
        id: "unknown",
        name: p.name || "Unnamed",
        field: "id",
        issue: "Record is missing an ID.",
        severity: "error",
      });
    } else if (seenIds.has(p.id)) {
      duplicateIds.push(p.id);
      errors.push({
        id: p.id,
        name: p.name,
        field: "id",
        issue: `Duplicate ID detected: "${p.id}".`,
        severity: "error",
      });
    } else {
      seenIds.add(p.id);
    }

    // 2. Check duplicate slugs
    if (p.slug) {
      if (seenSlugs.has(p.slug)) {
        duplicateSlugs.push(p.slug);
        warnings.push({
          id: p.id,
          name: p.name,
          field: "slug",
          issue: `Duplicate slug detected: "${p.slug}".`,
          severity: "warning",
        });
      } else {
        seenSlugs.add(p.slug);
      }
    }

    // 3. Coordinate validation
    if (p.coordinatesStatus === "needs_verified_geocoding" || p.latitude == null || p.longitude == null) {
      needsGeocodingCount++;
      warnings.push({
        id: p.id,
        name: p.name,
        field: "coordinates",
        issue: "Coordinates require verified field geocoding before precise route planning.",
        severity: "warning",
      });
    } else {
      if (isNaN(p.latitude) || isNaN(p.longitude)) {
        errors.push({
          id: p.id,
          name: p.name,
          field: "coordinates",
          issue: "Coordinates contain NaN values.",
          severity: "error",
        });
      } else if (
        p.latitude < KOLKATA_BOUNDING_BOX.minLat ||
        p.latitude > KOLKATA_BOUNDING_BOX.maxLat ||
        p.longitude < KOLKATA_BOUNDING_BOX.minLng ||
        p.longitude > KOLKATA_BOUNDING_BOX.maxLng
      ) {
        errors.push({
          id: p.id,
          name: p.name,
          field: "coordinates",
          issue: `Coordinates [${p.latitude}, ${p.longitude}] fall outside Kolkata bounding box.`,
          severity: "error",
        });
      } else if (isRoutablePandal(p)) {
        routableCount++;
      } else {
        warnings.push({
          id: p.id,
          name: p.name,
          field: "coordinates",
          issue: "Third-party reported coordinates require independent field verification before routing.",
          severity: "warning",
        });
      }
    }

    // 4. Source & Provenance validation
    const hasSource =
      Boolean(p.verificationSource) ||
      Boolean(p.sourceNote) ||
      (Array.isArray(p.sourceIds) && p.sourceIds.length > 0) ||
      Boolean(p.dataSource);

    if (!hasSource) {
      warnings.push({
        id: p.id,
        name: p.name,
        field: "sources",
        issue: "Record lacks provenance citation or source attribution.",
        severity: "warning",
      });
    }

    // 5. Conflicting record reviews
    if (p.themeStatus === "reported_needs_confirmation" || p.themeStatus === "reported_needs_verification") {
      reportedThemesCount++;
      if (p.sourceNote && p.sourceNote.toLowerCase().includes("conflict")) {
        warnings.push({
          id: p.id,
          name: p.name,
          field: "theme_2026",
          issue: `Conflicting source reports for 2026 theme: ${p.sourceNote}`,
          severity: "warning",
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    totalRecords: pandals.length,
    routableRecordsCount: routableCount,
    unroutableRecordsCount: pandals.length - routableCount,
    needsGeocodingCount,
    reportedThemesCount,
    duplicateIds,
    duplicateSlugs,
    errors,
    warnings,
  };
}
