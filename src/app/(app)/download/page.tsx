import type { Metadata } from "next";
import { InstallAppSection } from "@/components/pwa/InstallAppSection";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Sparkles, Smartphone, Download, HardDrive } from "lucide-react";

export const metadata: Metadata = {
  title: "Download App | Cholo Bondhu",
  description:
    "Download and install the official Cholo Bondhu Progressive Web App to your phone or desktop with our logo. 100% offline, zero account needed.",
};

export default function DownloadPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back button and page header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6F1830] hover:underline"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>

        <span className="text-[11px] font-bold text-[#8B5000] bg-[#FFF5E6] px-3 py-1 rounded-full border border-[#D99B32]/35">
          v2026.1 Official Build
        </span>
      </div>

      <div>
        <p className="text-[#D99B32] text-sm font-semibold uppercase tracking-widest mb-1">
          অফিসিয়াল অ্যাপ ডাউনলোড · Device Installation
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-[#211A1B]">
          Download Cholo Bondhu App
        </h1>
        <p className="text-[#7a6465] mt-1 leading-relaxed">
          Install the full Durga Puja 2026 directory, turn-by-turn routes, and emergency SOS directly onto your device with our official icon.
        </p>
      </div>

      {/* Main Interactive Install Section */}
      <InstallAppSection />

      {/* Why Install Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="card p-5 bg-white border border-[rgba(111,24,48,0.12)] rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#6F1830]/10 text-[#6F1830] flex items-center justify-center font-bold text-lg">
            ⚡
          </div>
          <h3 className="font-bold text-base text-[#211A1B]">
            Zero App Store Friction
          </h3>
          <p className="text-xs text-[#554042] leading-relaxed">
            No Play Store or App Store sign-in, OTPs, or password prompts required. Tap install and it places our official logo on your home screen in seconds.
          </p>
        </div>

        <div className="card p-5 bg-white border border-[rgba(111,24,48,0.12)] rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#D99B32]/15 text-[#8B5000] flex items-center justify-center font-bold text-lg">
            📶
          </div>
          <h3 className="font-bold text-base text-[#211A1B]">
            Works In Crowd Jams
          </h3>
          <p className="text-xs text-[#554042] leading-relaxed">
            During Ashtami and Nabami evening rushes when mobile networks stall around big pandals, your installed app and saved routes continue functioning offline.
          </p>
        </div>

        <div className="card p-5 bg-white border border-[rgba(111,24,48,0.12)] rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
            🛡️
          </div>
          <h3 className="font-bold text-base text-[#211A1B]">
            Lightweight &amp; Battery Friendly
          </h3>
          <p className="text-xs text-[#554042] leading-relaxed">
            Uses under 5MB of storage space compared to bloated 200MB native apps. Zero background analytics tracking your battery.
          </p>
        </div>
      </div>
    </div>
  );
}
