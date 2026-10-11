"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import {
  Search,
  MapPin,
  Sparkles,
  X,
  Map as MapIcon,
  List,
  ExternalLink,
  ShieldAlert,
  CalendarPlus,
} from "lucide-react";
import { PANDAL_DATA } from "@/data/pandals";
import { PandalCard } from "@/components/places/PandalCard";
import { PoliceBarricadeCaveat } from "@/components/ui/PoliceBarricadeCaveat";
import { buildSingleDestinationNavUrl } from "@/lib/navigation-links";
import type { ItineraryStop, PandalPlace } from "@/types";

const InteractiveMap = dynamic(
  () => import("@/components/map/InteractiveMap").then((m) => ({ default: m.InteractiveMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full min-h-[300px] bg-[#FFF5E6] rounded-xl flex items-center justify-center">
        <p className="text-[#7a6465] text-sm animate-pulse">Loading interactive map…</p>
      </div>
    ),
  }
);

type MapFilterTab = "all" | "mapped" | "themed";

export function MapPageClient() {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<MapFilterTab>("all");
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [showPoliceModal, setShowPoliceModal] = useState(false);

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

  // Convert filtered pandals with valid coordinates to stops for Leaflet
  const currentStops: ItineraryStop[] = useMemo(() => {
    return filteredPandals
      .filter((p) => typeof p.latitude === "number" && typeof p.longitude === "number")
      .map((p) => ({
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
  }, [filteredPandals]);

  const selectedPandal = useMemo(() => {
    return selectedId ? PANDAL_DATA.find((p) => p.id === selectedId) : null;
  }, [selectedId]);

  const mappedCount = useMemo(() => {
    return PANDAL_DATA.filter((p) => typeof p.latitude === "number" && typeof p.longitude === "number").length;
  }, []);

  const themedCount = useMemo(() => {
    return PANDAL_DATA.filter((p) => Boolean(p.theme2026 && p.theme2026.trim().length > 0)).length;
  }, []);

  const handleSelectOnMap = (pandal: PandalPlace) => {
    setSelectedId(pandal.id);
    setMobileView("map");
  };

  return (
    <div className="map-page-wrapper w-full h-[calc(100dvh-64px-4.75rem)] md:h-[calc(100dvh-64px)] flex flex-col md:flex-row overflow-hidden bg-[#FAF5EE]">
      {/* ─────────────────────────────────────────────────────────────
          MOBILE VIEW: Segmented toggle between Map & List view
          Eliminates vertical 50vh collision and touch scroll traps!
          ───────────────────────────────────────────────────────────── */}

      {/* MOBILE MAP VIEW */}
      <div
        className={`md:hidden relative w-full h-full overflow-hidden ${
          mobileView === "map" ? "flex flex-col" : "hidden"
        }`}
      >
        {/* Floating Top Controls (Search, Filters, View Switcher) */}
        <div className="absolute top-2 left-2 right-2 z-[420] pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-md border border-[rgba(111,24,48,0.15)] flex flex-col gap-2">
            {/* View Switcher Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 grid grid-cols-2 bg-[#FAF5EE] p-1 rounded-xl border border-[rgba(111,24,48,0.12)]">
                <button
                  onClick={() => setMobileView("map")}
                  className="py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all bg-[#6F1830] text-white shadow-2xs"
                  aria-label="Switch to interactive map view"
                >
                  <MapIcon size={14} />
                  <span>Map</span>
                </button>
                <button
                  onClick={() => setMobileView("list")}
                  className="py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-[#7a6465] hover:text-[#6F1830]"
                  aria-label="Switch to pandal list view"
                >
                  <List size={14} />
                  <span>List ({filteredPandals.length})</span>
                </button>
              </div>

              {/* Quick Advisory Trigger Button */}
              <button
                onClick={() => setShowPoliceModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors flex-shrink-0"
                title="View Kolkata Police Traffic Regulations"
                aria-label="Open police advisory modal"
              >
                <ShieldAlert size={14} className="text-amber-800" />
                <span className="hidden xs:inline">Advisory</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7a6465]" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pandals, locality, or 2026 theme…"
                className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-[rgba(111,24,48,0.18)] bg-[#FAF5EE] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#6F1830] text-[#211A1B]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7a6465] hover:text-[#211A1B] p-0.5"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Chips & Zone Selector (Zero Horizontal Scroll!) */}
            <div className="flex items-center justify-between gap-1.5 pt-0.5 text-[11px]">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-2 py-0.5 rounded-full font-semibold transition-colors ${
                    activeTab === "all"
                      ? "bg-[#6F1830] text-white"
                      : "bg-[#6F1830]/8 text-[#6F1830]"
                  }`}
                >
                  All ({PANDAL_DATA.length})
                </button>
                <button
                  onClick={() => setActiveTab("mapped")}
                  className={`px-2 py-0.5 rounded-full font-semibold transition-colors ${
                    activeTab === "mapped"
                      ? "bg-[#6F1830] text-white"
                      : "bg-[#6F1830]/8 text-[#6F1830]"
                  }`}
                >
                  📍 Pins ({mappedCount})
                </button>
                <button
                  onClick={() => setActiveTab("themed")}
                  className={`px-2 py-0.5 rounded-full font-semibold transition-colors ${
                    activeTab === "themed"
                      ? "bg-[#6F1830] text-white"
                      : "bg-[#6F1830]/8 text-[#6F1830]"
                  }`}
                >
                  🎭 Themes ({themedCount})
                </button>
              </div>

              {/* Native Zone Selector Dropdown - Clean, accessible, zero horizontal overflow */}
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="text-[11px] font-bold text-[#6F1830] bg-[#FAF5EE] border border-[rgba(111,24,48,0.2)] rounded-lg px-2 py-0.5 focus:outline-none max-w-[130px] truncate"
                aria-label="Filter by zone"
              >
                <option value="all">All Zones</option>
                {zones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replace(" Kolkata", "")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Full Interactive Map Canvas */}
        <div className="w-full h-full">
          <InteractiveMap
            stops={currentStops}
            selectedStopId={selectedId}
            onStopSelect={setSelectedId}
            className="w-full h-full"
          />
        </div>

        {/* Floating Bottom Card: Selected Pandal Drawer (Safe offset above mobile bottom nav) */}
        {selectedPandal && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[420] pointer-events-auto animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-[rgba(111,24,48,0.2)]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-[#211A1B] leading-snug">
                      {selectedPandal.name}
                    </span>
                    {typeof selectedPandal.latitude === "number" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        GPS Ready
                      </span>
                    )}
                  </div>

                  {selectedPandal.nameBengali && (
                    <p className="font-bengali text-xs text-[#7a6465] mt-0.5">
                      {selectedPandal.nameBengali}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-[#7a6465] mt-1 flex-wrap">
                    <span>📍 {selectedPandal.locality}</span>
                    {selectedPandal.zone && (
                      <span className="bg-[#FFF5E6] text-[#6F1830] font-medium px-1.5 py-0.2 rounded text-[10px]">
                        {selectedPandal.zone.replace(" Kolkata", "")}
                      </span>
                    )}
                  </div>

                  {selectedPandal.theme2026 && (
                    <div className="mt-1.5 pt-1.5 border-t border-[rgba(111,24,48,0.08)] flex items-start gap-1.5 text-xs text-[#6F1830] font-medium">
                      <Sparkles size={12} className="flex-shrink-0 text-[#D99B32] mt-0.5" />
                      <span className="line-clamp-2">{selectedPandal.theme2026}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedId(undefined)}
                  className="p-1 rounded-full text-[#7a6465] hover:text-[#211A1B] hover:bg-gray-100"
                  aria-label="Close selected card"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[rgba(111,24,48,0.08)]">
                {typeof selectedPandal.latitude === "number" && typeof selectedPandal.longitude === "number" && (
                  <a
                    href={buildSingleDestinationNavUrl({
                      latitude: selectedPandal.latitude,
                      longitude: selectedPandal.longitude,
                      name: selectedPandal.name,
                      locality: selectedPandal.locality,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink size={13} />
                    <span>Directions</span>
                  </a>
                )}
                <a
                  href={`/plan?add=${selectedPandal.id}`}
                  className="flex-1 btn btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
                >
                  <CalendarPlus size={13} />
                  <span>Add to Plan</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE LIST VIEW */}
      <div
        className={`md:hidden w-full h-full overflow-y-auto px-3 pt-2 pb-6 ${
          mobileView === "list" ? "flex flex-col" : "hidden"
        }`}
      >
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-[rgba(111,24,48,0.12)] space-y-3 mb-3">
          {/* View Switcher */}
          <div className="grid grid-cols-2 bg-[#FAF5EE] p-1 rounded-xl border border-[rgba(111,24,48,0.12)]">
            <button
              onClick={() => setMobileView("map")}
              className="py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-[#7a6465] hover:text-[#6F1830]"
              aria-label="Switch to map view"
            >
              <MapIcon size={14} />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setMobileView("list")}
              className="py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all bg-[#6F1830] text-white shadow-2xs"
              aria-label="Switch to list view"
            >
              <List size={14} />
              <span>List View ({filteredPandals.length})</span>
            </button>
          </div>

          <div>
            <h1 className="font-display text-lg font-bold text-[#211A1B]">Explore Pandals</h1>
            <p className="text-xs text-[#7a6465]">
              {PANDAL_DATA.length} Total · {mappedCount} Mapped Pins · {themedCount} 2026 Themes
            </p>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a6465]" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, locality, or 2026 theme…"
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-[rgba(111,24,48,0.2)] bg-[#FAF5EE] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#6F1830] text-[#211A1B]"
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
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                activeTab === "all"
                  ? "bg-[#6F1830] text-white"
                  : "bg-[rgba(111,24,48,0.06)] text-[#6F1830] hover:bg-[rgba(111,24,48,0.12)]"
              }`}
            >
              All ({PANDAL_DATA.length})
            </button>
            <button
              onClick={() => setActiveTab("mapped")}
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                activeTab === "mapped"
                  ? "bg-[#6F1830] text-white"
                  : "bg-[rgba(111,24,48,0.06)] text-[#6F1830] hover:bg-[rgba(111,24,48,0.12)]"
              }`}
            >
              📍 Pins ({mappedCount})
            </button>
            <button
              onClick={() => setActiveTab("themed")}
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                activeTab === "themed"
                  ? "bg-[#6F1830] text-white"
                  : "bg-[rgba(111,24,48,0.06)] text-[#6F1830] hover:bg-[rgba(111,24,48,0.12)]"
              }`}
            >
              🎭 Themes ({themedCount})
            </button>
          </div>

          {/* Zone Selector - Wrapped without any ugly horizontal scrollbar */}
          <div className="pt-1 border-t border-[rgba(111,24,48,0.08)]">
            <div className="text-[11px] font-bold text-[#7a6465] mb-1.5">Select Zone:</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedZone("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedZone === "all"
                    ? "bg-[#6F1830] text-white shadow-2xs"
                    : "bg-[#FAF5EE] text-[#7a6465] border border-[rgba(111,24,48,0.12)] hover:text-[#211A1B]"
                }`}
              >
                All Zones
              </button>
              {zones.map((zone) => (
                <button
                  key={zone}
                  onClick={() => setSelectedZone(zone)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedZone === zone
                      ? "bg-[#6F1830] text-white shadow-2xs"
                      : "bg-[#FAF5EE] text-[#7a6465] border border-[rgba(111,24,48,0.12)] hover:text-[#211A1B]"
                  }`}
                >
                  {zone.replace(" Kolkata", "")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pandal List Items */}
        <div className="space-y-2.5">
          {filteredPandals.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-[rgba(111,24,48,0.1)]">
              <MapPin className="mx-auto text-[#7a6465]/40 mb-2" size={32} />
              <p className="text-sm font-semibold text-[#211A1B]">No pandals found</p>
              <p className="text-xs text-[#7a6465] mt-1">
                Try clearing your search query or selecting a different filter.
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
                <div
                  key={pandal.id}
                  className={`card p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? "ring-2 ring-[#6F1830] bg-[#FAF5EE] border-[#6F1830]"
                      : "border-[rgba(111,24,48,0.1)] bg-white hover:border-[rgba(111,24,48,0.25)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-[#211A1B] text-sm leading-snug">
                        {pandal.name}
                      </h3>
                      {pandal.nameBengali && (
                        <p className="text-xs text-[#7a6465] font-bengali mt-0.5">
                          {pandal.nameBengali}
                        </p>
                      )}
                      <div className="text-xs text-[#7a6465] mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>📍 {pandal.locality}</span>
                        {pandal.zone && (
                          <span className="text-[10px] text-[#6F1830] bg-[#FFF5E6] px-1.5 py-0.2 rounded font-medium">
                            {pandal.zone.replace(" Kolkata", "")}
                          </span>
                        )}
                      </div>
                    </div>

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

                  {pandal.theme2026 && (
                    <div className="mt-2 pt-2 border-t border-[rgba(111,24,48,0.06)] flex items-start gap-1.5 text-xs text-[#6F1830] font-medium">
                      <Sparkles size={13} className="flex-shrink-0 mt-0.5 text-[#D99B32]" />
                      <span>{pandal.theme2026}</span>
                    </div>
                  )}

                  {/* Card Action Row */}
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[rgba(111,24,48,0.08)]">
                    {hasCoordinates && (
                      <button
                        onClick={() => handleSelectOnMap(pandal)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold bg-[#6F1830]/10 text-[#6F1830] hover:bg-[#6F1830] hover:text-white transition-all flex items-center justify-center gap-1"
                      >
                        <MapIcon size={13} />
                        <span>View on Map</span>
                      </button>
                    )}
                    {hasCoordinates && (
                      <a
                        href={buildSingleDestinationNavUrl({
                          latitude: pandal.latitude!,
                          longitude: pandal.longitude!,
                          name: pandal.name,
                          locality: pandal.locality,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-[#FAF5EE] text-[#3d3032] border border-[rgba(111,24,48,0.12)] hover:border-[#6F1830] transition-all flex items-center justify-center gap-1"
                      >
                        <ExternalLink size={12} />
                        <span>Directions</span>
                      </a>
                    )}
                    <a
                      href={`/plan?add=${pandal.id}`}
                      className="py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-[#6F1830] text-white hover:bg-[#8b2040] transition-all flex items-center justify-center gap-1"
                    >
                      <CalendarPlus size={12} />
                      <span>Add</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Traffic Advisory & Offline Info at Bottom of List */}
        <div className="mt-6 space-y-3">
          <PoliceBarricadeCaveat />
          <div className="text-center text-[11px] text-[#7a6465] py-2">
            Cholo Bondhu uses OpenStreetMap with zero external API dependencies.
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DESKTOP VIEW: Side-by-Side Dual Pane
          Left: Interactive Map Canvas (flex-1)
          Right: Side Explorer Panel (w-96 lg:w-[420px])
          ───────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 h-full min-h-0 relative p-3">
        <InteractiveMap
          stops={currentStops}
          selectedStopId={selectedId}
          onStopSelect={setSelectedId}
          className="h-full rounded-2xl overflow-hidden shadow-sm border border-[rgba(111,24,48,0.15)]"
        />
      </div>

      {/* Desktop Explorer Side Panel */}
      <div className="hidden md:flex w-96 lg:w-[420px] flex-col h-full overflow-hidden bg-white border-l border-[rgba(111,24,48,0.12)]">
        {/* Panel Header */}
        <div className="p-4 border-b border-[rgba(111,24,48,0.1)] space-y-3 flex-shrink-0">
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
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-[rgba(111,24,48,0.2)] bg-[#FAF5EE] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#6F1830] text-[#211A1B]"
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
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                activeTab === "all"
                  ? "bg-[#6F1830] text-white"
                  : "bg-[rgba(111,24,48,0.06)] text-[#6F1830] hover:bg-[rgba(111,24,48,0.12)]"
              }`}
            >
              All ({PANDAL_DATA.length})
            </button>
            <button
              onClick={() => setActiveTab("mapped")}
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                activeTab === "mapped"
                  ? "bg-[#6F1830] text-white"
                  : "bg-[rgba(111,24,48,0.06)] text-[#6F1830] hover:bg-[rgba(111,24,48,0.12)]"
              }`}
            >
              📍 Pins ({mappedCount})
            </button>
            <button
              onClick={() => setActiveTab("themed")}
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                activeTab === "themed"
                  ? "bg-[#6F1830] text-white"
                  : "bg-[rgba(111,24,48,0.06)] text-[#6F1830] hover:bg-[rgba(111,24,48,0.12)]"
              }`}
            >
              🎭 Themes ({themedCount})
            </button>
          </div>

          {/* Zone Selector - Wrapped without any ugly horizontal scrollbar */}
          <div className="pt-1 border-t border-[rgba(111,24,48,0.08)]">
            <div className="text-[11px] font-bold text-[#7a6465] mb-1.5">Zones:</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedZone("all")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                  selectedZone === "all"
                    ? "bg-[#6F1830] text-white shadow-2xs font-bold"
                    : "bg-[#FAF5EE] text-[#7a6465] border border-[rgba(111,24,48,0.12)] hover:text-[#211A1B]"
                }`}
              >
                All Zones
              </button>
              {zones.map((zone) => (
                <button
                  key={zone}
                  onClick={() => setSelectedZone(zone)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                    selectedZone === zone
                      ? "bg-[#6F1830] text-white shadow-2xs font-bold"
                      : "bg-[#FAF5EE] text-[#7a6465] border border-[rgba(111,24,48,0.12)] hover:text-[#211A1B]"
                  }`}
                >
                  {zone.replace(" Kolkata", "")}
                </button>
              ))}
            </div>
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

        {/* Desktop Panel Footer: Police Advisory */}
        <div className="p-3 border-t border-[rgba(111,24,48,0.1)] bg-[#FFFDF9] flex-shrink-0">
          <PoliceBarricadeCaveat compact />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          KOLKATA POLICE ADVISORY MODAL (Mobile Quick View)
          ───────────────────────────────────────────────────────────── */}
      {showPoliceModal && (
        <div
          className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowPoliceModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-4 shadow-2xl border border-amber-300 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-amber-800" size={20} />
                <h3 className="font-display font-bold text-base text-amber-950">
                  Police Traffic &amp; Barricades
                </h3>
              </div>
              <button
                onClick={() => setShowPoliceModal(false)}
                className="p-1 rounded-full text-[#7a6465] hover:text-[#211A1B] hover:bg-amber-100"
                aria-label="Close advisory modal"
              >
                <X size={18} />
              </button>
            </div>

            <PoliceBarricadeCaveat />

            <button
              onClick={() => setShowPoliceModal(false)}
              className="mt-4 w-full btn btn-primary text-xs py-2.5 font-bold"
            >
              Understood, Back to Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
