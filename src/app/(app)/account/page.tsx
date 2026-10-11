"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Shield,
  KeyRound,
  LogOut,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { PasswordRequestRecord } from "@/types/auth";

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading, logout, refreshUser } = useAuth();

  const [passwordReason, setPasswordReason] = useState("");
  const [submittingReq, setSubmittingReq] = useState(false);
  const [reqMessage, setReqMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeRequest, setActiveRequest] = useState<PasswordRequestRecord | null>(null);
  const [fetchingReq, setFetchingReq] = useState(true);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Reset workflow state when request is approved
  const [resetToken, setResetToken] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchActiveRequest = useCallback(async () => {
    try {
      setFetchingReq(true);
      const res = await fetch("/api/auth/password-request");
      if (res.ok) {
        const data = await res.json();
        setActiveRequest(data.request || null);
      }
    } catch {
      // Ignore request error
    } finally {
      setFetchingReq(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/account");
    } else if (user) {
      fetchActiveRequest();
    }
  }, [user, isLoading, router, fetchActiveRequest]);

  const handleRequestPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReq(true);
    setReqMessage(null);

    try {
      const res = await fetch("/api/auth/password-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: passwordReason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReqMessage({
          type: "success",
          text: "Password change request submitted successfully for administrator review.",
        });
        setPasswordReason("");
        fetchActiveRequest();
      } else {
        setReqMessage({
          type: "error",
          text: data.error || "Failed to submit request.",
        });
      }
    } catch {
      setReqMessage({
        type: "error",
        text: "Network error while submitting request.",
      });
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(null as any);
    setResetMessage(null);

    if (newPassword.length < 8) {
      setResetMessage({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: user?.phone,
          resetToken: resetToken.trim(),
          otpCode: resetOtp.trim(),
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetMessage({
          type: "success",
          text: "Password successfully updated! All previous sessions have been securely rotated.",
        });
        setShowResetForm(false);
        fetchActiveRequest();
        refreshUser();
      } else {
        setResetMessage({
          type: "error",
          text: data.error || "Failed to update password. Please verify your token and OTP.",
        });
      }
    } catch {
      setResetMessage({ type: "error", text: "Network error during password reset." });
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (deleteConfirmation !== "DELETE_MY_ACCOUNT") {
      setDeleteError('Please type "DELETE_MY_ACCOUNT" to confirm.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: deletePassword,
          confirmation: deleteConfirmation,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await logout();
        router.push("/");
      } else {
        setDeleteError(data.error || "Failed to delete account.");
      }
    } catch {
      setDeleteError("Network error while deleting account.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (isLoading || !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="h-48 skeleton rounded-2xl mb-6" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  const maskedPhone = `+91 ••••• ••${user.phone.slice(-3)}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <p className="text-[#D99B32] text-xs font-semibold uppercase tracking-widest mb-1">
          Account & Security
        </p>
        <h1 className="font-display text-3xl font-bold text-[#211A1B]">
          My Account
        </h1>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border border-[rgba(111,24,48,0.12)] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#6F1830]/10 text-[#6F1830] flex items-center justify-center flex-shrink-0">
              <User size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-[#211A1B]">
                  {maskedPhone}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
                  <CheckCircle2 size={12} />
                  Verified
                </span>
                {user.role === "admin" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D99B32]/10 text-[#D99B32] border border-[#D99B32]/30">
                    <ShieldCheck size={12} />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7a6465] mt-1">
                Account ID: <span className="font-mono text-[10px] text-gray-500">{user.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="btn btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Admin Portal Banner (if admin) */}
      {user.role === "admin" && (
        <div className="bg-[#FFF5E6] border border-[#D99B32]/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D99B32]/20 text-[#6F1830] flex items-center justify-center flex-shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#211A1B]">Administrator Dashboard</h2>
              <p className="text-xs text-[#7a6465]">
                Review and approve password change requests submitted by users.
              </p>
            </div>
          </div>
          <Link
            href="/admin/password-requests"
            className="btn btn-primary text-xs py-2 px-4 flex items-center justify-center gap-1.5"
          >
            Review Requests
            <ExternalLink size={13} />
          </Link>
        </div>
      )}

      {/* Password Management & Admin Approval Workflow */}
      <div className="bg-white border border-[rgba(111,24,48,0.12)] rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-start gap-3 border-b border-[rgba(111,24,48,0.08)] pb-4">
          <div className="w-10 h-10 rounded-xl bg-[#6F1830]/10 text-[#6F1830] flex items-center justify-center flex-shrink-0">
            <KeyRound size={20} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#211A1B]">
              Password Security & Modification Policy
            </h2>
            <p className="text-xs text-[#7a6465] mt-1 leading-relaxed">
              To defend your account against unauthorized account takeovers, all password changes require
              verification and approval by an administrator before an authorized reset is permitted.
            </p>
          </div>
        </div>

        {/* Existing Request Status */}
        {fetchingReq ? (
          <div className="h-16 skeleton rounded-xl" />
        ) : activeRequest ? (
          <div className="p-4 rounded-xl border border-[rgba(111,24,48,0.15)] bg-[#FFFCF7] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-[#7a6465]">
                Active Password Change Request
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  activeRequest.status === "pending"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : activeRequest.status === "approved"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {activeRequest.status === "pending" && <Clock size={12} />}
                {activeRequest.status === "approved" && <CheckCircle2 size={12} />}
                {activeRequest.status === "rejected" && <AlertTriangle size={12} />}
                {activeRequest.status.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-[#7a6465]">
              Submitted on: {new Date(activeRequest.createdAt).toLocaleString("en-IN")}
            </p>

            {activeRequest.adminNotes && (
              <p className="text-xs text-[#211A1B] bg-white p-2.5 rounded-lg border border-[rgba(111,24,48,0.1)]">
                <strong>Admin Note:</strong> {activeRequest.adminNotes}
              </p>
            )}

            {activeRequest.status === "approved" && !showResetForm && (
              <div className="pt-2">
                <button
                  onClick={() => setShowResetForm(true)}
                  className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <KeyRound size={13} />
                  Authorize & Set New Password
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Request submission form */
          <form onSubmit={handleRequestPasswordChange} className="space-y-4">
            <div>
              <label
                htmlFor="reason-input"
                className="block text-xs font-semibold text-[#211A1B] uppercase tracking-wider mb-1.5"
              >
                Reason for Password Change
              </label>
              <textarea
                id="reason-input"
                rows={2}
                placeholder="e.g. Periodic security update or lost access on a previous device"
                value={passwordReason}
                onChange={(e) => setPasswordReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[rgba(111,24,48,0.2)] rounded-xl focus:outline-none focus:border-[#6F1830] focus:ring-1 focus:ring-[#6F1830]"
              />
            </div>

            {reqMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  reqMessage.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {reqMessage.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                <span>{reqMessage.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submittingReq}
              className="btn btn-primary text-xs py-2.5 px-4 rounded-xl flex items-center gap-2"
            >
              {submittingReq ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <span>Request Administrator Approval</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Reset Password Form for Approved Requests */}
        {showResetForm && (
          <form onSubmit={handleExecuteReset} className="p-4 bg-[#FFF5E6] rounded-xl border border-[#D99B32]/30 space-y-3">
            <h3 className="text-sm font-bold text-[#6F1830] flex items-center gap-2">
              <ShieldCheck size={16} />
              Approved Password Reset Workflow
            </h3>
            <p className="text-xs text-[#7a6465]">
              Enter the reset token provided by your admin approval, the verification code sent to your phone, and your new password.
            </p>

            {resetMessage && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  resetMessage.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {resetMessage.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                <span>{resetMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#211A1B] uppercase mb-1">
                  Reset Token
                </label>
                <input
                  type="text"
                  placeholder="Paste admin reset token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[rgba(111,24,48,0.2)] rounded-lg font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#211A1B] uppercase mb-1">
                  SMS / Phone OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6-digit OTP"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2 text-xs border border-[rgba(111,24,48,0.2)] rounded-lg font-mono tracking-widest focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#211A1B] uppercase mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[rgba(111,24,48,0.2)] rounded-lg focus:outline-none"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#211A1B] uppercase mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[rgba(111,24,48,0.2)] rounded-lg focus:outline-none"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isResetting}
                className="btn btn-primary text-xs py-2 px-4 rounded-lg"
              >
                {isResetting ? "Updating..." : "Confirm Password Update"}
              </button>
              <button
                type="button"
                onClick={() => setShowResetForm(false)}
                className="btn btn-secondary text-xs py-2 px-3 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Deletion Danger Zone */}
      <div className="border border-red-200 bg-red-50/40 rounded-2xl p-6">
        <h2 className="text-base font-bold text-red-900 flex items-center gap-2">
          <Trash2 size={18} className="text-red-600" />
          Delete Account & Personal Data
        </h2>
        <p className="text-xs text-red-700 mt-1 leading-relaxed">
          Permanently delete your account, session credentials, and saved itineraries.
          This action cannot be undone. Public pandal content and discovery data will remain unaffected.
        </p>

        <div className="mt-4">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-xl bg-white border border-red-300 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
          >
            Delete My Account
          </button>
        </div>
      </div>

      {/* Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-red-200 space-y-4">
            <h3 className="font-bold text-lg text-red-900 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-600" />
              Confirm Permanent Deletion
            </h3>
            <p className="text-xs text-[#7a6465] leading-relaxed">
              To prevent accidental deletion, please re-enter your account password and type{" "}
              <strong className="font-mono text-red-800">DELETE_MY_ACCOUNT</strong> below.
            </p>

            {deleteError && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#211A1B] uppercase mb-1">
                  Your Password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#211A1B] uppercase mb-1">
                  Type Confirmation Phrase
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE_MY_ACCOUNT"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-secondary text-xs py-2 px-3"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="btn bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-4 rounded-xl font-semibold"
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
