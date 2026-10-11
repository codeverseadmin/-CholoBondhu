"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, AlertCircle, ExternalLink } from "lucide-react";
import type { ItineraryStop } from "@/types";
import { buildSingleDestinationNavUrl } from "@/lib/navigation-links";

const KOLKATA_CENTER: [number, number] = [22.5726, 88.3639];

interface InteractiveMapProps {
  stops?: ItineraryStop[];
  selectedStopId?: string;
  onStopSelect?: (stopId: string) => void;
  className?: string;
}

// Default OpenStreetMap tile layer and attribution
const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const FALLBACK_TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

export function InteractiveMap({
  stops = [],
  selectedStopId,
  onStopSelect,
  className = "",
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);

  const [mapState, setMapState] = useState<"loading" | "ready" | "fallback">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Initialize Leaflet map instance
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapRef.current) return;

      try {
        const L = (await import("leaflet")).default;
        if (!isMounted || !mapRef.current) return;

        // Clean up previous instance if any
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        }

        const map = L.map(mapRef.current, {
          center: KOLKATA_CENTER,
          zoom: 12,
          zoomControl: false,
          attributionControl: true,
        });

        // Add zoom control at bottom-right for clean mobile UI
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Configure tile layer with replaceable environment overrides
        const tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL || DEFAULT_TILE_URL;
        const attribution = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || DEFAULT_ATTRIBUTION;

        const tileLayer = L.tileLayer(tileUrl, {
          maxZoom: 19,
          attribution,
          subdomains: ["a", "b", "c"],
        });

        // Handle tile failure by swapping to fallback CartoDB endpoint
        tileLayer.on("tileerror", () => {
          if ((tileLayer as any)._hasFailedOnce) return;
          (tileLayer as any)._hasFailedOnce = true;
          tileLayer.setUrl(FALLBACK_TILE_URL);
        });

        tileLayer.addTo(map);

        // Group layer for markers and routes
        markersLayerRef.current = L.layerGroup().addTo(map);
        leafletMapRef.current = map;

        setMapState("ready");
      } catch (err: unknown) {
        console.error("Leaflet map initialization failed:", err);
        if (isMounted) {
          setMapState("fallback");
          setErrorMessage("Interactive map canvas could not be initialized on this device.");
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch {
          // ignore cleanup errors
        }
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update markers, popups, and route polylines when stops or selection changes
  useEffect(() => {
    if (mapState !== "ready" || !leafletMapRef.current) return;

    let isMounted = true;

    async function updateLayers() {
      const L = (await import("leaflet")).default;
      if (!isMounted || !leafletMapRef.current || !markersLayerRef.current) return;

      const map = leafletMapRef.current;
      markersLayerRef.current.clearLayers();

      if (routePolylineRef.current) {
        map.removeLayer(routePolylineRef.current);
        routePolylineRef.current = null;
      }

      const validStops = stops.filter(
        (s) =>
          typeof s.latitude === "number" &&
          typeof s.longitude === "number" &&
          !isNaN(s.latitude) &&
          !isNaN(s.longitude)
      );

      if (validStops.length === 0) {
        return;
      }

      const latLngList: [number, number][] = [];

      validStops.forEach((stop, idx) => {
        const isSelected = stop.id === selectedStopId;
        const isFood = stop.placeType === "food";
        const lat = stop.latitude!;
        const lng = stop.longitude!;
        latLngList.push([lat, lng]);

        // Build branded marker HTML
        const bgColor = isFood ? "#D99B32" : isSelected ? "#6F1830" : "#E74732";
        const borderColor = isFood ? "#c87d12" : isSelected ? "#FFF5E6" : "#6F1830";
        const badgeContent = isFood ? "🍽" : String(idx + 1);
        const ringStyle = isSelected
          ? "box-shadow: 0 0 0 4px rgba(111,24,48,0.4), 0 4px 12px rgba(0,0,0,0.3); transform: scale(1.15);"
          : "box-shadow: 0 2px 6px rgba(0,0,0,0.25);";

        const iconHtml = `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background-color: ${bgColor};
            border: 2px solid ${borderColor};
            border-radius: 50%;
            color: #ffffff;
            font-size: 13px;
            font-weight: 700;
            font-family: system-ui, -apple-system, sans-serif;
            cursor: pointer;
            transition: all 0.2s ease;
            ${ringStyle}
          ">
            ${badgeContent}
          </div>
        `;

        const customIcon = L.divIcon({
          className: "cholo-bondhu-marker-pin",
          html: iconHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18],
        });

        const marker = L.marker([lat, lng], {
          icon: customIcon,
          title: stop.placeName,
        });

        // External directions link without API keys
        const navUrl =
          stop.navigationUrl ||
          buildSingleDestinationNavUrl({ latitude: lat, longitude: lng });

        // Popup content
        const popupHtml = `
          <div style="font-family: system-ui, sans-serif; padding: 2px; min-width: 180px;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #D99B32; margin-bottom: 2px;">
              ${isFood ? "Food Stop" : `Stop ${idx + 1}`}
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #211A1B; line-height: 1.2;">
              ${escapeHtml(stop.placeName)}
            </div>
            ${
              stop.placeNameBengali
                ? `<div style="font-size: 12px; color: #7a6465; margin-top: 1px;">${escapeHtml(stop.placeNameBengali)}</div>`
                : ""
            }
            <div style="font-size: 11px; color: #7a6465; margin-top: 4px;">
              📍 ${escapeHtml(stop.locality)}
            </div>
            ${
              stop.estimatedVisitMinutes
                ? `<div style="font-size: 11px; color: #3d3032; margin-top: 2px;">⏱ ~${stop.estimatedVisitMinutes} mins visit</div>`
                : ""
            }
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(111,24,48,0.12); display: flex; justify-content: space-between; align-items: center;">
              <a href="${navUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; font-weight: 600; color: #6F1830; text-decoration: none;">
                Directions ↗
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);

        marker.on("click", () => {
          onStopSelect?.(stop.id);
        });

        markersLayerRef.current.addLayer(marker);
      });

      // Draw polyline connecting stops in itinerary order
      if (latLngList.length > 1) {
        routePolylineRef.current = L.polyline(latLngList, {
          color: "#6F1830",
          weight: 3.5,
          opacity: 0.85,
          dashArray: "6, 8",
        }).addTo(map);
      }

      // Automatically fit map bounds around all stops
      if (latLngList.length > 0) {
        const bounds = L.latLngBounds(latLngList);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        if (latLngList.length === 1) {
          map.setZoom(14);
        }
      }
    }

    updateLayers();

    return () => {
      isMounted = false;
    };
  }, [stops, selectedStopId, mapState, onStopSelect]);

  // Pan to selected stop smoothly
  useEffect(() => {
    if (!selectedStopId || mapState !== "ready" || !leafletMapRef.current) return;
    const stop = stops.find((s) => s.id === selectedStopId);
    if (stop?.latitude && stop?.longitude) {
      leafletMapRef.current.panTo([stop.latitude, stop.longitude], {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedStopId, stops, mapState]);

  if (mapState === "fallback") {
    return (
      <MapFallback
        stops={stops}
        isError={true}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <div className={`relative ${className} overflow-hidden rounded-xl border border-[rgba(111,24,48,0.15)]`}>
      {mapState === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#FFF5E6] rounded-xl z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#6F1830] border-t-transparent animate-spin" />
            <p className="text-xs text-[#7a6465]">Loading interactive map…</p>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-full min-h-[300px] z-0"
        aria-label="Interactive Durga Puja pandal map"
      />
    </div>
  );
}

// Helper to sanitize strings inserted into Leaflet popups
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─────────────────────────────────────────────
// Accessible fallback when map canvas is unavailable or failed
// ─────────────────────────────────────────────

export function MapFallback({
  stops,
  isError = false,
  errorMessage,
}: {
  stops: ItineraryStop[];
  isError?: boolean;
  errorMessage?: string;
}) {
  return (
    <div className="rounded-xl border border-[rgba(111,24,48,0.15)] bg-[#FFF5E6] p-4 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2 text-[#c87d12]">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p className="text-sm font-semibold text-[#8B5000]">
            {isError ? "Map View Fallback" : "Ordered Route Preview"}
          </p>
        </div>
        <p className="text-xs text-[#7a6465] mb-3 leading-relaxed">
          {isError
            ? errorMessage || "Interactive canvas could not be loaded. Displaying your stops in ordered list view."
            : "Displaying your itinerary stops in ordered list view with external directions."}
        </p>

        {stops.length > 0 && (
          <div className="overflow-auto max-h-[340px] pr-1">
            <p className="text-[11px] font-bold text-[#3d3032] mb-2 uppercase tracking-wider">
              Ordered Route Stops ({stops.length})
            </p>
            <ol className="space-y-2.5">
              {stops.map((stop, i) => (
                <li
                  key={stop.id}
                  className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white/70 border border-[rgba(111,24,48,0.08)]"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#6F1830] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#211A1B] leading-tight">
                        {stop.placeName}
                      </p>
                      {stop.placeNameBengali && (
                        <p className="font-bengali text-xs text-[#7a6465]">
                          {stop.placeNameBengali}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-[#7a6465] text-xs mt-0.5">
                        <MapPin size={10} />
                        <span>{stop.locality}</span>
                      </div>
                    </div>
                  </div>
                  {stop.latitude && stop.longitude && (
                    <a
                      href={
                        stop.navigationUrl ||
                        buildSingleDestinationNavUrl({
                          latitude: stop.latitude,
                          longitude: stop.longitude,
                        })
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#6F1830] font-medium hover:underline flex items-center gap-1 flex-shrink-0 py-1 px-2"
                      aria-label={`Open ${stop.placeName} in external Maps`}
                    >
                      Directions <ExternalLink size={11} />
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[rgba(111,24,48,0.1)] text-[11px] text-[#7a6465]">
        Cholo Bondhu uses OpenStreetMap with zero external API key requirements.
      </div>
    </div>
  );
}
