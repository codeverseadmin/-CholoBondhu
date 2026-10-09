"use client";

import { useState, useEffect } from "react";
import { Bookmark, Trash2, ArrowRight, Calendar, Edit2, Check, X } from "lucide-react";
import type { SavedPlan } from "@/types";
import { getSavedPlans, deletePlan, renamePlan } from "@/lib/saved-plans";
import { NoPlanEmptyState } from "@/components/ui/EmptyState";
import { formatDuration } from "@/lib/utils";

export default function SavedPage() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    setPlans(getSavedPlans());
    setLoaded(true);
  }, []);

  function handleDelete(id: string) {
    deletePlan(id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }

  function handleStartRename(plan: SavedPlan) {
    setEditingId(plan.id);
    setEditName(plan.name);
  }

  function handleSaveRename(id: string) {
    if (editName.trim()) {
      const updated = renamePlan(id, editName.trim());
      if (updated) {
        setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
      }
    }
    setEditingId(null);
  }

  function handleCancelRename() {
    setEditingId(null);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <p className="text-[#D99B32] text-sm font-semibold uppercase tracking-widest mb-1">
          Your Plans
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-[#211A1B]">
          Saved Itineraries
        </h1>
      </div>

      {!loaded ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 skeleton rounded-xl" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <NoPlanEmptyState />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#6F1830]/10 text-[#6F1830] flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                  <Bookmark size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === plan.id ? (
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(plan.id);
                          if (e.key === "Escape") handleCancelRename();
                        }}
                        className="flex-1 px-2.5 py-1 text-sm border border-[#6F1830] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6F1830]"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRename(plan.id)}
                        className="min-w-[36px] min-h-[36px] p-1.5 rounded-lg bg-[#6F1830] text-white flex items-center justify-center hover:bg-[#8B2040]"
                        aria-label="Confirm rename"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="min-w-[36px] min-h-[36px] p-1.5 rounded-lg border border-[rgba(111,24,48,0.2)] text-[#7a6465] flex items-center justify-center hover:bg-[#FFF5E6]"
                        aria-label="Cancel rename"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#211A1B] text-base truncate">
                        {plan.name}
                      </h3>
                      <button
                        onClick={() => handleStartRename(plan)}
                        className="text-[#7a6465] hover:text-[#6F1830] p-1 rounded transition-colors"
                        aria-label={`Rename ${plan.name}`}
                        title="Rename plan"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#7a6465]">
                    <div className="flex items-center gap-1">
                      <Calendar size={11} />
                      <span>
                        {new Date(plan.savedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <span>
                      {plan.itinerary.summary.totalStops} stops ·{" "}
                      {formatDuration(plan.itinerary.summary.estimatedTotalMinutes)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-[rgba(111,24,48,0.06)] w-full sm:w-auto justify-end">
                <a
                  href={`/plan?restore=${plan.id}`}
                  className="btn btn-secondary text-xs py-2 px-3 min-h-[44px] flex items-center gap-1.5"
                  aria-label={`Open ${plan.name} in planner`}
                >
                  Open Route
                  <ArrowRight size={13} />
                </a>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="min-w-[44px] min-h-[44px] rounded-lg bg-white border border-[rgba(111,24,48,0.15)] flex items-center justify-center text-[#7a6465] hover:border-red-400 hover:text-red-500 transition-colors"
                  aria-label={`Delete ${plan.name}`}
                  title="Delete plan"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-[#7a6465] mt-8 text-center">
        Plans are saved locally on this browser. No account required.
      </p>
    </div>
  );
}
