// ─────────────────────────────────────────────
// CHOLO BONDHU — Core Data Types
// ─────────────────────────────────────────────

export type DataConfidence = "verified" | "curated" | "estimated" | "demo" | "unknown";
export type VerificationStatus = "verified" | "curated" | "community" | "unverified" | "demo";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type { RoutingProvider } from "@/lib/routing-provider";

export type TransportMode = "walking" | "public_transport" | "metro_walking" | "taxi" | "flexible";

export type ExperienceTag =
  | "iconic"
  | "artistic"
  | "traditional"
  | "less_crowded"
  | "photography"
  | "family_friendly"
  | "street_food"
  | "bengali_food"
  | "group_outing"
  | "accessible"
  | "contemporary"
  | "heritage"
  | "spiritual";

export type FoodCategory =
  | "bengali_cuisine"
  | "street_food"
  | "sweets"
  | "snacks"
  | "cafe"
  | "restaurant"
  | "puja_stall"
  | "rolls_kathi"
  | "biryani"
  | "seafood";

export type DietaryNote = "vegetarian" | "vegan" | "non_vegetarian" | "halal" | "jain";

export type PriceRange = "budget" | "moderate" | "premium";

// ─────────────────────────────────────────────
// PANDAL / FESTIVAL PLACE
// ─────────────────────────────────────────────

export interface PandalPlace {
  id: string;
  slug: string;
  name: string;
  nameBengali?: string;
  alternateNames?: string[];
  description: string;
  editorialNote?: string;
  locality: string;
  address?: string;
  latitude: number;
  longitude: number;
  category: "pandal" | "attraction" | "event_venue";
  theme?: string;
  traditionTags?: string[];
  experienceTags: ExperienceTag[];
  familyFriendly: boolean;
  accessibilityDetails?: string;
  recommendedVisitMinutes: number;
  officialWebsite?: string;
  officialSocialLinks?: Record<string, string>;
  lastVerifiedAt?: string; // ISO date string
  verificationStatus: VerificationStatus;
  verificationSource?: string;
  seasonalValidity: {
    year: number;
    startDate?: string;
    endDate?: string;
    seasonNotes?: string;
  };
  locationConfidence?: "exact" | "high" | "approximate";
  openingHoursConfidence?: "standard_puja_window" | "verified_24h" | "seasonal_estimate" | "unverified";
  accessibilityConfidence?: "verified_accessible" | "crowd_dependent" | "unverified";
  dataSource?: "official_committee" | "editorial_curation" | "historical_archive" | "community";
  notes?: string;
  imageReferences?: string[];
  editorialRating?: number; // 1–5
  dataConfidence: DataConfidence;
  featured?: boolean;
  crowdLevel?: "low" | "moderate" | "high" | "very_high" | "unknown";
  bestVisitTime?: string;
}

// ─────────────────────────────────────────────
// FOOD HOTSPOT
// ─────────────────────────────────────────────

export interface FoodHotspot {
  id: string;
  name: string;
  nameBengali?: string;
  locality: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  foodCategory: FoodCategory[];
  description: string;
  approximateOperatingWindow?: string;
  seasonal: boolean;
  temporary: boolean;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  verificationSource?: string;
  lastReportedAt?: string;
  confidence: DataConfidence;
  locationConfidence?: "exact" | "high" | "approximate";
  openingHoursConfidence?: "standard_operating_window" | "seasonal_stall" | "unverified";
  dataSource?: "editorial_curation" | "community" | "public_record";
  notes?: string;
  priceRange?: PriceRange;
  dietaryNotes?: DietaryNote[];
  imageReferences?: string[];
  popularItems?: string[];
  googlePlaceId?: string;
}

// ─────────────────────────────────────────────
// ITINERARY ENGINE TYPES
// ─────────────────────────────────────────────

export type WalkingTolerance = "low" | "moderate" | "high";
export type ItineraryPacing = "relaxed" | "standard" | "packed";

export interface ItineraryPreset {
  id: string;
  name: string;
  nameBengali: string;
  tagline: string;
  description: string;
  iconName: string;
  preferences: Partial<ItineraryPreferences>;
}

export interface CommunityReport {
  id: string;
  placeId: string;
  placeName: string;
  category: "queue_delay" | "crowd_update" | "accessibility" | "stall_moved" | "police_diversion" | "general";
  notes: string;
  submittedAt: string;
  status: "pending_review" | "verified";
}

export interface ItineraryPreferences {
  startingLocality: string;
  startingLatitude?: number;
  startingLongitude?: number;
  availableMinutes: number;
  date: string; // ISO date string
  startTime: string; // HH:MM
  experienceTags: ExperienceTag[];
  transportMode: TransportMode;
  includeFood: boolean;
  foodCategories?: FoodCategory[];
  dietaryRestrictions?: DietaryNote[];
  maxBudget?: PriceRange;
  lockedStopIds?: string[];
  excludedPlaceIds?: string[];
  groupSize?: number;
  requiresAccessibility?: boolean;
  walkingTolerance?: WalkingTolerance;
  pacing?: ItineraryPacing;
  targetStopCount?: number;
}

export interface ItineraryStop {
  id: string;
  placeId: string;
  placeName: string;
  placeNameBengali?: string;
  placeType: "pandal" | "food" | "attraction";
  locality: string;
  latitude?: number;
  longitude?: number;
  recommendationReason: string;
  estimatedVisitMinutes: number;
  estimatedTravelMinutesFromPrevious?: number;
  routingMethodology?: "provider_verified" | "urban_heuristic" | "fallback_default";
  navigationUrl?: string;
  approximateArrivalTime?: string; // HH:MM
  dataConfidence: DataConfidence;
  caveats?: string[];
  locked: boolean;
  score?: number;
  tags?: ExperienceTag[];
  foodCategories?: FoodCategory[];
}

export interface ItinerarySummary {
  totalStops: number;
  estimatedTotalMinutes: number;
  estimatedTravelMinutes: number;
  estimatedVisitMinutes: number;
  approximateEndTime?: string; // HH:MM
  routingMethodology?: "provider_verified" | "urban_heuristic" | "fallback_default";
  isEstimated?: boolean;
  warnings: string[];
  unmetConstraints: string[];
  dataConfidence: DataConfidence;
}

export interface GeneratedItinerary {
  id: string;
  createdAt: string;
  preferences: ItineraryPreferences;
  stops: ItineraryStop[];
  summary: ItinerarySummary;
  unmetConstraints?: string[];
  alternatives?: PandalPlace[];
}

// ─────────────────────────────────────────────
// SAVED PLAN (localStorage)
// ─────────────────────────────────────────────

export interface SavedPlan {
  id: string;
  name: string;
  savedAt: string;
  version?: number;
  itinerary: GeneratedItinerary;
}

// ─────────────────────────────────────────────
// SCORING MODEL
// ─────────────────────────────────────────────

export interface ScoringWeights {
  preferenceMatch: number;      // 0–1
  festivalSignificance: number; // 0–1
  editorialQuality: number;     // 0–1
  geographicCompatibility: number; // 0–1
  diversityBonus: number;       // 0–1
  foodRelevance: number;        // 0–1
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  preferenceMatch: 0.35,
  festivalSignificance: 0.20,
  editorialQuality: 0.15,
  geographicCompatibility: 0.15,
  diversityBonus: 0.10,
  foodRelevance: 0.05,
};
