"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  KeyRound,
  Eye,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { PasswordRequestRecord } from "@/types/auth";

export default function AdminPasswordRequestsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [requests, setRequests] = useState<PasswordRequestRecord[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review modal state
  const [selectedReq, setSelectedReq] = useState<PasswordRequestRecord | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [adminNote, setAdminNote] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewResult, setReviewResult] = useState<{
    resetToken?: string;
    message: string;
  } | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoadingReqs(true);
      setError(null);
      const res = await fetch("/api/admin/password-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to load requests.");
      }
    } catch {
      setError("Network error while loading password requests.");
    } finally {
      setLoadingReqs(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user || user.role !== "admin") {
        router.push("/account");
      } else {
        fetchRequests();
      }
    }
  }, [user, isLoading, router, fetchRequests]);

  const handleOpenReview = (req: PasswordRequestRecord, action: "approve" | "reject") => {
    setSelectedReq(req);
    setReviewAction(action);
    setAdminNote("");
    setReviewResult(null);
  };

  const handleExecuteReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setSubmittingReview(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/password-requests/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedReq.id,
          action: reviewAction,
          adminNotes: adminNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReviewResult({
          resetToken: data.resetToken,
          message:
            reviewAction === "approve"
              ? "Request approved! A single-use reset authorization and phone OTP have been generated for the user."
              : "Request rejected.",
        });
        fetchRequests();
      } else {
        setError(data.error || "Failed to submit review.");
      }
    } catch {
      setError("Network error occurred during review submission.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  const filteredRequests =
    filter === "all"
      ? requests
      : requests.filter((r) => r.status === filter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/account"
            className="text-xs text-[#7a6465] hover:text-[#6F1830] inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft size={13} />
            Back to Account
          </Link>
          <div className="flex items-center gap-2">
            <Shield size={24} className="text-[#6F1830]" />
            <h1 className="font-display text-2xl font-bold text-[#211A1B]">
              Password Change Requests
            </h1>
          </div>
          <p className="text-xs text-[#7a6465] mt-1">
            Review user-submitted password modification requests in compliance with Cholo Bondhu Zero-Trust Credentials Policy.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loadingReqs}
          className="btn btn-secondary text-xs py-2 px-3 self-start sm:self-auto flex items-center gap-1.5"
        >
          <RefreshCw size={13} className={loadingReqs ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[rgba(111,24,48,0.1)] pb-2 overflow-x-auto">
        {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              filter === tab
                ? "bg-[#6F1830] text-white"
                : "text-[#7a6465] hover:bg-[#6F1830]/5 hover:text-[#6F1830]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Requests List */}
      {loadingReqs ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 skeleton rounded-xl" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card p-8 text-center text-[#7a6465]">
          <KeyRound size={32} className="mx-auto mb-2 text-[#7a6465]/50" />
          <p className="text-sm font-semibold">No requests found</p>
          <p className="text-xs mt-1">
            There are currently no password change requests matching this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[rgba(111,24,48,0.12)]"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#211A1B]">
                    User ID: {req.userId.slice(0, 12)}...
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      req.status === "pending"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : req.status === "approved"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {req.status === "pending" && <Clock size={11} />}
                    {req.status === "approved" && <CheckCircle2 size={11} />}
                    {req.status === "rejected" && <XCircle size={11} />}
                    {req.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-[#211A1B]">
                  <strong>Reason:</strong> {req.reason || "None specified."}
                </p>

                <p className="text-[11px] text-[#7a6465]">
                  Submitted: {new Date(req.createdAt).toLocaleString("en-IN")}
                </p>

                {req.adminNotes && (
                  <p className="text-[11px] text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                    <strong>Admin Note:</strong> {req.adminNotes}
                  </p>
                )}
              </div>

              {/* Action Buttons for Pending Requests */}
              {req.status === "pending" && (
                <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <button
                    onClick={() => handleOpenReview(req, "approve")}
                    className="btn bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded-lg flex items-center gap-1 font-semibold"
                  >
                    <CheckCircle2 size={13} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleOpenReview(req, "reject")}
                    className="btn bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded-lg flex items-center gap-1 font-semibold"
                  >
                    <XCircle size={13} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[rgba(111,24,48,0.15)] space-y-4">
            <h3 className="font-bold text-base text-[#211A1B] flex items-center gap-2">
              <Shield size={18} className="text-[#6F1830]" />
              {reviewAction === "approve" ? "Approve Password Request" : "Reject Password Request"}
            </h3>

            {reviewResult ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
                  <p className="font-semibold">{reviewResult.message}</p>
                  {reviewResult.resetToken && (
                    <div className="mt-3">
                      <p className="text-[11px] text-gray-600 mb-1">
                        Secure Reset Token (share with user or will be provided automatically in session):
                      </p>
                      <input
                        type="text"
                        readOnly
                        value={reviewResult.resetToken}
                        className="w-full font-mono text-xs p-2 bg-white border border-green-300 rounded select-all"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedReq(null);
                    setReviewResult(null);
                  }}
                  className="w-full btn btn-primary text-xs py-2.5 rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleExecuteReview} className="space-y-4">
                <p className="text-xs text-[#7a6465] leading-relaxed">
                  {reviewAction === "approve"
                    ? "Approving this request authorizes the user to reset their password using secondary phone OTP verification. Administrators cannot view or set plaintext passwords."
                    : "Rejecting this request will mark it as denied and inform the user."}
                </p>

                <div>
                  <label className="block text-xs font-semibold text-[#211A1B] uppercase mb-1">
                    Administrator Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="e.g. Identity verified via telephonic check"
                    className="w-full px-3 py-2 text-xs border border-[rgba(111,24,48,0.2)] rounded-lg focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedReq(null)}
                    disabled={submittingReview}
                    className="btn btn-secondary text-xs py-2 px-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className={`btn text-xs py-2 px-4 rounded-xl text-white font-semibold ${
                      reviewAction === "approve"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {submittingReview
                      ? "Processing..."
                      : reviewAction === "approve"
                      ? "Confirm Approval"
                      : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
