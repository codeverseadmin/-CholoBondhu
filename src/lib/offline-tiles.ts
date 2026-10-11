// ─────────────────────────────────────────────
// CHOLO BONDHU — PWA Offline Tile Pre-caching & IndexedDB Store
//
// Ensures Leaflet map tiles for major Kolkata festival corridors
// (Shyambazar–Kumartuli and Kalighat–Gariahat) remain crisp and
// interactive offline even during dense crowd cellular blackouts.
// ─────────────────────────────────────────────

const DB_NAME = "cholo_bondhu_offline_tiles_v1";
const STORE_NAME = "tiles";
const DB_VERSION = 1;

export interface CorridorBounds {
  id: string;
  name: string;
  nameBengali: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** Major Kolkata Durga Puja Corridors designated for pre-caching */
export const PRECACHE_CORRIDORS: CorridorBounds[] = [
  {
    id: "shyambazar-kumartuli",
    name: "Shyambazar–Kumartuli Corridor (North)",
    nameBengali: "শ্যামবাজার–কুমোরটুলি করিডোর (উত্তর)",
    minLat: 22.588,
    maxLat: 22.606,
    minLng: 88.360,
    maxLng: 88.376,
  },
  {
    id: "kalighat-gariahat",
    name: "Kalighat–Gariahat Corridor (South)",
    nameBengali: "কালীঘাট–গড়িয়াহাট করিডোর (দক্ষিণ)",
    minLat: 22.508,
    maxLat: 22.532,
    minLng: 88.346,
    maxLng: 88.372,
  },
];

/** Standard zoom levels required for responsive street-to-district viewing */
export const PRECACHE_ZOOM_LEVELS = [12, 13, 14, 15];

const PRIMARY_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const FALLBACK_TILE_URL = "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";

/** Slippy Map conversions: Longitude to Tile X */
export function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

/** Slippy Map conversions: Latitude to Tile Y */
export function lat2tile(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
}

/** Generate a unique key for a tile coordinate */
export function getTileKey(z: number, x: number, y: number): string {
  return `${z}/${x}/${y}`;
}

/** Open or initialize the IndexedDB database */
function openTileDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

/**
 * Retrieve a cached tile data URL from IndexedDB
 */
export async function getTileFromIndexedDB(
  z: number,
  x: number,
  y: number
): Promise<string | null> {
  try {
    const db = await openTileDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(getTileKey(z, x, y));

      req.onsuccess = () => {
        if (req.result && req.result.dataUrl) {
          resolve(req.result.dataUrl);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Save a tile data URL into IndexedDB
 */
export async function saveTileToIndexedDB(
  z: number,
  x: number,
  y: number,
  dataUrl: string
): Promise<void> {
  try {
    const db = await openTileDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({
        key: getTileKey(z, x, y),
        dataUrl,
        timestamp: Date.now(),
      });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fail silently without disrupting user experience
  }
}

/**
 * Calculates the full list of tile coordinates for all precache corridors
 */
export function getCorridorTileCoordinates(): { z: number; x: number; y: number }[] {
  const tileSet = new Set<string>();
  const tiles: { z: number; x: number; y: number }[] = [];

  for (const corridor of PRECACHE_CORRIDORS) {
    for (const z of PRECACHE_ZOOM_LEVELS) {
      const minX = lon2tile(corridor.minLng, z);
      const maxX = lon2tile(corridor.maxLng, z);
      const minY = lat2tile(corridor.maxLat, z); // Note: Y coordinates are inverted in Slippy maps
      const maxY = lat2tile(corridor.minLat, z);

      for (let x = Math.min(minX, maxX); x <= Math.max(minX, maxX); x++) {
        for (let y = Math.min(minY, maxY); y <= Math.max(minY, maxY); y++) {
          const key = getTileKey(z, x, y);
          if (!tileSet.has(key)) {
            tileSet.add(key);
            tiles.push({ z, x, y });
          }
        }
      }
    }
  }

  return tiles;
}

/**
 * Pre-cache tiles for Shyambazar–Kumartuli and Kalighat–Gariahat into IndexedDB
 */
export async function precacheCorridorTiles(
  onProgress?: (cached: number, total: number) => void
): Promise<{ cached: number; total: number; success: boolean }> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return { cached: 0, total: 0, success: false };
  }

  const allTiles = getCorridorTileCoordinates();
  let cachedCount = 0;

  // Process in batches of 4 to prevent network congestion
  const batchSize = 4;
  for (let i = 0; i < allTiles.length; i += batchSize) {
    const batch = allTiles.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async ({ z, x, y }) => {
        // Check if already stored
        const existing = await getTileFromIndexedDB(z, x, y);
        if (existing) {
          cachedCount++;
          onProgress?.(cachedCount, allTiles.length);
          return;
        }

        const tileUrl = PRIMARY_TILE_URL.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
        const fallbackUrl = FALLBACK_TILE_URL.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));

        try {
          let res = await fetch(tileUrl, { mode: "cors" }).catch(() => null);
          if (!res || !res.ok) {
            res = await fetch(fallbackUrl, { mode: "cors" }).catch(() => null);
          }

          if (res && res.ok) {
            const blob = await res.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });

            await saveTileToIndexedDB(z, x, y, dataUrl);
            cachedCount++;
            onProgress?.(cachedCount, allTiles.length);
          }
        } catch {
          // Ignore individual tile fetch errors
        }
      })
    );
  }

  return { cached: cachedCount, total: allTiles.length, success: cachedCount > 0 };
}

/** Check total tiles currently stored in IndexedDB */
export async function getOfflineTileCount(): Promise<number> {
  try {
    const db = await openTileDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}
