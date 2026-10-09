"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { PANDAL_DATA } from "@/data/pandals";
import { PandalCard } from "@/components/places/PandalCard";
import type { ItineraryStop } from "@/types";

const InteractiveMap = dynamic(
  () => import("@/components/map/InteractiveMap").then((m) => ({ default: m.InteractiveMap })),
  { ssr: false, loading: () => <div className="h-full bg-[#FFF5E6] rounded-xl flex items-center justify-center"><p className="text-[#7a6465] text-sm">Loading map…</p></div> }
);

// Convert pandals to map stops for display
const ALL_STOPS: ItineraryStop[] = PANDAL_DATA.map((p, i) => ({
  id: p.id,
  placeId: p.id,
  placeName: p.name,
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

export function MapPageClient() {
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const selectedPandal = selectedId
    ? PANDAL_DATA.find((p) => p.id === selectedId)
    : null;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-64px-72px)] md:h-[calc(100dvh-64px)]">
      {/* Map */}
      <div className="flex-1 relative p-2">
        <InteractiveMap
          stops={ALL_STOPS}
          selectedStopId={selectedId}
          onStopSelect={setSelectedId}
          className="h-full rounded-xl"
        />
      </div>

      {/* Side panel */}
      <div className="md:w-80 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-[rgba(111,24,48,0.1)]">
          <h1 className="font-display text-lg text-[#211A1B]">Explore the Map</h1>
          <p className="text-xs text-[#7a6465]">
            {PANDAL_DATA.length} pandals · Select a marker to see details
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {selectedPandal ? (
            <div className="animate-fade-in-up">
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
                className="btn btn-ghost w-full text-sm mt-2 text-[#7a6465]"
              >
                ← Back to list
              </button>
            </div>
          ) : (
            PANDAL_DATA.map((pandal) => (
              <button
                key={pandal.id}
                onClick={() => setSelectedId(pandal.id)}
                className={`w-full text-left card p-3 transition-all ${
                  selectedId === pandal.id ? "ring-2 ring-[#6F1830]" : ""
                }`}
                aria-pressed={selectedId === pandal.id}
              >
                <div className="font-semibold text-[#211A1B] text-sm">
                  {pandal.name}
                </div>
                <div className="text-xs text-[#7a6465]">{pandal.locality}</div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
