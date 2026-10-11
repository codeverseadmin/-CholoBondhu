"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  Clock,
  Sliders,
  Navigation2,
  RefreshCw,
  Share2,
  Bookmark,
  Plus,
  Utensils,
  ChevronDown,
  ChevronUp,
  Zap,
  Landmark,
  Palette,
  Users,
  Camera,
  Footprints,
  Accessibility,
  Check,
  Edit2,
  Info,
  SlidersHorizontal,
  Train,
  Heart,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type {
  ItineraryPreferences,
  ExperienceTag,
  TransportMode,
  GeneratedItinerary,
  WalkingTolerance,
  ItineraryPacing,
  PriceRange,
  FoodCategory,
  ItineraryPreset,
  PujoQuestProgress,
} from "@/types";
import {
  generateItinerary,
  generateItineraryWithDiagnostics,
  type PlanningDiagnostics,
  removeStop,
  reorderStop,
  toggleLockStop,
} from "@/lib/itinerary-engine";
import { savePlan, getShareableUrl, getPlanById, decodeSharedItinerary } from "@/lib/saved-plans";
import { PANDAL_DATA } from "@/data/pandals";
import { isRoutablePandal } from "@/lib/pandal-validator";
import { ITINERARY_PRESETS } from "@/data/presets";
import {
  KOLKATA_LOCALITIES,
  KOLKATA_METRO_STATIONS,
  CORE_PUJO_REGIONS,
  getCorePujoRegion,
  type CorePujoRegion,
  resolveLocalityCoordinates,
  getMetroStationById,
  getNearestMetroStation,
} from "@/data/localities";
import {
  ItineraryStopCard,
  RouteSummary,
  MetroOriginNode,
  PujoQuestTrackerCard,
} from "@/components/itinerary/ItineraryStopCard";
import {
  loadQuestProgress,
  toggleStopInQuest,
  toggleMetroInQuest,
  resetQuest,
} from "@/lib/gamification";
import { ReportFeedbackModal } from "@/components/ui/ReportFeedbackModal";
import { NoPlanEmptyState } from "@/components/ui/EmptyState";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(
  () => import("@/components/map/InteractiveMap").then((m) => ({ default: m.InteractiveMap })),
  { ssr: false, loading: () => <MapLoadingPlaceholder /> }
);

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const METRO_STATIONS = KOLKATA_METRO_STATIONS;
const LOCALITIES = KOLKATA_LOCALITIES.map((l) => l.name);

const TIME_OPTIONS = [
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
  { value: 360, label: "6 hours" },
  { value: 480, label: "Full day (8h)" },
];

const TAGS: { tag: ExperienceTag; label: string; emoji: string }[] = [
  { tag: "iconic", label: "Iconic Pandals", emoji: "⭐" },
  { tag: "artistic", label: "Art Installations", emoji: "🎨" },
  { tag: "traditional", label: "Traditional Puja", emoji: "🪔" },
  { tag: "less_crowded", label: "Quieter Spots", emoji: "🌿" },
  { tag: "photography", label: "Photography", emoji: "📷" },
  { tag: "family_friendly", label: "Family Outing", emoji: "👨‍👩‍👧" },
  { tag: "street_food", label: "Street Food", emoji: "🍢" },
  { tag: "heritage", label: "Heritage", emoji: "🏛️" },
  { tag: "contemporary", label: "Contemporary", emoji: "✨" },
];

const TRANSPORT_OPTIONS: { mode: TransportMode; label: string; note: string }[] = [
  { mode: "walking", label: "Walking", note: "Best for short neighbourhood clusters" },
  { mode: "metro_walking", label: "Metro + Walk", note: "Fastest & avoids street gridlock" },
  { mode: "public_transport", label: "Bus / Tram", note: "Authentic Kolkata experience" },
  { mode: "taxi", label: "Taxi / Cab", note: "Comfortable, higher traffic delays" },
  { mode: "flexible", label: "Flexible", note: "Dynamic multi-modal combination" },
];

const PACING_OPTIONS: { pacing: ItineraryPacing; label: string; note: string }[] = [
  { pacing: "relaxed", label: "Relaxed", note: "Extra queue buffers & longer rest periods" },
  { pacing: "standard", label: "Balanced", note: "Standard Kolkata festival pacing" },
  { pacing: "packed", label: "Fast-Paced", note: "Pack maximum pandals with quick visits" },
];

const WALKING_OPTIONS: { tolerance: WalkingTolerance; label: string; note: string }[] = [
  { tolerance: "low", label: "Short walks only", note: "Under 10 mins; auto/rickshaw preferred" },
  { tolerance: "moderate", label: "Moderate", note: "15–20 mins pedestrian tolerance" },
  { tolerance: "high", label: "High endurance", note: "Comfortable walking long Puja avenues" },
];

const FOOD_PREF_CATEGORIES: { category: FoodCategory; label: string }[] = [
  { category: "bengali_cuisine", label: "Bengali Cuisine" },
  { category: "biryani", label: "Biryani" },
  { category: "rolls_kathi", label: "Kathi Rolls" },
  { category: "sweets", label: "Sweets & Mishti" },
  { category: "street_food", label: "Street Food" },
  { category: "restaurant", label: "Dine-in Restaurant" },
];

function getPresetIcon(name: string) {
  switch (name) {
    case "Zap": return <Zap size={16} />;
    case "Landmark": return <Landmark size={16} />;
    case "Palette": return <Palette size={16} />;
    case "Users": return <Users size={16} />;
    case "Utensils": return <Utensils size={16} />;
    case "Camera": return <Camera size={16} />;
    case "Footprints": return <Footprints size={16} />;
    case "Heart": return <Heart size={16} />;
    default: return <SlidersHorizontal size={16} />;
  }
}

// ─────────────────────────────────────────────
// Plan Page Component
// ─────────────────────────────────────────────

function PlanPageInner() {
  const searchParams = useSearchParams();

  // 10 Dimensions of Planner form state
  // Default region: North Kolkata (starts at Shyambazar Metro Hub)
  const [selectedRegionId, setSelectedRegionId] = useState<string>("north_kolkata");
  const [locality, setLocality] = useState<string>("North Kolkata");
  const [availableMinutes, setAvailableMinutes] = useState(240);
  const [startTime, setStartTime] = useState("10:00");
  const [selectedTags, setSelectedTags] = useState<ExperienceTag[]>(["iconic", "artistic"]);
  const [transportMode, setTransportMode] = useState<TransportMode>("metro_walking");
  const [includeFood, setIncludeFood] = useState(true);
  const [foodCategories, setFoodCategories] = useState<FoodCategory[]>(["bengali_cuisine", "street_food"]);
  const [maxBudget, setMaxBudget] = useState<PriceRange | "any">("any");
  const [walkingTolerance, setWalkingTolerance] = useState<WalkingTolerance>("moderate");
  const [pacing, setPacing] = useState<ItineraryPacing>("standard");
  const [targetStopCount, setTargetStopCount] = useState(4);
  const [requiresAccessibility, setRequiresAccessibility] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Itinerary state
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [questProgress, setQuestProgress] = useState<PujoQuestProgress | null>(null);

  // Sync gamified quest progress when itinerary changes
  useEffect(() => {
    if (itinerary) {
      setQuestProgress(loadQuestProgress(itinerary));
    } else {
      setQuestProgress(null);
    }
  }, [itinerary]);
  const [diagnostics, setDiagnostics] = useState<PlanningDiagnostics | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<"saved" | "shared" | null>(null);
  const [reportingPlace, setReportingPlace] = useState<{ placeId: string; placeName: string } | null>(null);
  const [advisoryNotice, setAdvisoryNotice] = useState<{ type: "info" | "warning"; message: string } | null>(null);

  // View mode: "form" | "itinerary"
  const [view, setView] = useState<"form" | "itinerary">("form");
  const [isElderMode, setIsElderMode] = useState(false);

  function handleSelectRegion(regionId: string) {
    setSelectedRegionId(regionId);
    const reg = CORE_PUJO_REGIONS.find((r) => r.id === regionId) || getCorePujoRegion(regionId);
    if (reg) {
      setLocality(reg.name);
    }
  }

  // Handle URL query parameters (?mode=elder, ?preset=, ?restore=, ?share=, ?add=, ?area=)
  useEffect(() => {
    if (!searchParams) return;

    // Check area or region query param (e.g. ?area=north_kolkata, ?area=south_kolkata, ?area=college_square)
    const areaQuery = searchParams.get("area") || searchParams.get("region");
    if (areaQuery) {
      const reg = getCorePujoRegion(areaQuery);
      if (reg) {
        setSelectedRegionId(reg.id);
        setLocality(reg.name);
      }
    }

    // 1-Tap Elder Mode / Senior Heritage Walk
    const isElder =
      searchParams.get("mode") === "elder" ||
      searchParams.get("preset") === "senior-heritage-walk";

    if (isElder) {
      setIsElderMode(true);
      setActivePresetId("senior-heritage-walk");
      setSelectedRegionId("north_kolkata");

      const matchedMetro = getMetroStationById("shyambazar") || METRO_STATIONS[1];
      const coords = matchedMetro
        ? { latitude: matchedMetro.center.latitude, longitude: matchedMetro.center.longitude }
        : resolveLocalityCoordinates("North Kolkata");

      const elderPrefs: ItineraryPreferences = {
        startingLocality: "North Kolkata",
        startingMetroStationId: matchedMetro?.id,
        startingMetroStationName: matchedMetro?.name,
        startingLatitude: coords.latitude,
        startingLongitude: coords.longitude,
        availableMinutes: 180,
        date: new Date().toISOString().split("T")[0],
        startTime: "08:30",
        experienceTags: ["traditional", "heritage"],
        transportMode: "walking",
        walkingTolerance: "low",
        requiresAccessibility: true,
        pacing: "relaxed",
        targetStopCount: 3,
        includeFood: true,
        foodCategories: ["sweets", "bengali_cuisine"],
      };

      setLocality("North Kolkata");
      setAvailableMinutes(180);
      setStartTime("08:30");
      setSelectedTags(["traditional", "heritage"]);
      setTransportMode("walking");
      setWalkingTolerance("low");
      setRequiresAccessibility(true);
      setPacing("relaxed");
      setTargetStopCount(3);
      setIncludeFood(true);
      setFoodCategories(["sweets", "bengali_cuisine"]);

      const result = generateItineraryWithDiagnostics(elderPrefs);
      setItinerary(result.itinerary);
      setDiagnostics(result.diagnostics);
      setQuestProgress(loadQuestProgress(result.itinerary));
      setView("itinerary");
      return;
    }

    const restoreId = searchParams.get("restore");
    if (restoreId) {
      const saved = getPlanById(restoreId);
      if (saved) {
        setItinerary(saved.itinerary);
        setView("itinerary");
        return;
      }
    }

    const shareData = searchParams.get("share");
    if (shareData) {
      const decoded = decodeSharedItinerary(shareData);
      if (decoded) {
        setItinerary(decoded);
        setView("itinerary");
        return;
      }
    }

    const addPandalId = searchParams.get("add");
    if (addPandalId) {
      const pandal = PANDAL_DATA.find((p) => p.id === addPandalId || p.slug === addPandalId);
      if (pandal) {
        if (!isRoutablePandal(pandal)) {
          // Candidate record lacking verified turn-by-turn coordinates
          setAdvisoryNotice({
            type: "warning",
            message: `"${pandal.name}" is a candidate directory record (${pandal.locality}) awaiting field GPS coordinates and cannot be locked into automated turn-by-turn routing yet. We've set your starting area to ${pandal.locality} so you can plan routable pandals in this neighbourhood!`,
          });
          const matched = LOCALITIES.find((l) => l.toLowerCase().includes(pandal.locality.toLowerCase())) || pandal.locality;
          setLocality(matched);
          setView("form");
          return;
        }

        const prefs: ItineraryPreferences = {
          startingLocality: pandal.locality,
          availableMinutes: 240,
          date: new Date().toISOString().split("T")[0],
          startTime: "10:00",
          experienceTags: pandal.experienceTags.slice(0, 2),
          transportMode: "metro_walking",
          includeFood: true,
          lockedStopIds: [pandal.id],
          pacing: "standard",
          walkingTolerance: "moderate",
          targetStopCount: 4,
        };
        const result = generateItinerary(prefs);
        setItinerary(result);
        setView("itinerary");
      }
    }
  }, [searchParams]);

  function handleApplyPreset(preset: ItineraryPreset) {
    setActivePresetId(preset.id);
    setIsElderMode(preset.id === "senior-heritage-walk");
    const p = preset.preferences;
    if (p.startingLocality) {
      const reg = getCorePujoRegion(p.startingLocality);
      if (reg) {
        setSelectedRegionId(reg.id);
        setLocality(reg.name);
      } else {
        const matched = LOCALITIES.find((l) => l.toLowerCase().includes(p.startingLocality!.toLowerCase())) || p.startingLocality;
        setLocality(matched);
      }
    }
    if (p.availableMinutes) setAvailableMinutes(p.availableMinutes);
    if (p.startTime) setStartTime(p.startTime);
    if (p.transportMode) setTransportMode(p.transportMode);
    if (p.experienceTags) setSelectedTags(p.experienceTags);
    if (p.pacing) setPacing(p.pacing);
    if (p.walkingTolerance) setWalkingTolerance(p.walkingTolerance);
    if (p.targetStopCount) setTargetStopCount(p.targetStopCount);
    if (p.requiresAccessibility !== undefined) setRequiresAccessibility(p.requiresAccessibility);
    if (p.includeFood !== undefined) setIncludeFood(p.includeFood);
    if (p.foodCategories) setFoodCategories(p.foodCategories);
    if (p.maxBudget) setMaxBudget(p.maxBudget);
  }

  function toggleTag(tag: ExperienceTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function toggleFoodCategory(cat: FoodCategory) {
    setFoodCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function handleGenerate() {
    setIsGenerating(true);
    const matchedRegion = CORE_PUJO_REGIONS.find((r) => r.id === selectedRegionId) || getCorePujoRegion(locality);
    const matchedMetro =
      (matchedRegion ? getMetroStationById(matchedRegion.canonicalMetroId) : undefined) ||
      getMetroStationById(locality);
    const coords = matchedMetro ? matchedMetro.center : resolveLocalityCoordinates(locality);

    const prefs: ItineraryPreferences = {
      startingLocality: matchedRegion ? matchedRegion.name : locality,
      startingMetroStationId: matchedMetro?.id,
      startingMetroStationName: matchedMetro?.name,
      startingLatitude: coords.latitude,
      startingLongitude: coords.longitude,
      availableMinutes,
      date: new Date().toISOString().split("T")[0],
      startTime,
      experienceTags: selectedTags,
      transportMode,
      includeFood,
      walkingTolerance,
      pacing,
      targetStopCount,
      requiresAccessibility,
      foodCategories: includeFood && foodCategories.length > 0 ? foodCategories : undefined,
      maxBudget: includeFood && maxBudget !== "any" ? maxBudget : undefined,
    };

    setTimeout(() => {
      const result = generateItineraryWithDiagnostics(prefs);
      setItinerary(result.itinerary);
      setDiagnostics(result.diagnostics);
      setQuestProgress(loadQuestProgress(result.itinerary));
      setIsGenerating(false);
      setView("itinerary");
    }, 600);
  }

  function handleToggleStopComplete(stopId: string) {
    if (!itinerary) return;
    const updated = toggleStopInQuest(itinerary, stopId);
    setQuestProgress(updated);
  }

  function handleToggleMetroComplete() {
    if (!itinerary) return;
    const updated = toggleMetroInQuest(itinerary);
    setQuestProgress(updated);
  }

  function handleResetQuest() {
    if (!itinerary) return;
    const updated = resetQuest(itinerary);
    setQuestProgress(updated);
  }

  function handleRemoveStop(stopId: string) {
    if (!itinerary) return;
    setItinerary(removeStop(itinerary, stopId));
    if (selectedStopId === stopId) setSelectedStopId(undefined);
  }

  function handleMoveUp(index: number) {
    if (!itinerary) return;
    setItinerary(reorderStop(itinerary, index, index - 1));
  }

  function handleMoveDown(index: number) {
    if (!itinerary) return;
    setItinerary(reorderStop(itinerary, index, index + 1));
  }

  function handleToggleLock(stopId: string) {
    if (!itinerary) return;
    setItinerary(toggleLockStop(itinerary, stopId));
  }

  function handleSave() {
    if (!itinerary) return;
    savePlan(itinerary);
    setSavedFeedback("saved");
    setTimeout(() => setSavedFeedback(null), 2500);
  }

  function handleShare() {
    if (!itinerary) return;
    const url = getShareableUrl(itinerary);
    if (navigator.share) {
      navigator.share({ title: "My Puja Itinerary — Cholo Bondhu", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setSavedFeedback("shared");
      setTimeout(() => setSavedFeedback(null), 2500);
    }
  }

  function handleRegenerate() {
    setView("form");
    setItinerary(null);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[#D99B32] text-sm font-semibold uppercase tracking-widest mb-1">
          Intelligent Route Planner
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-[#211A1B]">
          Plan My Pujo
        </h1>
        <p className="text-[#7a6465] text-sm mt-1">
          Tailored to your pace, starting point, accessibility needs, and favourite food spots.
        </p>
      </div>

      {/* Feedback toast */}
      {savedFeedback && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#6F1830] text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg animate-fade-in-up">
          {savedFeedback === "saved" ? "✓ Plan saved to device!" : "✓ Shareable route link copied!"}
        </div>
      )}

      {/* Ground Condition Reporting Modal */}
      {reportingPlace && (
        <ReportFeedbackModal
          isOpen={true}
          onClose={() => setReportingPlace(null)}
          placeId={reportingPlace.placeId}
          placeName={reportingPlace.placeName}
        />
      )}

      {/* Candidate Record / Routing Advisory Notice */}
      {advisoryNotice && (
        <div className="mb-6 p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 flex items-start justify-between gap-3 animate-fade-in-up shadow-sm">
          <div className="flex items-start gap-2.5">
            <Info className="flex-shrink-0 text-amber-600 mt-0.5" size={18} />
            <p className="text-xs sm:text-sm leading-relaxed">{advisoryNotice.message}</p>
          </div>
          <button
            onClick={() => setAdvisoryNotice(null)}
            className="text-amber-800 hover:text-amber-950 text-xs font-semibold px-2 py-1 rounded hover:bg-amber-100 flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {view === "form" ? (
        <PlannerForm
          selectedRegionId={selectedRegionId}
          onSelectRegion={handleSelectRegion}
          locality={locality}
          setLocality={setLocality}
          availableMinutes={availableMinutes}
          setAvailableMinutes={setAvailableMinutes}
          selectedTags={selectedTags}
          toggleTag={toggleTag}
          requiresAccessibility={requiresAccessibility}
          setRequiresAccessibility={setRequiresAccessibility}
          includeFood={includeFood}
          setIncludeFood={setIncludeFood}
          foodCategories={foodCategories}
          toggleFoodCategory={toggleFoodCategory}
          activePresetId={activePresetId}
          onApplyPreset={handleApplyPreset}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      ) : (
        itinerary && (
          <ItineraryView
            itinerary={itinerary}
            diagnostics={diagnostics}
            selectedStopId={selectedStopId}
            setSelectedStopId={setSelectedStopId}
            showMap={showMap}
            setShowMap={setShowMap}
            onRemoveStop={handleRemoveStop}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onToggleLock={handleToggleLock}
            onReport={(placeId, placeName) => setReportingPlace({ placeId, placeName })}
            onRegenerate={handleRegenerate}
            onSave={handleSave}
            onShare={handleShare}
            questProgress={questProgress}
            onToggleStopComplete={handleToggleStopComplete}
            onToggleMetroComplete={handleToggleMetroComplete}
            onResetQuest={handleResetQuest}
            isElderMode={isElderMode}
          />
        )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Planner Form Component
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Streamlined Constants
// ─────────────────────────────────────────────

const STREAMLINED_TIME_OPTIONS = [
  {
    value: 120,
    label: "2 Hours",
    labelBn: "২ ঘণ্টা",
    tagline: "Quick 2–3 Pandal Hopper",
    desc: "Fast, focused darshan with minimal walking",
    icon: "⚡",
  },
  {
    value: 210,
    label: "3.5 Hours",
    labelBn: "৩.৫ ঘণ্টা",
    tagline: "Classic Walking Trail",
    desc: "Most popular: 3–4 iconic pandals + sweet shop",
    icon: "🚶",
  },
  {
    value: 300,
    label: "5 Hours",
    labelBn: "৫ ঘণ্টা",
    tagline: "Evening Darshan & Food",
    desc: "5–6 pandals with dedicated dining break",
    icon: "🌙",
  },
  {
    value: 420,
    label: "7 Hours",
    labelBn: "৭ ঘণ্টা",
    tagline: "All-Night Grand Tour",
    desc: "Midnight to dawn trail covering 7+ grand shrines",
    icon: "✨",
  },
];

const STREAMLINED_VIBES: {
  tag: ExperienceTag;
  label: string;
  labelBn: string;
  emoji: string;
  desc: string;
}[] = [
  {
    tag: "traditional",
    label: "Sabeki & Traditional",
    labelBn: "ঐতিহ্যবাহী ও সাবেকি",
    emoji: "🪔",
    desc: "Historic century-old barowari & rajbari pujas",
  },
  {
    tag: "iconic",
    label: "Grand & Iconic",
    labelBn: "বিখ্যাত ও জমকালো",
    emoji: "⭐",
    desc: "Kolkata's most famous landmark crowd-pullers",
  },
  {
    tag: "artistic",
    label: "Art & Theme Installations",
    labelBn: "থিম ও শিল্পকলা",
    emoji: "🎨",
    desc: "Innovative architectural masterpieces & concepts",
  },
  {
    tag: "less_crowded",
    label: "Peaceful & Quieter",
    labelBn: "শান্ত ও কম ভিড়",
    emoji: "🌿",
    desc: "Serene darshan without exhausting queues",
  },
  {
    tag: "photography",
    label: "Lighting & Visuals",
    labelBn: "ফটোগ্রাফি ও আলোকসজ্জা",
    emoji: "📷",
    desc: "Spectacular illumination & craftsmanship",
  },
  {
    tag: "family_friendly",
    label: "Family Friendly",
    labelBn: "পারিবারিক পরিক্রমা",
    emoji: "👨‍👩‍👧",
    desc: "Comfortable pacing, broad lanes & seating spots",
  },
];

const FOOD_GENRES: {
  category: FoodCategory;
  label: string;
  labelBn: string;
  emoji: string;
  desc: string;
}[] = [
  {
    category: "sweets",
    label: "Heritage Sweets & Mishti",
    labelBn: "ঐতিহ্যবাহী মিষ্টি ও রসগোল্লা",
    emoji: "🍯",
    desc: "Rosogolla, Sandesh, Mishti Doi & Chanar Jilipi",
  },
  {
    category: "biryani",
    label: "Kolkata Biryani",
    labelBn: "কলকাতা বিরিয়ানি ও মোগলাই",
    emoji: "🍗",
    desc: "Legendary aloo-dim biryani, chaap & firni",
  },
  {
    category: "bengali_cuisine",
    label: "Authentic Bengali Dishes",
    labelBn: "খাঁটি বাঙালি খাবার",
    emoji: "🍛",
    desc: "Kosha Mangsho, Fish Fry, Luchi & Shorshe Ilish",
  },
  {
    category: "rolls_kathi",
    label: "Kathi Rolls & Parathas",
    labelBn: "কাঠি রোল ও মোগলাই পরোটা",
    emoji: "🌯",
    desc: "Flaky egg-chicken kathi rolls & crisp parathas",
  },
  {
    category: "street_food",
    label: "Street Food & Phuchka",
    labelBn: "ফুচকা ও কলকাতার স্ট্রিট ফুড",
    emoji: "🍢",
    desc: "Piping-hot singara, telebhaja, phuchka & jhalmuri",
  },
  {
    category: "puja_stall",
    label: "Pujo Mela Food Stalls",
    labelBn: "পুজো মেলা ও প্যান্ডেল স্টল",
    emoji: "🎪",
    desc: "Night-market food clusters around pandal avenues",
  },
  {
    category: "cafe",
    label: "Heritage Cafés & Chai",
    labelBn: "ক্যাফে ও চা-আড্ডা",
    emoji: "☕",
    desc: "Coffee House nostalgia, Paramount sherbets & kulhad chai",
  },
  {
    category: "restaurant",
    label: "Dine-in Restaurants",
    labelBn: "রেস্তোরাঁ ও ডাইনিং",
    emoji: "🍽️",
    desc: "Family seating, Kolkata Chinese & multi-cuisine favourites",
  },
];

interface PlannerFormProps {
  selectedRegionId: string;
  onSelectRegion: (id: string) => void;
  locality: string;
  setLocality: (v: string) => void;
  availableMinutes: number;
  setAvailableMinutes: (v: number) => void;
  selectedTags: ExperienceTag[];
  toggleTag: (t: ExperienceTag) => void;
  requiresAccessibility: boolean;
  setRequiresAccessibility: (v: boolean) => void;
  includeFood: boolean;
  setIncludeFood: (v: boolean) => void;
  foodCategories: FoodCategory[];
  toggleFoodCategory: (cat: FoodCategory) => void;
  activePresetId: string | null;
  onApplyPreset: (preset: ItineraryPreset) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

function PlannerForm({
  selectedRegionId,
  onSelectRegion,
  locality,
  setLocality,
  availableMinutes,
  setAvailableMinutes,
  selectedTags,
  toggleTag,
  requiresAccessibility,
  setRequiresAccessibility,
  includeFood,
  setIncludeFood,
  foodCategories,
  toggleFoodCategory,
  activePresetId,
  onApplyPreset,
  onGenerate,
  isGenerating,
}: PlannerFormProps) {
  return (
    <div className="max-w-3xl space-y-7 no-horizontal-overflow">
      {/* Quick Curated Presets Bar */}
      <div className="card p-5 sm:p-6 bg-gradient-to-br from-[#FFFDF9] via-[#FFF5E6] to-[#FFF9F0] border-2 border-[#D99B32]/35 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#D99B32] text-white flex items-center justify-center shadow-xs">
              <Zap size={18} />
            </span>
            <h2 className="font-display font-bold text-[#211A1B] text-base sm:text-lg">
              1-Tap Curated Trails · জনপ্রিয় প্যান্ডেল ট্রেইল
            </h2>
          </div>
          <span className="text-[11px] text-[#8B5000] font-bold uppercase tracking-wider hidden sm:inline">
            Instant Route
          </span>
        </div>
        <p className="text-xs text-[#554042] mb-3.5 leading-relaxed">
          Tap any pre-calibrated trail to automatically configure your route with verified walking corridors:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ITINERARY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[58px] ${
                activePresetId === preset.id
                  ? "bg-[#6F1830] border-[#6F1830] text-white shadow-md ring-2 ring-[#6F1830]/20"
                  : "bg-white border-[rgba(111,24,48,0.15)] text-[#211A1B] hover:border-[#6F1830] hover:bg-[#FFF5E6]/50 shadow-xs"
              }`}
              aria-pressed={activePresetId === preset.id}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                    <span className={activePresetId === preset.id ? "text-amber-200" : "text-[#D99B32]"}>
                      {getPresetIcon(preset.iconName)}
                    </span>
                    <span>{preset.name}</span>
                  </div>
                  {activePresetId === preset.id && (
                    <Check size={14} className="text-amber-200 flex-shrink-0" />
                  )}
                </div>
                <div className={`text-[11px] font-bengali ${activePresetId === preset.id ? "text-amber-100" : "text-[#6F1830] font-semibold"}`}>
                  {preset.nameBengali}
                </div>
              </div>
              <p className={`text-[11px] mt-1.5 leading-tight ${activePresetId === preset.id ? "text-white/85" : "text-[#554042]"}`}>
                {preset.tagline}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 1 — Puja Area & Starting Metro Navigation */}
      <FormSection
        number="01"
        icon={<MapPin size={22} />}
        title="Choose Your Puja Area · আপনার পুজো এলাকা"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-[#554042] leading-relaxed">
            Select the Kolkata zone you wish to visit. Cholo Bondhu automatically assigns the optimal starting Metro Station, exit gate guidance, and starts your route navigation directly from there:
          </p>

          {/* 5 Core Region Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {CORE_PUJO_REGIONS.map((region) => {
              const isSelected = selectedRegionId === region.id || locality.toLowerCase().includes(region.name.toLowerCase());
              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => onSelectRegion(region.id)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between relative group min-h-[110px] ${
                    isSelected
                      ? "bg-gradient-to-br from-[#FFFDF9] to-[#FFF5E6] border-[#6F1830] ring-2 ring-[#6F1830]/25 shadow-md"
                      : "bg-white border-[rgba(111,24,48,0.15)] hover:border-[#6F1830]/50 hover:bg-[#FFFDF9]/60 shadow-xs"
                  }`}
                  aria-pressed={isSelected}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                            isSelected
                              ? "bg-[#6F1830] text-white"
                              : "bg-[#6F1830]/10 text-[#6F1830] group-hover:bg-[#6F1830] group-hover:text-white"
                          } transition-colors`}
                        >
                          {region.icon === "Landmark" && <Landmark size={18} />}
                          {region.icon === "Zap" && <Zap size={18} />}
                          {region.icon === "Palette" && <Palette size={18} />}
                          {region.icon === "Users" && <Users size={18} />}
                          {region.icon === "Train" && <Train size={18} />}
                        </span>
                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-[#211A1B] leading-tight">
                            {region.name}
                          </h3>
                          <span className="font-bengali text-xs text-[#6F1830] font-bold">
                            {region.nameBengali}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[#6F1830] text-white flex items-center justify-center shadow-xs">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#554042] line-clamp-2 mt-1 leading-snug">
                      {region.tagline}
                    </p>
                  </div>

                  {/* Assigned Metro Hub Preview Chip */}
                  <div className="mt-3.5 pt-2.5 border-t border-[rgba(111,24,48,0.08)] flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#005EB8] truncate">
                      <Train size={13} className={region.metroLineCode === "blue" ? "text-[#005EB8]" : "text-[#009639]"} />
                      <span>{region.canonicalMetroName}</span>
                    </span>
                    <span className="text-[10px] text-[#8B5000] font-bold bg-[#FFF5E6] px-2 py-0.5 rounded-full border border-[#D99B32]/40 flex-shrink-0">
                      Starts Here
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Assigned Metro Station Guidance Banner */}
          {(() => {
            const activeRegion = CORE_PUJO_REGIONS.find((r) => r.id === selectedRegionId) ||
              getCorePujoRegion(locality) ||
              CORE_PUJO_REGIONS[0];

            return (
              <div className="p-4 sm:p-5 bg-gradient-to-br from-[#FFF9F0] via-[#FFF5E6] to-[#FFFDF9] rounded-2xl border-2 border-[#D99B32]/50 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-[#005EB8] text-white flex items-center justify-center shadow-xs">
                      <Train size={17} />
                    </span>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#7a6465] block">
                        Assigned Starting Hub
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-[#6F1830] flex items-center gap-1.5">
                        <span>{activeRegion.canonicalMetroName}</span>
                        <span className="font-bengali text-xs text-[#554042] font-semibold">
                          ({activeRegion.canonicalMetroNameBengali})
                        </span>
                      </h4>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white shadow-xs ${
                    activeRegion.metroLineCode === "blue" ? "bg-[#005EB8]" : "bg-[#009639]"
                  }`}>
                    {activeRegion.metroLineName}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 text-xs text-[#3d3032]">
                  <div className="flex items-start gap-2.5 bg-white/90 p-3 rounded-xl border border-[rgba(111,24,48,0.1)]">
                    <Footprints size={16} className="text-[#D99B32] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#211A1B] block text-[11px] uppercase tracking-wide">
                        Station Exit & Turnout
                      </strong>
                      <span className="text-[#3d3032] font-medium leading-relaxed">{activeRegion.gateGuidance}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-white/90 p-3 rounded-xl border border-[rgba(111,24,48,0.1)]">
                    <Navigation2 size={16} className="text-[#6F1830] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#211A1B] block text-[11px] uppercase tracking-wide">
                        Walking Corridor
                      </strong>
                      <span className="text-[#554042] font-medium leading-relaxed">{activeRegion.startingCorridorDescription}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#554042] pt-0.5 flex-wrap">
                  <span className="font-bold text-[#6F1830]">Featured in this corridor:</span>
                  <span>{activeRegion.popularPandals.join(" · ")}</span>
                </div>
              </div>
            );
          })()}

          {/* Optional Custom Neighborhood Dropdown */}
          <details className="text-xs text-[#7a6465] group pt-1">
            <summary className="cursor-pointer font-semibold hover:text-[#6F1830] flex items-center gap-1.5 py-1 select-none">
              <span>Looking for another specific station or custom neighborhood?</span>
              <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-2">
              <select
                value={locality}
                onChange={(e) => {
                  setLocality(e.target.value);
                  const reg = getCorePujoRegion(e.target.value);
                  if (reg) onSelectRegion(reg.id);
                }}
                className="w-full h-11 px-3.5 rounded-xl border border-[rgba(111,24,48,0.2)] bg-white text-[#211A1B] text-xs font-semibold focus:outline-none focus:border-[#6F1830]"
              >
                <optgroup label="🚇 Kolkata Metro Stations">
                  {METRO_STATIONS.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.nameBengali})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="📍 Kolkata Neighbourhoods">
                  {LOCALITIES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </details>
        </div>
      </FormSection>

      {/* Step 2 — Time & Pacing */}
      <FormSection
        number="02"
        icon={<Clock size={22} />}
        title="Time Available · কতক্ষণ ঘুরবেন"
      >
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-[#554042]">
            Choose your comfortable hopping duration. Cholo Bondhu automatically calculates optimal pandal stops, queue buffers, and realistic transit times:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STREAMLINED_TIME_OPTIONS.map(({ value, label, labelBn, tagline, desc, icon }) => {
              const isSelected = availableMinutes === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAvailableMinutes(value)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3.5 min-h-[58px] ${
                    isSelected
                      ? "bg-gradient-to-br from-[#FFFDF9] to-[#FFF5E6] border-[#6F1830] ring-2 ring-[#6F1830]/25 shadow-sm"
                      : "bg-white border-[rgba(111,24,48,0.15)] text-[#211A1B] hover:border-[#6F1830]/50 hover:bg-[#FFFDF9]/60 shadow-xs"
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="text-2xl mt-0.5 flex-shrink-0" aria-hidden="true">
                    {icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm sm:text-base text-[#211A1B]">{label}</span>
                        <span className="font-bengali text-xs font-bold text-[#6F1830]">({labelBn})</span>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[#6F1830] text-white flex items-center justify-center flex-shrink-0">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#8B5000] mt-0.5">{tagline}</p>
                    <p className="text-[11px] text-[#554042] mt-0.5">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </FormSection>

      {/* Step 3 — Pujo Vibe & Amenities */}
      <FormSection
        number="03"
        icon={<Sliders size={22} />}
        title="Pujo Vibe & Preferences · পছন্দের বিষয় ও সুবিধা"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#6F1830] uppercase tracking-wider mb-2.5">
              Select Your Preferred Vibes (Choose one or more):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {STREAMLINED_VIBES.map(({ tag, label, labelBn, emoji, desc }) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[54px] ${
                      isSelected
                        ? "bg-[#6F1830] border-[#6F1830] text-white shadow-sm ring-2 ring-[#6F1830]/20"
                        : "bg-white border-[rgba(111,24,48,0.15)] text-[#211A1B] hover:border-[#6F1830] hover:bg-[#FFF5E6]/40 shadow-xs"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                          <span>{emoji}</span>
                          <span>{label}</span>
                        </div>
                        {isSelected && (
                          <Check size={14} className="text-amber-200 flex-shrink-0" />
                        )}
                      </div>
                      <div className={`text-[11px] font-bengali font-semibold ${isSelected ? "text-amber-100" : "text-[#6F1830]"}`}>
                        {labelBn}
                      </div>
                    </div>
                    <p className={`text-[11px] mt-1 leading-tight ${isSelected ? "text-white/85" : "text-[#554042]"}`}>
                      {desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1-Tap Food and Senior Amenities */}
          <div className="space-y-3 pt-3 border-t border-[rgba(111,24,48,0.1)]">
            {/* Food Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[rgba(111,24,48,0.12)] shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF5E6] text-[#D99B32] flex items-center justify-center font-bold text-lg flex-shrink-0">
                  ☕
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm text-[#211A1B] block">
                    Include Famous Sweets &amp; Food Stops (মিষ্টি ও খাবার)
                  </span>
                  <span className="text-[11px] sm:text-xs text-[#554042]">
                    Adds verified heritage mishti or Kolkata food joints along your walking route
                  </span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={includeFood}
                onClick={() => setIncludeFood(!includeFood)}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                  includeFood ? "bg-[#6F1830]" : "bg-gray-300"
                }`}
                aria-label="Include food stops in itinerary"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    includeFood ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Food Genres Selection (Visible when food is included) */}
            {includeFood && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FFFDF9] via-[#FFF9F0] to-[#FFF5E6] border-2 border-[#D99B32]/35 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <label className="block text-xs font-bold text-[#6F1830] uppercase tracking-wider">
                      Select Food Genres &amp; Cuisines · পছন্দের খাবারের ধরন
                    </label>
                    <p className="text-[11px] text-[#554042] mt-0.5">
                      Choose which food styles to suggest along your route (select one or more):
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#8B5000] bg-white px-2.5 py-1 rounded-full border border-[#D99B32]/30 shadow-2xs">
                    {foodCategories.length} {foodCategories.length === 1 ? "Genre" : "Genres"} Selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                  {FOOD_GENRES.map(({ category, label, labelBn, emoji, desc }) => {
                    const isSelected = foodCategories.includes(category);
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleFoodCategory(category)}
                        className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[66px] cursor-pointer touch-target-min ${
                          isSelected
                            ? "bg-[#6F1830] border-[#6F1830] text-white shadow-sm ring-2 ring-[#6F1830]/20"
                            : "bg-white border-[rgba(111,24,48,0.15)] text-[#211A1B] hover:border-[#6F1830] hover:bg-[#FFF5E6]/50 shadow-2xs"
                        }`}
                        aria-pressed={isSelected}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                              <span>{emoji}</span>
                              <span className="truncate">{label}</span>
                            </div>
                            {isSelected && (
                              <Check size={14} className="text-amber-200 flex-shrink-0" />
                            )}
                          </div>
                          <div
                            className={`text-[11px] font-bengali font-semibold ${
                              isSelected ? "text-amber-100" : "text-[#6F1830]"
                            }`}
                          >
                            {labelBn}
                          </div>
                        </div>
                        <p
                          className={`text-[10px] mt-1.5 leading-snug ${
                            isSelected ? "text-white/85" : "text-[#554042]"
                          }`}
                        >
                          {desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Accessibility / Senior Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[rgba(111,24,48,0.12)] shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#8B5000] flex items-center justify-center font-bold text-lg flex-shrink-0">
                  ♿
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm text-[#211A1B] block">
                    Senior &amp; Step-Free Priority (সহজ পরিক্রমা)
                  </span>
                  <span className="text-[11px] sm:text-xs text-[#554042]">
                    Avoids high footbridges and stairs; prioritizes step-free darshan and short paths
                  </span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={requiresAccessibility}
                onClick={() => setRequiresAccessibility(!requiresAccessibility)}
                className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                  requiresAccessibility ? "bg-[#6F1830]" : "bg-gray-300"
                }`}
                aria-label="Prioritize senior and wheelchair accessible routes"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    requiresAccessibility ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Primary Action CTA Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full min-h-[56px] sm:min-h-[64px] py-4 px-6 rounded-2xl bg-gradient-to-r from-[#6F1830] via-[#8B2040] to-[#E74732] text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer touch-target-min"
          aria-live="polite"
          aria-label="Generate personalized itinerary"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              <span>রুট তৈরি হচ্ছে... Calibrating Optimal Route</span>
            </>
          ) : (
            <>
              <Sparkles size={20} className="text-amber-200" />
              <span>তৈরি করুন · Generate My Pujo Route</span>
              <ArrowRight size={20} />
            </>
          )}
        </button>

        <p className="text-xs text-[#554042] text-center mt-3 leading-relaxed">
          ⚡ 100% offline-ready &amp; account-free. Automatically begins at the designated Metro station.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Itinerary View Component
// ─────────────────────────────────────────────

interface ItineraryViewProps {
  itinerary: GeneratedItinerary;
  diagnostics?: PlanningDiagnostics | null;
  selectedStopId?: string;
  setSelectedStopId: (id?: string) => void;
  showMap: boolean;
  setShowMap: (v: boolean) => void;
  onRemoveStop: (id: string) => void;
  onMoveUp: (i: number) => void;
  onMoveDown: (i: number) => void;
  onToggleLock: (id: string) => void;
  onReport: (placeId: string, placeName: string) => void;
  onRegenerate: () => void;
  onSave: () => void;
  onShare: () => void;
  questProgress?: PujoQuestProgress | null;
  onToggleStopComplete?: (stopId: string) => void;
  onToggleMetroComplete?: () => void;
  onResetQuest?: () => void;
  isElderMode?: boolean;
}

function PersonalizationInsightsCard({ diagnostics }: { diagnostics: PlanningDiagnostics }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card p-4 bg-gradient-to-br from-[#FFFDF9] to-[#FFF5E6] border border-[#6F1830]/20 space-y-2.5">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#6F1830] text-white flex items-center justify-center text-[10px] font-bold">
            ✓
          </div>
          <span className="font-semibold text-xs text-[#211A1B] uppercase tracking-wider">
            Route Highlights · আপনার রুটের বিশেষ বৈশিষ্ট্য
          </span>
        </div>
        <button
          type="button"
          className="text-xs text-[#6F1830] font-medium flex items-center gap-1 hover:underline"
        >
          {expanded ? "Hide Details" : "View Highlights"}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-center">
        <div className="bg-white/90 p-2.5 rounded-xl border border-[rgba(111,24,48,0.1)]">
          <div className="text-[10px] text-[#7a6465] uppercase font-bold tracking-wider">Transit Starting Point</div>
          <div className="text-xs font-bold text-[#6F1830] mt-0.5">
            Nearest Metro Corridor
          </div>
        </div>
        <div className="bg-white/90 p-2.5 rounded-xl border border-[rgba(111,24,48,0.1)]">
          <div className="text-[10px] text-[#7a6465] uppercase font-bold tracking-wider">Food &amp; Refreshment</div>
          <div className="text-xs font-bold text-[#6F1830] mt-0.5 truncate" title={diagnostics.foodHotspotSelected || "None"}>
            {diagnostics.foodIncluded ? diagnostics.foodHotspotSelected || "Heritage Sweets Included" : "Darshan Only"}
          </div>
        </div>
        <div className="bg-white/90 p-2.5 rounded-xl border border-[rgba(111,24,48,0.1)] col-span-2 sm:col-span-1">
          <div className="text-[10px] text-[#7a6465] uppercase font-bold tracking-wider">Route Optimization</div>
          <div className="text-xs font-bold text-emerald-800 mt-0.5">
            Verified Walking Paths
          </div>
        </div>
      </div>

      {expanded && (
        <div className="pt-2 border-t border-[rgba(111,24,48,0.12)] space-y-1.5">
          <div className="text-[11px] font-semibold text-[#3d3032]">
            Preferences active for this custom trail:
          </div>
          <ul className="space-y-1 text-xs text-[#523d40]">
            {diagnostics.preferenceInfluences.map((inf, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-[#6F1830] font-bold">•</span>
                <span>{inf}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ItineraryView({
  itinerary,
  diagnostics,
  selectedStopId,
  setSelectedStopId,
  showMap,
  setShowMap,
  onRemoveStop,
  onMoveUp,
  onMoveDown,
  onToggleLock,
  onReport,
  onRegenerate,
  onSave,
  onShare,
  questProgress,
  onToggleStopComplete,
  onToggleMetroComplete,
  onResetQuest,
  isElderMode,
}: ItineraryViewProps) {
  return (
    <div className="space-y-6">
      {/* Elder Mode / Senior Heritage Walk Active Banner */}
      {isElderMode && (
        <div className="card p-4 sm:p-5 bg-gradient-to-r from-amber-500/15 via-[#FFFDF9] to-amber-500/10 border-2 border-amber-400 rounded-2xl shadow-sm">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-400 text-[#6F1830] flex items-center justify-center font-bold shadow flex-shrink-0">
                <Heart className="w-6 h-6 fill-current text-[#6F1830]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bengali text-lg sm:text-xl font-bold text-[#6F1830]">
                    সহজ পুজো পরিক্রমা (Elder Mode Active)
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ 100% Step-Free & Low Walking
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#523d40] mt-1 leading-relaxed">
                  সকালের শান্ত বনেদি পরিক্রমা (08:30 AM darshan) • Bagbazar, Kumartuli & Sovabazar heritage shrines • Zero evening stampede risk • Includes Chittaranjan Mishti rest stop.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#7a6465] bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs font-semibold">
                Pacing: Relaxed (কম ভিড়)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="font-display text-2xl text-[#211A1B]">
            Your Pujo Route
          </h2>
          <p className="text-xs text-[#7a6465]">
            {itinerary.summary.totalStops} stops · {itinerary.summary.estimatedTotalMinutes} min total journey
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRegenerate} className="btn btn-secondary text-xs py-2 px-3.5">
            <RefreshCw size={14} />
            Adjust Prefs
          </button>
          <button
            onClick={() => setShowMap(!showMap)}
            className="btn btn-secondary text-xs py-2 px-3.5"
            aria-pressed={showMap}
          >
            {showMap ? "Hide Map" : "Show Map"}
          </button>
          <button onClick={onSave} className="btn btn-secondary text-xs py-2 px-3.5" aria-label="Save plan to device">
            <Bookmark size={14} />
            Save
          </button>
          <button onClick={onShare} className="btn btn-secondary text-xs py-2 px-3.5" aria-label="Share plan URL">
            <Share2 size={14} />
            Share
          </button>
        </div>
      </div>

      {/* Route summary */}
      <RouteSummary itinerary={itinerary} />

      {/* Gamified Pujo Quest Tracker */}
      {questProgress && (
        <PujoQuestTrackerCard
          quest={questProgress}
          onReset={onResetQuest}
        />
      )}

      {/* Personalization Diagnostics */}
      {diagnostics && <PersonalizationInsightsCard diagnostics={diagnostics} />}

      {/* Map (lazy loaded) */}
      {showMap && (
        <div className="h-72 md:h-96 rounded-xl overflow-hidden border border-[rgba(111,24,48,0.15)] shadow-inner">
          <InteractiveMap
            stops={itinerary.stops}
            selectedStopId={selectedStopId}
            onStopSelect={setSelectedStopId}
            className="h-full"
          />
        </div>
      )}

      {/* Stops */}
      {itinerary.stops.length === 0 ? (
        <NoPlanEmptyState />
      ) : (
        <div className="space-y-1 relative">
          <div className="timeline-line" aria-hidden="true" />

          {/* Starting Metro Origin Node */}
          {itinerary.startingMetro && (
            <MetroOriginNode
              startingMetro={itinerary.startingMetro}
              startTime={itinerary.preferences.startTime}
              firstStop={itinerary.stops[0]}
              isChecked={questProgress?.metroOriginChecked}
              onToggleCheck={onToggleMetroComplete}
            />
          )}

          {itinerary.stops.map((stop, i) => (
            <ItineraryStopCard
              key={stop.id}
              stop={stop}
              index={i}
              totalStops={itinerary.stops.length}
              selected={selectedStopId === stop.id}
              onSelect={setSelectedStopId}
              onRemove={onRemoveStop}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onToggleLock={onToggleLock}
              onReport={onReport}
              isCompleted={questProgress?.completedStopIds.includes(stop.id)}
              onToggleComplete={onToggleStopComplete}
            />
          ))}
        </div>
      )}

      {/* Add more stops CTA */}
      <div className="flex justify-center">
        <a href="/discover" className="btn btn-ghost text-sm text-[#6F1830]">
          <Plus size={16} />
          Add a stop from Discover
        </a>
      </div>

      {/* Editorial and Device-Local Notice */}
      <div className="card p-4 bg-[#FFF5E6] border border-[#D99B32]/30 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8B5000]">
          <Info size={14} />
          <span>Real-World Journey Guidance</span>
        </div>
        <p className="text-xs text-[#7a6465] leading-relaxed">
          Saved itineraries remain stored locally on this device. Walking times between pandals assume festive pedestrian lane diversions enforced by Kolkata Police. Always verify barricades with local volunteers.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Form Section Wrapper
// ─────────────────────────────────────────────

function FormSection({
  number, icon, title, children,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-[#6F1830]/10 text-[#6F1830] flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <span className="text-[10px] text-[#7a6465] font-semibold uppercase tracking-widest">
            Step {number}
          </span>
          <h3 className="font-semibold text-[#211A1B] text-base">{title}</h3>
        </div>
      </div>
      {children}
    </div>
  );
}

function MapLoadingPlaceholder() {
  return (
    <div className="h-full flex items-center justify-center bg-[#FFF5E6] rounded-xl">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 rounded-full border-2 border-[#6F1830] border-t-transparent animate-spin" />
        <p className="text-xs text-[#7a6465]">Loading interactive festival map…</p>
      </div>
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense>
      <PlanPageInner />
    </Suspense>
  );
}
