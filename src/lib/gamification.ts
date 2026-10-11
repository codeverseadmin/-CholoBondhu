// ─────────────────────────────────────────────
// CHOLO BONDHU — Gamified Pujo Quest Engine
//
// Step-by-step checklist, XP calculation, Durga Puja
// explorer ranks, badge unlocks, and local persistence.
// ─────────────────────────────────────────────

import type {
  GeneratedItinerary,
  PujoQuestBadge,
  PujoQuestLevel,
  PujoQuestProgress,
} from "@/types";

export const XP_PER_METRO_CHECKIN = 50;
export const XP_PER_PANDAL_VISIT = 100;
export const XP_PER_FOOD_STOP = 50;
export const XP_ALL_STOPS_BONUS = 150;

export const PUJO_QUEST_LEVELS: PujoQuestLevel[] = [
  {
    level: 1,
    title: "Pujo Nobin",
    titleBengali: "পুজো নবীন",
    minXp: 0,
    maxXp: 99,
    badgeIcon: "🌱",
  },
  {
    level: 2,
    title: "Rasta Choron",
    titleBengali: "রাস্তা চড়ন",
    minXp: 100,
    maxXp: 249,
    badgeIcon: "🚶",
  },
  {
    level: 3,
    title: "Addabaaj Bondhu",
    titleBengali: "আড্ডাবাজ বন্ধু",
    minXp: 250,
    maxXp: 449,
    badgeIcon: "☕",
  },
  {
    level: 4,
    title: "Bonedi Parikramak",
    titleBengali: "বনেদি পরিক্রমক",
    minXp: 450,
    maxXp: 699,
    badgeIcon: "🏛️",
  },
  {
    level: 5,
    title: "Shera Pandal Hunter",
    titleBengali: "সেরা প্যান্ডেল হান্টার",
    minXp: 700,
    maxXp: 9999,
    badgeIcon: "👑",
  },
];

export function getLevelForXp(xp: number): PujoQuestLevel {
  for (let i = PUJO_QUEST_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= PUJO_QUEST_LEVELS[i].minXp) {
      return PUJO_QUEST_LEVELS[i];
    }
  }
  return PUJO_QUEST_LEVELS[0];
}

export function getNextLevel(currentLevel: number): PujoQuestLevel | null {
  const next = PUJO_QUEST_LEVELS.find((l) => l.level === currentLevel + 1);
  return next || null;
}

function getStorageKey(itineraryId: string): string {
  return `cholobondhu_quest_${itineraryId}`;
}

export function calculateQuestProgress(
  itinerary: GeneratedItinerary,
  completedStopIds: string[],
  metroChecked: boolean
): PujoQuestProgress {
  const totalStops = itinerary.stops.length;
  const completedStopsSet = new Set(completedStopIds);
  let totalXp = 0;

  // Metro check-in XP
  if (metroChecked) {
    totalXp += XP_PER_METRO_CHECKIN;
  }

  let pandalVisits = 0;
  let foodVisits = 0;

  for (const stop of itinerary.stops) {
    if (completedStopsSet.has(stop.id)) {
      if (stop.placeType === "food") {
        totalXp += XP_PER_FOOD_STOP;
        foodVisits++;
      } else {
        totalXp += XP_PER_PANDAL_VISIT;
        pandalVisits++;
      }
    }
  }

  const completedStopsCount = completedStopIds.filter((id) =>
    itinerary.stops.some((s) => s.id === id)
  ).length;

  const isFullyCompleted =
    totalStops > 0 &&
    completedStopsCount === totalStops &&
    (!itinerary.startingMetro || metroChecked);

  // Bonus XP for finishing the entire quest
  if (isFullyCompleted) {
    totalXp += XP_ALL_STOPS_BONUS;
  }

  // Calculate badges
  const badges: PujoQuestBadge[] = [];

  if (metroChecked) {
    badges.push({
      id: "badge-metro",
      name: "Metro Rider",
      nameBengali: "মেট্রো রাইডার",
      icon: "🚇",
      description: "Checked in at the starting Kolkata Metro Station",
    });
  }

  if (pandalVisits >= 1) {
    badges.push({
      id: "badge-pratham-darshan",
      name: "Pratham Darshan",
      nameBengali: "প্রথম দর্শন",
      icon: "🪔",
      description: "Checked off your first puja pandal visit",
    });
  }

  if (foodVisits >= 1) {
    badges.push({
      id: "badge-petuk-bondhu",
      name: "Petuk Bondhu",
      nameBengali: "পেটুক বন্ধু",
      icon: "🍢",
      description: "Tasted Kolkata festive street food along your route",
    });
  }

  if (totalStops >= 3 && completedStopsCount >= Math.ceil(totalStops / 2)) {
    badges.push({
      id: "badge-ardha-parikrama",
      name: "Ardha Parikrama",
      nameBengali: "অর্ধ পরিক্রমা",
      icon: "⚡",
      description: "Crossed 50% of your planned Pujo route",
    });
  }

  if (isFullyCompleted) {
    badges.push({
      id: "badge-shera-hopper",
      name: "Pujo Parikramak",
      nameBengali: "পুজো পরিক্রমক",
      icon: "🏆",
      description: "Successfully checked off all steps on your itinerary!",
    });
  }

  const levelInfo = getLevelForXp(totalXp);
  const totalStepsTarget = totalStops + (itinerary.startingMetro ? 1 : 0);
  const totalStepsDone = completedStopsCount + (metroChecked ? 1 : 0);
  const percentComplete =
    totalStepsTarget > 0
      ? Math.min(100, Math.round((totalStepsDone / totalStepsTarget) * 100))
      : 0;

  return {
    itineraryId: itinerary.id,
    completedStopIds,
    metroOriginChecked: metroChecked,
    totalXp,
    level: levelInfo.level,
    levelTitle: levelInfo.title,
    levelTitleBengali: levelInfo.titleBengali,
    completedStopsCount,
    totalStopsCount: totalStops,
    percentComplete,
    badges,
    isFullyCompleted,
    lastUpdated: new Date().toISOString(),
  };
}

export function loadQuestProgress(itinerary: GeneratedItinerary): PujoQuestProgress {
  if (typeof window === "undefined" || !window.localStorage) {
    return calculateQuestProgress(itinerary, [], false);
  }

  try {
    const raw = localStorage.getItem(getStorageKey(itinerary.id));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.completedStopIds)) {
        return calculateQuestProgress(
          itinerary,
          parsed.completedStopIds,
          Boolean(parsed.metroOriginChecked)
        );
      }
    }
  } catch (err) {
    console.warn("Failed to load quest progress from localStorage:", err);
  }

  return calculateQuestProgress(itinerary, [], false);
}

export function saveQuestProgress(progress: PujoQuestProgress): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(
      getStorageKey(progress.itineraryId),
      JSON.stringify({
        completedStopIds: progress.completedStopIds,
        metroOriginChecked: progress.metroOriginChecked,
        totalXp: progress.totalXp,
        level: progress.level,
        lastUpdated: progress.lastUpdated,
      })
    );
  } catch (err) {
    console.warn("Failed to persist quest progress in localStorage:", err);
  }
}

export function toggleStopInQuest(
  itinerary: GeneratedItinerary,
  stopId: string
): PujoQuestProgress {
  const current = loadQuestProgress(itinerary);
  const exists = current.completedStopIds.includes(stopId);
  const nextCompleted = exists
    ? current.completedStopIds.filter((id) => id !== stopId)
    : [...current.completedStopIds, stopId];

  const updated = calculateQuestProgress(
    itinerary,
    nextCompleted,
    current.metroOriginChecked
  );
  saveQuestProgress(updated);
  return updated;
}

export function toggleMetroInQuest(
  itinerary: GeneratedItinerary
): PujoQuestProgress {
  const current = loadQuestProgress(itinerary);
  const updated = calculateQuestProgress(
    itinerary,
    current.completedStopIds,
    !current.metroOriginChecked
  );
  saveQuestProgress(updated);
  return updated;
}

export function resetQuest(itinerary: GeneratedItinerary): PujoQuestProgress {
  const updated = calculateQuestProgress(itinerary, [], false);
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem(getStorageKey(itinerary.id));
    } catch {}
  }
  return updated;
}
