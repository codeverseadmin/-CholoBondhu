"use client";

import { useState, useMemo } from "react";
import { Search, Filter, X } from "lucide-react";
import { PandalCard } from "@/components/places/PandalCard";
import { NoResultsEmptyState } from "@/components/ui/EmptyState";
import { PANDAL_DATA } from "@/data/pandals";
import type { ExperienceTag, PandalPlace } from "@/types";

const ALL_TAGS: { tag: ExperienceTag; label: string }[] = [
  { tag: "iconic", label: "Iconic" },
  { tag: "artistic", label: "Artistic" },
  { tag: "traditional", label: "Traditional" },
  { tag: "less_crowded", label: "Quieter" },
  { tag: "photography", label: "Photography" },
  { tag: "family_friendly", label: "Family" },
  { tag: "contemporary", label: "Contemporary" },
  { tag: "heritage", label: "Heritage" },
  { tag: "accessible", label: "Accessible" },
];

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<ExperienceTag[]>([]);
  const [sortBy, setSortBy] = useState<"featured" | "name" | "duration">("featured");

  const filtered = useMemo(() => {
    let results = [...PANDAL_DATA];

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.locality.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.alternateNames?.some((n) => n.toLowerCase().includes(q))
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      results = results.filter((p) =>
        selectedTags.every((tag) => p.experienceTags.includes(tag))
      );
    }

    // Sort
    switch (sortBy) {
      case "name":
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "duration":
        results.sort((a, b) => a.recommendedVisitMinutes - b.recommendedVisitMinutes);
        break;
      case "featured":
      default:
        results.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (b.editorialRating ?? 0) - (a.editorialRating ?? 0);
        });
    }

    return results;
  }, [query, selectedTags, sortBy]);

  function toggleTag(tag: ExperienceTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function clearFilters() {
    setQuery("");
    setSelectedTags([]);
  }

  const hasFilters = query.trim() || selectedTags.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-[#D99B32] text-sm font-semibold uppercase tracking-widest mb-1">
          2026 Season
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-[#211A1B] mb-2">
          Discover Pandals
        </h1>
        <p className="text-[#7a6465]">
          {PANDAL_DATA.length} curated locations across Kolkata
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
          placeholder="Search by name or locality…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-xl border border-[rgba(111,24,48,0.2)] bg-white text-[#211A1B] placeholder-[#7a6465] focus:outline-none focus:border-[#6F1830] focus:ring-2 focus:ring-[#6F1830]/20 transition-all text-sm"
          aria-label="Search pandals"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6465] hover:text-[#211A1B] transition-colors"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter size={14} className="text-[#7a6465] flex-shrink-0" aria-hidden="true" />
        <span className="text-xs text-[#7a6465] mr-1">Filter:</span>
        {ALL_TAGS.map(({ tag, label }) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`badge transition-all cursor-pointer ${
              selectedTags.includes(tag)
                ? "badge-maroon bg-[#6F1830] text-white border border-[#6F1830]"
                : "bg-white border border-[rgba(111,24,48,0.2)] text-[#3d3032] hover:border-[#6F1830] hover:text-[#6F1830]"
            }`}
            aria-pressed={selectedTags.includes(tag)}
            aria-label={`Filter by ${label}`}
          >
            {label}
          </button>
        ))}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="badge bg-[#FFF5E6] text-[#c87d12] border border-[#D99B32]/30 hover:bg-[#D99B32]/10 transition-colors cursor-pointer"
            aria-label="Clear all filters"
          >
            <X size={10} />
            Clear
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-[#7a6465]">Sort by:</span>
        {(["featured", "name", "duration"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all ${
              sortBy === s
                ? "bg-[#6F1830] text-white"
                : "bg-white border border-[rgba(111,24,48,0.15)] text-[#7a6465] hover:text-[#6F1830]"
            }`}
            aria-pressed={sortBy === s}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-xs text-[#7a6465]">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <NoResultsEmptyState query={query} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((pandal) => (
            <PandalCard
              key={pandal.id}
              pandal={pandal}
              variant="full"
              onAddToItinerary={(p) => {
                window.location.href = `/plan?add=${p.id}`;
              }}
            />
          ))}
        </div>
      )}

      {/* Data note */}
      <p className="text-xs text-[#7a6465] mt-8 text-center">
        Locations marked "Demo" are illustrative. Verified and Curated records are based on public sources.
        Always check official information before visiting.
      </p>
    </div>
  );
}
