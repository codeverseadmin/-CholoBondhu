"use client";

import {
  Clock,
  MapPin,
  Lock,
  Unlock,
  X,
  ChevronUp,
  ChevronDown,
  Navigation,
  Utensils,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import type { ItineraryStop, GeneratedItinerary } from "@/types";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { formatTime, formatDuration } from "@/lib/utils";

// ─────────────────────────────────────────────
// Single Stop Card
// ─────────────────────────────────────────────

interface StopCardProps {
  stop: ItineraryStop;
  index: number;
  totalStops: number;
  onRemove?: (stopId: string) => void;
  onToggleLock?: (stopId: string) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  selected?: boolean;
  onSelect?: (stopId: string) => void;
}

export function ItineraryStopCard({
  stop,
  index,
  totalStops,
  onRemove,
  onToggleLock,
  onMoveUp,
  onMoveDown,
  selected = false,
  onSelect,
}: StopCardProps) {
  const isFood = stop.placeType === "food";

  return (
    <div
      className={`relative flex items-start gap-3 group ${
        selected ? "opacity-100" : "opacity-100"
      }`}
    >
      {/* Timeline marker */}
      <div className="flex flex-col items-center flex-shrink-0 mt-1">
        <button
          onClick={() => onSelect?.(stop.id)}
          className={`w-10 h-10 rounded-full flex items-center justify-center z-10 relative transition-all border-2 ${
            selected
              ? "bg-[#6F1830] border-[#6F1830] text-white"
              : isFood
              ? "bg-[#FFF5E6] border-[#D99B32] text-[#D99B32]"
              : "bg-white border-[#6F1830]/30 text-[#6F1830] group-hover:border-[#6F1830]"
          }`}
          aria-label={`View ${stop.placeName}`}
        >
          {isFood ? (
            <Utensils size={16} />
          ) : (
            <span className="text-xs font-bold">{index + 1}</span>
          )}
        </button>
      </div>

      {/* Card content */}
      <div
        className={`flex-1 card p-3.5 mb-1 cursor-pointer transition-all ${
          selected ? "ring-2 ring-[#6F1830] ring-offset-1" : ""
        }`}
        onClick={() => onSelect?.(stop.id)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h4 className="font-semibold text-[#211A1B] text-base leading-tight">
              {stop.placeName}
            </h4>
            {stop.placeNameBengali && (
              <span className="font-bengali text-xs text-[#7a6465] font-normal block mt-0.5">
                {stop.placeNameBengali}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
            {stop.locked && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6F1830] bg-[#6F1830]/10 px-2 py-0.5 rounded-full"
                title="Must-visit stop"
              >
                <Lock size={11} />
                Locked
              </span>
            )}
            <ConfidenceBadge confidence={stop.dataConfidence} showLabel={false} />
          </div>
        </div>

        {/* Location + time */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#7a6465] mb-2">
          <div className="flex items-center gap-1">
            <MapPin size={12} />
            <span>{stop.locality}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>~{stop.estimatedVisitMinutes} min visit</span>
          </div>
          {stop.approximateArrivalTime && (
            <span className="font-medium text-[#6F1830]">
              Arrive ~{formatTime(stop.approximateArrivalTime)}
            </span>
          )}
        </div>

        {/* Travel time from previous */}
        {stop.estimatedTravelMinutesFromPrevious != null && index > 0 && (
          <div className="text-xs text-[#7a6465] mb-2 bg-[#FFF5E6]/60 px-2.5 py-1 rounded-md flex items-center justify-between">
            <span>
              ~{stop.estimatedTravelMinutesFromPrevious} min transit from previous stop
            </span>
            <span className="text-[10px] text-[#7a6465]/80 italic">
              {stop.routingMethodology === "urban_heuristic"
                ? "urban heuristic (1.6x)"
                : "estimated"}
            </span>
          </div>
        )}

        {/* Recommendation reason */}
        <p className="text-xs text-[#3d3032] leading-relaxed">
          {stop.recommendationReason}
        </p>

        {/* Caveats */}
        {stop.caveats && stop.caveats.length > 0 && (
          <div className="mt-2 space-y-1">
            {stop.caveats.map((caveat, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <AlertCircle size={12} className="text-[#c87d12] mt-0.5 flex-shrink-0" />
                <span className="text-[11px] text-[#c87d12] font-medium">{caveat}</span>
              </div>
            ))}
          </div>
        )}

        {/* Navigation link */}
        {stop.latitude && stop.longitude && (
          <a
            href={
              stop.navigationUrl ||
              `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`
            }
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-[#6F1830] hover:text-[#8B2040] hover:underline min-h-[36px] items-center"
            aria-label={`Open navigation to ${stop.placeName} in external Maps`}
          >
            <Navigation size={12} />
            Navigate with Maps
          </a>
        )}
      </div>

      {/* Touch-friendly stop action controls */}
      <div className="flex flex-col gap-1.5 flex-shrink-0 pt-1">
        {onMoveUp && index > 0 && (
          <button
            onClick={() => onMoveUp(index)}
            className="min-w-[40px] min-h-[40px] rounded-lg bg-white border border-[rgba(111,24,48,0.15)] flex items-center justify-center hover:bg-[#FFF5E6] text-[#7a6465] hover:text-[#6F1830] transition-colors"
            aria-label={`Move ${stop.placeName} earlier in route`}
            title="Move earlier"
          >
            <ChevronUp size={16} />
          </button>
        )}
        {onMoveDown && index < totalStops - 1 && (
          <button
            onClick={() => onMoveDown(index)}
            className="min-w-[40px] min-h-[40px] rounded-lg bg-white border border-[rgba(111,24,48,0.15)] flex items-center justify-center hover:bg-[#FFF5E6] text-[#7a6465] hover:text-[#6F1830] transition-colors"
            aria-label={`Move ${stop.placeName} later in route`}
            title="Move later"
          >
            <ChevronDown size={16} />
          </button>
        )}
        {onToggleLock && (
          <button
            onClick={() => onToggleLock(stop.id)}
            className={`min-w-[40px] min-h-[40px] rounded-lg border flex items-center justify-center transition-colors ${
              stop.locked
                ? "bg-[#6F1830] border-[#6F1830] text-white"
                : "bg-white border-[rgba(111,24,48,0.15)] text-[#7a6465] hover:border-[#6F1830] hover:text-[#6F1830]"
            }`}
            aria-label={stop.locked ? `Unlock ${stop.placeName}` : `Lock ${stop.placeName} as must-visit`}
            title={stop.locked ? "Remove must-visit lock" : "Mark as must-visit"}
          >
            {stop.locked ? <Lock size={15} /> : <Unlock size={15} />}
          </button>
        )}
        {onRemove && !stop.locked && (
          <button
            onClick={() => onRemove(stop.id)}
            className="min-w-[40px] min-h-[40px] rounded-lg bg-white border border-[rgba(111,24,48,0.15)] flex items-center justify-center text-[#7a6465] hover:border-red-400 hover:text-red-500 transition-colors"
            aria-label={`Remove ${stop.placeName} from route`}
            title="Remove stop"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Route Summary
// ─────────────────────────────────────────────

interface RouteSummaryProps {
  itinerary: GeneratedItinerary;
}

export function RouteSummary({ itinerary }: RouteSummaryProps) {
  const { summary, preferences } = itinerary;

  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <SummaryCell
          label="Stops"
          value={String(summary.totalStops)}
          sub={summary.totalStops === 1 ? "location" : "locations"}
        />
        <SummaryCell
          label="Total Time"
          value={formatDuration(summary.estimatedTotalMinutes)}
          sub="estimated"
        />
        <SummaryCell
          label="Travel"
          value={formatDuration(summary.estimatedTravelMinutes)}
          sub="between stops"
        />
      </div>

      {summary.approximateEndTime && (
        <div className="flex items-center justify-between text-sm border-t border-[rgba(111,24,48,0.1)] pt-3">
          <span className="text-[#7a6465]">Start</span>
          <span className="font-medium text-[#6F1830]">
            {formatTime(preferences.startTime)}
          </span>
          <span className="text-[#7a6465]">→</span>
          <span className="text-[#7a6465]">Finish ~</span>
          <span className="font-medium text-[#6F1830]">
            {formatTime(summary.approximateEndTime)}
          </span>
        </div>
      )}

      {/* Unmet Constraints & Budget Conflicts */}
      {summary.unmetConstraints && summary.unmetConstraints.length > 0 && (
        <div className="bg-[#FFF5E6] border border-[#D99B32]/40 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8B5000]">
            <AlertTriangle size={14} />
            <span>Itinerary Feasibility Advisory</span>
          </div>
          {summary.unmetConstraints.map((uc, i) => (
            <p key={i} className="text-xs text-[#8B5000] leading-relaxed">
              {uc}
            </p>
          ))}
        </div>
      )}

      {/* Warnings */}
      {summary.warnings.length > 0 && (
        <div className="space-y-1">
          {summary.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[#c87d12]">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-[rgba(111,24,48,0.08)] pt-2 flex items-center justify-between text-[11px] text-[#7a6465]">
        <span>
          Method:{" "}
          <strong className="text-[#3d3032]">
            {summary.routingMethodology === "urban_heuristic"
              ? "Urban street heuristic (1.6x factor)"
              : "Provider verified"}
          </strong>
        </span>
        <span>Festival crowds & diversions apply</span>
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-[#7a6465] uppercase tracking-wide mb-0.5">
        {label}
      </div>
      <div className="text-xl font-bold text-[#6F1830]">{value}</div>
      <div className="text-[10px] text-[#7a6465]">{sub}</div>
    </div>
  );
}
