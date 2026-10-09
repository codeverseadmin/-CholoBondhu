// ─────────────────────────────────────────────
// CHOLO BONDHU — Saved Plans Persistence
//
// Robust localStorage management with schema versioning,
// corrupted data recovery, renaming, and safe Unicode sharing.
// ─────────────────────────────────────────────

import type { SavedPlan, GeneratedItinerary } from "@/types";

export const STORAGE_KEY = "cholobondhu_saved_plans";
export const SCHEMA_VERSION = 1;

export function getSavedPlans(): SavedPlan[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Validate structural integrity of each plan
    return parsed.filter((p: unknown): p is SavedPlan => {
      if (!p || typeof p !== "object") return false;
      const plan = p as Partial<SavedPlan>;
      return (
        typeof plan.id === "string" &&
        typeof plan.name === "string" &&
        typeof plan.savedAt === "string" &&
        plan.itinerary != null &&
        typeof plan.itinerary === "object" &&
        Array.isArray((plan.itinerary as GeneratedItinerary).stops)
      );
    });
  } catch (err) {
    console.error("Failed to parse saved plans from localStorage:", err);
    return [];
  }
}

export function savePlan(itinerary: GeneratedItinerary, name?: string): SavedPlan {
  const plans = getSavedPlans();
  const plan: SavedPlan = {
    id: itinerary.id,
    name: name?.trim() || `Pujo Plan — ${new Date().toLocaleDateString("en-IN")}`,
    savedAt: new Date().toISOString(),
    version: SCHEMA_VERSION,
    itinerary,
  };

  const existingIdx = plans.findIndex((p) => p.id === plan.id);
  if (existingIdx >= 0) {
    plans[existingIdx] = plan;
  } else {
    plans.unshift(plan);
  }

  // Retain last 15 plans to respect localStorage quotas
  const trimmed = plans.slice(0, 15);
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  } catch (err) {
    console.warn("Storage quota exceeded; could not persist plan:", err);
  }
  return plan;
}

export function renamePlan(id: string, newName: string): SavedPlan | undefined {
  if (!newName || !newName.trim()) return undefined;
  const plans = getSavedPlans();
  const target = plans.find((p) => p.id === id);
  if (!target) return undefined;

  target.name = newName.trim();
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    }
  } catch (err) {
    console.warn("Failed to update plan name in localStorage:", err);
  }
  return target;
}

export function deletePlan(id: string): boolean {
  const plans = getSavedPlans();
  const filtered = plans.filter((p) => p.id !== id);
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
    return true;
  } catch (err) {
    console.warn("Failed to delete plan from localStorage:", err);
    return false;
  }
}

export function getPlanById(id: string): SavedPlan | undefined {
  return getSavedPlans().find((p) => p.id === id);
}

export const getSavedPlanById = getPlanById;

/** Safely encode an itinerary to a URL-safe Base64 string supporting Unicode (Bengali script) */
export function getShareableUrl(itinerary: GeneratedItinerary): string {
  const origin =
    typeof window !== "undefined" && window.location && window.location.origin
      ? window.location.origin
      : "";
  try {
    const jsonStr = JSON.stringify(itinerary);
    const safeBase64 = btoa(
      encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
    return `${origin}/plan?share=${encodeURIComponent(safeBase64)}`;
  } catch (err) {
    console.error("Failed to serialize shareable URL:", err);
    return `${origin}/plan`;
  }
}

/** Safely decode an itinerary from a URL parameter with Unicode reconstruction */
export function decodeSharedItinerary(encoded: string): GeneratedItinerary | null {
  try {
    const decodedB64 = atob(decodeURIComponent(encoded));
    const jsonStr = decodeURIComponent(
      Array.prototype.map
        .call(decodedB64, (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonStr) as GeneratedItinerary;
    if (parsed && parsed.id && Array.isArray(parsed.stops)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
