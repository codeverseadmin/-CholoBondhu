"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DesktopNavigation } from "@/components/navigation/Navigation";

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
        <Link
          href="/plan"
          className="hidden md:inline-flex btn btn-primary text-sm py-2 px-5"
        >
          Plan My Pujo
        </Link>
      </div>
    </header>
  );
}
