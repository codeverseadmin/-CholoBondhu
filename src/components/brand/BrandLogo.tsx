"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "full" | "icon" | "wordmark";
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
  className?: string;
  priority?: boolean;
  href?: string;
}

export function BrandLogo({
  variant = "full",
  size = "md",
  onDark = false,
  className,
  priority = true,
  href = "/",
}: BrandLogoProps) {
  // Dimensions calibrated for navigation and display
  const iconDimension = size === "sm" ? 32 : size === "md" ? 44 : 64;
  const textColor = onDark ? "text-white" : "text-[#6F1830]";
  const subColor = onDark ? "text-white/80" : "text-[#211A1B]/70";

  const content = (
    <>
      {/* Official App Icon Mark */}
      {variant !== "wordmark" && (
        <div
          className="relative flex-shrink-0 flex items-center justify-center"
          style={{ width: iconDimension, height: iconDimension }}
        >
          <Image
            src="/brand/app-icon-512.png"
            alt={variant === "icon" ? "Cholo Bondhu" : ""}
            width={iconDimension}
            height={iconDimension}
            priority={priority}
            className={cn(
              "rounded-xl object-contain shadow-xs transition-transform duration-200",
              onDark
                ? "ring-1 ring-white/15"
                : "ring-1 ring-[rgba(111,24,48,0.12)]"
            )}
          />
        </div>
      )}

      {/* Typography Wordmark */}
      {variant !== "icon" && (
        <div className="leading-tight flex flex-col justify-center">
          <span
            className={cn(
              "font-display font-bold tracking-tight",
              size === "sm" ? "text-lg leading-tight" : size === "md" ? "text-xl leading-tight" : "text-2xl leading-snug",
              textColor
            )}
          >
            Cholo Bondhu
          </span>
          {size !== "sm" && (
            <span
              className={cn("font-bengali text-xs tracking-normal mt-0.5", subColor)}
              lang="bn"
            >
              চলো বন্ধু
            </span>
          )}
        </div>
      )}
    </>
  );

  if (!href) {
    return (
      <div
        className={cn("inline-flex items-center gap-2.5", className)}
        aria-label="Cholo Bondhu"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D99B32] rounded-lg transition-opacity hover:opacity-95",
        className
      )}
      aria-label="Cholo Bondhu — Home"
    >
      {content}
    </Link>
  );
}
