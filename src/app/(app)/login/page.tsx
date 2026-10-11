"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CalendarDays, Bookmark } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/saved";

  useEffect(() => {
    const timer = setTimeout(() => {
      const destination = redirectTarget.startsWith("/") ? redirectTarget : "/saved";
      router.push(destination);
    }, 2500);
    return () => clearTimeout(timer);
  }, [router, redirectTarget]);

  return (
    <div className="w-full max-w-md bg-white border border-[rgba(111,24,48,0.12)] rounded-3xl shadow-sm p-6 sm:p-8 text-center">
      <div className="flex justify-center mb-4">
        <BrandLogo size="md" />
      </div>

      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
        <CheckCircle2 size={28} />
      </div>

      <h1 className="font-display text-2xl text-[#211A1B] mb-2">
        কোনো লগইন প্রয়োজন নেই!
      </h1>
      <p className="text-sm font-semibold text-[#6F1830] mb-2">
        No Sign-In Required
      </p>

      <p className="text-xs text-[#554042] leading-relaxed mb-6">
        Cholo Bondhu is now <strong>100% account-free and private</strong>. All your pujo routes, checklists, and preferences are automatically stored right in your phone&apos;s browser so you can navigate offline without any login hassles.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center">
        <Link
          href="/saved"
          className="w-full sm:w-auto btn btn-primary text-xs py-2.5 px-4 flex items-center justify-center gap-1.5"
        >
          <Bookmark size={14} />
          View Saved Routes
        </Link>
        <Link
          href="/plan"
          className="w-full sm:w-auto btn btn-secondary text-xs py-2.5 px-4 flex items-center justify-center gap-1.5"
        >
          <CalendarDays size={14} />
          Plan My Pujo
        </Link>
      </div>

      <p className="text-[11px] text-[#7a6465] mt-5">
        Redirecting automatically to your saved plans...
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[75vh] flex flex-col justify-center items-center px-4 py-12">
      <Suspense fallback={<div className="h-48 w-full max-w-md skeleton rounded-3xl" />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
