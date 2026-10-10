"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Phone, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify both fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register(cleanPhone, password, confirmPassword);
      if (res.success) {
        // Redirect to OTP verification screen with phone param
        router.push(`/verify-phone?phone=${encodeURIComponent(cleanPhone)}`);
      } else {
        setError(res.error || "Registration failed.");
      }
    } catch {
      setError("Network error occurred during registration. Please check your connection.");
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
            Create an Account
          </h1>
          <p className="text-sm text-[#7a6465] mt-1">
            Register with your mobile number to sync itineraries across all your devices.
          </p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reg-phone"
              className="block text-xs font-semibold text-[#211A1B] uppercase tracking-wider mb-1.5"
            >
              Indian Mobile Number
            </label>
            <div className="relative flex rounded-xl border border-[rgba(111,24,48,0.2)] focus-within:border-[#6F1830] focus-within:ring-1 focus-within:ring-[#6F1830] overflow-hidden">
              <span className="inline-flex items-center px-3 bg-[#FFF5E6] text-xs font-semibold text-[#6F1830] border-r border-[rgba(111,24,48,0.15)] select-none">
                +91
              </span>
              <input
                id="reg-phone"
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
            <p className="text-[11px] text-[#7a6465] mt-1">
              A 6-digit verification code will be sent to verify your phone ownership.
            </p>
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-xs font-semibold text-[#211A1B] uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <div className="relative flex items-center rounded-xl border border-[rgba(111,24,48,0.2)] focus-within:border-[#6F1830] focus-within:ring-1 focus-within:ring-[#6F1830] overflow-hidden">
              <div className="pl-3 text-[#7a6465]">
                <Lock size={15} />
              </div>
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm text-[#211A1B] placeholder-[#7a6465]/50 focus:outline-none"
                autoComplete="new-password"
                disabled={isSubmitting}
                required
                minLength={8}
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

          <div>
            <label
              htmlFor="reg-confirm-password"
              className="block text-xs font-semibold text-[#211A1B] uppercase tracking-wider mb-1.5"
            >
              Confirm Password
            </label>
            <div className="relative flex items-center rounded-xl border border-[rgba(111,24,48,0.2)] focus-within:border-[#6F1830] focus-within:ring-1 focus-within:ring-[#6F1830] overflow-hidden">
              <div className="pl-3 text-[#7a6465]">
                <Lock size={15} />
              </div>
              <input
                id="reg-confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm text-[#211A1B] placeholder-[#7a6465]/50 focus:outline-none"
                autoComplete="new-password"
                disabled={isSubmitting}
                required
                minLength={8}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 btn btn-primary py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold tracking-wide disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Continue to Verification</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[rgba(111,24,48,0.1)] text-center text-xs text-[#7a6465]">
          <p>
            Already registered?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#6F1830] hover:underline"
            >
              Sign In with Mobile Number
            </Link>
          </p>
        </div>

        <div className="mt-4 p-3 bg-[#FFF5E6]/60 rounded-xl border border-[#D99B32]/20 flex items-center gap-2 text-[11px] text-[#7a6465]">
          <ShieldCheck size={14} className="text-[#D99B32] flex-shrink-0" />
          <span>
            We never share your phone number or ask for unnecessary personal details.
          </span>
        </div>
      </div>
    </div>
  );
}
