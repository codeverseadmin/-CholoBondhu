"use client";

import Link from "next/link";
import { Clock, MapPin, Users, Camera, Star, Accessibility, Navigation, ExternalLink } from "lucide-react";
import type { PandalPlace, ExperienceTag } from "@/types";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { isRoutablePandal } from "@/lib/pandal-validator";
import { cn } from "@/lib/utils";
import { buildSingleDestinationNavUrl } from "@/lib/navigation-links";

const TAG_LABELS: Record<ExperienceTag, string> = {
  iconic: "Iconic",
  artistic: "Artistic",
  traditional: "Traditional",
  less_crowded: "Quieter",
  photography: "Photography",
  family_friendly: "Family",
  street_food: "Street Food",
  bengali_food: "Bengali Food",
  group_outing: "Group",
  accessible: "Accessible",
  contemporary: "Contemporary",
  heritage: "Heritage",
  spiritual: "Spiritual",
};

interface PandalCardProps {
  pandal: PandalPlace;
  variant?: "full" | "compact";
  onAddToItinerary?: (pandal: PandalPlace) => void;
  selected?: boolean;
  className?: string;
}

export function PandalCard({
  pandal,
  variant = "full",
  onAddToItinerary,
  selected = false,
  className,
}: PandalCardProps) {
  const showTags = pandal.experienceTags.slice(0, 3);

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "card flex items-start gap-3 p-3 cursor-pointer transition-all",
          selected && "ring-2 ring-[#6F1830] ring-offset-1",
          className
        )}
        role="article"
        aria-label={`${pandal.name}, ${pandal.locality}`}
      >
        {/* Color swatch */}
        <div
          className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #6F1830 0%, #E74732 100%)" }}
          aria-hidden="true"
        >
          <MapPin size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#211A1B] text-sm truncate">
            {pandal.name}
          </h3>
          <p className="text-[#7a6465] text-xs">{pandal.locality}</p>
          <div className="flex items-center gap-2 mt-1">
            <Clock size={11} className="text-[#7a6465]" />
            <span className="text-[10px] text-[#7a6465]">
              ~{pandal.recommendedVisitMinutes} min
            </span>
            {pandal.featured && (
              <Star size={11} className="text-[#D99B32]" fill="#D99B32" />
            )}
          </div>
        </div>
        {onAddToItinerary && (
          <button
            onClick={() => onAddToItinerary(pandal)}
            className="btn btn-secondary text-xs py-1.5 px-3 flex-shrink-0"
            aria-label={`Add ${pandal.name} to itinerary`}
          >
            Add
          </button>
        )}
      </div>
    );
  }

  // Full card
  return (
    <article
      className={cn(
        "card group relative overflow-hidden",
        selected && "ring-2 ring-[#6F1830] ring-offset-2",
        className
      )}
      aria-label={`${pandal.name} in ${pandal.locality}`}
    >
      {/* Hero visual */}
      <div
        className="relative h-44 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #6F1830 0%, ${
            pandal.experienceTags.includes("artistic")
              ? "#74764C"
              : pandal.experienceTags.includes("traditional")
              ? "#9e2a3a"
              : "#E74732"
          } 100%)`,
        }}
        aria-hidden="true"
      >
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border-2 border-white"
              style={{
                width: 60 + i * 20,
                height: 60 + i * 20,
                top: -30 + i * 5,
                right: -30 + i * 3,
                opacity: 0.3 - i * 0.03,
              }}
            />
          ))}
        </div>

        {/* Featured badge */}
        {pandal.featured && (
          <div className="absolute top-3 left-3">
            <span className="badge badge-maroon bg-white text-[#6F1830]">
              <Star size={10} fill="#6F1830" />
              Featured
            </span>
          </div>
        )}

        {/* Confidence badge */}
        <div className="absolute top-3 right-3">
          <ConfidenceBadge confidence={pandal.dataConfidence} />
        </div>

        {/* Place icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-25 group-hover:opacity-35 transition-opacity">
          <MapPin size={80} className="text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2" aria-label="Experience tags">
          {showTags.map((tag) => (
            <span
              key={tag}
              className={`badge tag-${tag} text-[10px]`}
            >
              {TAG_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>

        <h3 className="font-display font-semibold text-[#211A1B] text-lg leading-tight mb-0.5">
          {pandal.name}
        </h3>
        {pandal.nameBengali && (
          <p className="font-bengali text-xs text-[#7a6465] mb-1 font-medium">
            {pandal.nameBengali}
          </p>
        )}

        <div className="flex items-center gap-1.5 text-[#7a6465] mb-2">
          <MapPin size={12} />
          <span className="text-sm">{pandal.locality}</span>
        </div>

        <p className="text-sm text-[#3d3032] leading-relaxed line-clamp-2 mb-3">
          {pandal.editorialNote ?? pandal.description}
        </p>

        {/* Metadata row */}
        <div className="flex items-center gap-4 text-xs text-[#7a6465] mb-3">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>~{pandal.recommendedVisitMinutes} min</span>
          </div>
          {pandal.familyFriendly && (
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>Family</span>
            </div>
          )}
          {pandal.accessibilityDetails && (
            <div className="flex items-center gap-1">
              <Accessibility size={12} />
              <span>Accessible</span>
            </div>
          )}
          {pandal.experienceTags.includes("photography") && (
            <div className="flex items-center gap-1">
              <Camera size={12} />
              <span>Photo</span>
            </div>
          )}
        </div>

        {/* Crowd level with honest historical disclaimer */}
        {pandal.crowdLevel && pandal.crowdLevel !== "unknown" && (
          <div className="flex items-center justify-between gap-1.5 mb-3 bg-[#FFF5E6]/60 px-2.5 py-1.5 rounded-lg border border-[#D99B32]/20">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#7a6465]">Peak Rush:</span>
              <CrowdIndicator level={pandal.crowdLevel} />
            </div>
            <span className="text-[10px] text-[#7a6465]/80 italic">
              Historical evening avg
            </span>
          </div>
        )}

        {/* 2026 Reported Theme Block */}
        {pandal.theme2026 && (
          <div className="mb-3 p-2.5 rounded-lg bg-[#FFF5E6] border border-[#D99B32]/30">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8B5000]">
                2026 Theme
              </span>
              <ThemeStatusBadge status={pandal.themeStatus} />
            </div>
            <p className="text-xs font-semibold text-[#211A1B] leading-snug">
              {pandal.theme2026}
            </p>
            {pandal.themeBengali2026 && (
              <p className="font-bengali text-xs text-[#7a6465] mt-0.5">
                {pandal.themeBengali2026}
              </p>
            )}
          </div>
        )}

        {/* Reported Nearest Metro */}
        {pandal.nearestMetroReported && (
          <div className="text-[11px] text-[#7a6465] mb-2 flex items-center gap-1">
            <span className="font-medium text-[#211A1B]">Reported Metro:</span>
            <span>{pandal.nearestMetroReported}</span>
          </div>
        )}

        {/* Photo Gallery Source Link (Requirement 5 & 6: Link only, no hotlinking) */}
        {pandal.photoGalleryPage && (
          <div className="mb-3 text-xs bg-stone-50 p-2 rounded-lg border border-stone-200/70">
            <a
              href={pandal.photoGalleryPage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#6F1830] font-semibold hover:underline"
              aria-label={`View photo gallery source page for ${pandal.name}`}
            >
              <ExternalLink size={12} />
              <span>View Photo Gallery Source</span>
            </a>
            <p className="text-[10px] text-[#7a6465] mt-1 leading-tight italic">
              {pandal.photoUsageNote || "External source gallery page. Do not copy or redistribute photographs without permission."}
            </p>
          </div>
        )}

        {/* Location & Routing Status (Requirement 7, 8, 12) */}
        {isRoutablePandal(pandal) ? (
          pandal.latitude && pandal.longitude && (
            <div className="mb-3">
              <a
                href={buildSingleDestinationNavUrl({
                  latitude: pandal.latitude,
                  longitude: pandal.longitude,
                  name: pandal.name,
                  locality: pandal.locality || pandal.area,
                  address: pandal.address,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#6F1830] hover:text-[#8B2040] hover:underline"
                aria-label={`Open directions to ${pandal.name} in external Maps`}
              >
                <Navigation size={12} />
                Open Directions in Maps
              </a>
            </div>
          )
        ) : (
          <div className="mb-3 p-2 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
            <MapPin size={13} className="text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                {pandal.coordinatesStatus === "needs_verified_geocoding"
                  ? "Location coordinates pending field geocoding."
                  : "Reported coordinates require field verification."}
              </p>
              <p className="text-[10px] text-amber-800/90 mt-0.5">
                Available in list search. Turn-by-turn routing excluded until coordinates are verified.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        {isRoutablePandal(pandal) ? (
          onAddToItinerary ? (
            <button
              onClick={() => onAddToItinerary(pandal)}
              className="btn btn-primary w-full text-sm"
              aria-label={`Add ${pandal.name} to your itinerary`}
            >
              Add to Itinerary
            </button>
          ) : (
            <Link
              href={`/plan?add=${pandal.id}`}
              className="btn btn-primary w-full text-sm inline-flex items-center justify-center text-center"
              aria-label={`Plan route with ${pandal.name}`}
            >
              Plan with this Pandal
            </Link>
          )
        ) : (
          <div className="rounded-lg bg-stone-100 p-2 text-center text-xs text-[#7a6465] font-medium border border-stone-200">
            Available in Directory · Excluded from Route Planning
          </div>
        )}
      </div>
    </article>
  );
}

function CrowdIndicator({
  level,
}: {
  level: "low" | "moderate" | "high" | "very_high";
}) {
  const config = {
    low: { dots: 1, label: "Low", color: "#2d7a4f" },
    moderate: { dots: 2, label: "Moderate", color: "#c87d12" },
    high: { dots: 3, label: "High", color: "#E74732" },
    very_high: { dots: 4, label: "Very High", color: "#6F1830" },
  }[level];

  return (
    <div className="flex items-center gap-1.5" aria-label={`Crowd level: ${config.label}`}>
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="w-2 h-2 rounded-full"
          style={{
            background: n <= config.dots ? config.color : "#e8d1c9",
          }}
          aria-hidden="true"
        />
      ))}
      <span className="text-xs" style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  );
}

function ThemeStatusBadge({
  status,
}: {
  status?: "confirmed" | "reported_needs_confirmation" | "reported_needs_verification" | "not_verified";
}) {
  switch (status) {
    case "confirmed":
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
          Confirmed
        </span>
      );
    case "reported_needs_confirmation":
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
          Reported (Awaiting Confirmation)
        </span>
      );
    case "reported_needs_verification":
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 font-medium">
          Reported (Needs Verification)
        </span>
      );
    case "not_verified":
    default:
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
          Unverified
        </span>
      );
  }
}
