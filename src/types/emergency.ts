// ─────────────────────────────────────────────
// CHOLO BONDHU — Emergency & SOS Type Contracts
// ─────────────────────────────────────────────

import type { Coordinates } from "./index";

export type EmergencyCategory =
  | "medical"
  | "police"
  | "fire"
  | "lost_person"
  | "other";

export type EmergencyFacilityType =
  | "hospital"
  | "ambulance"
  | "police_station"
  | "fire_station";

export type EmergencyVerificationStatus =
  | "verified_authoritative"
  | "verified_curated"
  | "google_places";

export interface OfficialEmergencyNumber {
  id: string;
  name: string;
  nameBengali: string;
  number: string;
  dialNumber: string; // E.g. "112", "03322143230" for tel:
  category: EmergencyCategory;
  description: string;
  isNationalPrimary?: boolean;
}

export interface EmergencyFacility {
  id: string;
  name: string;
  nameBengali?: string;
  type: EmergencyFacilityType;
  category: EmergencyCategory;
  address: string;
  locality: string;
  zone: "north" | "central" | "south" | "east" | "south_west";
  coordinates: Coordinates;
  phone?: string;
  emergencyDepartmentPhone?: string;
  has24HourEmergency: boolean;
  verifiedStatus: EmergencyVerificationStatus;
  source: string;
  distanceKm?: number;
  notes?: string;
}

export type GeolocationState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "granted"; coordinates: Coordinates; accuracyMeters?: number }
  | { status: "denied"; message: string }
  | { status: "unavailable"; message: string }
  | { status: "timeout"; message: string }
  | { status: "manual"; localityName: string; coordinates: Coordinates };
