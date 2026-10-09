"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Compass, CalendarDays, Bookmark, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/plan", icon: CalendarDays, label: "Plan" },
  { href: "/food", icon: Utensils, label: "Food" },
  { href: "/map", icon: Map, label: "Map" },
  { href: "/saved", icon: Bookmark, label: "Saved" },
] as const;

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[300] md:hidden"
      aria-label="Main navigation"
      style={{
        background: "rgba(255,252,247,0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(111,24,48,0.1)",
        paddingBottom: "max(8px, env(safe-area-inset-bottom))",
      }}
    >
      <ul className="flex items-center justify-around px-2 pt-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-colors min-h-[52px] justify-center",
                  active
                    ? "text-[#6F1830]"
                    : "text-[#7a6465] hover:text-[#6F1830]"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2 : 1.5}
                  className="transition-all"
                />
                <span className="text-[10px] font-medium tracking-wide">
                  {label}
                </span>
                {active && (
                  <span
                    className="absolute bottom-0 w-4 h-0.5 rounded-full bg-[#6F1830]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
      {NAV_ITEMS.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              active
                ? "bg-[#6F1830] text-white"
                : "text-[#3d3032] hover:bg-[#6F1830]/10 hover:text-[#6F1830]"
            )}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
