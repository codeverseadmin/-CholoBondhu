// ─────────────────────────────────────────────
// CHOLO BONDHU — External Navigation Link Utility
//
// Zero-API-key Google Maps Universal Directions URL generator.
// Formats safe, URL-encoded URLs for individual destinations,
// point-to-point legs, and multi-stop itineraries with waypoint
// truncation protection and mobile web/app compatibility.
// ─────────────────────────────────────────────

import type { Coordinates, TransportMode } from "@/types";

export interface NavigationTarget {
  latitude: number;
  longitude: number;
  name?: string;
  locality?: string;
  address?: string;
}

export interface MultiStopNavResult {
  url: string;
  provider: "google_maps";
  travelMode: "walking" | "driving" | "transit";
  totalStops: number;
  waypointsIncluded: number;
  isTruncated: boolean;
  truncatedNotice?: string;
  advisory: string;
}

/** Maximum waypoints supported reliably by Google Maps Universal URL scheme */
export const MAX_GOOGLE_MAPS_WAYPOINTS = 9;

/**
 * Maps Cholo Bondhu transport modes to Google Maps travelmode URL parameter
 */
export function mapToGoogleTravelMode(mode?: TransportMode): "walking" | "driving" | "transit" {
  if (!mode || mode === "walking" || mode === "flexible") {
    return "walking";
  }
  if (mode === "taxi" || (mode as any) === "taxi_car") {
    return "driving";
  }
  // "public_transport", "metro_walking", "bus_tram"
  return "transit";
}

/**
 * Formats a coordinate pair into a safe query string
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/**
 * Formats a navigation target into an authoritative Google Maps destination query.
 * - When a place name is present, builds a localized query (e.g. "Ekdalia Evergreen Club, Gariahat, Kolkata")
 *   which instructs Google Maps Knowledge Graph to resolve the official Place POI,
 *   including opening hours, verified entrance gates, and pedestrian walkways,
 *   rather than dropping an anonymous GPS pin on an adjacent alley or behind boundary walls.
 * - When name is omitted, falls back safely to exact coordinate numbers (lat,lng).
 */
export function formatGoogleMapsDestination(target: NavigationTarget): string {
  if (target.name && target.name.trim().length > 0) {
    const parts: string[] = [target.name.trim()];
    if (
      target.locality &&
      target.locality.trim().length > 0 &&
      !target.name.toLowerCase().includes(target.locality.toLowerCase())
    ) {
      parts.push(target.locality.trim());
    }
    const combined = parts.join(", ").toLowerCase();
    if (!combined.includes("kolkata") && !combined.includes("calcutta")) {
      parts.push("Kolkata");
    }
    return parts.join(", ");
  }
  return formatCoordinates(target.latitude, target.longitude);
}

/**
 * Formats an origin into an authoritative Google Maps origin query.
 */
export function formatGoogleMapsOrigin(
  origin: Coordinates | (Coordinates & { name?: string; locality?: string })
): string {
  if ((origin as any).name && (origin as any).name.trim().length > 0) {
    const parts: string[] = [(origin as any).name.trim()];
    if (
      (origin as any).locality &&
      !(origin as any).name.toLowerCase().includes((origin as any).locality.toLowerCase())
    ) {
      parts.push((origin as any).locality.trim());
    }
    const combined = parts.join(", ").toLowerCase();
    if (!combined.includes("kolkata") && !combined.includes("calcutta")) {
      parts.push("Kolkata");
    }
    return parts.join(", ");
  }
  return formatCoordinates(origin.latitude, origin.longitude);
}

/**
 * Generates an external Google Maps Directions URL for a single destination.
 * Requires zero API keys or external credentials.
 *
 * @param destination Target coordinate (with optional name & locality)
 * @param origin Optional user origin coordinate (with optional name & locality)
 * @param mode Desired transport mode
 */
export function buildSingleDestinationNavUrl(
  destination: NavigationTarget,
  origin?: Coordinates | (Coordinates & { name?: string; locality?: string }),
  mode: TransportMode = "walking"
): string {
  const travelMode = mapToGoogleTravelMode(mode);
  const destParam = formatGoogleMapsDestination(destination);

  let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destParam)}&travelmode=${travelMode}`;

  if (origin && typeof origin.latitude === "number" && typeof origin.longitude === "number") {
    const originParam = formatGoogleMapsOrigin(origin);
    url += `&origin=${encodeURIComponent(originParam)}`;
  }

  return url;
}

/**
 * Generates an external Google Maps Directions URL for a multi-stop itinerary.
 *
 * Google Maps Universal URL format:
 * https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=w1|w2|...&travelmode=...
 *
 * Constraint Handling:
 * - Google Maps limits waypoints to a maximum of 9 (total 11 points including origin and final destination).
 * - If an itinerary contains more than 10 stops, stops beyond the limit are omitted from the single URL
 *   and flagged with `isTruncated: true` alongside an advisory suggesting leg-by-leg navigation.
 */
export function buildMultiStopNavUrl(
  stops: NavigationTarget[],
  origin?: Coordinates,
  mode: TransportMode = "walking"
): MultiStopNavResult {
  const travelMode = mapToGoogleTravelMode(mode);

  if (stops.length === 0) {
    return {
      url: "https://www.google.com/maps",
      provider: "google_maps",
      travelMode,
      totalStops: 0,
      waypointsIncluded: 0,
      isTruncated: false,
      advisory: "No stops provided.",
    };
  }

  if (stops.length === 1 && !origin) {
    return {
      url: buildSingleDestinationNavUrl(stops[0], undefined, mode),
      provider: "google_maps",
      travelMode,
      totalStops: 1,
      waypointsIncluded: 0,
      isTruncated: false,
      advisory: "Single-stop destination in external Google Maps.",
    };
  }

  // Determine origin and destination
  let originCoord: Coordinates & { name?: string; locality?: string };
  let candidateStops: NavigationTarget[];

  if (origin && typeof origin.latitude === "number" && typeof origin.longitude === "number") {
    originCoord = origin;
    candidateStops = [...stops];
  } else {
    originCoord = {
      latitude: stops[0].latitude,
      longitude: stops[0].longitude,
      name: stops[0].name,
      locality: stops[0].locality,
    };
    candidateStops = stops.slice(1);
  }

  if (candidateStops.length === 0) {
    return {
      url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatGoogleMapsDestination(originCoord as NavigationTarget))}&travelmode=${travelMode}`,
      provider: "google_maps",
      travelMode,
      totalStops: 1,
      waypointsIncluded: 0,
      isTruncated: false,
      advisory: "Point navigation.",
    };
  }

  // Final destination is the last stop of candidateStops
  const finalStop = candidateStops[candidateStops.length - 1];
  const intermediaryCandidates = candidateStops.slice(0, -1);

  // Waypoints are capped at MAX_GOOGLE_MAPS_WAYPOINTS (9)
  const isTruncated = intermediaryCandidates.length > MAX_GOOGLE_MAPS_WAYPOINTS;
  const waypointsToInclude = intermediaryCandidates.slice(0, MAX_GOOGLE_MAPS_WAYPOINTS);

  const originStr = formatGoogleMapsOrigin(originCoord);
  const destStr = formatGoogleMapsDestination(finalStop);

  let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destStr)}&travelmode=${travelMode}`;

  if (waypointsToInclude.length > 0) {
    const waypointsParam = waypointsToInclude
      .map((w) => formatCoordinates(w.latitude, w.longitude))
      .join("|");
    url += `&waypoints=${encodeURIComponent(waypointsParam)}`;
  }

  const truncatedNotice = isTruncated
    ? `Google Maps limits single-route directions to 9 waypoints. The first ${waypointsToInclude.length + 2} stops are included. Use leg-by-leg navigation for remaining stops.`
    : undefined;

  return {
    url,
    provider: "google_maps",
    travelMode,
    totalStops: stops.length,
    waypointsIncluded: waypointsToInclude.length,
    isTruncated,
    truncatedNotice,
    advisory: isTruncated
      ? "Partial multi-stop itinerary opened in external Google Maps (max waypoints reached)."
      : "Full multi-stop itinerary opened in external Google Maps.",
  };
}

/**
 * Builds a direct leg navigation URL between two consecutive stops.
 */
export function buildLegNavUrl(
  from: NavigationTarget,
  to: NavigationTarget,
  mode: TransportMode = "walking"
): string {
  return buildSingleDestinationNavUrl(to, from, mode);
}
