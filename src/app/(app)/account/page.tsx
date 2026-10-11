"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  HardDrive,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  Bookmark,
  CalendarDays,
  Shield,
  Sparkles,
  MapPin,
  RefreshCw,
  Info,
} from "lucide-react";
import { getSavedPlans, deletePlan, savePlan } from "@/lib/saved-plans";
import type { SavedPlan } from "@/types";

export default function AccountLocalPage() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [elderModeDefault, setElderModeDefault] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPlans(getSavedPlans());
    if (typeof window !== "undefined") {
      const elder = localStorage.getItem("cholobondhu_elder_mode_pref");
      setElderModeDefault(elder === "true");
    }
  }, []);

  const toggleElderMode = () => {
    const nextVal = !elderModeDefault;
    setElderModeDefault(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("cholobondhu_elder_mode_pref", String(nextVal));
    }
    setStatusMsg({
      type: "success",
      text: nextVal ? "Elder Mode preset activated as default." : "Elder Mode preset deactivated.",
    });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleExport = () => {
    try {
      const exportData = {
        app: "Cholo Bondhu",
        version: "2026.1",
        exportedAt: new Date().toISOString(),
        plans: getSavedPlans(),
        elderMode: elderModeDefault,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cholobondhu_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatusMsg({ type: "success", text: "All local data exported successfully." });
      setTimeout(() => setStatusMsg(null), 3500);
    } catch {
      setStatusMsg({ type: "error", text: "Failed to export data." });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const parsed = JSON.parse(raw);
        const importedPlans = Array.isArray(parsed) ? parsed : parsed.plans;

        if (Array.isArray(importedPlans)) {
          importedPlans.forEach((p: any) => {
            if (p && p.itinerary && Array.isArray(p.itinerary.stops)) {
              savePlan(p.itinerary, p.name);
            }
          });
          setPlans(getSavedPlans());
          setStatusMsg({ type: "success", text: `Imported ${importedPlans.length} route(s) to this browser.` });
          setTimeout(() => setStatusMsg(null), 3500);
        } else {
          throw new Error("Invalid structure");
        }
      } catch {
        setStatusMsg({ type: "error", text: "Invalid JSON backup file." });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearAll = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Clear all locally saved itineraries from this browser? This action cannot be reversed.")
    ) {
      plans.forEach((p) => deletePlan(p.id));
      setPlans([]);
      setStatusMsg({ type: "success", text: "Local storage cleared." });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[#D99B32] text-sm font-semibold uppercase tracking-widest mb-1">
          ডিভাইস স্টোরেজ · Privacy First
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-[#211A1B]">
          Local Browser Data &amp; Settings
        </h1>
        <p className="text-xs text-[#7a6465] mt-1.5 leading-relaxed">
          Cholo Bondhu requires zero sign-in. All your routes, checklists, and preferences are held directly on this device.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-xs transition-all ${
            statusMsg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-amber-50 border border-amber-200 text-amber-800"
          }`}
        >
          <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Storage Status Overview */}
      <div className="card p-5 mb-5 rounded-2xl border border-[rgba(111,24,48,0.1)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6F1830] text-[#D99B32] flex items-center justify-center">
              <HardDrive size={20} />
            </div>
            <div>
              <h2 className="font-bold text-[#211A1B] text-sm">Device Browser Storage</h2>
              <p className="text-xs text-[#7a6465]">Active on this phone / computer</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            100% Offline Ready
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[rgba(111,24,48,0.06)]">
          <div className="p-3 rounded-xl bg-[#FFF5E6]/60 border border-[#D99B32]/20">
            <p className="text-[11px] text-[#7a6465]">Saved Pujo Routes</p>
            <p className="font-bold text-lg text-[#6F1830]">{plans.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#FFF5E6]/60 border border-[#D99B32]/20">
            <p className="text-[11px] text-[#7a6465]">Sign-In Requirement</p>
            <p className="font-bold text-lg text-emerald-700">None (Free)</p>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="card p-5 mb-5 rounded-2xl border border-[rgba(111,24,48,0.1)] space-y-4">
        <h2 className="font-bold text-[#211A1B] text-sm flex items-center gap-2">
          <Sparkles size={16} className="text-[#D99B32]" />
          Local Preferences
        </h2>

        <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[rgba(111,24,48,0.08)]">
          <div>
            <p className="font-semibold text-xs text-[#211A1B]">Elder Mode / সহজ পুজো পরিক্রমা</p>
            <p className="text-[11px] text-[#7a6465]">Prioritizes step-free, low-walking heritage routes by default</p>
          </div>
          <button
            onClick={toggleElderMode}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              elderModeDefault ? "bg-[#6F1830]" : "bg-gray-300"
            }`}
            aria-label="Toggle Elder Mode Default"
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform transform ${
                elderModeDefault ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Backup and Restore */}
      <div className="card p-5 mb-5 rounded-2xl border border-[rgba(111,24,48,0.1)] space-y-3">
        <h2 className="font-bold text-[#211A1B] text-sm flex items-center gap-2">
          <Download size={16} className="text-[#6F1830]" />
          Data Backup &amp; Transfer
        </h2>
        <p className="text-xs text-[#7a6465] leading-relaxed">
          Transfer your saved routes to another device or create a safety backup without needing any cloud account.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            onClick={handleExport}
            className="btn btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <Download size={13} />
            Export Backup (.json)
          </button>

          <label className="btn btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer">
            <Upload size={13} />
            Import Backup
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          {plans.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs py-2 px-3 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors flex items-center gap-1"
            >
              <Trash2 size={13} />
              Clear Local Data
            </button>
          )}
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/saved"
          className="btn btn-primary text-xs py-2.5 px-4 flex items-center gap-1.5"
        >
          <Bookmark size={14} />
          View Saved Itineraries
        </Link>
        <Link
          href="/plan"
          className="btn btn-secondary text-xs py-2.5 px-4 flex items-center gap-1.5"
        >
          <CalendarDays size={14} />
          Plan New Route
        </Link>
      </div>
    </div>
  );
}
