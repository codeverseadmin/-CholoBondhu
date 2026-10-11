// ─────────────────────────────────────────────
// CHOLO BONDHU — Routing Provider Abstraction
//
// Separates route estimation heuristics from external
// providers, ensuring graceful fallback and transparency.
// ─────────────────────────────────────────────

import type { Coordinates, TransportMode } from "@/types";

export interface RoutingResult {
  minutes: number;
  distanceKm?: number;
  straightLineDistanceKm?: number;
  estimatedRoadDistanceKm?: number;
  methodology: "provider_verified" | "urban_heuristic" | "fallback_default";
  isEstimated: boolean;
  attribution?: string;
  notes?: string;
  externalNavUrl?: string;
}

export interface RouteEstimate {
  origin: Coordinates;
  destination: Coordinates;
  distanceKm: number;
  travelMinutes: number;
  methodology: string;
  isEstimated: boolean;
  notes?: string;
}

export interface RoutingProvider {
  name: string;
  methodology: string;
  isEstimated: boolean;
  estimateTravel(
    fromLat?: number,
    fromLng?: number,
    toLat?: number,
    toLng?: number,
    mode?: TransportMode
  ): RoutingResult;
  calculateRoute?(
    origin: Coordinates,
    destination: Coordinates,
    mode?: TransportMode
  ): Promise<RouteEstimate>;
  calculateMatrix?(
    origins: Coordinates[],
    destinations: Coordinates[],
    mode?: TransportMode
  ): Promise<RouteEstimate[][]>;
}

/** Urban straight-line expansion factor for Kolkata street network */
export const URBAN_STREET_FACTOR = 1.6;
export const WALKING_SPEED_KMH = 4.0;
export const DEFAULT_FALLBACK_MINUTES = 20;

/** Calculate urban travel minutes based on straight-line distance and mode */
export function calculateUrbanTravelMinutes(
  straightLineKm: number,
  mode: TransportMode = "walking"
): number {
  if (straightLineKm <= 0) return 0;
  const estimatedRoadKm = straightLineKm * URBAN_STREET_FACTOR;
  let minutes: number;

  switch (mode) {
    case "taxi":
    case "taxi_car" as any:
      // ~18 km/h in festival traffic + 5 min hail/parking buffer
      minutes = (estimatedRoadKm / 18) * 60 + 5;
      break;

    case "metro_walking":
      // Station entry/transfer buffer + walking portions
      minutes = (estimatedRoadKm / 8) * 60 + 12;
      break;

    case "public_transport":
    case "bus_tram" as any:
      // Bus / tram speed (~12 km/h) + 10 min waiting buffer
      minutes = (estimatedRoadKm / 12) * 60 + 10;
      break;

    case "walking":
    case "flexible":
    default:
      // 4 km/h walking speed
      minutes = (estimatedRoadKm / WALKING_SPEED_KMH) * 60;
      break;
  }

  return Math.round(minutes);
}

/** Haversine formula to compute distance in km (supports coordinate objects or numeric parameters) */
export function haversineDistanceKm(
  lat1OrOrigin: number | Coordinates,
  lng1OrDest: number | Coordinates,
  lat2?: number,
  lng2?: number
): number {
  let lat1: number;
  let lng1: number;
  let targetLat: number;
  let targetLng: number;

  if (typeof lat1OrOrigin === "object" && typeof lng1OrDest === "object") {
    lat1 = lat1OrOrigin.latitude;
    lng1 = lat1OrOrigin.longitude;
    targetLat = lng1OrDest.latitude;
    targetLng = lng1OrDest.longitude;
  } else {
    lat1 = Number(lat1OrOrigin);
    lng1 = Number(lng1OrDest);
    targetLat = Number(lat2);
    targetLng = Number(lng2);
  }

  if (isNaN(lat1) || isNaN(lng1) || isNaN(targetLat) || isNaN(targetLng)) {
    return 0;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((targetLat - lat1) * Math.PI) / 180;
  const dLng = ((targetLng - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((targetLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(4));
}

/** Generate a mobile-friendly external navigation URL (supports both coordinate objects and discrete numbers) */
export function getExternalNavigationUrl(
  destOrCoord: Coordinates | number,
  labelOrDestLng?: string | number,
  modeOrOriginLat?: TransportMode | number,
  originLng?: number,
  mode?: TransportMode
): string {
  let destLat: number;
  let destLng: number;
  let originLatVal: number | undefined;
  let originLngVal: number | undefined;
  let transportMode: TransportMode = "walking";

  if (typeof destOrCoord === "object") {
    destLat = destOrCoord.latitude;
    destLng = destOrCoord.longitude;
    if (typeof modeOrOriginLat === "string") {
      transportMode = modeOrOriginLat as TransportMode;
    }
  } else {
    destLat = destOrCoord;
    destLng = Number(labelOrDestLng);
    if (typeof modeOrOriginLat === "number") {
      originLatVal = modeOrOriginLat;
      originLngVal = originLng;
      transportMode = mode || "walking";
    } else if (typeof modeOrOriginLat === "string") {
      transportMode = modeOrOriginLat as TransportMode;
    }
  }

  const travelModeParam =
    transportMode === "walking"
      ? "walking"
      : transportMode === "taxi" || transportMode === ("taxi_car" as any)
      ? "driving"
      : "transit";

  if (originLatVal != null && originLngVal != null) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLatVal},${originLngVal}&destination=${destLat},${destLng}&travelmode=${travelModeParam}`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=${travelModeParam}`;
}

/**
 * Kolkata Heuristic Routing Provider
 *
 * Clearly labeled estimation heuristic for festival conditions.
 * Straight-line distance is multiplied by 1.6x urban street factor.
 * Transit modes include festival crowd buffers.
 */
export class HeuristicRoutingProvider implements RoutingProvider {
  name = "Kolkata Urban Street Heuristic";
  methodology = "Urban street factor 1.6x heuristic";
  isEstimated = true;

  estimateTravel(
    fromLat?: number,
    fromLng?: number,
    toLat?: number,
    toLng?: number,
    mode: TransportMode = "walking"
  ): RoutingResult {
    if (
      fromLat == null ||
      fromLng == null ||
      toLat == null ||
      toLng == null ||
      isNaN(fromLat) ||
      isNaN(fromLng) ||
      isNaN(toLat) ||
      isNaN(toLng)
    ) {
      return {
        minutes: DEFAULT_FALLBACK_MINUTES,
        methodology: "fallback_default",
        isEstimated: true,
        notes: "Missing coordinates; applied standard 20-minute urban transit buffer.",
      };
    }

    const straightLineKm = haversineDistanceKm(fromLat, fromLng, toLat, toLng);
    const estimatedRoadKm = straightLineKm * URBAN_STREET_FACTOR;
    let minutes: number;
    let notes: string;

    switch (mode) {
      case "taxi":
      case "taxi_car" as any:
        minutes = (estimatedRoadKm / 18) * 60 + 5;
        notes = "Vehicle estimate assumes festival traffic and road restrictions.";
        break;

      case "metro_walking":
        minutes = (estimatedRoadKm / 8) * 60 + 12;
        notes = "Metro & walking estimate. Verify local station crowd advisories.";
        break;

      case "public_transport":
      case "bus_tram" as any:
        minutes = (estimatedRoadKm / 12) * 60 + 10;
        notes = "Public transit estimate. Bus and tram routes may be diverted for Puja.";
        break;

      case "walking":
      case "flexible":
      default:
        minutes = (estimatedRoadKm / WALKING_SPEED_KMH) * 60;
        notes = "Walking heuristic based on 1.6x road-to-straight-line distance.";
        break;
    }

    const roundedMinutes = Math.max(5, Math.round(minutes));

    return {
      minutes: roundedMinutes,
      distanceKm: Number(estimatedRoadKm.toFixed(2)),
      straightLineDistanceKm: Number(straightLineKm.toFixed(2)),
      estimatedRoadDistanceKm: Number(estimatedRoadKm.toFixed(2)),
      methodology: "urban_heuristic",
      isEstimated: true,
      notes,
      externalNavUrl: getExternalNavigationUrl(toLat, toLng, fromLat, fromLng, mode),
    };
  }

  async calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: TransportMode = "walking"
  ): Promise<RouteEstimate> {
    const dist = haversineDistanceKm(origin, destination);
    const roadKm = Number((dist * URBAN_STREET_FACTOR).toFixed(2));
    const mins = calculateUrbanTravelMinutes(dist, mode);

    return {
      origin,
      destination,
      distanceKm: roadKm,
      travelMinutes: mins,
      methodology: this.methodology,
      isEstimated: this.isEstimated,
      notes: "Estimated route using 1.6x urban street factor.",
    };
  }

  async calculateMatrix(
    origins: Coordinates[],
    destinations: Coordinates[],
    mode: TransportMode = "walking"
  ): Promise<RouteEstimate[][]> {
    const matrix: RouteEstimate[][] = [];
    for (const origin of origins) {
      const row: RouteEstimate[] = [];
      for (const dest of destinations) {
        row.push(await this.calculateRoute(origin, dest, mode));
      }
      matrix.push(row);
    }
    return matrix;
  }
}

/**
 * Google Routes Platform Provider
 * Supports Google Routes API v2 with field masks and graceful fallback
 */
export class GoogleRoutesProvider implements RoutingProvider {
  name = "Google Routes Platform";
  methodology = "Google Routes API v2 verified";
  isEstimated = false;
  private apiKey: string;
  private fallback = new HeuristicRoutingProvider();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  estimateTravel(
    fromLat?: number,
    fromLng?: number,
    toLat?: number,
    toLng?: number,
    mode: TransportMode = "walking"
  ): RoutingResult {
    return this.fallback.estimateTravel(fromLat, fromLng, toLat, toLng, mode);
  }

  async calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: TransportMode = "walking"
  ): Promise<RouteEstimate> {
    if (!this.apiKey) {
      return this.fallback.calculateRoute(origin, destination, mode);
    }

    const travelPreference =
      mode === "walking" ? "WALK" : mode === "taxi" ? "DRIVE" : "TRANSIT";

    try {
      const endpoint = "https://routes.googleapis.com/directions/v2:computeRoutes";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: { latitude: origin.latitude, longitude: origin.longitude },
            },
          },
          destination: {
            location: {
              latLng: { latitude: destination.latitude, longitude: destination.longitude },
            },
          },
          travelMode: travelPreference,
          computeAlternativeRoutes: false,
        }),
      });

      if (!res.ok) {
        return this.fallback.calculateRoute(origin, destination, mode);
      }

      const json = await res.json();
      const route = json.routes?.[0];
      if (!route || !route.duration) {
        return this.fallback.calculateRoute(origin, destination, mode);
      }

      const durationSeconds = parseInt(route.duration.replace("s", ""), 10) || 0;
      const travelMinutes = Math.max(1, Math.round(durationSeconds / 60));
      const distanceKm = Number(((route.distanceMeters || 0) / 1000).toFixed(2));

      return {
        origin,
        destination,
        distanceKm,
        travelMinutes,
        methodology: "Google Routes API verified",
        isEstimated: false,
      };
    } catch {
      return this.fallback.calculateRoute(origin, destination, mode);
    }
  }

  async calculateMatrix(
    origins: Coordinates[],
    destinations: Coordinates[],
    mode: TransportMode = "walking"
  ): Promise<RouteEstimate[][]> {
    const matrix: RouteEstimate[][] = [];
    for (const origin of origins) {
      const row: RouteEstimate[] = [];
      for (const dest of destinations) {
        row.push(await this.calculateRoute(origin, dest, mode));
      }
      matrix.push(row);
    }
    return matrix;
  }
}

/** Active default routing provider */
export const defaultRoutingProvider = new HeuristicRoutingProvider();

/**
 * Factory to retrieve the active routing provider
 */
export function getRoutingProvider(): RoutingProvider {
  const serverKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (serverKey && serverKey.trim().length > 10) {
    return new GoogleRoutesProvider(serverKey.trim());
  }
  return defaultRoutingProvider;
}

// Re-export external navigation link utilities
export {
  buildSingleDestinationNavUrl,
  buildMultiStopNavUrl,
  buildLegNavUrl,
  type NavigationTarget,
  type MultiStopNavResult,
} from "./navigation-links";

