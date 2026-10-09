"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { MapPin, AlertCircle } from "lucide-react";
import type { ItineraryStop } from "@/types";

const KOLKATA_CENTER = { lat: 22.5726, lng: 88.3639 };

interface InteractiveMapProps {
  stops?: ItineraryStop[];
  selectedStopId?: string;
  onStopSelect?: (stopId: string) => void;
  className?: string;
}

export function InteractiveMap({
  stops = [],
  selectedStopId,
  onStopSelect,
  className = "",
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const [mapState, setMapState] = useState<"loading" | "ready" | "error" | "no-key">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;

  useEffect(() => {
    if (!apiKey) {
      setMapState("no-key");
      return;
    }

    setOptions({
      key: apiKey,
      v: "weekly",
    });

    Promise.all([
      importLibrary("maps") as Promise<google.maps.MapsLibrary>,
      importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
    ])
      .then(([mapsLib]) => {
        if (!mapRef.current) return;

        const { Map } = mapsLib;

        const map = new Map(mapRef.current, {
          center: KOLKATA_CENTER,
          zoom: 12,
          mapId: "cholo-bondhu-map",
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
        });

        mapInstanceRef.current = map;
        setMapState("ready");
      })
      .catch((err: unknown) => {
        console.error("Maps failed to load:", err);
        setMapState("error");
        setErrorMessage("Map could not be loaded. Please check your API key configuration.");
      });

    return () => {
      markersRef.current.forEach((m) => m.map = null);
      markersRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when stops change
  useEffect(() => {
    if (mapState !== "ready" || !mapInstanceRef.current) return;

    const loadMarkers = async () => {
      const { AdvancedMarkerElement, PinElement } = await importLibrary("marker") as google.maps.MarkerLibrary;

      // Remove old markers
      markersRef.current.forEach((m) => m.map = null);
      markersRef.current.clear();

      const bounds = new google.maps.LatLngBounds();
      let hasCoords = false;

      stops.forEach((stop, idx) => {
        if (!stop.latitude || !stop.longitude) return;
        hasCoords = true;

        const isSelected = stop.id === selectedStopId;
        const isFood = stop.placeType === "food";

        const pin = new PinElement({
          background: isFood ? "#D99B32" : isSelected ? "#6F1830" : "#E74732",
          borderColor: isFood ? "#c87d12" : "#6F1830",
          glyphColor: "white",
          glyph: isFood ? "🍽" : String(idx + 1),
          scale: isSelected ? 1.3 : 1,
        });

        const marker = new AdvancedMarkerElement({
          position: { lat: stop.latitude, lng: stop.longitude },
          map: mapInstanceRef.current!,
          title: stop.placeName,
          content: pin.element,
        });

        marker.addListener("click", () => {
          onStopSelect?.(stop.id);
        });

        markersRef.current.set(stop.id, marker);
        bounds.extend({ lat: stop.latitude, lng: stop.longitude });
      });

      if (hasCoords && mapInstanceRef.current) {
        mapInstanceRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
        if (stops.length === 1) {
          mapInstanceRef.current.setZoom(15);
        }
      }
    };

    loadMarkers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, mapState]);

  // Pan to selected marker
  useEffect(() => {
    if (!selectedStopId || mapState !== "ready" || !mapInstanceRef.current) return;
    const stop = stops.find((s) => s.id === selectedStopId);
    if (stop?.latitude && stop?.longitude) {
      mapInstanceRef.current.panTo({ lat: stop.latitude, lng: stop.longitude });
    }
  }, [selectedStopId, stops, mapState]);

  if (mapState === "no-key" || mapState === "error") {
    return (
      <MapFallback
        stops={stops}
        isError={mapState === "error"}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      {mapState === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#FFF5E6] rounded-xl z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#6F1830] border-t-transparent animate-spin" />
            <p className="text-xs text-[#7a6465]">Loading map…</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className={`map-container ${className}`} aria-label="Interactive map" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Fallback when Google Maps key is missing or encounters errors
// ─────────────────────────────────────────────

function MapFallback({
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
            {isError ? "Interactive Map Unavailable" : "Map Preview Mode (List View)"}
          </p>
        </div>
        <p className="text-xs text-[#7a6465] mb-3 leading-relaxed">
          {isError
            ? errorMessage || "Map services could not be reached. Showing your stops in ordered list view."
            : "No Google Maps API key detected. The planner is fully functional with list-based routing and external navigation."}
        </p>

        {/* List-based route display */}
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
                        `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#6F1830] font-medium hover:underline flex-shrink-0 py-1 px-2"
                      aria-label={`Open ${stop.placeName} in external Maps`}
                    >
                      Directions ↗
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[rgba(111,24,48,0.1)] text-[11px] text-[#7a6465]">
        Optional: configure <code>NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY</code> in <code>.env.local</code> to enable the interactive map canvas.
      </div>
    </div>
  );
}
