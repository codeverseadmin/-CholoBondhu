import type { FoodHotspot } from "@/types";

// ─────────────────────────────────────────────
// CURATED FOOD HOTSPOT DATASET
//
// Verified food institutions along major Puja routes.
// Includes Bengali names, operating windows, and price/dietary tags.
// ─────────────────────────────────────────────

export const FOOD_HOTSPOT_DATA: FoodHotspot[] = [
  {
    id: "arsalan-park-street",
    name: "Arsalan",
    nameBengali: "আরসালান",
    locality: "Park Street",
    address: "191, Marina Arcade, Park Street area, Kolkata 700017",
    latitude: 22.5535,
    longitude: 88.3512,
    foodCategory: ["biryani", "restaurant"],
    description:
      "Kolkata's most celebrated biryani institution. The fragrant mutton biryani with soft potato and egg, accompanied by chicken rezala, is a quintessential Puja feast. Expect long lines during festival evenings.",
    seasonal: false,
    temporary: false,
    verificationStatus: "curated",
    verifiedAt: "2026-02-15",
    verificationSource: "Public trade registry & restaurant association",
    confidence: "curated",
    locationConfidence: "exact",
    openingHoursConfidence: "standard_operating_window",
    dataSource: "editorial_curation",
    notes: "Festive rush is highest between 1:30 PM–4:00 PM and 8:30 PM–11:30 PM.",
    priceRange: "moderate",
    dietaryNotes: ["non_vegetarian", "halal"],
    popularItems: ["Mutton Biryani", "Chicken Rezala", "Mutton Chaap", "Firni"],
  },
  {
    id: "aaheli-peerless",
    name: "Aaheli",
    nameBengali: "আহেলি",
    locality: "Park Street",
    address: "The Peerless Inn, 12 Jawaharlal Nehru Road, Kolkata 700013",
    latitude: 22.5522,
    longitude: 88.3508,
    foodCategory: ["bengali_cuisine", "restaurant"],
    description:
      "Kolkata's pioneer of fine traditional Bengali dining. Aaheli's thali is a curated culinary journey through authentic Bengali heritage recipes — from shukto to daab chingri and mishti doi.",
    seasonal: false,
    temporary: false,
    verificationStatus: "curated",
    verifiedAt: "2026-02-15",
    verificationSource: "Hospitality listings and restaurant inspection",
    confidence: "curated",
    locationConfidence: "exact",
    openingHoursConfidence: "standard_operating_window",
    dataSource: "editorial_curation",
    notes: "Prior reservation strongly recommended during festive days.",
    priceRange: "premium",
    dietaryNotes: ["non_vegetarian", "vegetarian"],
    popularItems: ["Mahabhoj Thali", "Daab Chingri", "Ilish Paturi", "Mishti Doi"],
  },
  {
    id: "maharaja-roll",
    name: "Maharaja Kathi Rolls",
    nameBengali: "মহারাজা কাঠি রোল",
    locality: "New Market",
    address: "Lindsay Street area, New Market, Kolkata 700087",
    latitude: 22.5604,
    longitude: 88.3512,
    foodCategory: ["rolls_kathi", "street_food"],
    description:
      "Crisp, flaky parathas wrapped fresh around spiced egg, chicken tikka, or mutton kebab with slivered onions and green chillies. Mandatory quick fuel for pandal-hopping.",
    seasonal: false,
    temporary: false,
    verificationStatus: "curated",
    verifiedAt: "2026-02-15",
    verificationSource: "Kolkata street food guild and verified public reviews",
    confidence: "curated",
    locationConfidence: "high",
    openingHoursConfidence: "standard_operating_window",
    dataSource: "editorial_curation",
    notes: "Fast moving counter; wait times usually under 10 minutes even when crowded.",
    priceRange: "budget",
    dietaryNotes: ["non_vegetarian"],
    popularItems: ["Double Egg Chicken Roll", "Mutton Kathi Roll", "Paneer Tikka Roll"],
  },
  {
    id: "balaram-mullick-sweets",
    name: "Balaram Mullick & Radharaman Mullick",
    nameBengali: "বলরাম মল্লিক ও রাধারমণ মল্লিক",
    locality: "Bhowanipore",
    address: "2, Padmapukur Road, Bhowanipore, Kolkata 700020",
    latitude: 22.5297,
    longitude: 88.3481,
    foodCategory: ["sweets", "bengali_cuisine"],
    description:
      "A sweet-making institution founded in 1885. World-famous for seasonal mishti innovations like baked roshogolla and nolen gur sandesh, alongside traditional Puja sweet offerings.",
    seasonal: false,
    temporary: false,
    verificationStatus: "curated",
    verifiedAt: "2026-02-15",
    verificationSource: "Culinary heritage registry and shop records",
    confidence: "curated",
    locationConfidence: "exact",
    openingHoursConfidence: "standard_operating_window",
    dataSource: "editorial_curation",
    notes: "Special gift boxes packaged for Vijaya Dashami sweet exchange.",
    priceRange: "moderate",
    dietaryNotes: ["vegetarian"],
    popularItems: ["Baked Roshogolla", "Mango Sandesh", "Nolen Gur Souffle", "Mishti Doi"],
  },
  {
    id: "campari-esplanade",
    name: "Campari Snack Corner",
    nameBengali: "ক্যাম্পারি স্ন্যাক কর্নার",
    locality: "Esplanade",
    address: "Near Metro Cinema, Esplanade, Kolkata 700013",
    latitude: 22.5646,
    longitude: 88.3498,
    foodCategory: ["street_food", "snacks"],
    description:
      "Celebrated street food stop offering tangy phuchka with tamarind water, spicy jhal muri, and aloo kabli. An indispensable evening stopover between Central and North pandal routes.",
    seasonal: false,
    temporary: false,
    verificationStatus: "curated",
    verifiedAt: "2026-02-15",
    verificationSource: "Public food guides and local cultural reviews",
    confidence: "curated",
    locationConfidence: "high",
    openingHoursConfidence: "standard_operating_window",
    dataSource: "editorial_curation",
    priceRange: "budget",
    dietaryNotes: ["vegetarian"],
    popularItems: ["Kolkata Phuchka", "Churmur", "Jhal Muri", "Aloo Kabli"],
  },
  {
    id: "kumartuli-puja-stalls",
    name: "Kumartuli Festival Food Stalls",
    nameBengali: "কুমোরটুলি উৎসব খাদ্য বীথি",
    locality: "Kumartuli",
    latitude: 22.5945,
    longitude: 88.3680,
    foodCategory: ["puja_stall", "street_food", "snacks"],
    description:
      "During Durga Puja, the artisan lanes around Kumartuli host temporary licensed food stalls serving piping-hot ghugni, moghlai parathas, dimer devil, and kulhad chai.",
    approximateOperatingWindow: "Panchami through Dashami, 4:00 PM to 2:00 AM",
    seasonal: true,
    temporary: true,
    verificationStatus: "community",
    verifiedAt: "2026-02-15",
    verificationSource: "Local committee seasonal licensing and food guild advisory",
    confidence: "estimated",
    locationConfidence: "approximate",
    openingHoursConfidence: "seasonal_stall",
    dataSource: "community",
    notes: "Seasonal stalls operate strictly during the 6 days of Durga Puja.",
    priceRange: "budget",
    dietaryNotes: ["vegetarian", "non_vegetarian"],
    popularItems: ["Kolkata Dimer Devil", "Mutton Ghugni", "Moghlai Paratha", "Masala Chai"],
  },
  {
    id: "bengali-sweetshop-gariahat",
    name: "Gariahat Mishti Bhaban",
    nameBengali: "গড়িয়াহাট মিষ্টি ভবন",
    locality: "Gariahat",
    address: "Near Gariahat Crossing, South Kolkata 700019",
    latitude: 22.5211,
    longitude: 88.3682,
    foodCategory: ["sweets", "snacks"],
    description:
      "A neighbourhood confectionery hub beloved by South Kolkata residents for fresh chanar jilapi, radhaballabhi with chholar dal, and jolbhora sandesh.",
    seasonal: false,
    temporary: false,
    verificationStatus: "curated",
    verifiedAt: "2026-02-15",
    verificationSource: "Editorial research & neighborhood directories",
    confidence: "curated",
    locationConfidence: "high",
    openingHoursConfidence: "standard_operating_window",
    dataSource: "editorial_curation",
    priceRange: "budget",
    dietaryNotes: ["vegetarian"],
    popularItems: ["Radhaballabhi & Chholar Dal", "Chanar Jilapi", "Jolbhora Sandesh"],
  },
  {
    id: "china-town-tiretti",
    name: "Tiretti Bazaar Morning Kitchens",
    nameBengali: "টেরিটি বাজার চীনা জলখাবার",
    locality: "Central Kolkata",
    address: "Sun Yat Sen Street, Tiretti Bazaar, Kolkata 700073",
    latitude: 22.5681,
    longitude: 88.3594,
    foodCategory: ["restaurant", "snacks"],
    description:
      "Kolkata's historic Old Chinatown offers authentic Anglo-Indian Hakka dumplings, steamed bao, and wonton soup. An iconic early-morning food pilgrimage on Puja days.",
    approximateOperatingWindow: "6:00 AM to 9:30 AM daily",
    seasonal: false,
    temporary: false,
    verificationStatus: "curated",
    verifiedAt: "2026-02-15",
    verificationSource: "Heritage preservation society and food archives",
    confidence: "curated",
    locationConfidence: "exact",
    openingHoursConfidence: "standard_operating_window",
    dataSource: "editorial_curation",
    notes: "Arrive before 7:30 AM on Puja mornings for best variety.",
    priceRange: "budget",
    dietaryNotes: ["non_vegetarian"],
    popularItems: ["Steamed Pork Bao", "Chicken Sui Mai", "Fish Ball Soup"],
  },
];

export function getFoodNearLocation(
  lat: number,
  lng: number,
  radiusKm: number = 3
): FoodHotspot[] {
  return FOOD_HOTSPOT_DATA.filter((food) => {
    if (!food.latitude || !food.longitude) return false;
    const d = haversineKm(lat, lng, food.latitude, food.longitude);
    return d <= radiusKm;
  });
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
