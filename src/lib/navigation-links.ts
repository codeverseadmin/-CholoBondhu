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
 * Generates an external Google Maps Directions URL for a single destination.
 * Requires zero API keys or external credentials.
 *
 * @param destination Target coordinate (with optional name)
 * @param origin Optional user origin coordinate
 * @param mode Desired transport mode
 */
export function buildSingleDestinationNavUrl(
  destination: NavigationTarget,
  origin?: Coordinates,
  mode: TransportMode = "walking"
): string {
  const travelMode = mapToGoogleTravelMode(mode);
  const destParam = formatCoordinates(destination.latitude, destination.longitude);

  let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destParam)}&travelmode=${travelMode}`;

  if (origin && typeof origin.latitude === "number" && typeof origin.longitude === "number") {
    const originParam = formatCoordinates(origin.latitude, origin.longitude);
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
  let originCoord: Coordinates;
  let candidateStops: NavigationTarget[];

  if (origin && typeof origin.latitude === "number" && typeof origin.longitude === "number") {
    originCoord = origin;
    candidateStops = [...stops];
  } else {
    originCoord = { latitude: stops[0].latitude, longitude: stops[0].longitude };
    candidateStops = stops.slice(1);
  }

  if (candidateStops.length === 0) {
    return {
      url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatCoordinates(originCoord.latitude, originCoord.longitude))}&travelmode=${travelMode}`,
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

  const originStr = formatCoordinates(originCoord.latitude, originCoord.longitude);
  const destStr = formatCoordinates(finalStop.latitude, finalStop.longitude);

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
  return buildSingleDestinationNavUrl(to, { latitude: from.latitude, longitude: from.longitude }, mode);
}
