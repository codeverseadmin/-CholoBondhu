// ─────────────────────────────────────────────
// STAGE 7: Food Stop Selection & Detour Optimization
// ─────────────────────────────────────────────

import type { FoodHotspot, PandalPlace } from "@/types";
import type { NormalizedPlannerInput } from "./types";
import { FOOD_HOTSPOT_DATA } from "@/data/food";
import { haversineDistanceKm } from "@/lib/routing-provider";

export interface FoodSelectionResult {
  foodHotspot?: FoodHotspot;
  foodStop?: FoodHotspot;
  insertIndex: number;
  insertionIndex: number;
  detourMinutes: number;
  unmetConstraint?: string;
  advisories: string[];
}

export function selectFoodAlongRoute(
  orderedPandals: PandalPlace[],
  input: NormalizedPlannerInput,
  foodPool: FoodHotspot[] = FOOD_HOTSPOT_DATA
): FoodSelectionResult {
  const advisories: string[] = [];

  if (!input.includeFood || foodPool.length === 0) {
    return {
      insertIndex: -1,
      insertionIndex: -1,
      detourMinutes: 0,
      advisories: [],
    };
  }

  let candidates = [...foodPool];
  let unmetConstraint: string | undefined;

  // 1. Filter by user category preference
  if (input.foodCategories && input.foodCategories.length > 0) {
    const categoryMatches = candidates.filter((f) =>
      f.foodCategory.some((cat) => input.foodCategories.includes(cat))
    );
    if (categoryMatches.length > 0) {
      candidates = categoryMatches;
    } else {
      unmetConstraint = `Requested food categories [${input.foodCategories.join(", ")}] could not be matched along route. Showing general dining options.`;
      advisories.push(unmetConstraint);
    }
  }

  // 2. Filter by dietary restriction (e.g. vegetarian, halal)
  if (input.dietaryRestrictions && input.dietaryRestrictions.length > 0) {
    const dietMatches = candidates.filter((f) =>
      f.dietaryNotes &&
      input.dietaryRestrictions.every((req) => f.dietaryNotes!.includes(req))
    );
    if (dietMatches.length > 0) {
      candidates = dietMatches;
    } else {
      advisories.push(
        `Limited venues matching strict dietary filter [${input.dietaryRestrictions.join(", ")}]. Check venue dietary notices.`
      );
    }
  }

  // 3. Filter by budget preference
  if (input.maxBudget && input.maxBudget !== ("any" as any)) {
    const budgetRank = { budget: 1, moderate: 2, premium: 3 };
    const maxRank = budgetRank[input.maxBudget] ?? 3;
    const budgetMatches = candidates.filter((f) => {
      if (!f.priceRange) return true;
      const rank = budgetRank[f.priceRange] ?? 2;
      return rank <= maxRank;
    });
    if (budgetMatches.length > 0) {
      candidates = budgetMatches;
    }
  }

  // 4. Detour Optimization along route
  // Find the candidate that minimizes route detour
  if (orderedPandals.length === 0) {
    const chosen = candidates[0];
    return {
      foodHotspot: chosen,
      foodStop: chosen,
      insertIndex: 0,
      insertionIndex: 0,
      detourMinutes: 10,
      unmetConstraint,
      advisories,
    };
  }

  const midIndex = Math.max(0, Math.floor(orderedPandals.length / 2) - 1);
  const anchorPandal = orderedPandals[midIndex] || orderedPandals[0];
  const anchorLat = anchorPandal.latitude ?? input.startingCoordinates.latitude;
  const anchorLng = anchorPandal.longitude ?? input.startingCoordinates.longitude;

  // Rank by proximity to route midpoint anchor
  const scoredFood = candidates.map((food) => {
    let dist = 10.0;
    if (food.latitude != null && food.longitude != null) {
      dist = haversineDistanceKm(anchorLat, anchorLng, food.latitude, food.longitude);
    }
    return { food, dist };
  });

  scoredFood.sort((a, b) => {
    if (Math.abs(a.dist - b.dist) > 0.01) return a.dist - b.dist;
    return a.food.id.localeCompare(b.food.id);
  });

  const best = scoredFood[0];
  const detourMinutes = Math.round(best.dist * 3.5); // Approx transit detour

  return {
    foodHotspot: best.food,
    foodStop: best.food,
    insertIndex: midIndex,
    insertionIndex: midIndex,
    detourMinutes,
    unmetConstraint,
    advisories,
  };
}

export const selectFoodStopForRoute = selectFoodAlongRoute;
