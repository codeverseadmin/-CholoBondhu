"use client";

import Link from "next/link";
import { Clock, MapPin, Users, Camera, Star, Accessibility } from "lucide-react";
import type { PandalPlace, ExperienceTag } from "@/types";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { cn } from "@/lib/utils";

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

        {/* Crowd level */}
        {pandal.crowdLevel && pandal.crowdLevel !== "unknown" && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xs text-[#7a6465]">Crowds:</span>
            <CrowdIndicator level={pandal.crowdLevel} />
          </div>
        )}

        {/* Actions */}
        {onAddToItinerary ? (
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
