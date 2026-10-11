"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HardDrive, Bookmark, CalendarDays } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function AdminPasswordRequestsPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/saved");
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[75vh] flex flex-col justify-center items-center px-4 py-12 text-center">
      <div className="w-full max-w-md bg-white border border-[rgba(111,24,48,0.12)] rounded-3xl p-6 sm:p-8">
        <div className="flex justify-center mb-4">
          <BrandLogo size="md" />
        </div>
        <h1 className="font-display text-2xl text-[#211A1B] mb-2">Local Mode Active</h1>
        <p className="text-xs text-[#554042] mb-6">
          Cholo Bondhu operates 100% locally in browser storage with zero accounts. Admin account management is disabled.
        </p>
        <Link href="/saved" className="btn btn-primary text-xs py-2.5 px-4 inline-flex items-center gap-1.5">
          <Bookmark size={14} />
          Go to Saved Plans
        </Link>
      </div>
    </div>
  );
}
