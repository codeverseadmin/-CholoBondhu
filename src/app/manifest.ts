import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cholo Bondhu — Kolkata's Pujo. Your Adventure.",
    short_name: "Cholo Bondhu",
    description:
      "Discover Kolkata's Durga Puja pandals, explore food spots, and plan your personalized Pujo adventure with Cholo Bondhu.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF5E6",
    theme_color: "#6F1830",
    icons: [
      {
        src: "/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/app-icon-1024.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
