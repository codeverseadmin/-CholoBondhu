"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bookmark,
  Trash2,
  ArrowRight,
  Calendar,
  Edit2,
  Check,
  X,
  Share2,
  Download,
  Upload,
  HardDrive,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import type { SavedPlan } from "@/types";
import {
  getSavedPlans,
  deletePlan as deleteLocalPlan,
  renamePlan as renameLocalPlan,
  savePlan,
  getShareableUrl,
} from "@/lib/saved-plans";
import { NoPlanEmptyState } from "@/components/ui/EmptyState";
import { formatDuration } from "@/lib/utils";

export default function SavedPage() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from browser localStorage
  useEffect(() => {
    setPlans(getSavedPlans());
    setLoaded(true);
  }, []);

  function handleDelete(id: string) {
    deleteLocalPlan(id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
    setStatusMessage({
      type: "success",
      text: "Route deleted from local storage.",
    });
    setTimeout(() => setStatusMessage(null), 3000);
  }

  function handleStartRename(plan: SavedPlan) {
    setEditingId(plan.id);
    setEditName(plan.name);
  }

  function handleSaveRename(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }

    renameLocalPlan(id, trimmed);
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p))
    );
    setEditingId(null);
  }

  function handleCancelRename() {
    setEditingId(null);
  }

  function handleSharePlan(plan: SavedPlan) {
    if (!plan.itinerary) return;
    const url = getShareableUrl(plan.itinerary);
    if (navigator.share) {
      navigator
        .share({
          title: `${plan.name} — Cholo Bondhu`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopyFeedback(plan.id);
        setTimeout(() => setCopyFeedback(null), 2500);
      });
    }
  }

  function handleExportAll() {
    try {
      const dataStr = JSON.stringify(plans, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cholobondhu_pujo_plans_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatusMessage({
        type: "success",
        text: "Downloaded backup file with all saved routes.",
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch {
      setStatusMessage({
        type: "error",
        text: "Could not export backup file.",
      });
    }
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const imported = JSON.parse(raw);
        if (!Array.isArray(imported)) {
          throw new Error("Invalid format: expected array of plans");
        }

        let importCount = 0;
        imported.forEach((p: any) => {
          if (p && p.itinerary && Array.isArray(p.itinerary.stops)) {
            savePlan(p.itinerary, p.name || "Imported Pujo Plan");
            importCount++;
          }
        });

        setPlans(getSavedPlans());
        setStatusMessage({
          type: "success",
          text: `Successfully imported ${importCount} route(s) to this browser!`,
        });
        setTimeout(() => setStatusMessage(null), 4000);
      } catch {
        setStatusMessage({
          type: "error",
          text: "Invalid file format. Please upload a valid Cholo Bondhu backup JSON.",
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClearAll() {
    if (
      typeof window !== "undefined" &&
      window.confirm(
        "Are you sure you want to remove all saved plans from this browser? This cannot be undone."
      )
    ) {
      plans.forEach((p) => deleteLocalPlan(p.id));
      setPlans([]);
      setStatusMessage({
        type: "success",
        text: "All routes cleared from local storage.",
      });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[#D99B32] text-sm font-semibold uppercase tracking-widest mb-1">
            স্থানীয় ব্রাউজারে সংরক্ষিত · Local Storage
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-[#211A1B]">
            Saved Itineraries
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/plan"
            className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <Plus size={14} />
            Create Route
          </Link>
        </div>
      </div>

      {/* Local Browser Storage Banner */}
      <div className="mb-6 p-4 bg-gradient-to-r from-[#FFF5E6] to-[#FFF9F0] border border-[#D99B32]/35 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-[#211A1B] shadow-sm">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#6F1830] text-[#D99B32] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <HardDrive size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#6F1830]">
                100% Private & Device Local
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 size={10} />
                Offline Ready
              </span>
            </div>
            <p className="text-[12px] text-[#554042] mt-0.5 leading-relaxed">
              No account, passwords, or phone number required. All your puja
              routes and checklists are stored securely in this browser and load
              instantly even during cellular network congestion.
            </p>
          </div>
        </div>

        {/* Quick Data Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-[#D99B32]/20">
          <button
            onClick={handleExportAll}
            disabled={plans.length === 0}
            className="px-2.5 py-1.5 rounded-lg border border-[#6F1830]/20 bg-white hover:bg-[#FFF5E6] text-[#6F1830] text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download JSON backup file"
          >
            <Download size={12} />
            Backup
          </button>

          <label
            className="px-2.5 py-1.5 rounded-lg border border-[#6F1830]/20 bg-white hover:bg-[#FFF5E6] text-[#6F1830] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="Import plans from JSON file"
          >
            <Upload size={12} />
            Import
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          {plans.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 text-[11px] font-semibold flex items-center gap-1 transition-colors"
              title="Clear all saved plans"
            >
              <Trash2 size={12} />
              Clear
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-xs transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-amber-50 border border-amber-200 text-amber-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Plan list */}
      {!loaded ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <NoPlanEmptyState />
      ) : (
        <div className="space-y-3.5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:shadow-md border border-[rgba(111,24,48,0.1)] rounded-2xl"
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6F1830] to-[#E74732] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5 sm:mt-0">
                  <Bookmark size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === plan.id ? (
                    <div className="flex items-center gap-2 mb-1.5">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(plan.id);
                          if (e.key === "Escape") handleCancelRename();
                        }}
                        className="flex-1 px-3 py-1.5 text-sm border border-[#6F1830] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6F1830]/20"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRename(plan.id)}
                        className="min-w-[36px] min-h-[36px] p-2 rounded-xl bg-[#6F1830] text-white flex items-center justify-center hover:bg-[#8B2040]"
                        aria-label="Confirm rename"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="min-w-[36px] min-h-[36px] p-2 rounded-xl border border-[rgba(111,24,48,0.2)] text-[#7a6465] flex items-center justify-center hover:bg-[#FFF5E6]"
                        aria-label="Cancel rename"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#211A1B] text-base truncate">
                        {plan.name}
                      </h3>
                      <button
                        onClick={() => handleStartRename(plan)}
                        className="text-[#7a6465] hover:text-[#6F1830] p-1 rounded-md transition-colors"
                        aria-label={`Rename ${plan.name}`}
                        title="Rename plan"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-[#7a6465]">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-[#D99B32]" />
                      <span>
                        {new Date(plan.savedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <span className="text-[#D99B32]">·</span>
                    <span className="font-medium text-[#211A1B]">
                      {plan.itinerary?.summary?.totalStops || 0} stops
                    </span>
                    <span className="text-[#D99B32]">·</span>
                    <span>
                      {formatDuration(
                        plan.itinerary?.summary?.estimatedTotalMinutes || 0
                      )}
                    </span>
                    {plan.itinerary?.preferences?.startingMetroStationName && (
                      <>
                        <span className="text-[#D99B32]">·</span>
                        <span className="text-[#6F1830] font-medium">
                          🚇 Starts: {plan.itinerary.preferences.startingMetroStationName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[rgba(111,24,48,0.06)] w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleSharePlan(plan)}
                  className="min-h-[40px] px-3 rounded-xl border border-[rgba(111,24,48,0.2)] bg-white text-[#6F1830] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#FFF5E6] transition-colors"
                  title="Share itinerary link"
                >
                  <Share2 size={13} />
                  <span>{copyFeedback === plan.id ? "Link Copied!" : "Share"}</span>
                </button>

                <Link
                  href={`/plan?restore=${plan.id}`}
                  className="btn btn-secondary text-xs py-2 px-3.5 min-h-[40px] flex items-center gap-1.5 font-semibold"
                  aria-label={`Open ${plan.name} in planner`}
                >
                  Open Route
                  <ArrowRight size={13} />
                </Link>

                <button
                  onClick={() => handleDelete(plan.id)}
                  className="min-w-[40px] min-h-[40px] rounded-xl bg-white border border-[rgba(111,24,48,0.15)] flex items-center justify-center text-[#7a6465] hover:border-red-400 hover:text-red-500 transition-colors"
                  aria-label={`Delete ${plan.name}`}
                  title="Delete plan"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helpful footer */}
      <div className="mt-10 p-4 rounded-2xl bg-white/60 border border-[rgba(111,24,48,0.08)] text-center text-xs text-[#7a6465] space-y-1">
        <p className="font-semibold text-[#211A1B]">
          💾 সব ডেটা সরাসরি আপনার ব্রাউজারে সংরক্ষিত · All Data Stored Locally
        </p>
        <p>
          You never need to log in or create an account. You can use the Backup button above to transfer your plans to another phone anytime.
        </p>
      </div>
    </div>
  );
}
