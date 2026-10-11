import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { MobileNavigation } from "@/components/navigation/Navigation";
import { DesktopNavigation } from "@/components/navigation/Navigation";
import { SosButton } from "@/components/navigation/SosButton";
import { PandalCard } from "@/components/places/PandalCard";
import { PANDAL_DATA, getFeaturedPandals, getPandalStats } from "@/data/pandals";
import type { PandalPlace } from "@/types";
import {
  ArrowRight,
  Compass,
  Route,
  Utensils,
  MapPin,
  Users,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Heart,
  Download,
} from "lucide-react";
import { InstallAppSection } from "@/components/pwa/InstallAppSection";

export default function HomePage() {
  const stats = getPandalStats();

  // Pick 6 prominent standouts representing North, Central, South, and East Kolkata
  const standoutSlugs = [
    "bagbazar-sarbojanin",
    "kumartuli-park",
    "santosh-mitra-square",
    "ekdalia-evergreen",
    "sreebhumi-sporting",
    "suruchi-sangha",
  ];

  const featured: PandalPlace[] = standoutSlugs
    .map((slug) => PANDAL_DATA.find((p) => p.slug === slug))
    .filter((p): p is PandalPlace => Boolean(p));

  // Fallback to generic featured if any missing
  const finalFeatured = featured.length >= 4 ? featured : getFeaturedPandals().slice(0, 6);

  return (
    <div className="min-h-dvh flex flex-col page-with-bottom-nav no-horizontal-overflow">
      {/* ─── HERO ─────────────────────────────────── */}
      <section
        className="hero-gradient relative overflow-hidden"
        aria-labelledby="hero-heading"
      >
        {/* Desktop nav inside hero */}
        <header className="relative z-10 max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <BrandLogo onDark size="md" />
          <DesktopNavigation />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/download"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20 hover:bg-white/25 transition-all shadow-2xs min-h-[38px]"
              title="Download App to Home Screen"
              aria-label="Download app to your device"
            >
              <Download size={14} className="text-[#D99B32]" />
              <span className="hidden sm:inline">Install App</span>
              <span className="sm:hidden">Install</span>
            </Link>
            <SosButton compact />
            <Link href="/plan" className="hidden md:inline-flex btn btn-gold text-sm">
              Plan My Pujo
            </Link>
          </div>
        </header>

        {/* Decorative circles (alpana-inspired) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full border border-white/10"
          />
          <div
            className="absolute -top-10 -right-10 w-64 h-64 rounded-full border border-white/8"
          />
          <div
            className="absolute bottom-0 left-0 w-80 h-80 rounded-full"
            style={{ background: "rgba(217,155,50,0.08)", transform: "translate(-40%, 40%)" }}
          />
          {/* Shiuli flower dots */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-[#D99B32]"
              style={{
                opacity: 0.3,
                top: `${15 + i * 6}%`,
                left: `${5 + (i % 5) * 15}%`,
              }}
            />
          ))}
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 pb-16 pt-12 md:pt-20 md:pb-24">
          <div className="max-w-2xl">
            {/* Bengali accent */}
            <p
              className="font-bengali text-white/60 text-lg mb-4 animate-fade-in-up"
              aria-hidden="false"
              lang="bn"
            >
              চলো বন্ধু — এই পুজো, তোমার মতো করে
            </p>

            <h1
              id="hero-heading"
              className="font-display text-4xl md:text-6xl text-white font-bold leading-tight mb-4"
              style={{ animationDelay: "0.1s" }}
            >
              Every pandal
              <br />
              <span className="text-[#D99B32]">has a story.</span>
              <br />
              Let&apos;s find yours.
            </h1>

            <p className="text-white/75 text-lg md:text-xl mb-8 max-w-xl leading-relaxed">
              Discover Kolkata&apos;s Durga Puja with curated pandal themes, reliable walking routes,
              and iconic food spots — built entirely independent of paid map APIs.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/plan"
                className="btn btn-gold text-base px-8 py-3.5"
                aria-label="Start planning your Puja itinerary"
              >
                Plan My Pujo
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/discover"
                className="btn text-base px-8 py-3.5 bg-white/15 text-white border-white/25 border hover:bg-white/25"
              >
                <Compass size={18} />
                Explore {stats.total} Pandals
              </Link>
            </div>

            {/* 1-Tap Senior Presets / Elder Mode Toggle */}
            <div className="mt-8 pt-6 border-t border-white/15">
              <Link
                href="/plan?mode=elder"
                className="group relative block p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-white/15 via-white/10 to-amber-500/20 backdrop-blur-md border-2 border-amber-400/50 hover:border-amber-400 hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-amber-500/10 ring-1 ring-white/10"
                aria-label="সহজ পুজো পরিক্রমা / Senior Heritage Walk - 1-Tap Instant Route"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-400 text-[#6F1830] flex items-center justify-center font-bold shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Heart className="w-6 h-6 fill-current text-[#6F1830]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bengali text-lg sm:text-xl font-bold text-amber-300">
                          সহজ পুজো পরিক্রমা
                        </span>
                        <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                          / Senior Heritage Walk
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-200 border border-amber-300/40">
                          ১-ট্যাপে তৈরি (1-Tap)
                        </span>
                      </div>
                      <p className="text-white/85 text-xs sm:text-sm mt-0.5 leading-relaxed">
                        প্রবীণ ও পরিবারের জন্য বিশেষ সকালের শান্ত সাবেকি রুট • Low walking, 100% step-free, morning peaceful darshan (8:30 AM). Instant 1-tap route generation!
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <span className="btn btn-gold text-xs sm:text-sm py-2 px-4 shadow-sm group-hover:bg-amber-300 transition-colors font-bold whitespace-nowrap">
                      Start Senior Route <ArrowRight size={15} />
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Quick Area-First Pujo Hopping Selector */}
            <div className="mt-4 pt-3 flex flex-wrap items-center gap-2">
              <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                Choose Area:
              </span>
              <Link
                href="/plan?area=north_kolkata"
                className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all hover:scale-105"
              >
                🏛️ North Kolkata
              </Link>
              <Link
                href="/plan?area=central_kolkata"
                className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all hover:scale-105"
              >
                ⚡ Central Kolkata
              </Link>
              <Link
                href="/plan?area=college_square"
                className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all hover:scale-105"
              >
                🎨 College Square
              </Link>
              <Link
                href="/plan?area=south_kolkata"
                className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all hover:scale-105"
              >
                🌺 South Kolkata
              </Link>
              <Link
                href="/plan?area=newtown_area"
                className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all hover:scale-105"
              >
                🚇 New Town Area
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, var(--bg-primary))",
          }}
          aria-hidden="true"
        />
      </section>

      {/* ─── 2026 LAUNCH METRICS & TRUST BAR ────────── */}
      <section className="bg-[#FAF5EE] border-y border-[rgba(111,24,48,0.1)] py-5 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[rgba(111,24,48,0.08)] shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-[#6F1830]/10 text-[#6F1830] flex items-center justify-center font-bold text-base flex-shrink-0">
              {stats.total}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#211A1B] truncate">Kolkata Pandals</p>
              <p className="text-[11px] text-[#7a6465] truncate">{stats.zonesCount} City Zones Indexed</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[rgba(111,24,48,0.08)] shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-[#D99B32]/15 text-[#D99B32] flex items-center justify-center font-bold text-base flex-shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#211A1B] truncate">2026 Themes</p>
              <p className="text-[11px] text-[#7a6465] truncate">{stats.themed} Reported & Verified</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[rgba(111,24,48,0.08)] shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base flex-shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#211A1B] truncate">Map-Independent</p>
              <p className="text-[11px] text-[#7a6465] truncate">Zero API Key Requirement</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[rgba(111,24,48,0.08)] shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-[#6F1830]/10 text-[#6F1830] flex items-center justify-center font-bold text-base flex-shrink-0">
              <Utensils size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#211A1B] truncate">Iconic Food Trails</p>
              <p className="text-[11px] text-[#7a6465] truncate">Bengali Mishti & Street Food</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHAT WE DO ─────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-14" aria-labelledby="features-heading">
        <div className="text-center mb-10">
          <p className="text-[#D99B32] text-sm font-semibold uppercase tracking-widest mb-2">
            Your Puja Companion
          </p>
          <h2
            id="features-heading"
            className="font-display text-3xl md:text-4xl text-[#211A1B]"
          >
            Pandal dekho. Route pao.
            <br />
            Pujo jomao.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Compass size={28} />}
            title="Discover Pandals"
            description="Browse curated pandals across North, South, Central, and East Kolkata — with transparent verification badges for 2026 themes and photographic galleries."
          />
          <FeatureCard
            icon={<Route size={28} />}
            title="Personalized Route"
            description="Tell us your time, your starting point, and your preferences. We build an optimized, walkable itinerary — completely offline and free of API keys."
            highlighted
          />
          <FeatureCard
            icon={<Utensils size={28} />}
            title="Food Along the Way"
            description="From legendary biryani to phuchka, kathi rolls to heritage sweet shops — discover authentic Kolkata food stops synchronized with your route."
          />
        </div>
      </section>

      {/* ─── FEATURED PANDALS ─────────────────────────── */}
      <section className="bg-[#FFF5E6]">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[#D99B32] text-sm font-semibold uppercase tracking-widest mb-1">
                Curated Picks
              </p>
              <h2 className="font-display text-2xl md:text-3xl text-[#211A1B]">
                This Season&apos;s Standouts
              </h2>
            </div>
            <Link
              href="/discover"
              className="btn btn-secondary text-sm hidden sm:inline-flex"
            >
              View All {stats.total} Pandals
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {finalFeatured.map((pandal) => (
              <PandalCard
                key={pandal.id}
                pandal={pandal}
                variant="full"
              />
            ))}
          </div>

          <div className="text-center mt-6 sm:hidden">
            <Link href="/discover" className="btn btn-secondary">
              View All {stats.total} Pandals
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl text-[#211A1B]">
            Your Pujo in 3 Easy Steps
          </h2>
          <p className="text-sm text-[#554042] mt-1">
            No lengthy questionnaires. Pick your area and we calculate verified walking routes.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { num: "01", icon: <MapPin size={22} />, title: "Choose Your Puja Area", label: "Select North, Central, South, College Square, or New Town — assigned directly to its optimal Metro station." },
            { num: "02", icon: <Clock size={22} />, title: "Time & Duration", label: "Choose from 2h quick hopper to 7h grand night tour with realistic queue buffers." },
            { num: "03", icon: <Route size={22} />, title: "Vibe & Generate", label: "Select Sabeki, Iconic, Art or Peaceful themes and get your turn-by-turn walking guide." },
          ].map((step) => (
            <div key={step.num} className="card p-6 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#6F1830]/10 text-[#6F1830] flex items-center justify-center">
                {step.icon}
              </div>
              <span className="font-display text-3xl text-[#E8D1C9] font-bold">
                {step.num}
              </span>
              <h3 className="font-bold text-base text-[#211A1B]">
                {step.title}
              </h3>
              <p className="text-xs text-[#554042] leading-relaxed">
                {step.label}
              </p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/plan" className="btn btn-primary px-10 py-3.5 text-base touch-target-min">
            Start Planning
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ─── DOWNLOAD APP TO DEVICE WITH OUR LOGO ───── */}
      <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <InstallAppSection />
      </section>

      {/* ─── TRUST & DISCLAIMER SECTION ──────────────── */}
      <section className="bg-[#211A1B] py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="font-bengali text-[#D99B32] text-lg mb-4" lang="bn">
            চলো, পুজো ঘুরে আসি।
          </p>
          <p className="text-white/80 text-base leading-relaxed mb-6">
            Cholo Bondhu is built for the little moments that make Pujo special:
            finding a pandal you would otherwise miss, discovering a new food spot,
            and turning a day around Kolkata into a memory worth keeping.
          </p>
          <p className="text-white/40 text-xs sm:text-sm">
            Itinerary suggestions are algorithmic recommendations. Reported themes and queue conditions
            are based on curated field research and community updates. Access conditions may change during peak puja days.
            Always follow official Kolkata Police and local festival administration directions.
          </p>
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-3">
            <BrandLogo onDark size="sm" />
            <p className="text-white/40 text-xs">
              Made with ❤️ for Kolkata&apos;s Durga Puja.
            </p>
          </div>
        </div>
      </section>

      {/* Mobile bottom nav */}
      <MobileNavigation />
    </div>
  );
}

// ─── Feature card ────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
  highlighted = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-6 flex flex-col gap-3 ${
        highlighted
          ? "bg-[#6F1830] text-white"
          : "bg-white border border-[rgba(111,24,48,0.1)]"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          highlighted ? "bg-white/15" : "bg-[#FFF5E6] text-[#6F1830]"
        }`}
      >
        {icon}
      </div>
      <h3
        className={`font-semibold text-lg ${
          highlighted ? "text-white" : "text-[#211A1B]"
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-sm leading-relaxed ${
          highlighted ? "text-white/80" : "text-[#7a6465]"
        }`}
      >
        {description}
      </p>
    </div>
  );
}
