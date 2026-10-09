import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cholo Bondhu — Kolkata's Pujo. Your Adventure.",
    template: "%s | Cholo Bondhu",
  },
  description:
    "Your personal companion for discovering Kolkata Durga Puja. Pandal dekho. Route pao. Pujo jomao.",
  keywords: [
    "Durga Puja",
    "Kolkata",
    "Pandal",
    "Pujo",
    "Puja 2026",
    "Puja itinerary",
    "Kolkata festival",
    "Bengali culture",
  ],
  openGraph: {
    title: "Cholo Bondhu — Kolkata's Pujo. Your Adventure.",
    description:
      "Discover Kolkata Durga Puja pandals, build personalized itineraries, and find the best food spots along the way.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6F1830",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
