// ─────────────────────────────────────────────
// CHOLO BONDHU — Itinerary Presets
//
// Curated, data-backed trails matching actual Kolkata
// Durga Puja patterns and curated records.
// ─────────────────────────────────────────────

import type { ItineraryPreset } from "@/types";

export const ITINERARY_PRESETS: ItineraryPreset[] = [
  {
    id: "quick-pujo",
    name: "Quick Pujo",
    nameBengali: "ঝটপট ঠাকুর দেখা",
    tagline: "2-hour focused sprint through iconic central pandals",
    description:
      "Ideal for quick outings, post-work hopping, or visitors with limited time. Prioritizes central transit access and iconic installations.",
    iconName: "Zap",
    preferences: {
      startingLocality: "Central Kolkata",
      availableMinutes: 120,
      transportMode: "metro_walking",
      experienceTags: ["iconic"],
      pacing: "standard",
      targetStopCount: 3,
      walkingTolerance: "moderate",
      includeFood: false,
    },
  },
  {
    id: "north-heritage-trail",
    name: "North Kolkata Heritage Trail",
    nameBengali: "উত্তর কলকাতার বনেদি পুজো পরিক্রমা",
    tagline: "Bagbazar, Kumartuli & Sovabazar traditional craftsmanship",
    description:
      "A deep dive into Kolkata's century-old aristocratic and community Pujas. Experience traditional *ekchala* idols, classical clay modeling, and historic riverbank lanes.",
    iconName: "Landmark",
    preferences: {
      startingLocality: "North Kolkata",
      availableMinutes: 240,
      transportMode: "walking",
      experienceTags: ["traditional", "heritage"],
      pacing: "standard",
      targetStopCount: 4,
      walkingTolerance: "moderate",
      includeFood: true,
      foodCategories: ["bengali_cuisine", "sweets", "street_food"],
    },
  },
  {
    id: "south-artistic-trail",
    name: "South Kolkata Artistic Trail",
    nameBengali: "দক্ষিণ কলকাতার থিম ও শিল্পকলা",
    tagline: "Suruchi Sangha, Ekdalia Evergreen & innovative themes",
    description:
      "Celebrate modern Bengal's creative genius. Features award-winning architectural pandals, intricate lighting spectacles, and contemporary social themes.",
    iconName: "Palette",
    preferences: {
      startingLocality: "South Kolkata",
      availableMinutes: 300,
      transportMode: "metro_walking",
      experienceTags: ["artistic", "contemporary", "iconic"],
      pacing: "standard",
      targetStopCount: 5,
      walkingTolerance: "moderate",
      includeFood: true,
      foodCategories: ["biryani", "rolls_kathi", "street_food"],
    },
  },
  {
    id: "family-friendly-pujo",
    name: "Family-Friendly Pujo",
    nameBengali: "পরিবার ও বয়োজ্যেষ্ঠদের সাথে পুজো",
    tagline: "Relaxed pacing, accessible routes & senior-friendly buffers",
    description:
      "Designed for families with children or seniors. Adds 15-minute buffers per stop, prioritizes wheelchair accessibility, and selects wider thoroughfares.",
    iconName: "Users",
    preferences: {
      startingLocality: "South Kolkata",
      availableMinutes: 210,
      transportMode: "taxi",
      experienceTags: ["family_friendly", "accessible"],
      pacing: "relaxed",
      targetStopCount: 3,
      walkingTolerance: "low",
      requiresAccessibility: true,
      includeFood: true,
      foodCategories: ["restaurant", "bengali_cuisine", "sweets"],
    },
  },
  {
    id: "senior-heritage-walk",
    name: "সহজ পুজো পরিক্রমা / Senior Heritage Walk",
    nameBengali: "সহজ পুজো পরিক্রমা (প্রবীণ বান্ধব সাবেকি রুট)",
    tagline: "Low-walking, step-free morning Sabeki route with wheelchair accessibility",
    description:
      "A serene morning route designed for seniors and families. Peaceful morning darshan (08:30 AM), step-free access, zero stampede risk, minimal walking, and traditional North Kolkata Sabeki idols.",
    iconName: "Heart",
    preferences: {
      startingLocality: "North Kolkata",
      startTime: "08:30",
      availableMinutes: 180,
      transportMode: "walking",
      experienceTags: ["traditional", "heritage", "accessible"],
      pacing: "relaxed",
      targetStopCount: 3,
      walkingTolerance: "low",
      requiresAccessibility: true,
      includeFood: true,
      foodCategories: ["sweets", "bengali_cuisine"],
    },
  },
  {
    id: "food-and-pandal-adventure",
    name: "Food & Pandal Adventure",
    nameBengali: "পুজো পরিক্রমা ও কলকাতার ভোজ",
    tagline: "From Arsalan biryani to Mitra Cafe & iconic pandals",
    description:
      "For the quintessential Kolkata foodie. Couples legendary pandals with historic culinary landmarks like Paramount Sherbets, Arsalan, and Mitra Cafe.",
    iconName: "Utensils",
    preferences: {
      startingLocality: "Central Kolkata",
      availableMinutes: 360,
      transportMode: "metro_walking",
      experienceTags: ["iconic", "street_food", "bengali_food"],
      pacing: "standard",
      targetStopCount: 4,
      walkingTolerance: "moderate",
      includeFood: true,
      foodCategories: ["biryani", "rolls_kathi", "sweets", "bengali_cuisine"],
      maxBudget: "moderate",
    },
  },
  {
    id: "photography-trail",
    name: "Photography & Illuminations",
    nameBengali: "ফটোগ্রাফি ও আলোকসজ্জার ট্রেইল",
    tagline: "Evening light reflections, architectural grand scale & symmetry",
    description:
      "Timed for dusk and nightfall when the grand illumination arches of Chandannagar ignite. Perfect for capturing dramatic perspectives and intricate idol crafting.",
    iconName: "Camera",
    preferences: {
      startingLocality: "Central Kolkata",
      startTime: "18:30",
      availableMinutes: 240,
      transportMode: "metro_walking",
      experienceTags: ["photography", "artistic", "iconic"],
      pacing: "standard",
      targetStopCount: 4,
      walkingTolerance: "moderate",
      includeFood: false,
    },
  },
  {
    id: "relaxed-pujo-walk",
    name: "Relaxed Pujo Walk",
    nameBengali: "শান্ত পদব্রজে পুজো ভ্রমণ",
    tagline: "Leisurely pedestrian wander avoiding crushing peak crowds",
    description:
      "Focuses on close-proximity pandals with tranquil daytime or late-afternoon ambiance. Minimizes traffic delays and maximizes meditative appreciation.",
    iconName: "Footprints",
    preferences: {
      startingLocality: "North Kolkata",
      availableMinutes: 180,
      transportMode: "walking",
      experienceTags: ["less_crowded", "traditional", "spiritual"],
      pacing: "relaxed",
      targetStopCount: 3,
      walkingTolerance: "moderate",
      includeFood: false,
    },
  },
  {
    id: "saltlake-spectacle",
    name: "Salt Lake & Lake Town Spectacle",
    nameBengali: "সল্টলেক ও লেক টাউনের বর্ণাঢ্য পুজো",
    tagline: "Sreebhumi, FD Block & grand illuminations",
    description:
      "Witness colossal pandal architecture, themed royal citadels, and radiant Chandannagar lighting spectacles along North-East Kolkata and Salt Lake corridors.",
    iconName: "Landmark",
    preferences: {
      startingLocality: "Salt Lake / Lake Town / Dum Dum Park (East)",
      availableMinutes: 240,
      transportMode: "metro_walking",
      experienceTags: ["iconic", "artistic", "photography"],
      pacing: "standard",
      targetStopCount: 4,
      walkingTolerance: "moderate",
      includeFood: false,
    },
  },
  {
    id: "south-traditional-adda",
    name: "Classic South Kolkata Adda & Heritage",
    nameBengali: "দক্ষিণ কলকাতার বনেদি ও সাবেকি আড্ডা",
    tagline: "Maddox Square, Mudiali & parkland cultural adda",
    description:
      "Immerse yourself in South Kolkata's festive adda culture across Bhowanipore, Ballygunge, and Kalighat. Features open-air park lawns, heritage idols, and musical ambiance.",
    iconName: "Users",
    preferences: {
      startingLocality: "Bhowanipore / Maddox Square (South)",
      availableMinutes: 210,
      transportMode: "walking",
      experienceTags: ["traditional", "group_outing", "heritage"],
      pacing: "relaxed",
      targetStopCount: 3,
      walkingTolerance: "moderate",
      includeFood: true,
      foodCategories: ["street_food", "rolls_kathi", "sweets"],
    },
  },
];

