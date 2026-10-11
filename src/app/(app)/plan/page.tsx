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
import { useAuth } from "@/context/AuthContext";
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
    default: return <SlidersHorizontal size={16} />;
  }
}

// ─────────────────────────────────────────────
// Plan Page Component
// ─────────────────────────────────────────────

function PlanPageInner() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // 10 Dimensions of Planner form state (Defaulting origin to Shyambazar Metro Hub)
  const [locality, setLocality] = useState(METRO_STATIONS[1]?.name || LOCALITIES[0]);
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

  // Handle URL query parameters (?restore=, ?share=, ?add=)
  useEffect(() => {
    if (!searchParams) return;
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
    const p = preset.preferences;
    if (p.startingLocality) {
      const matched = LOCALITIES.find((l) => l.toLowerCase().includes(p.startingLocality!.toLowerCase())) || p.startingLocality;
      setLocality(matched);
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
    const matchedMetro = getMetroStationById(locality);
    const coords = resolveLocalityCoordinates(locality);
    const prefs: ItineraryPreferences = {
      startingLocality: locality,
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
    if (user) {
      fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itinerary.id,
          name: `Pujo Plan — ${new Date().toLocaleDateString("en-IN")}`,
          itinerary,
        }),
      }).catch((err) => console.warn("Background cloud plan save error:", err));
    }
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
          locality={locality}
          setLocality={setLocality}
          availableMinutes={availableMinutes}
          setAvailableMinutes={setAvailableMinutes}
          startTime={startTime}
          setStartTime={setStartTime}
          selectedTags={selectedTags}
          toggleTag={toggleTag}
          transportMode={transportMode}
          setTransportMode={setTransportMode}
          pacing={pacing}
          setPacing={setPacing}
          walkingTolerance={walkingTolerance}
          setWalkingTolerance={setWalkingTolerance}
          targetStopCount={targetStopCount}
          setTargetStopCount={setTargetStopCount}
          requiresAccessibility={requiresAccessibility}
          setRequiresAccessibility={setRequiresAccessibility}
          includeFood={includeFood}
          setIncludeFood={setIncludeFood}
          foodCategories={foodCategories}
          toggleFoodCategory={toggleFoodCategory}
          maxBudget={maxBudget}
          setMaxBudget={setMaxBudget}
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
          />
        )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Planner Form Component
// ─────────────────────────────────────────────

interface PlannerFormProps {
  locality: string;
  setLocality: (v: string) => void;
  availableMinutes: number;
  setAvailableMinutes: (v: number) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  selectedTags: ExperienceTag[];
  toggleTag: (t: ExperienceTag) => void;
  transportMode: TransportMode;
  setTransportMode: (v: TransportMode) => void;
  pacing: ItineraryPacing;
  setPacing: (v: ItineraryPacing) => void;
  walkingTolerance: WalkingTolerance;
  setWalkingTolerance: (v: WalkingTolerance) => void;
  targetStopCount: number;
  setTargetStopCount: (v: number) => void;
  requiresAccessibility: boolean;
  setRequiresAccessibility: (v: boolean) => void;
  includeFood: boolean;
  setIncludeFood: (v: boolean) => void;
  foodCategories: FoodCategory[];
  toggleFoodCategory: (c: FoodCategory) => void;
  maxBudget: PriceRange | "any";
  setMaxBudget: (b: PriceRange | "any") => void;
  activePresetId: string | null;
  onApplyPreset: (preset: ItineraryPreset) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

function PlannerForm({
  locality, setLocality,
  availableMinutes, setAvailableMinutes,
  startTime, setStartTime,
  selectedTags, toggleTag,
  transportMode, setTransportMode,
  pacing, setPacing,
  walkingTolerance, setWalkingTolerance,
  targetStopCount, setTargetStopCount,
  requiresAccessibility, setRequiresAccessibility,
  includeFood, setIncludeFood,
  foodCategories, toggleFoodCategory,
  maxBudget, setMaxBudget,
  activePresetId, onApplyPreset,
  onGenerate, isGenerating,
}: PlannerFormProps) {
  return (
    <div className="max-w-3xl space-y-6">
      {/* Quick Curated Presets Bar */}
      <div className="card p-5 bg-gradient-to-br from-[#FFFDF9] to-[#FFF5E6] border border-[#D99B32]/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-[#D99B32]" />
            <h2 className="font-display font-semibold text-[#211A1B] text-base">
              Curated Festival Trails
            </h2>
          </div>
          <span className="text-[11px] text-[#7a6465] font-medium">
            Tap a trail to auto-fill preferences
          </span>
        </div>
        <p className="text-xs text-[#7a6465] mb-3">
          Hand-crafted itineraries calibrated with authentic Kolkata transit times and crowds.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {ITINERARY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                activePresetId === preset.id
                  ? "bg-[#6F1830] border-[#6F1830] text-white shadow-md"
                  : "bg-white border-[rgba(111,24,48,0.15)] text-[#211A1B] hover:border-[#6F1830] hover:bg-[#FFF5E6]/40"
              }`}
              aria-pressed={activePresetId === preset.id}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs">
                    <span className={activePresetId === preset.id ? "text-amber-200" : "text-[#D99B32]"}>
                      {getPresetIcon(preset.iconName)}
                    </span>
                    <span>{preset.name}</span>
                  </div>
                  {activePresetId === preset.id && (
                    <Check size={14} className="text-amber-200 flex-shrink-0" />
                  )}
                </div>
                <div className={`text-[10px] line-clamp-1 font-bengali ${activePresetId === preset.id ? "text-amber-100" : "text-[#7a6465]"}`}>
                  {preset.nameBengali}
                </div>
              </div>
              <p className={`text-[11px] mt-1.5 leading-tight ${activePresetId === preset.id ? "text-white/80" : "text-[#7a6465]"}`}>
                {preset.tagline}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 1 — Starting Location */}
      <FormSection
        number="01"
        icon={<MapPin size={20} />}
        title="Where are you starting?"
      >
        <div className="space-y-3">
          <select
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-[rgba(111,24,48,0.2)] bg-white text-[#211A1B] focus:outline-none focus:border-[#6F1830] focus:ring-2 focus:ring-[#6F1830]/20 text-sm font-medium"
            aria-label="Starting locality or metro station"
          >
            <optgroup label="🚇 Kolkata Metro Stations (Fastest Pujo Hopping)">
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

          {/* Metro Station Exit Guidance Card */}
          {(() => {
            const metroInfo =
              getMetroStationById(locality) ||
              METRO_STATIONS.find(
                (m) =>
                  locality.toLowerCase().includes(m.name.toLowerCase()) ||
                  m.aliases.some((a) => locality.toLowerCase().includes(a))
              );
            if (!metroInfo) return null;
            return (
              <div className="p-3 bg-[#FFF5E6] rounded-xl border border-[#D99B32]/40 text-xs space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-semibold text-[#6F1830] flex items-center gap-1.5">
                    <Train size={14} className="text-[#005EB8]" />
                    <span>{metroInfo.name}</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#7a6465] px-2 py-0.5 rounded-full bg-white border border-[rgba(111,24,48,0.1)]">
                    {metroInfo.line}
                  </span>
                </div>
                <p className="text-[#3d3032] flex items-start gap-1.5 pt-1">
                  <Footprints size={13} className="text-[#D99B32] flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Exit Guidance:</strong> {metroInfo.gateGuidance}
                  </span>
                </p>
                {metroInfo.popularNearbyPandals.length > 0 && (
                  <p className="text-[11px] text-[#7a6465] pt-0.5">
                    Nearby major pandals: {metroInfo.popularNearbyPandals.join(" · ")}
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      </FormSection>

      {/* Step 2 — Time & Schedule */}
      <FormSection
        number="02"
        icon={<Clock size={20} />}
        title="How much time do you have?"
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
          {TIME_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setAvailableMinutes(value)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                availableMinutes === value
                  ? "bg-[#6F1830] border-[#6F1830] text-white"
                  : "bg-white border-[rgba(111,24,48,0.2)] text-[#3d3032] hover:border-[#6F1830]"
              }`}
              aria-pressed={availableMinutes === value}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-[#7a6465]" htmlFor="start-time">
            Target start time:
          </label>
          <input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[rgba(111,24,48,0.2)] bg-white text-[#211A1B] focus:outline-none focus:border-[#6F1830] text-sm"
          />
        </div>
      </FormSection>

      {/* Step 3 — Pandal Themes & Interests */}
      <FormSection
        number="03"
        icon={<Sliders size={20} />}
        title="What do you enjoy seeing most?"
      >
        <div className="flex flex-wrap gap-2">
          {TAGS.map(({ tag, label, emoji }) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                selectedTags.includes(tag)
                  ? "bg-[#6F1830] border-[#6F1830] text-white"
                  : "bg-white border-[rgba(111,24,48,0.2)] text-[#3d3032] hover:border-[#6F1830]"
              }`}
              aria-pressed={selectedTags.includes(tag)}
            >
              <span aria-hidden="true">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </FormSection>

      {/* Step 4 — Transport Mode */}
      <FormSection
        number="04"
        icon={<Navigation2 size={20} />}
        title="How will you travel?"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TRANSPORT_OPTIONS.map(({ mode, label, note }) => (
            <button
              key={mode}
              onClick={() => setTransportMode(mode)}
              className={`flex flex-col text-left px-3.5 py-2.5 rounded-xl border transition-all ${
                transportMode === mode
                  ? "bg-[#6F1830] border-[#6F1830] text-white"
                  : "bg-white border-[rgba(111,24,48,0.2)] text-[#3d3032] hover:border-[#6F1830]"
              }`}
              aria-pressed={transportMode === mode}
            >
              <span className="font-semibold text-sm">{label}</span>
              <span className={`text-[11px] mt-0.5 ${transportMode === mode ? "text-white/80" : "text-[#7a6465]"}`}>
                {note}
              </span>
            </button>
          ))}
        </div>
      </FormSection>

      {/* Step 5 — Pacing & Walking Tolerance */}
      <FormSection
        number="05"
        icon={<Footprints size={20} />}
        title="Pacing, Walking & Physical Comfort"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#7a6465] uppercase tracking-wider mb-2">
              Tour Pacing:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PACING_OPTIONS.map(({ pacing: pVal, label, note }) => (
                <button
                  key={pVal}
                  onClick={() => setPacing(pVal)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    pacing === pVal
                      ? "bg-[#6F1830] border-[#6F1830] text-white"
                      : "bg-white border-[rgba(111,24,48,0.2)] text-[#3d3032] hover:border-[#6F1830]"
                  }`}
                  aria-pressed={pacing === pVal}
                >
                  <div className="font-semibold text-xs">{label}</div>
                  <div className={`text-[10px] mt-0.5 ${pacing === pVal ? "text-white/80" : "text-[#7a6465]"}`}>
                    {note}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#7a6465] uppercase tracking-wider mb-2">
              Walking Tolerance:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {WALKING_OPTIONS.map(({ tolerance, label, note }) => (
                <button
                  key={tolerance}
                  onClick={() => setWalkingTolerance(tolerance)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    walkingTolerance === tolerance
                      ? "bg-[#6F1830] border-[#6F1830] text-white"
                      : "bg-white border-[rgba(111,24,48,0.2)] text-[#3d3032] hover:border-[#6F1830]"
                  }`}
                  aria-pressed={walkingTolerance === tolerance}
                >
                  <div className="font-semibold text-xs">{label}</div>
                  <div className={`text-[10px] mt-0.5 ${walkingTolerance === tolerance ? "text-white/80" : "text-[#7a6465]"}`}>
                    {note}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF5E6]/60 border border-[rgba(111,24,48,0.1)]">
            <div className="flex items-center gap-2.5">
              <Accessibility size={18} className="text-[#6F1830]" />
              <div>
                <span className="text-xs font-semibold text-[#211A1B] block">
                  Wheelchair / Step-Free Priority
                </span>
                <span className="text-[11px] text-[#7a6465]">
                  Favours pandals with ramp entries (note: barricade diversions may still apply)
                </span>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={requiresAccessibility}
              onClick={() => setRequiresAccessibility(!requiresAccessibility)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                requiresAccessibility ? "bg-[#6F1830]" : "bg-[#E8D1C9]"
              }`}
              aria-label="Prioritize wheelchair accessible venues"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  requiresAccessibility ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </FormSection>

      {/* Step 6 — Preferred Number of Stops */}
      <FormSection
        number="06"
        icon={<SlidersHorizontal size={20} />}
        title="Preferred Number of Stops"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#7a6465]">Stops count target:</span>
          {[2, 3, 4, 5, 6].map((count) => (
            <button
              key={count}
              onClick={() => setTargetStopCount(count)}
              className={`w-10 h-10 rounded-xl border text-sm font-bold transition-all ${
                targetStopCount === count
                  ? "bg-[#6F1830] border-[#6F1830] text-white"
                  : "bg-white border-[rgba(111,24,48,0.2)] text-[#3d3032] hover:border-[#6F1830]"
              }`}
              aria-pressed={targetStopCount === count}
            >
              {count}
            </button>
          ))}
          <span className="text-[11px] text-[#7a6465] ml-2 italic">
            Engine fits stops to available time budget
          </span>
        </div>
      </FormSection>

      {/* Step 7 — Practical Food Planning */}
      <FormSection
        number="07"
        icon={<Utensils size={20} />}
        title="Food & Culinary Preferences"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              role="switch"
              aria-checked={includeFood}
              onClick={() => setIncludeFood(!includeFood)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                includeFood ? "bg-[#6F1830]" : "bg-[#E8D1C9]"
              }`}
              aria-label="Include food stops in itinerary"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  includeFood ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-[#3d3032]">
              {includeFood ? "Yes, include a food stop along the route" : "Skip food stops"}
            </span>
          </div>

          {includeFood && (
            <div className="space-y-3 pt-2 border-t border-[rgba(111,24,48,0.1)]">
              <div>
                <label className="block text-xs font-semibold text-[#7a6465] uppercase tracking-wider mb-2">
                  Cuisine Preferences:
                </label>
                <div className="flex flex-wrap gap-2">
                  {FOOD_PREF_CATEGORIES.map(({ category, label }) => (
                    <button
                      key={category}
                      onClick={() => toggleFoodCategory(category)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                        foodCategories.includes(category)
                          ? "bg-[#6F1830] border-[#6F1830] text-white"
                          : "bg-white border-[rgba(111,24,48,0.2)] text-[#3d3032] hover:border-[#6F1830]"
                      }`}
                      aria-pressed={foodCategories.includes(category)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7a6465] uppercase tracking-wider mb-2">
                  Budget Level:
                </label>
                <div className="flex items-center gap-2">
                  {(["any", "budget", "moderate", "premium"] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => setMaxBudget(b)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        maxBudget === b
                          ? "bg-[#6F1830] border-[#6F1830] text-white"
                          : "bg-white border-[rgba(111,24,48,0.2)] text-[#3d3032] hover:border-[#6F1830]"
                      }`}
                      aria-pressed={maxBudget === b}
                    >
                      {b === "any" ? "Any Budget" : b === "budget" ? "₹ Budget" : b === "moderate" ? "₹₹ Moderate" : "₹₹₹ Premium"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </FormSection>

      {/* Generate CTA */}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="btn btn-primary w-full py-4 text-base shadow-lg hover:shadow-xl transition-all"
        aria-live="polite"
        aria-label="Generate personalized itinerary"
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            Optimizing your Puja route…
          </>
        ) : (
          <>
            Build My Pujo Route
            <Navigation2 size={18} />
          </>
        )}
      </button>

      <p className="text-xs text-[#7a6465] text-center leading-relaxed">
        Engine applies deterministic 2-opt tour routing to eliminate unnecessary backtracking.
        Estimates incorporate festive crowd buffers.
      </p>
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
}

function PersonalizationInsightsCard({ diagnostics }: { diagnostics: PlanningDiagnostics }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card p-4 bg-[#FFF5E6] border border-[#6F1830]/20 space-y-2.5">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#6F1830] text-white flex items-center justify-center text-[10px] font-bold">
            ✓
          </div>
          <span className="font-semibold text-xs text-[#211A1B] uppercase tracking-wider">
            Route Personalization Diagnostics
          </span>
        </div>
        <button
          type="button"
          className="text-xs text-[#6F1830] font-medium flex items-center gap-1 hover:underline"
        >
          {expanded ? "Hide Details" : "Inspect Influences"}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
        <div className="bg-white/80 p-2 rounded-lg border border-[rgba(111,24,48,0.1)]">
          <div className="text-[10px] text-[#7a6465] uppercase">Origin Anchor</div>
          <div className="text-xs font-bold text-[#6F1830] truncate" title={`${diagnostics.resolvedOrigin.latitude}, ${diagnostics.resolvedOrigin.longitude}`}>
            {diagnostics.resolvedOrigin.latitude.toFixed(3)}, {diagnostics.resolvedOrigin.longitude.toFixed(3)}
          </div>
        </div>
        <div className="bg-white/80 p-2 rounded-lg border border-[rgba(111,24,48,0.1)]">
          <div className="text-[10px] text-[#7a6465] uppercase">Candidates Scored</div>
          <div className="text-xs font-bold text-[#6F1830]">
            {diagnostics.candidatesScored} venues
          </div>
        </div>
        <div className="bg-white/80 p-2 rounded-lg border border-[rgba(111,24,48,0.1)]">
          <div className="text-[10px] text-[#7a6465] uppercase">Routing Engine</div>
          <div className="text-xs font-bold text-[#6F1830] truncate" title={diagnostics.routingProviderUsed}>
            {diagnostics.routingProviderUsed.includes("Google") ? "Google Routes API" : "Urban Heuristic (1.6x)"}
          </div>
        </div>
        <div className="bg-white/80 p-2 rounded-lg border border-[rgba(111,24,48,0.1)]">
          <div className="text-[10px] text-[#7a6465] uppercase">Food Detour</div>
          <div className="text-xs font-bold text-[#6F1830] truncate" title={diagnostics.foodHotspotSelected || "None"}>
            {diagnostics.foodIncluded ? diagnostics.foodHotspotSelected || "Included" : "None"}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="pt-2 border-t border-[rgba(111,24,48,0.12)] space-y-1.5">
          <div className="text-[11px] font-semibold text-[#3d3032]">
            Preferences that shaped this route:
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
}: ItineraryViewProps) {
  return (
    <div className="space-y-6">
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
