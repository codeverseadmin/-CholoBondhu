# CHOLO BONDHU (চলো বন্ধু)
> **Kolkata's Pujo. Your Adventure.**

An intelligent, culturally authentic, mobile-first companion for exploring Kolkata Durga Puja 2026. Cholo Bondhu delivers deterministic itinerary planning, editorial crowd buffers, authentic Bengali typography, and graceful offline/missing-key fallbacks.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Local Installation](#2-local-installation)
3. [Development Commands](#3-development-commands)
4. [Test Commands](#4-test-commands)
5. [Build Command](#5-build-command)
6. [Environment Variable Setup](#6-environment-variable-setup)
7. [Required Google Maps APIs](#7-required-google-maps-apis)
8. [Browser-Key Restriction Guidance](#8-browser-key-restriction-guidance)
9. [Deployment Instructions (Vercel)](#9-deployment-instructions)
10. [Current Limitations](#10-current-limitations)
11. [Data Verification Policy](#11-data-verification-policy)
12. [Cost-Control Recommendations](#12-cost-control-recommendations)

---

## 1. Project Overview

During Durga Puja, millions of pandal-hoppers navigate Kolkata's festive streets. Traditional navigation apps fail because of road closures, bamboo barricades (*bansh-er barik'), one-way pedestrian channels, and unpredictable festival transit diversions.

**Cholo Bondhu** solves this with:
- **Deterministic Itinerary Engine**: Transparent mathematical scoring model combining preference alignment, geographic proximity, and festival significance.
- **Urban Street Heuristic**: Haversine straight-line distance expanded with a **1.6x urban street factor** and Kolkata-specific pedestrian/transit crowd buffers.
- **Provider Abstraction**: A clean `RoutingProvider` architecture that supports external APIs when available, and degrades gracefully to explainable heuristic models when external providers are offline or unconfigured.
- **Bengali Cultural Depth**: Authentic Bangla script (`কুমোরটুলি পার্ক সার্বজনীন`, `বাগবাজার সার্বজনীন`), verified local heritage notes, and curated street food landmarks (Arsalan, Mitra Cafe, Ahare Bangla, Paramount Sherbets).
- **Security & Privacy**: Zero server-side API key leakage, no cross-device telemetry without consent, and client-side versioned plan storage (`version: 1`).

---

## 2. Local Installation

### Prerequisites
- **Node.js**: v20.x or higher (LTS recommended)
- **npm**: v10.x or higher

### Clone and Install
```bash
git clone https://github.com/your-username/CholoBondhu.git
cd CholoBondhu
npm install
```

---

## 3. Development Commands

Start the local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or the port specified by Next.js) in your mobile or desktop browser.

---

## 4. Test Commands

Run the automated Jest test suite covering itinerary constraints, routing calculations, Unicode-safe persistence, and edge-case recovery:
```bash
npm test
```

Run tests with coverage:
```bash
npx jest --coverage
```

Verify strict TypeScript type-checking without emitting files:
```bash
npx tsc --noEmit
```

---

## 5. Build Command

Generate an optimized production build:
```bash
npm run build
```

Preview the production server locally:
```bash
npm start
```

---

## 6. Environment Variable Setup

The application is fully functional **without** external API keys. To enable interactive Google Maps rendering, configure a browser key.

1. Copy the template:
```bash
cp .env.example .env.local
```

2. Add your restricted Google Maps browser key in `.env.local`:
```env
# Client-side Google Maps JavaScript API key
NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=AIzaSy...YOUR_BROWSER_KEY
```

> **Security Rule**: Never prefix backend credentials or server keys with `NEXT_PUBLIC_`. Private keys must never be committed or exposed to client bundles. `.gitignore` strictly protects `.env*.local`.

---

## 7. Required Google Maps APIs & Cloud Setup

The application uses Google Maps JavaScript API for interactive map visualization.

### Google Cloud Configuration Instructions
Follow these steps to set up your Google Cloud project:
1. **Create or Select a Google Cloud Project**: Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project or select an existing one.
2. **Enable the Required APIs**: Navigate to **APIs & Services > Library** and enable **Maps JavaScript API**. *(Optional future expansions: Places API (New), Routes API).*
3. **Configure Billing**: Ensure billing is linked to your project. Google Cloud provides a recurring monthly free credit for Maps Platform.
4. **Create a Browser API Key**: Go to **APIs & Services > Credentials**, click **Create Credentials**, and select **API Key**.
5. **Restrict the Browser Key to Approved Website Referrers**:
   - Under **Application restrictions**, choose **Websites (HTTP referrers)**.
   - Add authorized domains:
     - `http://localhost:3000/*`
     - `http://localhost:3002/*`
     - `https://cholo-bondhu.vercel.app/*`
     - `https://*.vercel.app/*`
6. **Restrict the Key to the APIs Needed**: Under **API restrictions**, select **Restrict key** and check only **Maps JavaScript API**.
7. **Add the Key to Local `.env.local`**: Add `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=your_key_here` to your local `.env.local`.
8. **Configure the Production Environment Variable in Vercel**: In your Vercel Project Settings under **Environment Variables**, add `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`.
9. **Redeploy After Changing Environment Variables**: Trigger a redeploy in Vercel so the newly configured environment variable is injected into the client bundle.

---

## 8. Browser-Key Restriction Guidance

To prevent quota theft and unauthorized usage, configure strict HTTP referrer restrictions in Google Cloud Console:
1. Navigate to **Google Cloud Console** > **APIs & Services** > **Credentials**.
2. Select your `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`.
3. Under **Application restrictions**, select **Websites (HTTP referrers)**.
4. Add your authorized domains:
   - Development: `http://localhost:3000/*`, `http://localhost:3002/*`
   - Production: `https://cholo-bondhu.vercel.app/*`, `https://*.yourdomain.com/*`
5. Under **API restrictions**, choose **Restrict key** and check **Maps JavaScript API** only.

---

## DEPLOY TO VERCEL

Follow these steps to deploy Cholo Bondhu to Vercel:

1. Open https://vercel.com/
2. Choose **Add New Project**.
3. Import the GitHub repository:
   `codeverseadmin/-CholoBondhu`
4. Confirm the **Next.js** framework preset.
5. Confirm the project root directory (`./`).
6. Add `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` under **Environment Variables**.
7. Add `GOOGLE_MAPS_SERVER_API_KEY` only if the implemented server-side functionality requires it (not required for standard client-side operation).
8. Deploy the project.
9. Test the production URL.
10. Verify Google Maps, the planner, discovery, and saved plans.

---

## 10. Current Limitations

Honest transparency is core to Cholo Bondhu's architectural philosophy:
- **Heuristic Travel Times**: Inter-stop travel durations are calculated using straight-line Haversine distance multiplied by a **1.6x urban street factor** plus Kolkata festival pedestrian buffers. They are **not** real-time GPS traffic feeds.
- **Static Crowd Estimates**: Crowd levels (`moderate`, `high`, `very_high`) are editorial expectations based on historical Puja evening patterns; they are not live camera or telecommunication density sensor streams.
- **Pedestrian Barricade Divergences**: Kolkata Police introduces localized pedestrian one-way traffic (*bansh-er barik*) on Saptami, Ashtami, and Nabami nights. Users are advised to follow on-ground police directions.
- **Local Storage Scoping**: Saved plans are persisted in client-side `localStorage` (schema version `1`). They do not automatically sync across separate physical devices without sharing the generated Unicode URL.

---

## 11. Data Verification Policy

Every pandal and culinary entry in `src/data/pandals.ts` and `src/data/food.ts` includes structured verification metadata:
- **`verificationStatus`**:
  - `verified`: Ground-checked during recent festival cycles with documented history.
  - `curated`: Hand-curated by local contributors; seasonal adjustments pending.
  - `demo`: Demonstration placeholder clearly flagged with warning banners.
- **`locationConfidence`**: Indicates accuracy of geospatial coordinates (`exact`, `approximate`, `neighborhood_centroid`).
- **`seasonalValidity`**: Identifies whether the destination operates year-round or exclusively during the autumnal Durga Puja festival.
- **`notes` & `dataSource`**: Explains provenance and accessibility context honestly.

---

## 12. Cost-Control Recommendations

To avoid surprise cloud billing:
- **Keep Maps Optional**: Cholo Bondhu provides an accessible, fully responsive card-based list fallback that functions perfectly when Google Maps is disabled or quota is exceeded.
- **Avoid Unbounded Autocomplete**: Do not attach un-debounced autocomplete to search fields.
- **Enforce Field Masking**: If querying Places API, request only needed fields (`id,displayName,location`) to avoid higher SKU charges.
- **GCP Budget Alerts**: Configure budget notifications in Google Cloud Billing at $10, $50, and $100 thresholds.

---

## License & Credits
Crafted with pride for Kolkata Durga Puja. © 2026 Cholo Bondhu.
All cultural names and locations are trademarks or copyrights of their respective Puja Samitis and culinary establishments.
