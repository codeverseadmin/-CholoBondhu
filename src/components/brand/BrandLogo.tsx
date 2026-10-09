"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "full" | "icon" | "wordmark";
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
  className?: string;
}

export function BrandLogo({
  variant = "full",
  size = "md",
  onDark = false,
  className,
}: BrandLogoProps) {
  const iconSize = size === "sm" ? 28 : size === "md" ? 36 : 48;
  const textColor = onDark ? "text-white" : "text-[#6F1830]";
  const subColor = onDark ? "text-white/70" : "text-[#211A1B]/60";

  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2.5 focus-visible:outline-none", className)}
      aria-label="Cholo Bondhu — Home"
    >
      {/* Icon mark */}
      {variant !== "wordmark" && (
        <div
          className="flex-shrink-0 relative"
          style={{ width: iconSize, height: iconSize }}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
          >
            {/* Outer circle — festival lamp shape */}
            <circle
              cx="24"
              cy="24"
              r="22"
              fill={onDark ? "rgba(255,255,255,0.15)" : "#6F1830"}
            />
            {/* Location pin body */}
            <path
              d="M24 8C18.477 8 14 12.477 14 18C14 24.5 24 38 24 38C24 38 34 24.5 34 18C34 12.477 29.523 8 24 8Z"
              fill={onDark ? "white" : "#FFF5E6"}
            />
            {/* Inner dot — shiuli flower */}
            <circle cx="24" cy="18" r="4" fill={onDark ? "#E74732" : "#6F1830"} />
            {/* Gold accent line at bottom */}
            <path
              d="M17 40 Q24 37 31 40"
              stroke={onDark ? "#D99B32" : "#D99B32"}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      )}

      {/* Text mark */}
      {variant !== "icon" && (
        <div className="leading-tight">
          <div
            className={cn(
              "font-display font-bold tracking-tight",
              size === "sm" ? "text-lg" : size === "md" ? "text-xl" : "text-2xl",
              textColor
            )}
          >
            Cholo Bondhu
          </div>
          {size !== "sm" && (
            <div
              className={cn(
                "font-bengali text-xs mt-0.5",
                subColor
              )}
            >
              চলো বন্ধু
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
