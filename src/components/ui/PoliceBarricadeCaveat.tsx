"use client";

import { AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

interface PoliceBarricadeCaveatProps {
  compact?: boolean;
  className?: string;
}

interface PoliceShiftInfo {
  name: string;
  nameBengali: string;
  hours: string;
  status: "open" | "regulated" | "strict_channel";
  description: string;
}

/**
 * Returns the active Kolkata Police festival traffic & pedestrian regulation shift
 * based on current Indian Standard Time (IST, UTC+5:30).
 */
export function getKolkataPoliceShift(): PoliceShiftInfo {
  // Compute current hour in Kolkata (IST = UTC+5:30)
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const istMinutes = utcHours * 60 + utcMinutes + 330;
  const istHour = Math.floor((istMinutes % 1440) / 60);

  if (istHour >= 18 || istHour < 4) {
    return {
      name: "Night Peak Barricade Shift",
      nameBengali: "সান্ধ্য ও নৈশ ব্যারিকেড চ্যানেল",
      hours: "6:00 PM – 4:00 AM",
      status: "strict_channel",
      description:
        "Strict one-way pedestrian channelization enforced across Bagbazar, Sovabazar, Central Ave, Rashbehari, and Gariahat. Direct diagonal crossings prohibited; follow bamboo queue corridors.",
    };
  }

  if (istHour >= 14 && istHour < 18) {
    return {
      name: "Afternoon Regulation Shift",
      nameBengali: "অপরাহ্ন ট্রাফিক ও পথচারী নিয়ন্ত্রণ",
      hours: "2:00 PM – 6:00 PM",
      status: "regulated",
      description:
        "Arterial thoroughfares open with volunteer-managed pedestrian gates. Barricades active at major intersections; use designated crossing points.",
    };
  }

  return {
    name: "Morning Darshan Shift",
    nameBengali: "প্রভাতী মুক্ত পরিক্রমা",
    hours: "4:00 AM – 2:00 PM",
    status: "open",
    description:
      "Minimal queue barricading and open lane circulation. Recommended for senior citizens, families, and meditative Sabeki visits.",
  };
}

const DEFAULT_SHIFT: PoliceShiftInfo = {
  name: "Kolkata Police Regulation Shift",
  nameBengali: "কলকাতা ট্রাফিক ও পুলিশ ব্যারিকেড নির্দেশিকা",
  hours: "Afternoon (2–6 PM) & Night (6 PM–4 AM)",
  status: "regulated",
  description:
    "Kolkata Police pedestrian diversions change between afternoon and night shifts across Bagbazar, Central Ave, Rashbehari, and Gariahat. Follow designated bamboo queue corridors.",
};

export function PoliceBarricadeCaveat({
  compact = false,
  className = "",
}: PoliceBarricadeCaveatProps) {
  const [shift, setShift] = useState<PoliceShiftInfo>(DEFAULT_SHIFT);

  useEffect(() => {
    setShift(getKolkataPoliceShift());
    const interval = setInterval(() => {
      setShift(getKolkataPoliceShift());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <div
        className={`flex items-start gap-1.5 p-2 rounded-lg bg-amber-50/95 border border-amber-300/80 text-[11px] text-amber-950 ${className}`}
        role="note"
        aria-label="Kolkata Police pedestrian diversion notice"
      >
        <AlertTriangle size={13} className="text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="leading-tight">
          <span className="font-semibold text-amber-900">
            ⚠️ Kolkata Police Advisory ({shift.hours}):
          </span>{" "}
          <span>
            Pedestrian barricades shift dynamically between afternoon & night shifts. Follow volunteer signage on ground.
          </span>
        </div>
      </div>
    );
  }

  return (
    <aside
      className={`rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-[#FFF9F0] to-amber-50/70 p-3 sm:p-3.5 shadow-2xs ${className}`}
      role="complementary"
      aria-label="Kolkata Police dynamic pedestrian diversion advisory"
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center flex-shrink-0 mt-0.5">
          <ShieldAlert size={18} className="text-amber-800" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-full border border-amber-300">
              Kolkata Police Traffic & Barricade Advisory
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800">
              <Clock size={11} />
              Current Shift: {shift.hours}
            </span>
          </div>

          <h5 className="text-xs sm:text-sm font-bold text-amber-950 mt-1">
            {shift.name} ({shift.nameBengali})
          </h5>

          <p className="text-[11px] sm:text-xs text-amber-900 mt-0.5 leading-relaxed">
            {shift.description}
          </p>

          <p className="text-[11px] text-amber-800/90 mt-1.5 pt-1.5 border-t border-amber-200/70 italic">
            Notice: External Google Maps walking paths do not reflect temporary bamboo barricade diversions. Always obey police rope-lines and volunteer signals.
          </p>
        </div>
      </div>
    </aside>
  );
}
