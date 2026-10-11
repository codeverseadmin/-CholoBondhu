"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Bookmark } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function AccountRecoverRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/saved");
    }, 2000);
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
          পাসওয়ার্ড বা রিকভারির প্রয়োজন নেই
        </h1>
        <p className="text-sm font-semibold text-[#6F1830] mb-2">
          No Password Recovery Needed
        </p>

        <p className="text-xs text-[#554042] leading-relaxed mb-6">
          Cholo Bondhu has no accounts or passwords. All your data is safely kept directly in your browser.
        </p>

        <Link
          href="/saved"
          className="btn btn-primary text-xs py-2.5 px-5 inline-flex items-center gap-1.5"
        >
          <Bookmark size={14} />
          Go to Saved Plans
        </Link>
      </div>
    </div>
  );
}
