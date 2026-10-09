"use client";

import { useState } from "react";
import { FoodCard } from "@/components/places/FoodCard";
import { FOOD_HOTSPOT_DATA } from "@/data/food";
import type { FoodHotspot } from "@/types";
import { Search, X } from "lucide-react";

const CATEGORIES = [
  { key: "all", label: "All Food" },
  { key: "bengali_cuisine", label: "Bengali Cuisine" },
  { key: "biryani", label: "Biryani" },
  { key: "rolls_kathi", label: "Kathi Rolls" },
  { key: "street_food", label: "Street Food" },
  { key: "sweets", label: "Sweets & Mishti" },
  { key: "restaurant", label: "Restaurants" },
  { key: "cafe", label: "Cafés" },
];

const DIETARY_FILTERS = [
  { key: "all", label: "All Diets" },
  { key: "vegetarian", label: "Vegetarian" },
  { key: "non_vegetarian", label: "Non-Veg" },
];

const BUDGET_FILTERS = [
  { key: "all", label: "All Budgets" },
  { key: "budget", label: "₹ Budget" },
  { key: "moderate", label: "₹₹ Moderate" },
  { key: "premium", label: "₹₹₹ Premium" },
];

export default function FoodPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [dietaryFilter, setDietaryFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");

  const filtered = FOOD_HOTSPOT_DATA.filter((f) => {
    const matchesQuery =
      !query.trim() ||
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.locality.toLowerCase().includes(query.toLowerCase()) ||
      f.description.toLowerCase().includes(query.toLowerCase()) ||
      f.popularItems?.some((item) => item.toLowerCase().includes(query.toLowerCase()));

    const matchesCategory =
      activeCategory === "all" ||
      f.foodCategory.includes(activeCategory as FoodHotspot["foodCategory"][0]);

    const matchesDiet =
      dietaryFilter === "all" ||
      (f.dietaryNotes && f.dietaryNotes.includes(dietaryFilter as any));

    const matchesBudget =
      budgetFilter === "all" || f.priceRange === budgetFilter;

    return matchesQuery && matchesCategory && matchesDiet && matchesBudget;
  });

  const hasActiveFilters =
    query.trim() !== "" ||
    activeCategory !== "all" ||
    dietaryFilter !== "all" ||
    budgetFilter !== "all";

  function clearAllFilters() {
    setQuery("");
    setActiveCategory("all");
    setDietaryFilter("all");
    setBudgetFilter("all");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-[#D99B32] text-sm font-semibold uppercase tracking-widest mb-1">
          Puja Culinary Guide
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-[#211A1B]">
          The Taste of Pujo
        </h1>
        <p className="text-[#7a6465] mt-1">
          From legendary biryani to quintessential mishti — discover verified food along your Kolkata Puja trail.
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
          placeholder="Search by restaurant name, locality, or signature dish (e.g. biryani, paturi, mishti doi)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-xl border border-[rgba(111,24,48,0.2)] bg-white text-[#211A1B] placeholder-[#7a6465] focus:outline-none focus:border-[#6F1830] focus:ring-2 focus:ring-[#6F1830]/20 text-sm"
          aria-label="Search food spots and dishes"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6465] hover:text-[#211A1B]"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Primary Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] ${
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

      {/* Sub-Filters: Dietary & Budget */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 bg-[#FFF5E6]/60 p-3 rounded-xl border border-[rgba(111,24,48,0.08)]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#7a6465]">Diet:</span>
          {DIETARY_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDietaryFilter(key)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                dietaryFilter === key
                  ? "bg-[#6F1830] border-[#6F1830] text-white"
                  : "bg-white border-[rgba(111,24,48,0.15)] text-[#3d3032] hover:border-[#6F1830]"
              }`}
            >
              {label}
            </button>
          ))}

          <span className="text-xs font-semibold text-[#7a6465] ml-2">Budget:</span>
          {BUDGET_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setBudgetFilter(key)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                budgetFilter === key
                  ? "bg-[#6F1830] border-[#6F1830] text-white"
                  : "bg-white border-[rgba(111,24,48,0.15)] text-[#3d3032] hover:border-[#6F1830]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#E74732] hover:underline font-medium"
            >
              Reset filters
            </button>
          )}
          <span className="text-xs text-[#7a6465] font-medium">
            {filtered.length} spot{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 card p-8">
          <p className="text-[#211A1B] font-semibold mb-1">No culinary spots found matching your filter criteria.</p>
          <p className="text-xs text-[#7a6465] mb-4">Try clearing filters or searching for another neighbourhood.</p>
          <button onClick={clearAllFilters} className="btn btn-secondary text-xs px-4 py-2">
            Clear all filters
          </button>
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

      <p className="text-xs text-[#7a6465] mt-8 text-center leading-relaxed">
        Food data is curated from verified Kolkata heritage records and restaurant registries. Operating hours during Ashtami and Nabami may extend past midnight.
      </p>
    </div>
  );
}
