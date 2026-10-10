"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Phone, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/brand/BrandLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/saved";

  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unverifiedPhone, setUnverifiedPhone] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverifiedPhone(null);

    if (!phone.trim()) {
      setError("Please enter your 10-digit Indian mobile number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(phone, password);
      if (res.success) {
        // Safe redirect: ensure local relative path
        const destination = redirectTarget.startsWith("/") ? redirectTarget : "/saved";
        router.push(destination);
      } else {
        setError(res.error || "Invalid mobile number or password.");
        if (res.unverified) {
          setUnverifiedPhone(phone);
        }
      }
    } catch {
      setError("An unexpected error occurred. Please check your network and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[rgba(111,24,48,0.12)] rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <BrandLogo size="md" />
          <h1 className="font-display text-2xl font-bold text-[#211A1B] mt-4">
            Welcome to Cholo Bondhu
          </h1>
          <p className="text-sm text-[#7a6465] mt-1">
            Sign in with your Indian mobile number to access your saved itineraries across all your devices.
          </p>
        </div>

        {error && (
          <div
            className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700"
            role="alert"
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1">
              <p>{error}</p>
              {unverifiedPhone && (
                <div className="mt-2">
                  <Link
                    href={`/verify-phone?phone=${encodeURIComponent(unverifiedPhone)}`}
                    className="font-semibold text-red-800 underline hover:text-red-900"
                  >
                    Verify your phone number with OTP &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-phone"
              className="block text-xs font-semibold text-[#211A1B] uppercase tracking-wider mb-1.5"
            >
              Indian Mobile Number
            </label>
            <div className="relative flex rounded-xl border border-[rgba(111,24,48,0.2)] focus-within:border-[#6F1830] focus-within:ring-1 focus-within:ring-[#6F1830] overflow-hidden">
              <span className="inline-flex items-center px-3 bg-[#FFF5E6] text-xs font-semibold text-[#6F1830] border-r border-[rgba(111,24,48,0.15)] select-none">
                +91
              </span>
              <input
                id="login-phone"
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
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-[#211A1B] uppercase tracking-wider"
              >
                Password
              </label>
              <Link
                href="/account/recover"
                className="text-xs text-[#6F1830] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center rounded-xl border border-[rgba(111,24,48,0.2)] focus-within:border-[#6F1830] focus-within:ring-1 focus-within:ring-[#6F1830] overflow-hidden">
              <div className="pl-3 text-[#7a6465]">
                <Lock size={15} />
              </div>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm text-[#211A1B] placeholder-[#7a6465]/50 focus:outline-none"
                autoComplete="current-password"
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-3 text-[#7a6465] hover:text-[#6F1830] focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 btn btn-primary py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold tracking-wide disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[rgba(111,24,48,0.1)] text-center text-xs text-[#7a6465]">
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#6F1830] hover:underline"
            >
              Register with Mobile Number
            </Link>
          </p>
        </div>

        <div className="mt-4 p-3 bg-[#FFF5E6]/60 rounded-xl border border-[#D99B32]/20 flex items-center gap-2 text-[11px] text-[#7a6465]">
          <ShieldCheck size={14} className="text-[#D99B32] flex-shrink-0" />
          <span>
            Browsing pandals, creating itineraries, and SOS remain 100% free and accessible without an account.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-16 h-16 skeleton rounded-2xl" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

