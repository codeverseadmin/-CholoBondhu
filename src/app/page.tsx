import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { MobileNavigation } from "@/components/navigation/Navigation";
import { DesktopNavigation } from "@/components/navigation/Navigation";
import { SosButton } from "@/components/navigation/SosButton";
import { PandalCard } from "@/components/places/PandalCard";
import { getFeaturedPandals } from "@/data/pandals";
import {
  ArrowRight,
  Compass,
  Route,
  Utensils,
  MapPin,
  Users,
  Clock,
} from "lucide-react";

export default function HomePage() {
  const featured = getFeaturedPandals().slice(0, 3);

  return (
    <div className="min-h-dvh flex flex-col">
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
              Discover Kolkata&apos;s Durga Puja. Build a personalized route.
              Find the best food along the way.
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
                Explore Pandals
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
            description="Browse curated pandals across Kolkata — from iconic to artistic, traditional to contemporary. Find the ones that match what you love."
          />
          <FeatureCard
            icon={<Route size={28} />}
            title="Personalized Route"
            description="Tell us your time, your starting point, and your preferences. We build a feasible, ordered itinerary — not just a list."
            highlighted
          />
          <FeatureCard
            icon={<Utensils size={28} />}
            title="Food Along the Way"
            description="From biryani to phuchka, mishti to Hakka noodles — discover the best food spots that fit naturally into your Puja plan."
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
              View All
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((pandal) => (
              <PandalCard
                key={pandal.id}
                pandal={pandal}
                variant="full"
              />
            ))}
          </div>

          <div className="text-center mt-6 sm:hidden">
            <Link href="/discover" className="btn btn-secondary">
              View All Pandals
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl text-[#211A1B]">
            Your Pujo in 4 steps
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { num: "01", icon: <MapPin size={22} />, label: "Choose your starting point" },
            { num: "02", icon: <Clock size={22} />, label: "Set your available time" },
            { num: "03", icon: <Users size={22} />, label: "Pick your preferences" },
            { num: "04", icon: <Route size={22} />, label: "Get your personalized route" },
          ].map((step) => (
            <div key={step.num} className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#6F1830]/10 text-[#6F1830] flex items-center justify-center">
                {step.icon}
              </div>
              <span className="font-display text-3xl text-[#E8D1C9] font-bold">
                {step.num}
              </span>
              <p className="text-sm text-[#3d3032] font-medium leading-snug">
                {step.label}
              </p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/plan" className="btn btn-primary px-10 py-3.5 text-base">
            Start Planning
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ─── TRUST SECTION ─────────────────────────────── */}
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
          <p className="text-white/40 text-sm">
            Itinerary suggestions are recommendations, not guarantees.
            Festival schedules and access conditions may change.
            Always follow official safety instructions.
          </p>
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-3">
            <BrandLogo onDark size="sm" />
            <p className="text-white/40 text-xs">
              Made for Kolkata&apos;s Pujo.
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
