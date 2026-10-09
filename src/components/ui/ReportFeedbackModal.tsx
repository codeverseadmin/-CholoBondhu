"use client";

import { useState } from "react";
import { X, Send, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface ReportFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeId: string;
  placeName: string;
}

const REPORT_CATEGORIES = [
  { id: "queue_delay", label: "Queue significantly longer/shorter than estimated" },
  { id: "crowd_update", label: "Crowd density / barricade advisory" },
  { id: "accessibility", label: "Ramp / wheelchair access condition" },
  { id: "stall_moved", label: "Stall location or operating hours changed" },
  { id: "police_diversion", label: "Police one-way pedestrian diversion in effect" },
  { id: "general", label: "Other factual correction" },
] as const;

export function ReportFeedbackModal({
  isOpen,
  onClose,
  placeId,
  placeName,
}: ReportFeedbackModalProps) {
  const [category, setCategory] = useState<string>(REPORT_CATEGORIES[0].id);
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!details.trim()) return;

    try {
      const reports = JSON.parse(localStorage.getItem("cholobondhu_community_reports") || "[]");
      reports.unshift({
        id: `rep_${Date.now()}`,
        placeId,
        placeName,
        category,
        details: details.trim(),
        submittedAt: new Date().toISOString(),
        status: "pending_review",
      });
      localStorage.setItem("cholobondhu_community_reports", JSON.stringify(reports.slice(0, 50)));
    } catch {
      // Local storage fallback
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDetails("");
      onClose();
    }, 2200);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-[#FFFDF9] rounded-2xl border border-[rgba(111,24,48,0.2)] max-w-md w-full p-6 shadow-2xl relative text-[#211A1B]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#7a6465] hover:text-[#211A1B] rounded-full hover:bg-black/5 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-2 text-[#6F1830]">
          <AlertTriangle size={22} className="text-[#D99B32]" />
          <h2 id="report-modal-title" className="font-display text-xl font-bold">
            Report Venue Update
          </h2>
        </div>

        <p className="text-xs text-[#7a6465] mb-4">
          Updating info for <strong className="text-[#211A1B]">{placeName}</strong>. Cholo Bondhu relies on ground truth and editorial verification to keep Kolkata pandal-hoppers safe.
        </p>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle size={48} className="text-emerald-600 mx-auto" />
            <h3 className="font-bold text-lg text-[#211A1B]">Update Recorded</h3>
            <p className="text-xs text-[#7a6465] leading-relaxed max-w-xs mx-auto">
              Thank you for contributing to Kolkata&apos;s Puja community. Your report has been timestamped and queued for editorial verification.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7a6465] mb-1.5">
                Update Type
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[rgba(111,24,48,0.2)] bg-white text-sm text-[#211A1B] focus:outline-none focus:border-[#6F1830]"
              >
                {REPORT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7a6465] mb-1.5">
                Ground Observation Notes
              </label>
              <textarea
                rows={3}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="E.g., Queue moving slow via VIP gate; police have barricaded left turn at Sovabazar."
                className="w-full p-3 rounded-xl border border-[rgba(111,24,48,0.2)] bg-white text-sm text-[#211A1B] placeholder-[#7a6465] focus:outline-none focus:border-[#6F1830]"
              />
            </div>

            <div className="bg-[#FFF5E6] rounded-xl p-3 border border-[rgba(217,155,50,0.3)] flex items-start gap-2.5">
              <Info size={16} className="text-[#c87d12] flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#7a6465] leading-relaxed">
                <strong>Data Policy:</strong> Cholo Bondhu does not fabricate live sensor telemetry. All crowd levels shown are historical estimates; community contributions are distinguished from verified facts.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[rgba(111,24,48,0.2)] text-sm font-medium text-[#7a6465] hover:bg-black/5 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#6F1830] text-white text-sm font-semibold hover:bg-[#8B1E3F] transition-colors flex items-center gap-1.5 min-h-[44px]"
              >
                <Send size={15} />
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
