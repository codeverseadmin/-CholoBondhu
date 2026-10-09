import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Map",
  description: "Explore Kolkata's Durga Puja pandals on an interactive map.",
};

import { MapPageClient } from "./MapPageClient";

export default function MapPage() {
  return <MapPageClient />;
}
