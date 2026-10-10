"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { DesktopNavigation } from "@/components/navigation/Navigation";
import { SosButton } from "@/components/navigation/SosButton";
import { useAuth } from "@/context/AuthContext";
import { User, ShieldCheck } from "lucide-react";

interface AppHeaderProps {
  onDark?: boolean;
  transparent?: boolean;
}

export function AppHeader({ onDark = false, transparent = false }: AppHeaderProps) {
  const { user, isLoading } = useAuth();

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
          <SosButton compact />

          {!isLoading && (
            user ? (
              <Link
                href="/account"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  onDark
                    ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                    : "bg-[#FFF5E6] text-[#6F1830] border-[#D99B32]/40 hover:border-[#6F1830]"
                }`}
                aria-label="My Account"
                title="My Account"
              >
                {user.role === "admin" ? (
                  <ShieldCheck size={14} className="text-[#D99B32]" />
                ) : (
                  <User size={14} className="text-[#6F1830]" />
                )}
                <span className="hidden sm:inline font-mono">
                  ••• {user.phone.slice(-4)}
                </span>
                <span className="sm:hidden">Account</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  onDark
                    ? "text-white border-white/30 hover:bg-white/10"
                    : "text-[#6F1830] border-[#6F1830]/30 hover:bg-[#6F1830]/5"
                }`}
              >
                Sign In
              </Link>
            )
          )}

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
