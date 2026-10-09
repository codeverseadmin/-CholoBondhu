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
} from "lucide-react";
import type {
  ItineraryPreferences,
  ExperienceTag,
  TransportMode,
  GeneratedItinerary,
} from "@/types";
import {
  generateItinerary,
  removeStop,
  reorderStop,
  toggleLockStop,
} from "@/lib/itinerary-engine";
import { savePlan, getShareableUrl, getPlanById, decodeSharedItinerary } from "@/lib/saved-plans";
import { PANDAL_DATA } from "@/data/pandals";
import { ItineraryStopCard, RouteSummary } from "@/components/itinerary/ItineraryStopCard";
import { NoPlanEmptyState } from "@/components/ui/EmptyState";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(
  () => import("@/components/map/InteractiveMap").then((m) => ({ default: m.InteractiveMap })),
  { ssr: false, loading: () => <MapLoadingPlaceholder /> }
);

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const LOCALITIES = [
  "Shyambazar / Kumartuli (North)",
  "Central Kolkata (Park Street / Esplanade)",
  "South Kolkata (Ballygunge / Ekdalia)",
  "New Alipore / Alipore",
  "Lake Town / Deshapriya Park",
  "Naktala / Behala",
];

const TIME_OPTIONS = [
  { value: 120, label: "2 hours" },
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
  { mode: "walking", label: "Walking", note: "Best for short routes" },
  { mode: "public_transport", label: "Bus / Tram", note: "Authentic Kolkata experience" },
  { mode: "metro_walking", label: "Metro + Walk", note: "Fast & efficient" },
  { mode: "taxi", label: "Taxi / Car", note: "Comfortable, slower in traffic" },
  { mode: "flexible", label: "Flexible", note: "Mix of options" },
];

// ─────────────────────────────────────────────
// Plan Page
// ─────────────────────────────────────────────

function PlanPageInner() {
  const searchParams = useSearchParams();

  // Planner form state
  const [locality, setLocality] = useState(LOCALITIES[0]);
  const [availableMinutes, setAvailableMinutes] = useState(240);
  const [startTime, setStartTime] = useState("10:00");
  const [selectedTags, setSelectedTags] = useState<ExperienceTag[]>(["iconic", "artistic"]);
  const [transportMode, setTransportMode] = useState<TransportMode>("metro_walking");
  const [includeFood, setIncludeFood] = useState(true);

  // Itinerary state
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<"saved" | "shared" | null>(null);

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
        const prefs: ItineraryPreferences = {
          startingLocality: pandal.locality,
          availableMinutes: 240,
          date: new Date().toISOString().split("T")[0],
          startTime: "10:00",
          experienceTags: pandal.experienceTags.slice(0, 2),
          transportMode: "metro_walking",
          includeFood: true,
          lockedStopIds: [pandal.id],
        };
        const result = generateItinerary(prefs);
        setItinerary(result);
        setView("itinerary");
      }
    }
  }, [searchParams]);

  function toggleTag(tag: ExperienceTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleGenerate() {
    setIsGenerating(true);
    const prefs: ItineraryPreferences = {
      startingLocality: locality,
      availableMinutes,
      date: new Date().toISOString().split("T")[0],
      startTime,
      experienceTags: selectedTags,
      transportMode,
      includeFood,
    };
    // Simulate brief loading for UX (engine is synchronous)
    setTimeout(() => {
      const result = generateItinerary(prefs);
      setItinerary(result);
      setIsGenerating(false);
      setView("itinerary");
    }, 800);
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
      navigator.share({ title: "My Puja Itinerary", url }).catch(() => {});
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
      <div className="mb-8">
        <p className="text-[#D99B32] text-sm font-semibold uppercase tracking-widest mb-1">
          Build Your Journey
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-[#211A1B]">
          Plan My Pujo
        </h1>
      </div>

      {/* Feedback toast */}
      {savedFeedback && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#6F1830] text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg animate-fade-in-up">
          {savedFeedback === "saved" ? "✓ Plan saved!" : "✓ Link copied!"}
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
          includeFood={includeFood}
          setIncludeFood={setIncludeFood}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      ) : (
        itinerary && (
          <ItineraryView
            itinerary={itinerary}
            selectedStopId={selectedStopId}
            setSelectedStopId={setSelectedStopId}
            showMap={showMap}
            setShowMap={setShowMap}
            onRemoveStop={handleRemoveStop}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onToggleLock={handleToggleLock}
            onRegenerate={handleRegenerate}
            onSave={handleSave}
            onShare={handleShare}
          />
        )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Planner Form
// ─────────────────────────────────────────────

function PlannerForm({
  locality, setLocality,
  availableMinutes, setAvailableMinutes,
  startTime, setStartTime,
  selectedTags, toggleTag,
  transportMode, setTransportMode,
  includeFood, setIncludeFood,
  onGenerate, isGenerating,
}: {
  locality: string; setLocality: (v: string) => void;
  availableMinutes: number; setAvailableMinutes: (v: number) => void;
  startTime: string; setStartTime: (v: string) => void;
  selectedTags: ExperienceTag[]; toggleTag: (t: ExperienceTag) => void;
  transportMode: TransportMode; setTransportMode: (v: TransportMode) => void;
  includeFood: boolean; setIncludeFood: (v: boolean) => void;
  onGenerate: () => void; isGenerating: boolean;
}) {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Step 1 — Location */}
      <FormSection
        number="01"
        icon={<MapPin size={20} />}
        title="Where are you starting?"
      >
        <select
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-[rgba(111,24,48,0.2)] bg-white text-[#211A1B] focus:outline-none focus:border-[#6F1830] focus:ring-2 focus:ring-[#6F1830]/20 text-sm"
          aria-label="Starting locality"
        >
          {LOCALITIES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </FormSection>

      {/* Step 2 — Time */}
      <FormSection
        number="02"
        icon={<Clock size={20} />}
        title="How much time do you have?"
      >
        <div className="grid grid-cols-2 gap-2 mb-3">
          {TIME_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setAvailableMinutes(value)}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
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
            Start time:
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

      {/* Step 3 — Preferences */}
      <FormSection
        number="03"
        icon={<Sliders size={20} />}
        title="What do you enjoy?"
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

      {/* Step 4 — Transport */}
      <FormSection
        number="04"
        icon={<Navigation2 size={20} />}
        title="How will you travel?"
      >
        <div className="space-y-2">
          {TRANSPORT_OPTIONS.map(({ mode, label, note }) => (
            <button
              key={mode}
              onClick={() => setTransportMode(mode)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                transportMode === mode
                  ? "bg-[#6F1830] border-[#6F1830] text-white"
                  : "bg-white border-[rgba(111,24,48,0.2)] text-[#3d3032] hover:border-[#6F1830]"
              }`}
              aria-pressed={transportMode === mode}
            >
              <span className="font-medium">{label}</span>
              <span className={`text-xs ${transportMode === mode ? "text-white/70" : "text-[#7a6465]"}`}>
                {note}
              </span>
            </button>
          ))}
        </div>
      </FormSection>

      {/* Step 5 — Food */}
      <FormSection
        number="05"
        icon={<Utensils size={20} />}
        title="Include food stops?"
      >
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
          <span className="text-sm text-[#3d3032]">
            {includeFood ? "Yes, add a food stop" : "Skip food stops"}
          </span>
        </div>
      </FormSection>

      {/* Generate CTA */}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="btn btn-primary w-full py-4 text-base"
        aria-live="polite"
        aria-label="Generate personalized itinerary"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            Building your itinerary…
          </>
        ) : (
          <>
            Build My Pujo Route
            <Navigation2 size={18} />
          </>
        )}
      </button>

      <p className="text-xs text-[#7a6465] text-center">
        Travel times are estimates. Festival conditions may differ.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Itinerary View
// ─────────────────────────────────────────────

function ItineraryView({
  itinerary,
  selectedStopId,
  setSelectedStopId,
  showMap,
  setShowMap,
  onRemoveStop,
  onMoveUp,
  onMoveDown,
  onToggleLock,
  onRegenerate,
  onSave,
  onShare,
}: {
  itinerary: GeneratedItinerary;
  selectedStopId?: string;
  setSelectedStopId: (id?: string) => void;
  showMap: boolean;
  setShowMap: (v: boolean) => void;
  onRemoveStop: (id: string) => void;
  onMoveUp: (i: number) => void;
  onMoveDown: (i: number) => void;
  onToggleLock: (id: string) => void;
  onRegenerate: () => void;
  onSave: () => void;
  onShare: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-display text-xl text-[#211A1B]">
          Your Pujo Route
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={onRegenerate} className="btn btn-secondary text-sm py-2 px-4">
            <RefreshCw size={14} />
            Adjust
          </button>
          <button
            onClick={() => setShowMap(!showMap)}
            className="btn btn-secondary text-sm py-2 px-4"
            aria-pressed={showMap}
          >
            {showMap ? "Hide Map" : "Show Map"}
          </button>
          <button onClick={onSave} className="btn btn-secondary text-sm py-2 px-4" aria-label="Save plan">
            <Bookmark size={14} />
          </button>
          <button onClick={onShare} className="btn btn-secondary text-sm py-2 px-4" aria-label="Share plan">
            <Share2 size={14} />
          </button>
        </div>
      </div>

      {/* Route summary */}
      <RouteSummary itinerary={itinerary} />

      {/* Map (lazy loaded) */}
      {showMap && (
        <div className="h-72 md:h-96 rounded-xl overflow-hidden border border-[rgba(111,24,48,0.15)]">
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
          {/* Timeline spine */}
          <div className="timeline-line" aria-hidden="true" />
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

      {/* Disclaimer */}
      <div className="card p-4 bg-[#FFF5E6]">
        <p className="text-xs text-[#7a6465] leading-relaxed">
          <strong className="text-[#3d3032]">Important:</strong> This itinerary is a recommendation only.
          Actual journey times during Durga Puja may be significantly longer due to crowds and traffic.
          Always follow official safety guidance and traffic instructions.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Form section wrapper
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
        <p className="text-xs text-[#7a6465]">Loading map…</p>
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
