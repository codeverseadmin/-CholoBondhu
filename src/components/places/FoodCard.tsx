"use client";

import { Utensils, MapPin, Clock, Tag, Navigation } from "lucide-react";
import type { FoodHotspot } from "@/types";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { cn } from "@/lib/utils";
import { buildSingleDestinationNavUrl } from "@/lib/navigation-links";

const FOOD_CATEGORY_LABELS: Record<string, string> = {
  bengali_cuisine: "Bengali",
  street_food: "Street Food",
  sweets: "Sweets",
  snacks: "Snacks",
  cafe: "Café",
  restaurant: "Restaurant",
  puja_stall: "Puja Stall",
  rolls_kathi: "Rolls / Kathi",
  biryani: "Biryani",
  seafood: "Seafood",
};

const PRICE_LABELS = {
  budget: "₹",
  moderate: "₹₹",
  premium: "₹₹₹",
};

const FOOD_COLORS = [
  "linear-gradient(135deg, #E74732 0%, #c0392b 100%)",
  "linear-gradient(135deg, #D99B32 0%, #c87d12 100%)",
  "linear-gradient(135deg, #6F1830 0%, #9e2a3a 100%)",
  "linear-gradient(135deg, #74764C 0%, #5a5c3a 100%)",
];

interface FoodCardProps {
  food: FoodHotspot;
  index?: number;
  onAddToItinerary?: (food: FoodHotspot) => void;
  className?: string;
}

export function FoodCard({
  food,
  index = 0,
  onAddToItinerary,
  className,
}: FoodCardProps) {
  const gradient = FOOD_COLORS[index % FOOD_COLORS.length];

  return (
    <article
      className={cn("card overflow-hidden group", className)}
      aria-label={`${food.name} — ${food.locality}`}
    >
      {/* Visual header */}
      <div
        className="relative h-32 flex items-center justify-center"
        style={{ background: gradient }}
        aria-hidden="true"
      >
        <Utensils size={40} className="text-white opacity-30 group-hover:opacity-40 transition-opacity" />
        {food.temporary && (
          <span className="absolute top-2 left-2 badge bg-white text-[#6F1830] text-[9px]">
            Festival Stall
          </span>
        )}
        <div className="absolute top-2 right-2">
          <ConfidenceBadge confidence={food.confidence} showLabel={false} />
        </div>
      </div>

      <div className="p-3.5">
        {/* Categories */}
        <div className="flex flex-wrap gap-1 mb-1.5">
          {food.foodCategory.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#FFF5E6] text-[#D99B32]"
            >
              {FOOD_CATEGORY_LABELS[cat] ?? cat}
            </span>
          ))}
        </div>

        <h3 className="font-semibold text-[#211A1B] text-base leading-tight mb-0.5">
          {food.name}
        </h3>
        {food.nameBengali && (
          <p className="font-bengali text-xs text-[#7a6465] mb-1 font-medium">
            {food.nameBengali}
          </p>
        )}

        <div className="flex items-center gap-1 text-[#7a6465] mb-1.5">
          <MapPin size={11} />
          <span className="text-xs">{food.locality}</span>
          {food.priceRange && (
            <>
              <span className="text-[#E8D1C9]">·</span>
              <span className="text-xs font-medium text-[#D99B32]">
                {PRICE_LABELS[food.priceRange]}
              </span>
            </>
          )}
        </div>

        <p className="text-xs text-[#3d3032] leading-relaxed line-clamp-2 mb-2">
          {food.description}
        </p>

        {/* Popular items */}
        {food.popularItems && food.popularItems.length > 0 && (
          <div className="flex items-start gap-1.5 mb-2">
            <Tag size={11} className="text-[#D99B32] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#7a6465]">
              {food.popularItems.slice(0, 3).join(" · ")}
            </p>
          </div>
        )}

        {/* Operating window */}
        {food.approximateOperatingWindow && (
          <div className="flex items-center gap-1.5 mb-2">
            <Clock size={11} className="text-[#7a6465]" />
            <span className="text-xs text-[#7a6465]">{food.approximateOperatingWindow}</span>
          </div>
        )}

        {/* Dietary notes */}
        <div className="flex flex-wrap gap-1 mb-2">
          {food.dietaryNotes && food.dietaryNotes.length > 0 ? (
            food.dietaryNotes.map((note) => (
              <span
                key={note}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FFF5E6] text-[#7a6465]"
              >
                {note.replace("_", " ")}
              </span>
            ))
          ) : (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-stone-100 text-[#7a6465] italic">
              Dietary: Unknown
            </span>
          )}
          {food.openingHoursConfidence && food.openingHoursConfidence !== "standard_operating_window" && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Hours Unverified
            </span>
          )}
        </div>

        {/* Directions link if coordinates available */}
        {food.latitude && food.longitude && (
          <div className="mb-2">
            <a
              href={buildSingleDestinationNavUrl({
                latitude: food.latitude,
                longitude: food.longitude,
                name: food.name,
                locality: food.locality,
                address: food.address,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6F1830] hover:text-[#8B2040] hover:underline"
              aria-label={`Get directions to ${food.name} in external Maps`}
            >
              <Navigation size={11} />
              Open Directions
            </a>
          </div>
        )}

        {onAddToItinerary ? (
          <button
            onClick={() => onAddToItinerary(food)}
            className="btn btn-secondary w-full text-xs min-h-[44px] flex items-center justify-center"
            aria-label={`Add ${food.name} to itinerary`}
          >
            Add Food Stop
          </button>
        ) : (
          <a
            href={`/plan?locality=${encodeURIComponent(food.locality)}`}
            className="btn btn-secondary w-full text-xs min-h-[44px] flex items-center justify-center text-center"
            aria-label={`Plan route near ${food.name}`}
          >
            Plan Route Nearby
          </a>
        )}
      </div>
    </article>
  );
}
