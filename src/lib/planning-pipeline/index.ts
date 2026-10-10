// ─────────────────────────────────────────────
// CHOLO BONDHU — Clean Planning Pipeline
// ─────────────────────────────────────────────

import type {
  ItineraryPreferences,
  ScoringWeights,
  PandalPlace,
  FoodHotspot,
} from "@/types";
import { DEFAULT_SCORING_WEIGHTS } from "@/types";
import { PANDAL_DATA } from "@/data/pandals";
import { FOOD_HOTSPOT_DATA } from "@/data/food";
import type { RoutingProvider } from "@/lib/routing-provider";
import { defaultRoutingProvider } from "@/lib/routing-provider";

import type {
  PlanningPipelineResult,
  NormalizedPlannerInput,
} from "./types";
import { normalizePlannerInput } from "./stage1-normalize-input";
import { applyHardConstraints } from "./stage4-hard-constraints";
import { scoreCandidates } from "./stage5-score-candidates";
import { selectAndOptimizeStops } from "./stage6-select-and-optimize";
import { selectFoodAlongRoute } from "./stage7-insert-food";
import { validateAndExplainResult } from "./stage8-validate-and-explain";

export * from "./types";
export { normalizePlannerInput } from "./stage1-normalize-input";
export { applyHardConstraints } from "./stage4-hard-constraints";
export { scoreCandidates } from "./stage5-score-candidates";
export { selectAndOptimizeStops } from "./stage6-select-and-optimize";
export { selectFoodAlongRoute } from "./stage7-insert-food";
export { validateAndExplainResult } from "./stage8-validate-and-explain";

/**
 * Executes the complete 13-stage itinerary generation pipeline.
 * Deterministic for identical inputs & provider results.
 */
export function runPlanningPipeline(
  prefs: ItineraryPreferences,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  routingProvider: RoutingProvider = defaultRoutingProvider,
  customCandidates?: PandalPlace[],
  customFoodHotspots?: FoodHotspot[]
): PlanningPipelineResult {
  const warnings: string[] = [];
  const unmetConstraints: string[] = [];

  // Stage 1 & 2: Normalize user input & resolve starting coordinates
  const { normalized, warnings: normWarnings } = normalizePlannerInput(prefs);
  warnings.push(...normWarnings);

  // Stage 3 & 4: Retrieve candidate pool and apply hard constraints
  const candidatePool = customCandidates ?? PANDAL_DATA;
  const totalConsidered = candidatePool.length;

  const {
    lockedPandals,
    filteredCandidates,
    warnings: constraintWarnings,
    unmetConstraints: constraintUnmet,
  } = applyHardConstraints(candidatePool, normalized);

  warnings.push(...constraintWarnings);
  unmetConstraints.push(...constraintUnmet);

  // Stage 5: Score candidates with multi-factor scoring (spatial proximity + tags + editorial)
  const scoredCandidates = scoreCandidates(
    filteredCandidates,
    normalized,
    weights,
    lockedPandals
  );

  // Stage 6: Feasible selection and route optimization (2-opt)
  const {
    orderedPandals,
    warnings: selectionWarnings,
    unmetConstraints: selectionUnmet,
  } = selectAndOptimizeStops(
    lockedPandals,
    scoredCandidates,
    normalized,
    routingProvider
  );

  warnings.push(...selectionWarnings);
  unmetConstraints.push(...selectionUnmet);

  // Stage 7: Food selection along route corridor
  const foodHotspotsPool = customFoodHotspots ?? FOOD_HOTSPOT_DATA;
  const foodResult = selectFoodAlongRoute(
    orderedPandals,
    normalized,
    foodHotspotsPool
  );

  if (foodResult.unmetConstraint) {
    unmetConstraints.push(foodResult.unmetConstraint);
  }

  // Stage 8 & 13: Validate final itinerary & assemble explainable timeline
  return validateAndExplainResult(
    normalized,
    orderedPandals,
    foodResult.foodStop,
    foodResult.insertionIndex,
    routingProvider,
    {
      totalConsidered,
      excludedCount: totalConsidered - (lockedPandals.length + filteredCandidates.length),
      scoredCount: scoredCandidates.length,
      warnings,
      unmetConstraints,
    }
  );
}
