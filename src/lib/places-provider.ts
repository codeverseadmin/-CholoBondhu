// ─────────────────────────────────────────────
// CHOLO BONDHU — Places Discovery Provider
//
// Abstraction layer supporting Google Places API (New)
// with secure server-side execution, field masks, caching,
// and curated festival dataset fallback.
// ─────────────────────────────────────────────

import type { PandalPlace, Coordinates } from "@/types";
import { PANDAL_DATA } from "@/data/pandals";
import { haversineDistanceKm } from "@/lib/routing-provider";

export interface PlaceSearchQuery {
  locality: string;
  coordinates: Coordinates;
  radiusMeters?: number;
  experienceTag?: string;
  textQuery?: string;
}

export interface PlacesDiscoveryProvider {
  name: string;
  isExternal: boolean;
  searchPlaces(query: PlaceSearchQuery): Promise<PandalPlace[]>;
}

/**
 * Curated Places Provider (Default — Always Available, Zero Paid API Overhead)
 */
export class CuratedPlacesProvider implements PlacesDiscoveryProvider {
  name = "Curated Kolkata Festival Dataset";
  isExternal = false;

  async searchPlaces(_query: PlaceSearchQuery): Promise<PandalPlace[]> {
    return [...PANDAL_DATA];
  }
}

/**
 * In-memory LRU cache for Google Places searches (15 minute TTL)
 */
interface CacheEntry {
  data: PandalPlace[];
  expiresAt: number;
}
const placesCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Google Places API (New) Server-Side Provider
 */
export class GooglePlacesProvider implements PlacesDiscoveryProvider {
  name = "Google Places Platform (New)";
  isExternal = true;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchPlaces(query: PlaceSearchQuery): Promise<PandalPlace[]> {
    if (!this.apiKey) {
      return [...PANDAL_DATA];
    }

    const cacheKey = `places:${query.locality}:${query.experienceTag || "all"}`;
    const cached = placesCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    try {
      const searchTerm = `Durga Puja pandal ${query.locality} Kolkata`;

      // Places API (New) Text Search
      const endpoint = "https://places.googleapis.com/v1/places:searchText";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.types",
        },
        body: JSON.stringify({
          textQuery: searchTerm,
          locationBias: {
            circle: {
              center: {
                latitude: query.coordinates.latitude,
                longitude: query.coordinates.longitude,
              },
              radius: query.radiusMeters || 5000,
            },
          },
          maxResultCount: 8,
        }),
      });

      if (!res.ok) {
        console.warn(`[GooglePlacesProvider] API status ${res.status}. Falling back to curated data.`);
        return [...PANDAL_DATA];
      }

      const json = await res.json();
      const rawPlaces = json.places || [];

      const externalPandals: PandalPlace[] = rawPlaces.map((p: any) => {
        const name = p.displayName?.text || "Kolkata Community Pandal";
        return {
          id: `gplace_${p.id}`,
          slug: p.id,
          name,
          locality: query.locality,
          address: p.formattedAddress,
          latitude: p.location?.latitude,
          longitude: p.location?.longitude,
          category: "pandal" as const,
          experienceTags: ["contemporary", "artistic"],
          familyFriendly: true,
          recommendedVisitMinutes: 40,
          description: `Discovered venue in ${query.locality} via Google Places Platform.`,
          verificationStatus: "unverified" as const,
          locationConfidence: "exact" as const,
          openingHoursConfidence: "standard_puja_window" as const,
          dataSource: "external_provider" as any,
          dataConfidence: "estimated" as const,
          editorialRating: p.rating ? Math.round(p.rating) : 3,
          googlePlaceId: p.id,
        };
      });

      // Merge with curated data to ensure festival heritage accuracy
      const merged = mergeAndDeduplicate(PANDAL_DATA, externalPandals);

      placesCache.set(cacheKey, {
        data: merged,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      return merged;
    } catch (err) {
      console.warn("[GooglePlacesProvider] Request failed, using curated fallback:", err);
      return [...PANDAL_DATA];
    }
  }
}

/**
 * Deduplicate places by identifier, name similarity, and geographical proximity (< 120m)
 */
export function mergeAndDeduplicate(
  curated: PandalPlace[],
  external: PandalPlace[]
): PandalPlace[] {
  const result: PandalPlace[] = [...curated];

  for (const ext of external) {
    if (!ext.latitude || !ext.longitude) continue;

    // Check if an existing curated place is already within 120 meters
    const isDuplicate = result.some((cur) => {
      if (cur.googlePlaceId && cur.googlePlaceId === ext.googlePlaceId) return true;
      if (cur.name.toLowerCase() === ext.name.toLowerCase()) return true;
      if (cur.latitude && cur.longitude) {
        const dist = haversineDistanceKm(cur.latitude, cur.longitude, ext.latitude!, ext.longitude!);
        return dist < 0.12; // within 120m
      }
      return false;
    });

    if (!isDuplicate) {
      result.push(ext);
    }
  }

  return result;
}

/**
 * Factory for creating the active places provider
 */
export function getPlacesProvider(): PlacesDiscoveryProvider {
  const serverKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (serverKey && serverKey.trim().length > 10) {
    return new GooglePlacesProvider(serverKey.trim());
  }
  return new CuratedPlacesProvider();
}
