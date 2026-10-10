import { BrandLogo } from "@/components/brand/BrandLogo";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Brand Artwork Presentation */}
      <div className="flex flex-col items-center justify-center mb-6 gap-3">
        <BrandLogo size="lg" />
        <span className="text-xs uppercase tracking-widest text-[#6F1830]/70 font-semibold">
          Official Brand Identity
        </span>
      </div>

      {/* Bengali accent */}
      <p
        className="text-center font-bengali text-[#D99B32] text-xl mb-8"
        lang="bn"
      >
        চলো, পুজো ঘুরে আসি।
      </p>

      <div className="prose prose-sm max-w-none space-y-6 text-[#3d3032]">
        <div className="card p-6 text-center">
          <p className="font-display text-2xl text-[#211A1B] leading-relaxed italic">
            "Cholo Bondhu is built for the little moments that make Pujo special:
            finding a pandal you would otherwise miss, discovering a new food spot,
            and turning a day around Kolkata into a memory worth keeping."
          </p>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-xl text-[#211A1B] mb-3">
            What is Cholo Bondhu?
          </h2>
          <p>
            Cholo Bondhu — চলো বন্ধু — means <em>Come on, friend.</em>
          </p>
          <p className="mt-2">
            It is a personal companion for discovering Kolkata&apos;s Durga Puja.
            We help you find the right pandals for your interests, plan a realistic
            route based on your time, and discover the best food along the way.
          </p>
          <p className="mt-2">
            Pujo is not just about visiting pandals. It is about the people you
            go with, the places you discover, the food you share, and the memories
            you bring home.
          </p>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-xl text-[#211A1B] mb-3">
            How it works
          </h2>
          <ol className="space-y-2 list-decimal list-inside">
            <li>Choose your starting point in Kolkata.</li>
            <li>Tell us how much time you have.</li>
            <li>Select what you enjoy — art, tradition, photography, food.</li>
            <li>Choose your preferred way to travel.</li>
            <li>We build a personalized, feasible Puja itinerary.</li>
          </ol>
        </div>

        <div className="card p-6 bg-[#FFF5E6]">
          <h2 className="font-display text-xl text-[#211A1B] mb-3">
            A note on our data
          </h2>
          <p>
            Itinerary suggestions are recommendations, not guarantees. Actual journey
            times during Durga Puja may be significantly longer due to crowds and
            festival traffic. Festival schedules and access conditions can change
            at short notice.
          </p>
          <p className="mt-2">
            We clearly label our data: <strong>Verified</strong> records are confirmed
            from authoritative sources. <strong>Curated</strong> records are based on
            reliable public information. <strong>Demo</strong> records are illustrative
            and should be verified before your visit.
          </p>
          <p className="mt-2">
            Always follow official safety instructions and traffic guidance.
          </p>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-xl text-[#211A1B] mb-3">
            About the Project
          </h2>
          <p>
            Made for Kolkata&apos;s Pujo.
          </p>
          <p className="mt-2 text-sm text-[#7a6465]">
            Cholo Bondhu is not affiliated with any Durga Puja committee, government
            agency, Kolkata Police, or transport authority.
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/plan" className="btn btn-primary">
          Plan My Pujo
        </Link>
        <Link href="/discover" className="btn btn-secondary">
          Explore Pandals
        </Link>
      </div>
    </div>
  );
}
