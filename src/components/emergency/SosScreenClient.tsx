"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Phone,
  PhoneCall,
  MapPin,
  Navigation,
  ShieldAlert,
  Flame,
  Stethoscope,
  Users,
  AlertCircle,
  CheckCircle2,
  Share2,
  Copy,
  ChevronDown,
  Info,
  ExternalLink,
} from "lucide-react";
import type {
  EmergencyCategory,
  EmergencyFacility,
  GeolocationState,
} from "@/types/emergency";
import {
  formatTelHref,
  getDirectionsUrl,
  getOfficialEmergencyNumbers,
  getEmergencyFacilities,
} from "@/lib/emergency-provider";
import { KOLKATA_LOCALITIES } from "@/data/localities";

export function SosScreenClient() {
  const [selectedCategory, setSelectedCategory] =
    useState<EmergencyCategory>("medical");
  const [geoState, setGeoState] = useState<GeolocationState>({ status: "idle" });
  const [facilities, setFacilities] = useState<EmergencyFacility[]>(() =>
    getEmergencyFacilities({ category: "medical", limit: 12 })
  );
  const [manualLocalityId, setManualLocalityId] = useState<string>("");
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Official numbers for active category
  const activeNumbers = getOfficialEmergencyNumbers(selectedCategory);

  // Update facilities whenever category or location changes
  useEffect(() => {
    let coords =
      geoState.status === "granted"
        ? geoState.coordinates
        : geoState.status === "manual"
        ? geoState.coordinates
        : undefined;

    // Fetch from internal API (or fallback to local curated)
    if (coords) {
      fetch("/api/emergency/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: coords.latitude,
          lng: coords.longitude,
          category: selectedCategory,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.facilities) && data.facilities.length > 0) {
            setFacilities(data.facilities);
          } else {
            setFacilities(
              getEmergencyFacilities({ coordinates: coords, category: selectedCategory })
            );
          }
        })
        .catch(() => {
          // Offline / fetch failed fallback
          setFacilities(
            getEmergencyFacilities({ coordinates: coords, category: selectedCategory })
          );
        });
    } else {
      setFacilities(getEmergencyFacilities({ category: selectedCategory, limit: 12 }));
    }
  }, [selectedCategory, geoState]);

  // Request browser location once
  const handleRequestLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoState({
        status: "unavailable",
        message: "Geolocation is not supported by your browser.",
      });
      return;
    }

    setGeoState({ status: "requesting" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState({
          status: "granted",
          coordinates: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
          accuracyMeters: pos.coords.accuracy,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoState({
            status: "denied",
            message:
              "Location access was denied. You can choose your Kolkata locality manually below.",
          });
        } else if (err.code === err.TIMEOUT) {
          setGeoState({
            status: "timeout",
            message:
              "Location request timed out. Please select your Kolkata locality manually.",
          });
        } else {
          setGeoState({
            status: "unavailable",
            message:
              "Unable to detect your device position. Please select your Kolkata locality manually.",
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  };

  // Handle manual locality selection
  const handleSelectLocality = (localityId: string) => {
    setManualLocalityId(localityId);
    const found = KOLKATA_LOCALITIES.find((l) => l.id === localityId);
    if (found) {
      setGeoState({
        status: "manual",
        localityName: found.name,
        coordinates: found.center,
      });
    }
  };

  // Lost person location share handler (requires explicit user click)
  const handleShareEmergencyStatus = async () => {
    let locDesc = "Kolkata Durga Puja Area";
    if (geoState.status === "granted") {
      locDesc = `Coordinates: ${geoState.coordinates.latitude.toFixed(
        4
      )}, ${geoState.coordinates.longitude.toFixed(4)}`;
    } else if (geoState.status === "manual") {
      locDesc = geoState.localityName;
    }

    const shareText = `EMERGENCY SOS (Cholo Bondhu): I need assistance near ${locDesc}. Please call me or dial India National Emergency: 112 / Kolkata Police: 033-2214-3230.`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Cholo Bondhu — Emergency SOS",
          text: shareText,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 4000);
      } catch {
        // User cancelled or share failed, fallback to copy
        copyToClipboard(shareText);
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 4000);
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-8">
      {/* ─── PRIMARY EMERGENCY CALL BANNER (112) ─────────────────── */}
      <section
        aria-label="National Emergency Dial Action"
        className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#961c28] via-[#E74732] to-[#B31D2C] text-white shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
              <ShieldAlert size={14} className="animate-pulse" />
              Pan-India National Emergency
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Emergency Assistance (SOS)
            </h1>
            <p className="text-white/90 text-sm sm:text-base max-w-xl">
              Dial <strong>112</strong> for immediate Police, Fire, or Medical
              dispatch. Available 24/7 toll-free from any mobile or landline across
              India.
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col items-center gap-2">
            {/* Immediate 112 Call Button */}
            <a
              href="tel:112"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white text-[#961c28] text-xl font-black shadow-2xl hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98] transition-all min-h-[64px]"
              aria-label="Call 112 National Emergency Now"
            >
              <PhoneCall size={26} className="text-[#E74732]" />
              <span>CALL 112 NOW</span>
            </a>
            <span className="text-xs text-white/80 font-medium">
              Free • No mobile balance or SIM required
            </span>
          </div>
        </div>
      </section>

      {/* ─── EMERGENCY CATEGORIES ─────────────────────────────────── */}
      <section aria-labelledby="categories-heading" className="space-y-3">
        <h2 id="categories-heading" className="text-lg font-bold text-[#211A1B]">
          Select Emergency Type
        </h2>
        <div
          role="tablist"
          aria-label="Emergency categories"
          className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3"
        >
          <CategoryButton
            active={selectedCategory === "medical"}
            onClick={() => setSelectedCategory("medical")}
            icon={Stethoscope}
            label="Medical"
            sub="Ambulance & Hospital"
          />
          <CategoryButton
            active={selectedCategory === "police"}
            onClick={() => setSelectedCategory("police")}
            icon={ShieldAlert}
            label="Police"
            sub="Safety & Crime"
          />
          <CategoryButton
            active={selectedCategory === "fire"}
            onClick={() => setSelectedCategory("fire")}
            icon={Flame}
            label="Fire"
            sub="Rescue & Hazard"
          />
          <CategoryButton
            active={selectedCategory === "lost_person"}
            onClick={() => setSelectedCategory("lost_person")}
            icon={Users}
            label="Lost Person"
            sub="Crowd Separation"
          />
          <CategoryButton
            active={selectedCategory === "other"}
            onClick={() => setSelectedCategory("other")}
            icon={AlertCircle}
            label="Other"
            sub="Traffic & Helplines"
          />
        </div>
      </section>

      {/* ─── LOST PERSON ADVISORY (When active) ──────────────────── */}
      {selectedCategory === "lost_person" && (
        <section
          aria-label="Separated in Crowd Guidance"
          className="rounded-2xl p-5 bg-[#FFF5E6] border border-[#D99B32]/30 space-y-4"
        >
          <div className="flex items-start gap-3">
            <Users className="text-[#D99B32] flex-shrink-0 mt-0.5" size={24} />
            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#211A1B]">
                Separated in a Pujo Crowd?
              </h3>
              <p className="text-sm text-[#3d3032]">
                Kolkata pandals draw massive crowds. Follow these recommended
                steps immediately:
              </p>
            </div>
          </div>

          <ol className="text-xs sm:text-sm text-[#3d3032] space-y-1.5 list-decimal list-inside pl-2">
            <li>
              <strong>Head to the nearest "May I Help You" booth:</strong> Major
              pandals have police outpost desks with microphone systems for crowd
              announcements.
            </li>
            <li>
              <strong>Dial Lalbazar Control Room:</strong> Call{" "}
              <a href="tel:03322143230" className="text-[#6F1830] font-bold underline">
                033-2214-3230
              </a>{" "}
              or <strong>112</strong> to report a separated family member.
            </li>
            <li>
              <strong>Lost Child:</strong> Dial Childline toll-free{" "}
              <a href="tel:1098" className="text-[#6F1830] font-bold underline">
                1098
              </a>{" "}
              immediately.
            </li>
          </ol>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleShareEmergencyStatus}
              className="btn btn-primary text-xs py-2 px-4 inline-flex items-center gap-2"
            >
              <Share2 size={15} />
              Share My Location & Status
            </button>
            {shareSuccess && (
              <span className="text-xs text-green-700 font-semibold inline-flex items-center gap-1">
                <CheckCircle2 size={14} /> Shared / Copied to clipboard!
              </span>
            )}
          </div>
        </section>
      )}

      {/* ─── DIRECT OFFICIAL HELPLINES ──────────────────────────── */}
      <section aria-labelledby="helplines-heading" className="space-y-3">
        <h2 id="helplines-heading" className="text-lg font-bold text-[#211A1B]">
          Direct Official Helplines
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {activeNumbers.map((num) => (
            <div
              key={num.id}
              className="card p-4 flex flex-col justify-between border border-[rgba(111,24,48,0.12)] hover:border-[#6F1830]/30 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6F1830] uppercase tracking-wide">
                    {num.category}
                  </span>
                  {num.isNationalPrimary && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E74732] text-white font-bold">
                      National Primary
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-[#211A1B]">{num.name}</h3>
                <p className="text-xs text-[#7a6465] leading-relaxed">
                  {num.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[rgba(111,24,48,0.08)] flex items-center justify-between">
                <span className="font-mono font-bold text-base text-[#211A1B]">
                  {num.number}
                </span>
                <a
                  href={formatTelHref(num.dialNumber)}
                  className="btn btn-primary py-1.5 px-3.5 text-xs inline-flex items-center gap-1.5 min-h-[38px]"
                  aria-label={`Call ${num.name} at ${num.number}`}
                >
                  <Phone size={14} />
                  Call
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── LOCATION & NEARBY FACILITIES ───────────────────────── */}
      <section aria-labelledby="facilities-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 id="facilities-heading" className="text-lg font-bold text-[#211A1B]">
              Nearby Emergency Facilities
            </h2>
            <p className="text-xs text-[#7a6465]">
              Verified 24/7 hospital emergency wings, police stations, and fire units.
            </p>
          </div>

          {/* Location Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRequestLocation}
              disabled={geoState.status === "requesting"}
              className="btn btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5"
            >
              <Navigation size={14} />
              {geoState.status === "requesting"
                ? "Locating..."
                : geoState.status === "granted"
                ? "Update My Location"
                : "Find Near My Location"}
            </button>

            {/* Manual Locality Picker */}
            <div className="relative">
              <select
                value={manualLocalityId}
                onChange={(e) => handleSelectLocality(e.target.value)}
                className="bg-white border border-[rgba(111,24,48,0.2)] rounded-full px-3 py-1.5 text-xs text-[#211A1B] font-medium focus:ring-2 focus:ring-[#6F1830] outline-none"
                aria-label="Select Kolkata Locality Manually"
              >
                <option value="">Choose Neighbourhood...</option>
                {KOLKATA_LOCALITIES.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location Status Alerts */}
        {geoState.status === "denied" && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2"
          >
            <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Location Access Denied:</strong> {geoState.message}
            </div>
          </div>
        )}

        {geoState.status === "timeout" && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2"
          >
            <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Location Timed Out:</strong> {geoState.message}
            </div>
          </div>
        )}

        {geoState.status === "unavailable" && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs flex items-start gap-2"
          >
            <Info size={16} className="text-neutral-600 flex-shrink-0 mt-0.5" />
            <div>{geoState.message}</div>
          </div>
        )}

        {geoState.status === "granted" && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-900 text-xs flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-green-600" />
              Location active. Facilities sorted by closest distance.
            </span>
          </div>
        )}

        {geoState.status === "manual" && (
          <div className="p-3 rounded-xl bg-[#FFF5E6] border border-[#D99B32]/30 text-[#211A1B] text-xs flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <MapPin size={15} className="text-[#D99B32]" />
              Showing facilities around: <strong>{geoState.localityName}</strong>
            </span>
          </div>
        )}

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facilities.map((fac) => (
            <div
              key={fac.id}
              className="card p-5 flex flex-col justify-between border border-[rgba(111,24,48,0.12)] space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-[#211A1B]">
                      {fac.name}
                    </h3>
                    {fac.nameBengali && (
                      <p className="font-bengali text-xs text-[#7a6465]" lang="bn">
                        {fac.nameBengali}
                      </p>
                    )}
                  </div>

                  {fac.distanceKm !== undefined ? (
                    <span className="px-2.5 py-1 rounded-full bg-[#FFF5E6] border border-[#D99B32]/30 text-[#6F1830] font-mono text-xs font-bold whitespace-nowrap">
                      {fac.distanceKm} km
                    </span>
                  ) : (
                    <span className="text-xs text-[#7a6465] font-medium whitespace-nowrap">
                      {fac.locality}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#3d3032] flex items-start gap-1.5">
                  <MapPin size={14} className="text-[#7a6465] flex-shrink-0 mt-0.5" />
                  <span>{fac.address}</span>
                </p>

                {fac.has24HourEmergency && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-50 text-red-800 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    24/7 Emergency Wing
                  </div>
                )}

                {fac.notes && (
                  <p className="text-[11px] text-[#7a6465] italic">{fac.notes}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[rgba(111,24,48,0.08)] flex items-center justify-between gap-2">
                {fac.phone ? (
                  <a
                    href={formatTelHref(
                      fac.emergencyDepartmentPhone || fac.phone
                    )}
                    className="btn btn-primary py-2 px-4 text-xs inline-flex items-center gap-1.5 flex-1 justify-center"
                    aria-label={`Call ${fac.name} at ${fac.phone}`}
                  >
                    <Phone size={14} />
                    Call Now ({fac.emergencyDepartmentPhone || fac.phone})
                  </a>
                ) : (
                  <span className="text-xs text-[#7a6465] py-2 px-3 italic flex-1">
                    Direct phone not listed • Dial 112
                  </span>
                )}

                <a
                  href={getDirectionsUrl(fac)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary py-2 px-3 text-xs inline-flex items-center gap-1"
                  aria-label={`Get directions to ${fac.name} on Google Maps`}
                >
                  <Navigation size={14} />
                  <span>Directions</span>
                  <ExternalLink size={11} className="opacity-70" />
                </a>
              </div>

              {/* Data Verification Footer */}
              <div className="text-[10px] text-[#7a6465] flex items-center justify-between pt-1">
                <span>Source: {fac.source}</span>
                <span className="text-[#6F1830] font-medium">
                  {fac.verifiedStatus === "verified_authoritative"
                    ? "Official Verified"
                    : fac.verifiedStatus === "google_places"
                    ? "Google Places"
                    : "Curated Directory"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SAFETY DISCLAIMER ────────────────────────────────────── */}
      <footer
        role="contentinfo"
        className="rounded-2xl p-5 bg-[#211A1B] text-white/80 text-xs leading-relaxed space-y-2"
      >
        <p className="font-semibold text-white">Important Safety Notice:</p>
        <p>
          Cholo Bondhu provides offline reference contacts and nearby emergency facility
          discovery for Kolkata Durga Puja. It is an informational companion and{" "}
          <strong>not an emergency dispatch service</strong>. It does not replace 112,
          police, fire, or ambulance authorities, and cannot dispatch responders on your
          behalf.
        </p>
        <p className="text-white/50 text-[11px]">
          In an immediate life-threatening situation or serious accident, call{" "}
          <strong className="text-white">112</strong> or proceed directly to the nearest
          government hospital emergency department.
        </p>
      </footer>
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

function CategoryButton({
  active,
  onClick,
  icon: Icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  sub: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`p-3 rounded-2xl flex flex-col items-center text-center gap-1 transition-all min-h-[72px] justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E74732] ${
        active
          ? "bg-[#6F1830] text-white shadow-md scale-[1.02]"
          : "bg-white text-[#211A1B] border border-[rgba(111,24,48,0.12)] hover:border-[#6F1830]/30 hover:bg-[#FFF5E6]/40"
      }`}
    >
      <Icon
        size={20}
        className={active ? "text-[#D99B32]" : "text-[#6F1830]"}
        aria-hidden="true"
      />
      <span className="font-bold text-xs tracking-tight">{label}</span>
      <span
        className={`text-[10px] hidden sm:block ${
          active ? "text-white/70" : "text-[#7a6465]"
        }`}
      >
        {sub}
      </span>
    </button>
  );
}
