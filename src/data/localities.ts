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

// ─────────────────────────────────────────────
// KOLKATA METRO STATIONS REGISTRY
// ─────────────────────────────────────────────

export interface MetroStationRecord {
  id: string;
  name: string;
  nameBengali: string;
  line: "Blue Line (North-South)" | "Green Line (East-West)" | "Purple Line" | "Orange Line";
  lineCode: "blue" | "green" | "purple" | "orange";
  zone: KolkataZone;
  center: Coordinates;
  gateGuidance: string;
  popularNearbyPandals: string[];
  aliases: string[];
}

export const KOLKATA_METRO_STATIONS: MetroStationRecord[] = [
  // ── Blue Line (North-South Corridor) ──
  {
    id: "metro-dum-dum",
    name: "Dum Dum Metro (Blue Line)",
    nameBengali: "দমদম মেট্রো (ব্লু লাইন)",
    line: "Blue Line (North-South)",
    lineCode: "blue",
    zone: "north",
    center: { latitude: 22.6225, longitude: 88.3934 },
    gateGuidance: "Gate 1 (Jessore Road / Suburban Railway Concourse Exit)",
    popularNearbyPandals: ["Dum Dum Park Bharat Chakra", "Dum Dum Park Tarun Sangha"],
    aliases: ["dum dum metro", "dum dum", "dumdum metro", "jessore road metro"],
  },
  {
    id: "metro-shyambazar",
    name: "Shyambazar Metro (Blue Line)",
    nameBengali: "শ্যামবাজার মেট্রো (ব্লু লাইন)",
    line: "Blue Line (North-South)",
    lineCode: "blue",
    zone: "north",
    center: { latitude: 22.6006, longitude: 88.3712 },
    gateGuidance: "Gate 1 (Bhupen Bose Avenue / 5-Point Crossing Exit)",
    popularNearbyPandals: ["Bagbazar Sarbojanin", "Kumartuli Park", "Jagat Mukherjee Park", "Tala Prattoy"],
    aliases: ["shyambazar metro", "shyambazar", "five point crossing", "bhupen bose avenue"],
  },
  {
    id: "metro-sovabazar",
    name: "Sovabazar Sutanuti Metro (Blue Line)",
    nameBengali: "শোভাবাজার সুতানুটি মেট্রো (ব্লু লাইন)",
    line: "Blue Line (North-South)",
    lineCode: "blue",
    zone: "north",
    center: { latitude: 22.5956, longitude: 88.3664 },
    gateGuidance: "Gate 1 (BK Paul Avenue / Kumartuli Lane Exit)",
    popularNearbyPandals: ["Kumartuli Sarbojanin", "Ahiritola Sarbojanin", "Beniatola Sarbojanin"],
    aliases: ["sovabazar metro", "shobhabazar metro", "sovabazar sutanuti", "kumartuli metro"],
  },
  {
    id: "metro-girish-park",
    name: "Girish Park Metro (Blue Line)",
    nameBengali: "গিরিশ পার্ক মেট্রো (ব্লু লাইন)",
    line: "Blue Line (North-South)",
    lineCode: "blue",
    zone: "north",
    center: { latitude: 22.5862, longitude: 88.3614 },
    gateGuidance: "Gate 2 (Vivekananda Road / Girish Park Exit)",
    popularNearbyPandals: ["Kashi Bose Lane", "Vivekananda Sporting Club", "Maniktala Chaltabagan"],
    aliases: ["girish park metro", "girish park", "vivekananda road metro"],
  },
  {
    id: "metro-mg-road",
    name: "MG Road Metro (Blue Line)",
    nameBengali: "মহাত্মা গান্ধী রোড মেট্রো (ব্লু লাইন)",
    line: "Blue Line (North-South)",
    lineCode: "blue",
    zone: "central",
    center: { latitude: 22.5802, longitude: 88.3601 },
    gateGuidance: "Gate 1 (College Street / CR Avenue Crossing Exit)",
    popularNearbyPandals: ["College Square", "Mohammed Ali Park", "Thanthania Kalibari"],
    aliases: ["mg road metro", "mahatma gandhi road metro", "mg road", "college street metro"],
  },
  {
    id: "metro-central",
    name: "Central Metro (Blue Line)",
    nameBengali: "সেন্ট্রাল মেট্রো (ব্লু লাইন)",
    line: "Blue Line (North-South)",
    lineCode: "blue",
    zone: "central",
    center: { latitude: 22.5684, longitude: 88.3585 },
    gateGuidance: "Gate 4 (BB Ganguly Street / Bowbazar Concourse Exit)",
    popularNearbyPandals: ["Santosh Mitra Square", "Bowbazar Sarbojanin"],
    aliases: ["central metro", "bowbazar metro", "bb ganguly street"],
  },
  {
    id: "metro-chandni-chowk",
    name: "Chandni Chowk Metro (Blue Line)",
    nameBengali: "চাঁদনি চক মেট্রো (ব্লু লাইন)",
    line: "Blue Line (North-South)",
    lineCode: "blue",
    zone: "central",
    center: { latitude: 22.5641, longitude: 88.3547 },
    gateGuidance: "Gate 2 (Ganesh Chandra Avenue / E-Mall Exit)",
    popularNearbyPandals: ["Lebutala Park", "Santosh Mitra Square"],
    aliases: ["chandni chowk metro", "chandni chowk", "ganesh chandra avenue"],
  },
  {
    id: "metro-esplanade",
    name: "Esplanade Metro Interchange (Blue Line)",
    nameBengali: "এসপ্ল্যানেড মেট্রো ইন্টারচেঞ্জ (ব্লু লাইন)",
    line: "Blue Line (North-South)",
    lineCode: "blue",
    zone: "central",
    center: { latitude: 22.5638, longitude: 88.3516 },
    gateGuidance: "Gate 5 (Jawaharlal Nehru Road / New Market Exit)",
    popularNearbyPandals: ["Janbazar Sarbojanin", "Simla Bayam Samity"],
    aliases: ["esplanade metro", "esplanade", "dharmatala metro", "new market metro"],
  },
  {
    id: "metro-park-street",
    name: "Park Street Metro (Blue Line)",
    nameBengali: "পার্ক স্ট্রিট মেট্রো (ব্লু লাইন)",
    line: "Blue Line (North-South)",
    lineCode: "blue",
    zone: "central",
    center: { latitude: 22.5532, longitude: 88.3510 },
    gateGuidance: "Gate 1 (Park Street Concourse / Chowringhee Exit)",
    popularNearbyPandals: ["Park Circus Sarbojanin", "Ripon Street Pujo"],
    aliases: ["park street metro", "park street"],
  },
  {
    id: "metro-netaji-bhavan",
    name: "Netaji Bhavan Metro (Blue Line)",
    nameBengali: "নেতাজি ভবন মেট্রো (ব্লু লাইন)",
    line: "Blue Line (North-South)",
    lineCode: "blue",
    zone: "south",
    center: { latitude: 22.5367, longitude: 88.3483 },
    gateGuidance: "Gate 2 (Ashutosh Mukherjee Road / Harish Park Exit)",
    popularNearbyPandals: ["Maddox Square", "68 Pally", "Harish Park", "Bhowanipore 75 Pally"],
    aliases: ["netaji bhavan metro", "netaji bhavan", "bhowanipore metro"],
  },
  {
    id: "metro-jatin-das-park",
    name: "Jatin Das Park Metro (Blue Line)",
    nameBengali: "যতীন দাস পার্ক মেট্রো (ব্লু লাইন)",
    line: "Blue Line (North-South)",
    lineCode: "blue",
    zone: "south",
    center: { latitude: 22.5278, longitude: 88.3475 },
    gateGuidance: "Gate 1 (Hazra Crossing / SP Mukherjee Road Exit)",
    popularNearbyPandals: ["Hazra Park", "66 Pally", "Kalighat Milan Sangha"],
    aliases: ["jatin das park metro", "jatin das park", "hazra metro"],
  },
  {
    id: "metro-kalighat",
    name: "Kalighat Metro (Blue Line)",
    nameBengali: "কালীঘাট মেট্রো (ব্লু লাইন)",
    line: "Blue Line (North-South)",
    lineCode: "blue",
    zone: "south",
    center: { latitude: 22.5198, longitude: 88.3467 },
    gateGuidance: "Gate 3 (Southern Avenue / Rashbehari Avenue Crossing Exit)",
    popularNearbyPandals: [
      "Deshapriya Park",
      "Tridhara Sammilani",
      "Badamtala Ashar Sangha",
      "Mudiali Club",
      "Ballygunge Cultural",
      "Ekdalia Evergreen",
    ],
    aliases: ["kalighat metro", "kalighat", "rashbehari metro", "rashbehari crossing"],
  },
  {
    id: "metro-rabindra-sarobar",
    name: "Rabindra Sarobar Metro (Blue Line)",
    nameBengali: "রবীন্দ্র সরোবর মেট্রো (ব্লু লাইন)",
    line: "Blue Line (North-South)",
    lineCode: "blue",
    zone: "south",
    center: { latitude: 22.5085, longitude: 88.3463 },
    gateGuidance: "Gate 2 (Southern Avenue / Charu Market Exit)",
    popularNearbyPandals: ["Suruchi Sangha (via Auto/Walk)", "Mudiali Club", "Shiv Mandir"],
    aliases: ["rabindra sarobar metro", "rabindra sarobar", "tollygunge circular canal"],
  },
  {
    id: "metro-mahanayak-uttam-kumar",
    name: "Mahanayak Uttam Kumar / Tollygunge Metro (Blue Line)",
    nameBengali: "মহানায়ক উত্তম কুমার / টালিগঞ্জ মেট্রো (ব্লু লাইন)",
    line: "Blue Line (North-South)",
    lineCode: "blue",
    zone: "south_west",
    center: { latitude: 22.4977, longitude: 88.3458 },
    gateGuidance: "Gate 1 (Tollygunge Tram Depot / Deshpran Sashmal Road Exit)",
    popularNearbyPandals: ["Behala Club (via Auto)", "Naktala Udayan Sangha (via South Walk)"],
    aliases: ["tollygunge metro", "mahanayak uttam kumar", "uttam kumar metro"],
  },
  {
    id: "metro-gitanjali",
    name: "Gitanjali / Naktala Metro (Blue Line)",
    nameBengali: "গীতাঞ্জলি / নাকতলা মেট্রো (ব্লু লাইন)",
    line: "Blue Line (North-South)",
    lineCode: "blue",
    zone: "south_west",
    center: { latitude: 22.4705, longitude: 88.3444 },
    gateGuidance: "Gate 1 (NSC Bose Road / Naktala High School Exit)",
    popularNearbyPandals: ["Naktala Udayan Sangha", "Garia Nabodurga"],
    aliases: ["gitanjali metro", "naktala metro", "nsc bose road metro"],
  },

  // ── Green Line (East-West Corridor) ──
  {
    id: "metro-sealdah",
    name: "Sealdah Metro (Green Line)",
    nameBengali: "শিয়ালদহ মেট্রো (গ্রীন লাইন)",
    line: "Green Line (East-West)",
    lineCode: "green",
    zone: "central",
    center: { latitude: 22.5682, longitude: 88.3718 },
    gateGuidance: "Gate 1 (Direct Sealdah Railway Station Concourse Subway Exit)",
    popularNearbyPandals: ["Santosh Mitra Square", "College Square", "Beleghata Sandhani"],
    aliases: ["sealdah metro", "sealdah", "sealdah railway metro"],
  },
  {
    id: "metro-saltlake-stadium",
    name: "Salt Lake Stadium Metro (Green Line)",
    nameBengali: "সল্টলেক স্টেডিয়াম মেট্রো (গ্রীন লাইন)",
    line: "Green Line (East-West)",
    lineCode: "green",
    zone: "east",
    center: { latitude: 22.5701, longitude: 88.4021 },
    gateGuidance: "Gate 2 (Yuva Bharati Krirangan / EM Bypass Connector Exit)",
    popularNearbyPandals: ["Beleghata 33 Pally", "Subhas Sarobar Pujo"],
    aliases: ["salt lake stadium metro", "stadium metro", "yuva bharati metro"],
  },
  {
    id: "metro-karunamoyee",
    name: "Karunamoyee Metro (Green Line)",
    nameBengali: "করুণাময়ী মেট্রো (গ্রীন লাইন)",
    line: "Green Line (East-West)",
    lineCode: "green",
    zone: "east",
    center: { latitude: 22.5866, longitude: 88.4192 },
    gateGuidance: "Gate 1 (Karunamoyee Central Bus Station & Subhas Bhavan Exit)",
    popularNearbyPandals: ["FD Block Salt Lake", "BJ Block Salt Lake", "Salt Lake Central Park"],
    aliases: ["karunamoyee metro", "karunamoyee", "salt lake central bus stand"],
  },
  {
    id: "metro-saltlake-sector-v",
    name: "Salt Lake Sector V Metro (Green Line)",
    nameBengali: "সল্টলেক সেক্টর ৫ মেট্রো (গ্রীন লাইন)",
    line: "Green Line (East-West)",
    lineCode: "green",
    zone: "east",
    center: { latitude: 22.5804, longitude: 88.4335 },
    gateGuidance: "Gate 1 (College More / Ring Road Concourse Exit)",
    popularNearbyPandals: ["Salt Lake FD Block (via E-Rickshaw)", "New Town Sarbojanin"],
    aliases: ["sector v metro", "sector 5 metro", "salt lake sector v"],
  },
  {
    id: "metro-howrah-maidan",
    name: "Howrah Maidan Metro (Green Line)",
    nameBengali: "হাওড়া ময়দান মেট্রো (গ্রীন লাইন)",
    line: "Green Line (East-West)",
    lineCode: "green",
    zone: "central",
    center: { latitude: 22.5857, longitude: 88.3308 },
    gateGuidance: "Gate 1 (Howrah Court & Maidan Ground Exit)",
    popularNearbyPandals: ["Howrah Sporting", "Ramrajatala Pujas"],
    aliases: ["howrah maidan metro", "howrah maidan", "under river metro"],
  },
];

/**
 * Calculate accurate Haversine distance between two points in km
 */
function haversineDistanceKm(c1: Coordinates, c2: Coordinates): number {
  const R = 6371; // Earth radius in km
  const dLat = ((c2.latitude - c1.latitude) * Math.PI) / 180;
  const dLon = ((c2.longitude - c1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.latitude * Math.PI) / 180) *
      Math.cos((c2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get the closest Kolkata Metro Station from any geographic coordinate
 */
export function getNearestMetroStation(lat: number, lng: number): MetroStationRecord {
  let closest = KOLKATA_METRO_STATIONS[0];
  let minDistance = Infinity;

  const point: Coordinates = { latitude: lat, longitude: lng };
  for (const station of KOLKATA_METRO_STATIONS) {
    const dist = haversineDistanceKm(point, station.center);
    if (dist < minDistance) {
      minDistance = dist;
      closest = station;
    }
  }

  return closest;
}

/**
 * Get a Kolkata Metro Station by its unique identifier
 */
export function getMetroStationById(id: string): MetroStationRecord | undefined {
  const q = id.toLowerCase().trim();
  return KOLKATA_METRO_STATIONS.find(
    (m) => m.id === q || m.name.toLowerCase() === q || m.id.replace("metro-", "") === q
  );
}

/**
 * Resolve any free-form locality or metro station string into an exact geographic coordinate anchor
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
    // Default to Shyambazar Metro Hub
    return KOLKATA_METRO_STATIONS[1].center;
  }

  const query = localityInput.toLowerCase().trim();

  // 1. Direct Metro Station exact or alias match
  const directMetro = KOLKATA_METRO_STATIONS.find(
    (m) =>
      m.id === query ||
      m.name.toLowerCase() === query ||
      m.aliases.some((alias) => query === alias || query.includes(alias))
  );
  if (directMetro) return directMetro.center;

  // 2. Direct Locality ID or Name exact match
  const directLocality = KOLKATA_LOCALITIES.find(
    (loc) => loc.id === query || loc.name.toLowerCase() === query
  );
  if (directLocality) return directLocality.center;

  // 3. Locality alias match
  for (const loc of KOLKATA_LOCALITIES) {
    if (loc.aliases.some((alias) => query.includes(alias) || alias.includes(query))) {
      return loc.center;
    }
  }

  // 4. Substring heuristics
  if (query.includes("north") || query.includes("shyam") || query.includes("kumar") || query.includes("bagbazar")) {
    return KOLKATA_METRO_STATIONS[1].center; // Shyambazar Metro
  }
  if (query.includes("kalighat") || query.includes("rashbehari") || query.includes("deshapriya")) {
    return KOLKATA_METRO_STATIONS[11].center; // Kalighat Metro
  }
  if (query.includes("salt lake") || query.includes("karunamoyee") || query.includes("east")) {
    return KOLKATA_METRO_STATIONS[17].center; // Karunamoyee Metro
  }
  if (query.includes("behala") || query.includes("naktala") || query.includes("tolly")) {
    return KOLKATA_METRO_STATIONS[13].center; // Tollygunge / Mahanayak Metro
  }
  if (query.includes("south") || query.includes("ballygunge") || query.includes("gariahat")) {
    return KOLKATA_LOCALITIES[3].center; // Ballygunge
  }
  if (query.includes("sealdah")) {
    return KOLKATA_METRO_STATIONS[15].center; // Sealdah Metro
  }

  // Fallback to Central Kolkata / Esplanade Metro Interchange
  return { latitude: 22.5638, longitude: 88.3516 };
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

