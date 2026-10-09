"use client";

import { ShieldCheck, Star, Info } from "lucide-react";
import type { DataConfidence } from "@/types";
import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: DataConfidence;
  className?: string;
  showLabel?: boolean;
}

const CONFIDENCE_CONFIG = {
  verified: {
    label: "Verified",
    icon: ShieldCheck,
    className: "badge badge-verified",
  },
  curated: {
    label: "Curated",
    icon: Star,
    className: "badge badge-curated",
  },
  estimated: {
    label: "Estimated",
    icon: Info,
    className: "badge",
    style: { background: "#f0f0f0", color: "#666" },
  },
  demo: {
    label: "Demo Data",
    icon: Info,
    className: "badge badge-demo",
  },
  unknown: {
    label: "Unverified",
    icon: Info,
    className: "badge badge-demo",
  },
} as const;

export function ConfidenceBadge({
  confidence,
  className,
  showLabel = true,
}: ConfidenceBadgeProps) {
  const config = CONFIDENCE_CONFIG[confidence];
  const Icon = config.icon;

  return (
    <span
      className={cn(config.className, className)}
      title={`Data confidence: ${config.label}`}
    >
      <Icon size={10} />
      {showLabel && config.label}
    </span>
  );
}

export function DataSourceAttribution({ source }: { source?: string }) {
  if (!source) return null;
  return (
    <p className="text-xs text-[#7a6465] mt-1">
      Source: {source}
    </p>
  );
}
