"use client";

import Link from "next/link";
import { AlertTriangle, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";

interface SosButtonProps {
  className?: string;
  compact?: boolean;
}

export function SosButton({ className, compact = false }: SosButtonProps) {
  return (
    <Link
      href="/sos"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-bold transition-all select-none",
        "bg-[#E74732] text-white shadow-sm hover:bg-[#d03b27] hover:shadow-md active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E74732] focus-visible:ring-offset-2",
        compact
          ? "px-3 py-1.5 text-xs min-h-[36px] min-w-[44px]"
          : "px-3.5 py-2 text-sm min-h-[44px]",
        className
      )}
      aria-label="Emergency SOS Assistance — Call 112 or find nearby facilities"
      title="Emergency SOS Assistance"
    >
      <AlertTriangle size={15} className="animate-pulse" aria-hidden="true" />
      <span className="tracking-wider uppercase font-extrabold text-[12px]">
        SOS
      </span>
      <span className="hidden sm:inline-block text-[11px] opacity-90 font-medium">
        (112)
      </span>
    </Link>
  );
}
