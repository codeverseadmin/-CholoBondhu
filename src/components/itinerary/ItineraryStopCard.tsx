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
  Flag,
  ExternalLink,
  Train,
  CheckCircle2,
  Circle,
  Footprints,
  Sparkles,
  Trophy,
  RotateCcw,
} from "lucide-react";
import type {
  ItineraryStop,
  GeneratedItinerary,
  ItineraryMetroOrigin,
  PujoQuestProgress,
} from "@/types";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { formatTime, formatDuration } from "@/lib/utils";
import { buildMultiStopNavUrl, buildSingleDestinationNavUrl } from "@/lib/navigation-links";
import { getNextLevel } from "@/lib/gamification";
import { PoliceBarricadeCaveat } from "@/components/ui/PoliceBarricadeCaveat";

// ─────────────────────────────────────────────
// Single Stop Card with Checklist Integration
// ─────────────────────────────────────────────

interface StopCardProps {
  stop: ItineraryStop;
  index: number;
  totalStops: number;
  onRemove?: (stopId: string) => void;
  onToggleLock?: (stopId: string) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onReport?: (placeId: string, placeName: string) => void;
  selected?: boolean;
  onSelect?: (stopId: string) => void;
  isCompleted?: boolean;
  onToggleComplete?: (stopId: string) => void;
}

export function ItineraryStopCard({
  stop,
  index,
  totalStops,
  onRemove,
  onToggleLock,
  onMoveUp,
  onMoveDown,
  onReport,
  selected = false,
  onSelect,
  isCompleted = false,
  onToggleComplete,
}: StopCardProps) {
  const isFood = stop.placeType === "food";
  const xpReward = isFood ? 50 : 100;

  return (
    <div
      className={`relative flex items-start gap-3 group transition-all ${
        selected ? "opacity-100" : "opacity-100"
      }`}
    >
      {/* Timeline marker */}
      <div className="flex flex-col items-center flex-shrink-0 mt-1">
        <button
          onClick={() => onSelect?.(stop.id)}
          className={`w-10 h-10 rounded-full flex items-center justify-center z-10 relative transition-all border-2 ${
            isCompleted
              ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
              : selected
              ? "bg-[#6F1830] border-[#6F1830] text-white"
              : isFood
              ? "bg-[#FFF5E6] border-[#D99B32] text-[#D99B32]"
              : "bg-white border-[#6F1830]/30 text-[#6F1830] group-hover:border-[#6F1830]"
          }`}
          aria-label={`View ${stop.placeName}`}
        >
          {isCompleted ? (
            <CheckCircle2 size={18} />
          ) : isFood ? (
            <Utensils size={16} />
          ) : (
            <span className="text-xs font-bold">{index + 1}</span>
          )}
        </button>
      </div>

      {/* Card content */}
      <div
        className={`flex-1 card p-3.5 mb-1 cursor-pointer transition-all border ${
          isCompleted
            ? "border-emerald-300 bg-emerald-50/25 ring-1 ring-emerald-200"
            : selected
            ? "ring-2 ring-[#6F1830] ring-offset-1 border-[#6F1830]/40"
            : "border-[rgba(111,24,48,0.12)]"
        }`}
        onClick={() => onSelect?.(stop.id)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`font-semibold text-base leading-tight ${
                  isCompleted ? "text-emerald-950" : "text-[#211A1B]"
                }`}
              >
                {stop.placeName}
              </h4>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                  ✓ Visited (+{xpReward} XP)
                </span>
              )}
            </div>
            {stop.placeNameBengali && (
              <span className="font-bengali text-xs text-[#7a6465] font-normal block mt-0.5">
                {stop.placeNameBengali}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
            {/* Gamified Checklist Toggle Button */}
            {onToggleComplete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete(stop.id);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isCompleted
                    ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                    : "bg-[#FFF5E6] text-[#6F1830] border border-[#D99B32]/40 hover:bg-[#6F1830] hover:text-white"
                }`}
                aria-pressed={isCompleted}
                title={isCompleted ? "Click to uncheck" : `Check off as visited to earn +${xpReward} XP`}
              >
                {isCompleted ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                <span>{isCompleted ? "Done" : `Checklist (+${xpReward} XP)`}</span>
              </button>
            )}

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
        {stop.estimatedTravelMinutesFromPrevious != null && (
          <div className="text-xs text-[#7a6465] mb-2 bg-[#FFF5E6]/60 px-2.5 py-1.5 rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span>
              ~{stop.estimatedTravelMinutesFromPrevious} min transit from previous stop
              {stop.straightLineDistanceKmFromPrevious != null && (
                <span className="text-[10px] text-[#7a6465] block sm:inline sm:ml-1">
                  (~{stop.straightLineDistanceKmFromPrevious} km straight · ~{stop.estimatedRoadDistanceKmFromPrevious} km road)
                </span>
              )}
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

        {/* Navigation & Community Feedback Action Row */}
        <div className="flex items-center justify-between flex-wrap gap-2 mt-2.5 pt-2 border-t border-[rgba(111,24,48,0.06)]">
          {stop.latitude && stop.longitude ? (
            <a
              href={
                stop.navigationUrl ||
                buildSingleDestinationNavUrl({
                  latitude: stop.latitude,
                  longitude: stop.longitude,
                  name: stop.placeName,
                  locality: stop.locality,
                })
              }
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6F1830] hover:text-[#8B2040] hover:underline min-h-[36px]"
              aria-label={`Open navigation to ${stop.placeName} in external Maps`}
            >
              <Navigation size={12} />
              Navigate with Maps
            </a>
          ) : <span />}

          {/* Caveat for pedestrian diversions */}
          {stop.latitude && stop.longitude && (
            <PoliceBarricadeCaveat compact className="w-full mt-1 mb-1" />
          )}

          {onReport && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReport(stop.placeId, stop.placeName);
              }}
              className="inline-flex items-center gap-1 text-[11px] text-[#7a6465] hover:text-[#6F1830] transition-colors py-1 min-h-[36px]"
              aria-label={`Report ground conditions or delays for ${stop.placeName}`}
            >
              <Flag size={11} className="text-[#D99B32]" />
              Report Ground Update
            </button>
          )}
        </div>
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
// Metro Origin Node (Journey Starting Point)
// ─────────────────────────────────────────────

export interface MetroOriginNodeProps {
  startingMetro: ItineraryMetroOrigin;
  startTime?: string;
  firstStop?: ItineraryStop;
  isChecked?: boolean;
  onToggleCheck?: () => void;
}

export function MetroOriginNode({
  startingMetro,
  startTime,
  firstStop,
  isChecked = false,
  onToggleCheck,
}: MetroOriginNodeProps) {
  const lineBg =
    startingMetro.lineCode === "blue"
      ? "bg-[#005EB8] text-white"
      : "bg-[#009639] text-white";

  const navToStop1Url =
    firstStop?.latitude && firstStop?.longitude
      ? buildSingleDestinationNavUrl(
          {
            latitude: firstStop.latitude,
            longitude: firstStop.longitude,
            name: firstStop.placeName,
            locality: firstStop.locality,
          },
          {
            latitude: startingMetro.center.latitude,
            longitude: startingMetro.center.longitude,
            name: `${startingMetro.name} Metro Station`,
          } as any,
          "walking"
        )
      : undefined;

  return (
    <div className="relative flex items-start gap-3 mb-2 group">
      {/* Metro icon timeline marker */}
      <div className="flex flex-col items-center flex-shrink-0 mt-1">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center z-10 relative border-2 ${
            isChecked
              ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
              : "bg-[#005EB8] border-[#005EB8] text-white"
          }`}
        >
          <Train size={18} />
        </div>
      </div>

      {/* Card content */}
      <div
        className={`flex-1 card p-3.5 border transition-all ${
          isChecked
            ? "border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-200"
            : "border-[#005EB8]/20 bg-white"
        }`}
      >
        <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${lineBg}`}
              >
                {startingMetro.line}
              </span>
              <span className="text-[11px] text-[#7a6465] font-semibold">
                Start Here · Metro Hop-Off Point
              </span>
            </div>
            <h4 className="font-semibold text-[#211A1B] text-base leading-tight mt-1">
              {startingMetro.name}
            </h4>
            <span className="font-bengali text-xs text-[#7a6465] block mt-0.5">
              {startingMetro.nameBengali}
            </span>
          </div>

          {/* Gamified Metro Check-in */}
          {onToggleCheck && (
            <button
              type="button"
              onClick={onToggleCheck}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isChecked
                  ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                  : "bg-[#FFF5E6] text-[#6F1830] hover:bg-[#6F1830] hover:text-white border border-[#D99B32]/40"
              }`}
              aria-pressed={isChecked}
              title={isChecked ? "Click to uncheck" : "Check in at metro station for +50 XP"}
            >
              {isChecked ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              <span>{isChecked ? "Arrived (+50 XP)" : "Check in (+50 XP)"}</span>
            </button>
          )}
        </div>

        {/* Exit Gate guidance */}
        <div className="mt-2 text-xs bg-[#FFF5E6]/70 p-2.5 rounded-lg border border-[rgba(111,24,48,0.08)] flex items-start gap-2">
          <Footprints size={14} className="text-[#6F1830] flex-shrink-0 mt-0.5" />
          <div className="text-[#3d3032]">
            <span className="font-semibold text-[#6F1830]">
              Recommended Station Exit:{" "}
            </span>
            <span>{startingMetro.gateGuidance}</span>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between flex-wrap gap-2 mt-3 pt-2.5 border-t border-[rgba(111,24,48,0.08)]">
          <div className="text-xs text-[#7a6465]">
            {startTime && (
              <span>
                Meet at metro ~<strong>{formatTime(startTime)}</strong>
              </span>
            )}
            {firstStop && (
              <span className="ml-2">
                → First stop: <strong>{firstStop.placeName}</strong>
              </span>
            )}
          </div>

          {navToStop1Url && (
            <div className="w-full">
              <a
                href={navToStop1Url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#005EB8] hover:underline min-h-[32px]"
              >
                <Navigation size={12} />
                Directions: Metro Exit → Stop 1
              </a>
              <PoliceBarricadeCaveat compact className="mt-1" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Gamified Pujo Quest Tracker Card
// ─────────────────────────────────────────────

interface QuestTrackerProps {
  quest: PujoQuestProgress;
  onReset?: () => void;
}

export function PujoQuestTrackerCard({ quest, onReset }: QuestTrackerProps) {
  const nextLevel = getNextLevel(quest.level);
  const xpNeeded = nextLevel ? nextLevel.minXp - quest.totalXp : 0;

  return (
    <div className="card p-4 bg-gradient-to-br from-white via-[#FFF5E6]/40 to-[#FFF5E6]/80 border border-[#D99B32]/40 shadow-sm space-y-3">
      {/* Top row: Rank badge + XP */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#6F1830] text-amber-200 flex items-center justify-center font-bold text-lg shadow-sm">
            🏆
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#6F1830] uppercase tracking-wide">
                Level {quest.level}: {quest.levelTitle}
              </span>
              <span className="font-bengali text-xs text-[#7a6465]">
                ({quest.levelTitleBengali})
              </span>
            </div>
            <p className="text-[11px] text-[#7a6465]">
              {nextLevel
                ? `${xpNeeded} more XP to reach Level ${nextLevel.level} (${nextLevel.titleBengali})`
                : "Top Explorer Rank Achieved!"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-lg font-bold text-[#6F1830] flex items-center gap-1 justify-end">
              <Sparkles size={16} className="text-[#D99B32]" />
              <span>{quest.totalXp} XP</span>
            </div>
            <div className="text-[10px] text-[#7a6465]">Pujo Points Earned</div>
          </div>
          {onReset && quest.completedStopsCount > 0 && (
            <button
              onClick={onReset}
              className="p-1.5 text-[#7a6465] hover:text-[#6F1830] rounded-lg border border-[rgba(111,24,48,0.15)] hover:bg-white"
              title="Reset trail checklist"
              aria-label="Reset checklist"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#3d3032]">
            {quest.completedStopsCount} of {quest.totalStopsCount} stops visited
            {quest.metroOriginChecked ? " · Metro checked-in" : ""}
          </span>
          <span className="font-bold text-[#6F1830]">{quest.percentComplete}% Complete</span>
        </div>
        <div className="w-full h-2.5 bg-[rgba(111,24,48,0.1)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D99B32] to-[#6F1830] transition-all duration-500 rounded-full"
            style={{ width: `${quest.percentComplete}%` }}
          />
        </div>
      </div>

      {/* Badges Ribbon */}
      {quest.badges.length > 0 && (
        <div className="pt-2 border-t border-[rgba(111,24,48,0.08)] flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-[#7a6465] tracking-wider">
            Badges:
          </span>
          {quest.badges.map((b) => (
            <div
              key={b.id}
              className="inline-flex items-center gap-1 bg-white border border-[#D99B32]/40 px-2 py-0.5 rounded-full text-[11px] shadow-2xs font-medium text-[#3d3032]"
              title={b.description}
            >
              <span>{b.icon}</span>
              <span>{b.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* 100% Completion Celebration Banner */}
      {quest.isFullyCompleted && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Trophy size={24} className="text-amber-200 flex-shrink-0" />
            <div>
              <h5 className="font-bold text-sm leading-tight text-white">
                অভিনন্দন! Durga Puja Trail Completed!
              </h5>
              <p className="text-xs text-emerald-100">
                You checked off all stops & earned +150 bonus XP! Ultimate Pujo Champion.
              </p>
            </div>
          </div>
        </div>
      )}
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
  const { summary, preferences, stops } = itinerary;

  const validNavStops = stops
    .filter((s) => typeof s.latitude === "number" && typeof s.longitude === "number")
    .map((s) => ({
      latitude: s.latitude!,
      longitude: s.longitude!,
      name: s.placeName,
      locality: s.locality,
    }));

  const navOrigin =
    itinerary.startingMetro
      ? ({
          latitude: itinerary.startingMetro.center.latitude,
          longitude: itinerary.startingMetro.center.longitude,
          name: `${itinerary.startingMetro.name} Metro Station`,
        } as any)
      : preferences.startingLatitude && preferences.startingLongitude
      ? {
          latitude: preferences.startingLatitude,
          longitude: preferences.startingLongitude,
        }
      : undefined;

  const multiStopNav =
    validNavStops.length > 0
      ? buildMultiStopNavUrl(validNavStops, navOrigin, preferences.transportMode)
      : null;

  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
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
        {summary.totalEstimatedRoadDistanceKm != null && (
          <SummaryCell
            label="Distance"
            value={`~${summary.totalEstimatedRoadDistanceKm} km`}
            sub={
              summary.totalStraightLineDistanceKm != null
                ? `~${summary.totalStraightLineDistanceKm} km straight`
                : "est. road"
            }
          />
        )}
      </div>

      {multiStopNav && (
        <div className="pt-2 border-t border-[rgba(111,24,48,0.1)] space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <a
              href={multiStopNav.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5 text-[#6F1830] font-semibold hover:bg-[#FFF5E6]"
              aria-label="Open multi-stop route directions in external Google Maps"
            >
              <Navigation size={13} />
              Open Full Route in External Google Maps <ExternalLink size={11} />
            </a>
            <span className="text-[11px] text-[#7a6465]">
              Opens Google Maps starting from {itinerary.startingMetro ? itinerary.startingMetro.name : "origin"}
            </span>
          </div>
          <PoliceBarricadeCaveat />
        </div>
      )}

      {summary.approximationExplanation && (
        <p className="text-[11px] text-[#7a6465] leading-relaxed italic bg-[#FFF5E6]/50 p-2 rounded-lg border border-[rgba(111,24,48,0.06)]">
          ℹ {summary.approximationExplanation}
        </p>
      )}

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
