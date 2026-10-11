"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { Search, MapPin, Sparkles, Navigation, X } from "lucide-react";
import { PANDAL_DATA } from "@/data/pandals";
import { isRoutablePandal } from "@/lib/pandal-validator";
import { PandalCard } from "@/components/places/PandalCard";
import type { ItineraryStop } from "@/types";

const InteractiveMap = dynamic(
  () => import("@/components/map/InteractiveMap").then((m) => ({ default: m.InteractiveMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-[#FFF5E6] rounded-xl flex items-center justify-center">
        <p className="text-[#7a6465] text-sm animate-pulse">Loading interactive map…</p>
      </div>
    ),
  }
);

// Convert all pandals with coordinates to map stops for Leaflet
const ALL_STOPS: ItineraryStop[] = PANDAL_DATA.map((p) => ({
  id: p.id,
  placeId: p.id,
  placeName: p.name,
  placeNameBengali: p.nameBengali,
  placeType: "pandal" as const,
  locality: p.locality,
  latitude: p.latitude,
  longitude: p.longitude,
  recommendationReason: p.description,
  estimatedVisitMinutes: p.recommendedVisitMinutes,
  dataConfidence: p.dataConfidence,
  locked: false,
  tags: p.experienceTags,
}));

type MapFilterTab = "all" | "mapped" | "themed";

export function MapPageClient() {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<MapFilterTab>("all");
  const [selectedZone, setSelectedZone] = useState<string>("all");

  const zones = useMemo(() => {
    return Array.from(new Set(PANDAL_DATA.map((p) => p.zone).filter(Boolean))) as string[];
  }, []);

  const filteredPandals = useMemo(() => {
    return PANDAL_DATA.filter((p) => {
      // Tab filter
      if (activeTab === "mapped" && (typeof p.latitude !== "number" || typeof p.longitude !== "number")) {
        return false;
      }
      if (activeTab === "themed" && (!p.theme2026 || p.theme2026.trim().length === 0)) {
        return false;
      }

      // Zone filter
      if (selectedZone !== "all" && p.zone !== selectedZone) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBengali = p.nameBengali?.toLowerCase().includes(q);
        const matchesLocality = p.locality.toLowerCase().includes(q);
        const matchesArea = p.area?.toLowerCase().includes(q);
        const matchesTheme = p.theme2026?.toLowerCase().includes(q);
        const matchesAlias = p.alternateNames?.some((a) => a.toLowerCase().includes(q));
        if (!matchesName && !matchesBengali && !matchesLocality && !matchesArea && !matchesTheme && !matchesAlias) {
          return false;
        }
      }

      return true;
    });
  }, [activeTab, selectedZone, searchQuery]);

  const selectedPandal = selectedId
    ? PANDAL_DATA.find((p) => p.id === selectedId)
    : null;

  const mappedCount = useMemo(() => {
    return PANDAL_DATA.filter((p) => typeof p.latitude === "number" && typeof p.longitude === "number").length;
  }, []);

  const themedCount = useMemo(() => {
    return PANDAL_DATA.filter((p) => Boolean(p.theme2026 && p.theme2026.trim().length > 0)).length;
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-64px-72px)] md:h-[calc(100dvh-64px)]">
      {/* Interactive Map Canvas */}
      <div className="flex-1 relative p-2 order-2 md:order-1 h-[50vh] md:h-auto">
        <InteractiveMap
          stops={ALL_STOPS}
          selectedStopId={selectedId}
          onStopSelect={setSelectedId}
          className="h-full rounded-xl"
        />
      </div>

      {/* Side Panel / Explorer */}
      <div className="w-full md:w-96 flex flex-col overflow-hidden bg-white border-l border-[rgba(111,24,48,0.1)] order-1 md:order-2 h-[50vh] md:h-auto">
        {/* Panel Header */}
        <div className="p-4 border-b border-[rgba(111,24,48,0.1)] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-lg font-bold text-[#211A1B]">Explore the Map</h1>
              <p className="text-xs text-[#7a6465]">
                {PANDAL_DATA.length} Total · {mappedCount} Mapped Pins · {themedCount} 2026 Themes
              </p>
            </div>
            {selectedId && (
              <button
                onClick={() => setSelectedId(undefined)}
                className="text-xs font-semibold text-[#6F1830] hover:underline"
              >
                Clear Selection
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a6465]" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, locality, or 2026 theme…"
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-[rgba(111,24,48,0.2)] bg-[#FAF5EE] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#6F1830] text-[#211A1B]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7a6465] hover:text-[#211A1B]"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-[#6F1830] text-white"
                  : "bg-[rgba(111,24,48,0.06)] text-[#6F1830] hover:bg-[rgba(111,24,48,0.12)]"
              }`}
            >
              All ({PANDAL_DATA.length})
            </button>
            <button
              onClick={() => setActiveTab("mapped")}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                activeTab === "mapped"
                  ? "bg-[#6F1830] text-white"
                  : "bg-[rgba(111,24,48,0.06)] text-[#6F1830] hover:bg-[rgba(111,24,48,0.12)]"
              }`}
            >
              📍 Pins ({mappedCount})
            </button>
            <button
              onClick={() => setActiveTab("themed")}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                activeTab === "themed"
                  ? "bg-[#6F1830] text-white"
                  : "bg-[rgba(111,24,48,0.06)] text-[#6F1830] hover:bg-[rgba(111,24,48,0.12)]"
              }`}
            >
              🎭 Themes ({themedCount})
            </button>
          </div>

          {/* Zone Selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <button
              onClick={() => setSelectedZone("all")}
              className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors ${
                selectedZone === "all"
                  ? "font-bold text-[#6F1830] border-b-2 border-[#6F1830]"
                  : "text-[#7a6465] hover:text-[#211A1B]"
              }`}
            >
              All Zones
            </button>
            {zones.map((zone) => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors ${
                  selectedZone === zone
                    ? "font-bold text-[#6F1830] border-b-2 border-[#6F1830]"
                    : "text-[#7a6465] hover:text-[#211A1B]"
                }`}
              >
                {zone.replace(" Kolkata", "")}
              </button>
            ))}
          </div>
        </div>

        {/* Panel Content (Selected Pandal or Filtered List) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {selectedPandal ? (
            <div className="animate-fade-in-up space-y-2">
              <PandalCard
                pandal={selectedPandal}
                variant="full"
                selected
                onAddToItinerary={(p) => {
                  window.location.href = `/plan?add=${p.id}`;
                }}
              />
              <button
                onClick={() => setSelectedId(undefined)}
                className="btn btn-ghost w-full text-xs text-[#7a6465] py-2"
              >
                ← Back to list ({filteredPandals.length})
              </button>
            </div>
          ) : filteredPandals.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MapPin className="mx-auto text-[#7a6465]/40 mb-2" size={32} />
              <p className="text-sm font-semibold text-[#211A1B]">No pandals found</p>
              <p className="text-xs text-[#7a6465] mt-1">
                Try clearing your search query or selecting a different filter tab.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                  setSelectedZone("all");
                }}
                className="btn btn-secondary text-xs mt-3 py-1.5 px-3"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredPandals.map((pandal) => {
              const hasCoordinates =
                typeof pandal.latitude === "number" && typeof pandal.longitude === "number";
              const isSelected = selectedId === pandal.id;

              return (
                <button
                  key={pandal.id}
                  onClick={() => setSelectedId(pandal.id)}
                  className={`w-full text-left card p-3 transition-all rounded-xl border ${
                    isSelected
                      ? "ring-2 ring-[#6F1830] bg-[#FAF5EE] border-[#6F1830]"
                      : "border-[rgba(111,24,48,0.1)] hover:border-[rgba(111,24,48,0.25)] bg-white"
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#211A1B] text-sm leading-snug truncate">
                        {pandal.name}
                      </div>
                      {pandal.nameBengali && (
                        <div className="text-xs text-[#7a6465] font-bengali truncate">
                          {pandal.nameBengali}
                        </div>
                      )}
                      <div className="text-xs text-[#7a6465] mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>📍 {pandal.locality}</span>
                        {pandal.zone && (
                          <span className="text-[10px] text-[#7a6465]/80 bg-[#FFF5E6] px-1.5 py-0.2 rounded">
                            {pandal.zone.replace(" Kolkata", "")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Chip */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {hasCoordinates ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Pin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          GPS Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2026 Theme snippet */}
                  {pandal.theme2026 && (
                    <div className="mt-2 pt-2 border-t border-[rgba(111,24,48,0.06)] flex items-start gap-1.5 text-[11px] text-[#6F1830] font-medium">
                      <Sparkles size={12} className="flex-shrink-0 mt-0.5 text-[#D99B32]" />
                      <span className="line-clamp-1">{pandal.theme2026}</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
