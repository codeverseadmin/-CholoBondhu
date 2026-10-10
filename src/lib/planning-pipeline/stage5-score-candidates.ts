// ─────────────────────────────────────────────
// STAGE 5: Multi-Factor Candidate Scoring
//
// Genuinely integrates spatial origin proximity,
// user experience tags, transport mode reach,
// accessibility, and pacing into a composite score.
// ─────────────────────────────────────────────

import type { PandalPlace, ScoringWeights } from "@/types";
import { DEFAULT_SCORING_WEIGHTS } from "@/types";
import type { NormalizedPlannerInput, ScoredCandidate, CandidateScoreBreakdown } from "./types";
import { haversineDistanceKm } from "@/lib/routing-provider";

export function scoreCandidates(
  candidates: PandalPlace[],
  input: NormalizedPlannerInput,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
  lockedPandals: PandalPlace[] = []
): ScoredCandidate[] {
  const alreadySelectedTags = new Set<string>(
    lockedPandals.flatMap((p) => p.experienceTags)
  );
  const originLat = input.startingCoordinates.latitude;
  const originLng = input.startingCoordinates.longitude;

  // Scale factor D0 for exponential distance decay based on transport mode
  const decayDistanceKm =
    input.transportMode === "walking"
      ? input.walkingTolerance === "low" ? 1.5 : input.walkingTolerance === "high" ? 3.5 : 2.2
      : input.transportMode === "metro_walking"
      ? 6.5
      : 8.0;

  return candidates.map((place) => {
    // 1. Proximity Score (0.0 to 1.0)
    let distKm = 5.0; // fallback
    if (place.latitude != null && place.longitude != null) {
      distKm = haversineDistanceKm(originLat, originLng, place.latitude, place.longitude);
    }
    // Exponential decay: nearest = 1.0, farther away drops toward 0.0
    const proximityScore = Math.exp(-distKm / decayDistanceKm);

    // 2. Experience Tag Match Score (0.0 to 1.0)
    const userTags = input.experienceTags;
    const matchedTags = place.experienceTags.filter((t) => userTags.includes(t));
    const tagMatchScore =
      userTags.length > 0 ? matchedTags.length / userTags.length : 0.5;

    // 3. Accessibility Match Score (0.0 to 1.0)
    let accessibilityScore = 0.5;
    if (input.requiresAccessibility) {
      if (place.accessibilityConfidence === "verified_accessible") {
        accessibilityScore = 1.0;
      } else if (place.accessibilityConfidence === "crowd_dependent") {
        accessibilityScore = 0.5;
      } else {
        accessibilityScore = 0.1;
      }
    }

    // 4. Pacing & Crowd Match Score (0.0 to 1.0)
    let pacingScore = 0.6;
    if (input.pacing === "relaxed") {
      // Relaxed prefers low/moderate crowds and longer visit times
      pacingScore =
        place.crowdLevel === "low"
          ? 1.0
          : place.crowdLevel === "moderate"
          ? 0.8
          : 0.4;
    } else if (input.pacing === "packed") {
      // Packed prefers shorter visit durations to fit more stops
      pacingScore = place.recommendedVisitMinutes <= 40 ? 0.9 : 0.6;
    }

    // 5. Editorial Significance & Quality (0.0 to 1.0)
    const significance = place.editorialRating ? (place.editorialRating - 1) / 4 : 0.5;
    const quality =
      (place.featured ? 0.5 : 0.25) +
      (place.dataConfidence === "verified" || place.dataConfidence === "curated" ? 0.5 : 0.2);

    // 6. Diversity Score (0.0 to 1.0)
    const unseenTags = place.experienceTags.filter((t) => !alreadySelectedTags.has(t));
    const diversityScore = Math.min(unseenTags.length / 3, 1.0);

    // Weighted composite score (Weights sum to 1.0)
    // Proximity has a strong 0.35 weight so geographic origin genuinely controls selection!
    const totalScore =
      proximityScore * 0.35 +
      tagMatchScore * 0.30 +
      accessibilityScore * (input.requiresAccessibility ? 0.15 : 0.05) +
      significance * 0.10 +
      quality * 0.08 +
      diversityScore * 0.07 +
      pacingScore * 0.05;

    const scoreBreakdown: CandidateScoreBreakdown = {
      proximityScore,
      tagMatchScore,
      accessibilityScore,
      editorialSignificance: significance,
      diversityScore,
      totalScore: Number(totalScore.toFixed(4)),
      matchedTags,
      distanceFromStartKm: Number(distKm.toFixed(2)),
    };

    return {
      place,
      scoreBreakdown,
    };
  });
}
