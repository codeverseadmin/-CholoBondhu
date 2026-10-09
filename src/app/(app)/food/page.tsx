"use client";

import { useState } from "react";
import { FoodCard } from "@/components/places/FoodCard";
import { FOOD_HOTSPOT_DATA } from "@/data/food";
import type { FoodHotspot } from "@/types";
import { Search, X } from "lucide-react";

const CATEGORIES = [
  { key: "all", label: "All Food" },
  { key: "bengali_cuisine", label: "Bengali" },
  { key: "street_food", label: "Street Food" },
  { key: "sweets", label: "Sweets" },
  { key: "biryani", label: "Biryani" },
  { key: "puja_stall", label: "Puja Stalls" },
  { key: "restaurant", label: "Restaurants" },
];

export default function FoodPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = FOOD_HOTSPOT_DATA.filter((f) => {
    const matchesQuery =
      !query.trim() ||
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.locality.toLowerCase().includes(query.toLowerCase()) ||
      f.description.toLowerCase().includes(query.toLowerCase());

    const matchesCategory =
      activeCategory === "all" ||
      f.foodCategory.includes(activeCategory as FoodHotspot["foodCategory"][0]);

    return matchesQuery && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-[#D99B32] text-sm font-semibold uppercase tracking-widest mb-1">
          Puja Food Guide
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-[#211A1B]">
          The Taste of Pujo
        </h1>
        <p className="text-[#7a6465] mt-1">
          From biryani to mishti — discover the best food along your Puja route
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a6465]"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search food or locality…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-xl border border-[rgba(111,24,48,0.2)] bg-white text-[#211A1B] placeholder-[#7a6465] focus:outline-none focus:border-[#6F1830] focus:ring-2 focus:ring-[#6F1830]/20 text-sm"
          aria-label="Search food"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6465]"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === key
                ? "bg-[#6F1830] text-white"
                : "bg-white border border-[rgba(111,24,48,0.2)] text-[#3d3032] hover:border-[#6F1830]"
            }`}
            aria-pressed={activeCategory === key}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#7a6465]">No food spots found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((food, i) => (
            <FoodCard
              key={food.id}
              food={food}
              index={i}
              onAddToItinerary={() => {
                window.location.href = `/plan`;
              }}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-[#7a6465] mt-8 text-center">
        Food data is curated from public sources. Operating hours and availability may change.
        Demo records are illustrative only.
      </p>
    </div>
  );
}
