"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DesktopNavigation } from "@/components/navigation/Navigation";
import { SosButton } from "@/components/navigation/SosButton";

interface AppHeaderProps {
  onDark?: boolean;
  transparent?: boolean;
}

export function AppHeader({ onDark = false, transparent = false }: AppHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-[300] transition-all ${
        transparent
          ? "bg-transparent"
          : onDark
          ? "bg-[#4d0f21]/95 backdrop-blur-sm"
          : "bg-[rgba(255,252,247,0.95)] backdrop-blur-sm border-b border-[rgba(111,24,48,0.1)]"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <BrandLogo size="sm" onDark={onDark} />
        <DesktopNavigation />
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/download"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#6F1830]/10 text-[#6F1830] border border-[rgba(111,24,48,0.15)] hover:bg-[#6F1830] hover:text-white transition-all shadow-2xs min-h-[38px]"
            title="Download Cholo Bondhu to Home Screen"
            aria-label="Download app to your device"
          >
            <Download size={14} className="text-[#D99B32]" />
            <span className="hidden sm:inline">Install App</span>
            <span className="sm:hidden">Install</span>
          </Link>

          <SosButton compact />

          <Link
            href="/plan"
            className="hidden md:inline-flex btn btn-primary text-sm py-2 px-5"
          >
            Plan My Pujo
          </Link>
        </div>
      </div>
    </header>
  );
}
