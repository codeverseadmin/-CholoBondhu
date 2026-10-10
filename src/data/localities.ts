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
    aliases: ["shyambazar", "kumartuli", "bagbazar", "sovabazar", "north kolkata", "hatibagan"],
    majorLandmarks: ["Shyambazar 5-Point Crossing", "Kumartuli Artisan Quarter", "Bagbazar Ghat"],
  },
  {
    id: "central-park-street",
    name: "Central Kolkata (Park Street / Esplanade)",
    nameBengali: "সেন্ট্রাল কলকাতা (পার্ক স্ট্রিট / এসপ্ল্যানেড)",
    zone: "central",
    center: { latitude: 22.5604, longitude: 88.3512 },
    aliases: ["central kolkata", "park street", "esplanade", "dharmatala", "chandni chowk", "new market"],
    majorLandmarks: ["Park Street Crossing", "Esplanade Metro", "Indian Museum"],
  },
  {
    id: "college-street-bowbazar",
    name: "College Street / Bowbazar (Central)",
    nameBengali: "কলেজ স্ট্রিট / বউবাজার",
    zone: "central",
    center: { latitude: 22.5726, longitude: 88.3585 },
    aliases: ["college street", "bowbazar", "mohammed ali park", "santosh mitra square", "lebutala", "sealdah"],
    majorLandmarks: ["College Square", "Calcutta University", "Sealdah Railway Station"],
  },
  {
    id: "south-ballygunge-ekdalia",
    name: "South Kolkata (Ballygunge / Ekdalia)",
    nameBengali: "দক্ষিণ কলকাতা (বালিগঞ্জ / একডালিয়া)",
    zone: "south",
    center: { latitude: 22.5255, longitude: 88.3615 },
    aliases: ["ballygunge", "ekdalia", "gariahat", "singhi park", "south kolkata", "golpark"],
    majorLandmarks: ["Gariahat Crossing", "Ekdalia Road", "Ballygunge Railway Station"],
  },
  {
    id: "south-deshapriya-kalighat",
    name: "Deshapriya Park / Kalighat (South)",
    nameBengali: "দেশপ্রিয় পার্ক / কালীঘাট",
    zone: "south",
    center: { latitude: 22.5199, longitude: 88.3530 },
    aliases: ["deshapriya park", "kalighat", "rashbehari", "southern avenue", "lake area", "triangular park"],
    majorLandmarks: ["Deshapriya Park", "Kalighat Temple", "Rabindra Sarobar"],
  },
  {
    id: "new-alipore-chetla",
    name: "New Alipore / Alipore (South)",
    nameBengali: "নিউ আলিপুর / আলিপুর",
    zone: "south",
    center: { latitude: 22.5204, longitude: 88.3311 },
    aliases: ["new alipore", "alipore", "chetla", "suruchi sangha", "taratala"],
    majorLandmarks: ["Suruchi Sangha Ground", "Alipore Zoo", "National Library"],
  },
  {
    id: "salt-lake-lake-town",
    name: "Salt Lake / Lake Town (East)",
    nameBengali: "সল্টলেক / লেক টাউন",
    zone: "east",
    center: { latitude: 22.5910, longitude: 88.4050 },
    aliases: ["salt lake", "lake town", "sreebhumi", "bidhannagar", "fd block", "bj block", "ultadanga"],
    majorLandmarks: ["Sreebhumi Clock Tower", "FD Block Park", "Karunamoyee Bus Terminal"],
  },
  {
    id: "naktala-behala",
    name: "Naktala / Behala (South-West)",
    nameBengali: "নাকতলা / বেহালা",
    zone: "south_west",
    center: { latitude: 22.4930, longitude: 88.3450 },
    aliases: ["naktala", "behala", "gitanjali", "tollygunge", "kudghat", "thakurpukur"],
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
