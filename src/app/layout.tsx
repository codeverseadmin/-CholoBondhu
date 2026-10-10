import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Cholo Bondhu",
  title: {
    default: "Cholo Bondhu — Kolkata's Pujo. Your Adventure.",
    template: "%s | Cholo Bondhu",
  },
  description:
    "Discover Kolkata's Durga Puja pandals, explore food spots, and plan your personalized Pujo adventure with Cholo Bondhu.",
  keywords: [
    "Durga Puja",
    "Kolkata",
    "Pandal",
    "Pujo",
    "Puja 2026",
    "Puja itinerary",
    "Kolkata festival",
    "Bengali culture",
    "চলো বন্ধু",
  ],
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Cholo Bondhu — Kolkata's Pujo. Your Adventure.",
    description:
      "Discover Kolkata's Durga Puja pandals, explore food spots, and plan your personalized Pujo adventure with Cholo Bondhu.",
    siteName: "Cholo Bondhu (চলো বন্ধু)",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/brand/logo.png",
        width: 1024,
        height: 1024,
        alt: "Cholo Bondhu — Kolkata's Pujo. Your Adventure.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cholo Bondhu — Kolkata's Pujo. Your Adventure.",
    description:
      "Discover Kolkata's Durga Puja pandals, explore food spots, and plan your personalized Pujo adventure with Cholo Bondhu.",
    images: ["/brand/logo.png"],
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
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
