# DEPLOYMENT — Cholo Bondhu

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local and add your Google Maps key (optional)

# 3. Run dev server
npm run dev
```

Open: http://localhost:3000

## Production Build

```bash
npm run build
npm run start
```

## Vercel Deployment (Recommended)

1. Push to GitHub/GitLab/Bitbucket
2. Import project in Vercel dashboard
3. Add environment variables:
   - `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` → your restricted browser key
4. Deploy

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` | Optional | Google Maps browser key for interactive map |
| `GOOGLE_MAPS_SERVER_API_KEY` | Optional | Server-side key (future use) |
| `NEXT_PUBLIC_APP_URL` | Optional | Full URL of deployed app (for share links) |

## Without API Keys

The application loads and functions completely without any API keys.
The map falls back to a list view with a clear explanation.

## Type Checking and Linting

```bash
npm run type-check
npm run lint
```

## Tests

```bash
npm test
```
