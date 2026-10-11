"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Download,
  Smartphone,
  CheckCircle2,
  Share2,
  PlusSquare,
  Sparkles,
  Zap,
  WifiOff,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Laptop,
} from "lucide-react";
import { usePwaInstall } from "@/components/pwa/usePwaInstall";

interface InstallAppSectionProps {
  id?: string;
  className?: string;
  variant?: "full" | "card" | "compact";
}

export function InstallAppSection({
  id = "download-app",
  className = "",
  variant = "full",
}: InstallAppSectionProps) {
  const { isReady, canPrompt, isInstalled, isStandalone, isIOS, isAndroid, triggerInstall } =
    usePwaInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);

  const handleInstallClick = async () => {
    if (isStandalone || isInstalled) {
      setInstallFeedback("Cholo Bondhu is already installed on your device!");
      setTimeout(() => setInstallFeedback(null), 3500);
      return;
    }

    if (isIOS) {
      setShowIosGuide(true);
      return;
    }

    if (canPrompt) {
      const outcome = await triggerInstall();
      if (outcome === "accepted") {
        setInstallFeedback("Thank you! Cholo Bondhu is now installed on your device.");
      } else {
        setInstallFeedback("Installation was cancelled. You can install anytime.");
      }
      setTimeout(() => setInstallFeedback(null), 4000);
    } else {
      // Fallback guide if browser doesn't support beforeinstallprompt or event already resolved
      if (isIOS) {
        setShowIosGuide(true);
      } else {
        setInstallFeedback("To install: tap your browser's menu (⋮) and select 'Add to Home screen' or 'Install App'.");
        setTimeout(() => setInstallFeedback(null), 5000);
      }
    }
  };

  return (
    <section
      id={id}
      aria-label="Download and Install Cholo Bondhu App"
      className={`relative overflow-hidden rounded-3xl ${className}`}
    >
      <div className="relative z-10 bg-gradient-to-br from-[#FFFDF9] via-[#FFF5E6] to-[#FFEED6] border-2 border-[#D99B32]/40 rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg">
        {/* Subtle Decorative Alpana background circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#D99B32]/10 pointer-events-none blur-xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-[#6F1830]/10 pointer-events-none blur-xl" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left Column: App Logo & Showcase */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 sm:gap-6 max-w-xl">
            {/* High-Resolution App Icon / Logo with Gold Bezel */}
            <div className="relative flex-shrink-0 group">
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#6F1830] via-[#D99B32] to-[#E74732] rounded-3xl blur-xs opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-2 border-2 border-[#D99B32] shadow-xl flex items-center justify-center overflow-hidden">
                <Image
                  src="/brand/app-icon-512.png"
                  alt="Cholo Bondhu Official App Icon Logo"
                  width={112}
                  height={112}
                  className="rounded-xl object-contain"
                  priority
                />
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#6F1830] text-amber-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap border border-[#D99B32]/40">
                Official PWA
              </span>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6F1830]/10 border border-[#6F1830]/20 text-[#6F1830] text-xs font-bold tracking-wide">
                <Sparkles size={13} className="text-[#D99B32]" />
                <span>Download App to Device · মোবাইল অ্যাপ</span>
              </div>

              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#211A1B] leading-tight">
                Get Cholo Bondhu on Your Phone
              </h2>

              <p className="font-bengali text-sm text-[#6F1830] font-semibold">
                আপনার ডিভাইসে ইনস্টল করুন — কোনো স্টোর লগইন ছাড়া সম্পূর্ণ অফলাইন
              </p>

              <p className="text-xs sm:text-sm text-[#554042] leading-relaxed pt-1">
                Install directly to your Home Screen with our official logo. Opens full-screen with instant loading, offline turn-by-turn guidance, and zero battery drain.
              </p>
            </div>
          </div>

          {/* Right Column: Install Actions & Badges */}
          <div className="w-full lg:w-auto flex flex-col items-center sm:items-stretch gap-3.5 flex-shrink-0">
            {/* Primary Install Button */}
            {isStandalone || isInstalled ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 flex items-center gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <div className="font-bold text-sm">
                    App Installed on this Device
                  </div>
                  <div className="text-xs text-emerald-800 font-medium">
                    Tap the Cholo Bondhu icon on your home screen anytime!
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full min-h-[58px] py-4 px-6 rounded-2xl bg-gradient-to-r from-[#6F1830] via-[#8B2040] to-[#E74732] text-white font-bold text-base shadow-lg hover:shadow-xl hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer touch-target-min"
                aria-label="Download and install app to device"
              >
                <Download size={22} className="text-amber-200 animate-bounce" />
                <span>Install App to Home Screen</span>
              </button>
            )}

            {/* Direct Image Logo Download Option */}
            <div className="flex items-center gap-2">
              <a
                href="/brand/app-icon-512.png"
                download="cholo-bondhu-logo.png"
                className="flex-1 py-2.5 px-3.5 rounded-xl bg-white border border-[rgba(111,24,48,0.2)] text-[#6F1830] hover:border-[#6F1830] hover:bg-[#FFF5E6]/60 transition-colors text-xs font-bold flex items-center justify-center gap-2 shadow-2xs"
                title="Download high-resolution official logo (PNG)"
              >
                <Download size={14} />
                <span>Save Logo (512x512 PNG)</span>
              </a>

              {isIOS && (
                <button
                  type="button"
                  onClick={() => setShowIosGuide(!showIosGuide)}
                  className="py-2.5 px-3 rounded-xl bg-white border border-[rgba(111,24,48,0.2)] text-[#554042] text-xs font-semibold flex items-center gap-1 hover:border-[#6F1830]"
                >
                  <span>iOS Guide</span>
                  {showIosGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>

            {/* Status Feedback Message */}
            {installFeedback && (
              <div className="p-2.5 rounded-xl bg-amber-100/80 border border-amber-300 text-[#8B5000] text-xs text-center font-medium animate-fade-in">
                {installFeedback}
              </div>
            )}
          </div>
        </div>

        {/* Feature Badges Row */}
        <div className="mt-8 pt-6 border-t border-[rgba(111,24,48,0.12)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-white/80 border border-[rgba(111,24,48,0.08)] shadow-2xs">
            <Zap size={18} className="text-[#D99B32] mx-auto mb-1" />
            <div className="text-xs font-bold text-[#211A1B]">Lightweight &lt; 5MB</div>
            <div className="text-[10px] text-[#7a6465]">Instant launch, zero bloat</div>
          </div>

          <div className="p-3 rounded-xl bg-white/80 border border-[rgba(111,24,48,0.08)] shadow-2xs">
            <WifiOff size={18} className="text-emerald-700 mx-auto mb-1" />
            <div className="text-xs font-bold text-[#211A1B]">100% Offline</div>
            <div className="text-[10px] text-[#7a6465]">Works during crowd jam</div>
          </div>

          <div className="p-3 rounded-xl bg-white/80 border border-[rgba(111,24,48,0.08)] shadow-2xs">
            <ShieldCheck size={18} className="text-[#005EB8] mx-auto mb-1" />
            <div className="text-xs font-bold text-[#211A1B]">Zero Sign-Up</div>
            <div className="text-[10px] text-[#7a6465]">Private &amp; device local</div>
          </div>

          <div className="p-3 rounded-xl bg-white/80 border border-[rgba(111,24,48,0.08)] shadow-2xs">
            <Smartphone size={18} className="text-[#6F1830] mx-auto mb-1" />
            <div className="text-xs font-bold text-[#211A1B]">Native Full Screen</div>
            <div className="text-[10px] text-[#7a6465]">No browser address bar</div>
          </div>
        </div>

        {/* Illustrated Step-by-Step Guide for iOS / Safari */}
        {(showIosGuide || isIOS) && !isStandalone && (
          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#D99B32]/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🍏</span>
                <h3 className="font-bold text-sm sm:text-base text-[#211A1B]">
                  How to Install on iPhone / iPad (Safari):
                </h3>
              </div>
              <span className="text-[10px] text-[#8B5000] font-bold bg-[#FFF5E6] px-2 py-0.5 rounded-full border border-[#D99B32]/30">
                3 Quick Steps
              </span>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#3d3032] pt-1">
              <li className="p-3 rounded-xl bg-[#FFFDF9] border border-[rgba(111,24,48,0.1)] flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#6F1830] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="block text-[#211A1B] text-[11px] mb-0.5">
                    Tap the Share Icon
                  </strong>
                  Tap the <Share2 size={13} className="inline text-[#005EB8] mx-1" /> <strong>Share</strong> button at the bottom of Safari.
                </div>
              </li>

              <li className="p-3 rounded-xl bg-[#FFFDF9] border border-[rgba(111,24,48,0.1)] flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#6F1830] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="block text-[#211A1B] text-[11px] mb-0.5">
                    Select &apos;Add to Home Screen&apos;
                  </strong>
                  Scroll down the menu and tap <PlusSquare size={13} className="inline text-[#6F1830] mx-1" /> <strong>Add to Home Screen</strong>.
                </div>
              </li>

              <li className="p-3 rounded-xl bg-[#FFFDF9] border border-[rgba(111,24,48,0.1)] flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#6F1830] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="block text-[#211A1B] text-[11px] mb-0.5">
                    Tap &apos;Add&apos;
                  </strong>
                  Tap <strong>Add</strong> in the top right. Our Cholo Bondhu logo will appear instantly on your home screen!
                </div>
              </li>
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
