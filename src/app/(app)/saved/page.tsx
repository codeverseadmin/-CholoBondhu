"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bookmark,
  Trash2,
  ArrowRight,
  Calendar,
  Edit2,
  Check,
  X,
  Cloud,
  CloudCheck,
  RefreshCw,
  LogIn,
  AlertCircle,
} from "lucide-react";
import type { SavedPlan } from "@/types";
import { getSavedPlans, deletePlan as deleteLocalPlan, renamePlan as renameLocalPlan } from "@/lib/saved-plans";
import { NoPlanEmptyState } from "@/components/ui/EmptyState";
import { formatDuration } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function SavedPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const loadPlans = useCallback(async () => {
    setSyncError(null);
    if (user) {
      // Authenticated: load from authoritative server endpoint
      try {
        setIsSyncing(true);
        const res = await fetch("/api/plans");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.plans)) {
            // Map server records to SavedPlan shape
            const mapped: SavedPlan[] = data.plans.map((p: any) => ({
              id: p.id,
              name: p.name,
              savedAt: p.savedAt,
              version: p.version || 1,
              itinerary: p.itinerary,
            }));
            setPlans(mapped);
          }
        } else {
          setSyncError("Could not load cloud plans. Showing local backup if available.");
          setPlans(getSavedPlans());
        }
      } catch {
        setSyncError("Network error while connecting to cloud.");
        setPlans(getSavedPlans());
      } finally {
        setIsSyncing(false);
        setLoaded(true);
      }
    } else {
      // Guest: load local plans from browser storage
      setPlans(getSavedPlans());
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadPlans();
    }
  }, [user, authLoading, loadPlans]);

  async function handleDelete(id: string) {
    if (user) {
      // Authenticated: delete from server
      try {
        await fetch(`/api/plans/${id}`, { method: "DELETE" });
      } catch (err) {
        console.warn("Failed to delete plan on server:", err);
      }
    }
    // Also remove from local storage to keep state clean
    deleteLocalPlan(id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }

  function handleStartRename(plan: SavedPlan) {
    setEditingId(plan.id);
    setEditName(plan.name);
  }

  async function handleSaveRename(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }

    if (user) {
      const plan = plans.find((p) => p.id === id);
      if (plan) {
        try {
          await fetch("/api/plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id,
              name: trimmed,
              itinerary: plan.itinerary,
            }),
          });
        } catch (err) {
          console.warn("Failed to update plan name on server:", err);
        }
      }
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[#D99B32] text-sm font-semibold uppercase tracking-widest mb-1">
            Your Plans
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-[#211A1B]">
            Saved Itineraries
          </h1>
        </div>

        {user && (
          <button
            onClick={loadPlans}
            disabled={isSyncing}
            className="btn btn-secondary text-xs py-2 px-3 self-start sm:self-auto flex items-center gap-1.5"
            title="Refresh from cloud database"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
            Sync Cloud
          </button>
        )}
      </div>

      {/* Cloud Sync Status Banner */}
      {user ? (
        <div className="mb-6 p-3.5 bg-green-50/70 border border-green-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-green-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse flex-shrink-0" />
            <span className="truncate">
              Synchronized with account (+91 ••••• ••{user.phone.slice(-3)})
            </span>
          </div>
          <span className="font-semibold text-green-700 text-[11px] flex-shrink-0">
            Cross-Device Active
          </span>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-[#FFF5E6] border border-[#D99B32]/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#211A1B]">
          <div className="flex items-start sm:items-center gap-2.5">
            <Cloud size={18} className="text-[#D99B32] flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-semibold">Access your itineraries across all your devices</p>
              <p className="text-[11px] text-[#7a6465]">
                Sign in with your mobile number to safely back up and sync your plans.
              </p>
            </div>
          </div>
          <Link
            href="/login?redirect=/saved"
            className="btn btn-primary text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <LogIn size={13} />
            Sign In / Register
          </Link>
        </div>
      )}

      {syncError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
          <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

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
                      {plan.itinerary?.summary?.totalStops || 0} stops ·{" "}
                      {formatDuration(plan.itinerary?.summary?.estimatedTotalMinutes || 0)}
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
        {user
          ? "Authoritative copies are safely secured in your Cholo Bondhu account."
          : "Plans are saved locally on this browser. Create an account to sync across devices."}
      </p>
    </div>
  );
}
