"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/brand/BrandLogo";

function VerifyPhoneForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get("phone") || "";
  const purposeParam = (searchParams.get("purpose") as "registration" | "password_reset") || "registration";

  const { verifyOtpCode } = useAuth();
  const [phone, setPhone] = useState(phoneParam);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (phoneParam) {
      setPhone(phoneParam);
    }
  }, [phoneParam]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!code || code.length !== 6) {
      setError("Please enter the 6-digit verification code sent to your phone.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyOtpCode(phone, code, purposeParam);
      if (res.success) {
        setSuccessMsg("Phone verified successfully! Redirecting...");
        setTimeout(() => {
          if (purposeParam === "password_reset") {
            router.push(`/account/recover?verified=true&phone=${encodeURIComponent(phone)}&code=${encodeURIComponent(code)}`);
          } else {
            router.push("/saved");
          }
        }, 1200);
      } else {
        setError(res.error || "Verification failed. Please check the code and try again.");
      }
    } catch {
      setError("Network error occurred during verification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    try {
      // Re-trigger OTP request
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, resendOnly: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCooldown(60);
        setError(null);
        setSuccessMsg(data.message || "A new verification code has been sent to your phone.");
      } else {
        setError(data.error || "Failed to resend code.");
      }
    } catch {
      setError("Network error while requesting new code.");
    } finally {
      setIsResending(false);
    }
  };

  const maskedPhone = phone.length >= 10
    ? `+91 ••••• ••${phone.slice(-3)}`
    : phone;

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[rgba(111,24,48,0.12)] rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <BrandLogo size="md" />
          <div className="w-12 h-12 rounded-full bg-[#6F1830]/10 text-[#6F1830] flex items-center justify-center mt-4">
            <ShieldCheck size={24} />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#211A1B] mt-3">
            Verify Phone Number
          </h1>
          <p className="text-sm text-[#7a6465] mt-1">
            We sent a 6-digit verification code to
          </p>
          <span className="font-mono font-semibold text-sm text-[#6F1830] mt-0.5">
            {maskedPhone}
          </span>
        </div>

        {error && (
          <div
            className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700"
            role="alert"
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {successMsg && (
          <div
            className="mb-5 p-3.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2.5 text-xs text-green-700"
            role="status"
          >
            <ShieldCheck size={16} className="text-green-600 flex-shrink-0" />
            <p className="flex-1">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label
              htmlFor="otp-code"
              className="block text-xs font-semibold text-[#211A1B] uppercase tracking-wider mb-2 text-center"
            >
              6-Digit Verification Code
            </label>
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 px-4 rounded-xl border border-[rgba(111,24,48,0.25)] focus:border-[#6F1830] focus:ring-1 focus:ring-[#6F1830] focus:outline-none"
              autoComplete="one-time-code"
              autoFocus
              disabled={isSubmitting}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className="w-full btn btn-primary py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold tracking-wide disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Verifying...</span>
            ) : (
              <>
                <span>Confirm & Activate</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-[#7a6465]">
          <span>Didn&apos;t receive code?</span>
          {cooldown > 0 ? (
            <span className="font-mono text-[#D99B32]">
              Resend in {cooldown}s
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-[#6F1830] font-semibold hover:underline flex items-center gap-1"
            >
              <RefreshCw size={12} className={isResending ? "animate-spin" : ""} />
              Resend Code
            </button>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-[rgba(111,24,48,0.1)] text-center text-xs text-[#7a6465]">
          <Link
            href="/login"
            className="text-[#6F1830] hover:underline"
          >
            &larr; Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-16 h-16 skeleton rounded-2xl" />
        </div>
      }
    >
      <VerifyPhoneForm />
    </Suspense>
  );
}

