"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Phone, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function AccountRecoveryPage() {
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/password-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          reason: reason || "Forgotten password recovery request",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(
          "Your account recovery request has been submitted. In accordance with security policy, an administrator will review this request, after which you will be authorized to reset your password with SMS verification."
        );
      } else {
        // Generic response to avoid phone enumeration, unless known specific condition
        setError(data.error || "Unable to submit recovery request. Please try again.");
      }
    } catch {
      setError("Network error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[rgba(111,24,48,0.12)] rounded-2xl shadow-sm p-6 sm:p-8">
        <Link
          href="/login"
          className="text-xs text-[#7a6465] hover:text-[#6F1830] inline-flex items-center gap-1 mb-4"
        >
          <ArrowLeft size={13} />
          Back to Sign In
        </Link>

        <div className="flex flex-col items-center text-center mb-6">
          <BrandLogo size="md" />
          <h1 className="font-display text-2xl font-bold text-[#211A1B] mt-4">
            Account Recovery
          </h1>
          <p className="text-xs text-[#7a6465] mt-1 leading-relaxed">
            Forgotten your password? Submit an authorized password recovery request for administrator verification.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-xs text-green-800">
              <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">{success}</p>
            </div>
            <Link
              href="/login"
              className="w-full btn btn-primary text-xs py-2.5 rounded-xl flex items-center justify-center"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="recover-phone"
                className="block text-xs font-semibold text-[#211A1B] uppercase tracking-wider mb-1.5"
              >
                Registered Mobile Number
              </label>
              <div className="relative flex rounded-xl border border-[rgba(111,24,48,0.2)] focus-within:border-[#6F1830] focus-within:ring-1 focus-within:ring-[#6F1830] overflow-hidden">
                <span className="inline-flex items-center px-3 bg-[#FFF5E6] text-xs font-semibold text-[#6F1830] border-r border-[rgba(111,24,48,0.15)] select-none">
                  +91
                </span>
                <input
                  id="recover-phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2.5 text-sm text-[#211A1B] placeholder-[#7a6465]/50 focus:outline-none"
                  autoComplete="tel-national"
                  disabled={isSubmitting}
                  required
                />
                <div className="flex items-center pr-3 text-[#7a6465]">
                  <Phone size={15} />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="recover-reason"
                className="block text-xs font-semibold text-[#211A1B] uppercase tracking-wider mb-1.5"
              >
                Reason / Note for Administrator (Optional)
              </label>
              <textarea
                id="recover-reason"
                rows={2}
                placeholder="e.g. Switched to new phone and forgot password"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[rgba(111,24,48,0.2)] rounded-xl focus:outline-none focus:border-[#6F1830]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn btn-primary py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold tracking-wide disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting request...</span>
              ) : (
                <>
                  <span>Submit Recovery Request</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-[rgba(111,24,48,0.1)] text-center text-xs text-[#7a6465]">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#7a6465]">
            <ShieldCheck size={14} className="text-[#D99B32]" />
            <span>Administrator approval protects against unauthorized account takeovers.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
