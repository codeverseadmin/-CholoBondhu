// ─────────────────────────────────────────────
// CHOLO BONDHU — Planning Pipeline Type Contracts
// ─────────────────────────────────────────────

import type {
  ItineraryPreferences,
  ItineraryStop,
  GeneratedItinerary,
  PandalPlace,
  FoodHotspot,
  ExperienceTag,
  TransportMode,
  Coordinates,
  DataConfidence,
  PriceRange,
  FoodCategory,
  DietaryNote,
} from "@/types";

export interface NormalizedPlannerInput {
  startingLocality: string;
  startingCoordinates: Coordinates;
  availableMinutes: number;
  date: string;
  startTime: string; // HH:MM
  experienceTags: ExperienceTag[];
  transportMode: TransportMode;
  includeFood: boolean;
  foodCategories: FoodCategory[];
  dietaryRestrictions: DietaryNote[];
  maxBudget?: PriceRange;
  walkingTolerance: "low" | "moderate" | "high";
  pacing: "relaxed" | "standard" | "packed";
  targetStopCount: number;
  requiresAccessibility: boolean;
  lockedStopIds: string[];
  excludedPlaceIds: string[];
}

export interface CandidateScoreBreakdown {
  proximityScore: number;
  tagMatchScore: number;
  accessibilityScore: number;
  editorialSignificance: number;
  diversityScore: number;
  totalScore: number;
  matchedTags: string[];
  distanceFromStartKm: number;
}

export interface ScoredCandidate {
  place: PandalPlace;
  scoreBreakdown: CandidateScoreBreakdown;
}

export interface PlanningDiagnostics {
  resolvedOrigin: Coordinates;
  totalCandidatesConsidered: number;
  hardExcludedCount: number;
  candidatesScored: number;
  selectedPandalCount: number;
  foodIncluded: boolean;
  foodHotspotSelected?: string;
  routingProviderUsed: string;
  durationBudgetRequested: number;
  durationEstimatedTotal: number;
  preferenceInfluences: string[];
}

export interface PlanningPipelineResult {
  itinerary: GeneratedItinerary;
  diagnostics: PlanningDiagnostics;
}
