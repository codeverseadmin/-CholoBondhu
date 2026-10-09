# GOOGLE MAPS SETUP — Cholo Bondhu

## Overview

Cholo Bondhu uses the Google Maps JavaScript API (browser-side only).
The application works without a key — the map degrades to a list view.
You only need an API key to enable the interactive map.

## Required APIs

Enable these in your Google Cloud Console project:

1. **Maps JavaScript API** — interactive map
2. **Places API (New)** — for food discovery (optional phase)
3. **Geocoding API** — location search (optional phase)

## Step-by-step Setup

### 1. Create a Google Cloud project

Visit: https://console.cloud.google.com

### 2. Enable APIs

APIs & Services → Enable APIs:
- Maps JavaScript API
- (Optional) Places API (New)

### 3. Create a Browser Key

APIs & Services → Credentials → Create Credentials → API Key

**CRITICAL: Restrict the key**
- Application restrictions: HTTP referrers (websites)
- Add: `localhost:3000/*` (development)
- Add: `yourdomain.com/*` (production)
- API restrictions: Restrict to Maps JavaScript API only

### 4. Configure environment

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=your_browser_key_here
```

**Never add the browser key to `.env` (committed to git).**

### 5. Map ID (optional, for styled maps)

In Maps Platform → Map Management → Create Map ID
- Map type: JavaScript

Add to your `.env.local`:
```
NEXT_PUBLIC_GOOGLE_MAPS_ID=your_map_id
```

## Server-side API Key (optional)

Only needed if you add server-side geocoding or Places calls.
Create a **Server key** (not a browser key) and restrict by IP.

```
GOOGLE_MAPS_SERVER_API_KEY=your_server_key
```

**Never expose this key in NEXT_PUBLIC_* variables.**

## Without a key

The app remains fully functional:
- Itinerary engine works completely
- Discovery and filtering work
- The map view shows a list-based fallback
- A clear message explains the requirement

## Security notes

- Do not commit `.env.local`
- Do not use unrestricted API keys in production
- Restrict by referrer AND by API
- Monitor usage in Cloud Console
