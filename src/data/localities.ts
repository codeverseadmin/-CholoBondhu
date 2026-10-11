// ─────────────────────────────────────────────
// CHOLO BONDHU — Kolkata Locality & Geographic Registry
//
// Authoritative coordinate mappings, geographic zones,
// and neighbourhood aliases for accurate routing anchors.
// ─────────────────────────────────────────────

import type { Coordinates } from "@/types";

export type KolkataZone = "north" | "central" | "south" | "east" | "south_west";

export interface LocalityRecord {
  id: string;
  name: string;
  nameBengali: string;
  zone: KolkataZone;
  center: Coordinates;
  aliases: string[];
  majorLandmarks: string[];
}

export const KOLKATA_LOCALITIES: LocalityRecord[] = [
  {
    id: "shyambazar-kumartuli",
    name: "Shyambazar / Kumartuli (North)",
    nameBengali: "শ্যামবাজার / কুমোরটুলি",
    zone: "north",
    center: { latitude: 22.5992, longitude: 88.3698 },
    aliases: [
      "shyambazar",
      "kumartuli",
      "bagbazar",
      "sovabazar",
      "north kolkata",
      "hatibagan",
      "tala",
      "paikpara",
      "ahiritola",
      "beniatola",
    ],
    majorLandmarks: ["Shyambazar 5-Point Crossing", "Kumartuli Artisan Quarter", "Bagbazar Ghat", "Tala Park"],
  },
  {
    id: "maniktala-kashi-bose",
    name: "Maniktala / Kashi Bose Lane (North)",
    nameBengali: "মানিকতলা / কাশী বোস লেন",
    zone: "north",
    center: { latitude: 22.5878, longitude: 88.3745 },
    aliases: ["maniktala", "kashi bose lane", "nalin sarkar street", "telengabagan", "chaltabagan", "ultadanga"],
    majorLandmarks: ["Maniktala Crossing", "Vivekananda Road", "Kashi Bose Lane"],
  },
  {
    id: "central-park-street",
    name: "Central Kolkata (Park Street / Esplanade)",
    nameBengali: "সেন্ট্রাল কলকাতা (পার্ক স্ট্রিট / এসপ্ল্যানেড)",
    zone: "central",
    center: { latitude: 22.5604, longitude: 88.3512 },
    aliases: ["central kolkata", "park street", "esplanade", "dharmatala", "chandni chowk", "new market", "janbazar"],
    majorLandmarks: ["Park Street Crossing", "Esplanade Metro", "Indian Museum"],
  },
  {
    id: "college-street-bowbazar",
    name: "College Street / Bowbazar (Central)",
    nameBengali: "কলেজ স্ট্রিট / বউবাজার",
    zone: "central",
    center: { latitude: 22.5726, longitude: 88.3585 },
    aliases: [
      "college street",
      "bowbazar",
      "mohammed ali park",
      "santosh mitra square",
      "lebutala",
      "sealdah",
      "central avenue",
      "thanthania",
      "beleghata",
    ],
    majorLandmarks: ["College Square", "Calcutta University", "Sealdah Railway Station", "Santosh Mitra Square"],
  },
  {
    id: "south-ballygunge-ekdalia",
    name: "South Kolkata (Ballygunge / Ekdalia)",
    nameBengali: "দক্ষিণ কলকাতা (বালিগঞ্জ / একডালিয়া)",
    zone: "south",
    center: { latitude: 22.5255, longitude: 88.3615 },
    aliases: ["ballygunge", "ekdalia", "gariahat", "singhi park", "south kolkata", "golpark", "lake terrace"],
    majorLandmarks: ["Gariahat Crossing", "Ekdalia Road", "Ballygunge Railway Station"],
  },
  {
    id: "south-bhowanipore-maddox",
    name: "Bhowanipore / Maddox Square (South)",
    nameBengali: "ভবানীপুর / ম্যাডক্স স্কোয়ার",
    zone: "south",
    center: { latitude: 22.5292, longitude: 88.3586 },
    aliases: ["bhowanipore", "maddox square", "66 pally", "68 pally", "ritchie road", "harish park", "netaji bhavan"],
    majorLandmarks: ["Maddox Square Park", "Harish Mukherjee Road", "Netaji Bhavan Metro"],
  },
  {
    id: "south-deshapriya-kalighat",
    name: "Deshapriya Park / Kalighat (South)",
    nameBengali: "দেশপ্রিয় পার্ক / কালীঘাট",
    zone: "south",
    center: { latitude: 22.5199, longitude: 88.3530 },
    aliases: [
      "deshapriya park",
      "kalighat",
      "rashbehari",
      "southern avenue",
      "lake area",
      "triangular park",
      "tridhara sammilani",
      "mudiali",
      "badamtala ashar sangha",
    ],
    majorLandmarks: ["Deshapriya Park", "Kalighat Temple", "Rabindra Sarobar", "Tridhara"],
  },
  {
    id: "kasba-santoshpur-dhakuria",
    name: "Kasba / Santoshpur / Dhakuria (South-East)",
    nameBengali: "কসবা / সন্তোষপুর / ঢাকুরিয়া",
    zone: "south",
    center: { latitude: 22.5020, longitude: 88.3790 },
    aliases: [
      "kasba",
      "santoshpur",
      "babu bagan",
      "dhakuria",
      "bosepukur",
      "talbagan",
      "jodhpur park",
      "lake gardens",
      "santoshpur lake pally",
    ],
    majorLandmarks: ["Bosepukur Sitala Mandir", "Santoshpur Jadavpur Connector", "Dhakuria Bridge"],
  },
  {
    id: "new-alipore-chetla",
    name: "New Alipore / Chetla (South-West)",
    nameBengali: "নিউ আলিপুর / চেতলা",
    zone: "south",
    center: { latitude: 22.5204, longitude: 88.3311 },
    aliases: ["new alipore", "alipore", "chetla", "suruchi sangha", "taratala"],
    majorLandmarks: ["Suruchi Sangha Ground", "Alipore Zoo", "National Library"],
  },
  {
    id: "salt-lake-lake-town",
    name: "Salt Lake / Lake Town / Dum Dum Park (East)",
    nameBengali: "সল্টলেক / লেক টাউন / দমদম পার্ক",
    zone: "east",
    center: { latitude: 22.5910, longitude: 88.4050 },
    aliases: [
      "salt lake",
      "lake town",
      "sreebhumi",
      "bidhannagar",
      "fd block",
      "bj block",
      "ib block",
      "dum dum park",
      "bangur avenue",
      "dakshindari",
      "bharat chakra",
    ],
    majorLandmarks: ["Sreebhumi Clock Tower", "FD Block Park", "Karunamoyee Bus Terminal", "Dum Dum Park Ground"],
  },
  {
    id: "newtown-rajarhat",
    name: "New Town / Rajarhat (East)",
    nameBengali: "নিউ টাউন / রাজারহাট",
    zone: "east",
    center: { latitude: 22.5850, longitude: 88.4550 },
    aliases: ["new town", "rajarhat", "action area", "eco park", "new town sarbojanin"],
    majorLandmarks: ["Biswa Bangla Gate", "New Town Clock Tower", "Eco Park"],
  },
  {
    id: "naktala-behala",
    name: "Naktala / Behala (South-West)",
    nameBengali: "নাকতলা / বেহালা",
    zone: "south_west",
    center: { latitude: 22.4930, longitude: 88.3450 },
    aliases: [
      "naktala",
      "behala",
      "gitanjali",
      "tollygunge",
      "kudghat",
      "thakurpukur",
      "barisha",
      "parnasree",
      "ajeya sanghati",
      "behala club",
    ],
    majorLandmarks: ["Gitanjali Metro", "Behala Chowrasta", "Naktala Udayan Ground"],
  },
];

/**
 * Resolve any free-form locality string or coordinates into an exact geographic coordinate anchor
 */
export function resolveLocalityCoordinates(
  localityInput?: string,
  explicitLat?: number,
  explicitLng?: number
): Coordinates {
  if (
    explicitLat != null &&
    explicitLng != null &&
    !isNaN(explicitLat) &&
    !isNaN(explicitLng) &&
    explicitLat >= 22.3 && explicitLat <= 22.8 &&
    explicitLng >= 88.1 && explicitLng <= 88.6
  ) {
    return { latitude: explicitLat, longitude: explicitLng };
  }

  if (!localityInput || typeof localityInput !== "string") {
    // Default to Central Kolkata
    return { latitude: 22.5604, longitude: 88.3512 };
  }

  const query = localityInput.toLowerCase().trim();

  // 1. Direct ID or Name exact match
  const direct = KOLKATA_LOCALITIES.find(
    (loc) => loc.id === query || loc.name.toLowerCase() === query
  );
  if (direct) return direct.center;

  // 2. Alias match
  for (const loc of KOLKATA_LOCALITIES) {
    if (loc.aliases.some((alias) => query.includes(alias) || alias.includes(query))) {
      return loc.center;
    }
  }

  // 3. Zone substring match
  if (query.includes("north") || query.includes("shyam") || query.includes("kumar") || query.includes("bagbazar")) {
    return KOLKATA_LOCALITIES[0].center; // Shyambazar
  }
  if (query.includes("salt lake") || query.includes("lake town") || query.includes("east")) {
    return KOLKATA_LOCALITIES[6].center; // Salt Lake
  }
  if (query.includes("behala") || query.includes("naktala") || query.includes("tolly")) {
    return KOLKATA_LOCALITIES[7].center; // Naktala / Behala
  }
  if (query.includes("south") || query.includes("ballygunge") || query.includes("gariahat")) {
    return KOLKATA_LOCALITIES[3].center; // Ballygunge
  }

  // Fallback to Central Kolkata
  return { latitude: 22.5604, longitude: 88.3512 };
}

/**
 * Determine the general zone for a given coordinate
 */
export function getZoneFromCoordinates(lat: number, lng: number): KolkataZone {
  if (lng > 88.39) return "east";
  if (lat > 22.58) return "north";
  if (lat < 22.50) return "south_west";
  if (lat < 22.54) return "south";
  return "central";
}
