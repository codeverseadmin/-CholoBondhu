"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, CalendarDays, Bookmark } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/plan");
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[75vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-[rgba(111,24,48,0.12)] rounded-3xl shadow-sm p-6 sm:p-8 text-center">
        <div className="flex justify-center mb-4">
          <BrandLogo size="md" />
        </div>

        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          <CheckCircle2 size={28} />
        </div>

        <h1 className="font-display text-2xl text-[#211A1B] mb-2">
          রেজিস্ট্রেশন করতে হবে না!
        </h1>
        <p className="text-sm font-semibold text-[#6F1830] mb-2">
          Zero Sign-Up Required
        </p>

        <p className="text-xs text-[#554042] leading-relaxed mb-6">
          Cholo Bondhu works <strong>completely offline &amp; locally</strong> in your browser. You can immediately create, customize, and save puja routes without creating any account.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center">
          <Link
            href="/plan"
            className="w-full sm:w-auto btn btn-primary text-xs py-2.5 px-4 flex items-center justify-center gap-1.5"
          >
            <CalendarDays size={14} />
            Start Planning
          </Link>
          <Link
            href="/saved"
            className="w-full sm:w-auto btn btn-secondary text-xs py-2.5 px-4 flex items-center justify-center gap-1.5"
          >
            <Bookmark size={14} />
            View Saved Routes
          </Link>
        </div>

        <p className="text-[11px] text-[#7a6465] mt-5">
          Redirecting to planner...
        </p>
      </div>
    </div>
  );
}
