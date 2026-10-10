ANTIGRAVITY — CHOLO BONDHU BRAND INTEGRATION TASK

Integrate the supplied Cholo Bondhu brand assets and brand handoff into the existing application. Do not restart the repository or overwrite working implementation. First inspect the current project and report where the existing app shell, global styles, metadata, manifest, and public assets live.

ASSETS
The supplied handoff contains:
- `cholo-bondhu-app-icon-source.png`
- `app-icon-1024.png`
- `app-icon-512.png`
- `icon-192.png`
- `apple-touch-icon-180.png`
- `favicon-32.png`
- `favicon-16.png`
- `BRAND-HANDOFF.md`

Copy the needed image assets into `public/brand/` (or the project's equivalent public asset directory). Preserve the source image unchanged. Configure Next.js metadata, favicon, Apple touch icon, and PWA/web manifest icon references using valid paths. Confirm paths resolve in the production build. The supplied raster icon is not an SVG; do not rename it to `.svg` or claim it is vector.

BRAND SYSTEM
Implement the tokens and guidelines in `BRAND-HANDOFF.md` using the project's existing styling approach. Avoid replacing a working architecture merely to match this handoff. Establish reusable CSS variables/tailwind theme tokens and consistent typography with a Bengali-capable fallback. Check Bengali rendering. Do not invent Bengali copy.

VISUAL APPLICATION
Apply the identity consistently to the home page, navigation, itinerary builder, discovery cards, food discovery, saved plans, map/list experience, and empty/error/loading states. Keep the planner calm and highly usable. Use cultural illustration as a supporting element, not a background that harms legibility. Keep the header wordmark readable; don't use the icon alone as the whole brand name. Do not squeeze the campaign tagline into the tiny icon.

PRODUCT QUALITY
- Mobile-first; test narrow mobile widths and desktop.
- Preserve existing functionality and route logic.
- Keep keyboard focus visible, use accessible contrast and reduced-motion support.
- Use the list alternative if maps are unavailable.
- Do not fake map tiles, live traffic, ratings, hours, crowd levels, or route durations.
- Respect existing Google Maps/API setup and secret handling; never expose a server API key in client code.
- Do not claim external places are verified unless they are.
- Do not add unnecessary animations or autoplay audio.

ACCEPTANCE CHECKS
1. All icon paths resolve; metadata and manifest are correct.
2. No broken images or console errors caused by the asset integration.
3. TypeScript, lint, tests, and production build pass (report commands and real results).
4. The app remains usable without Maps API keys.
5. Brand is coherent but the itinerary/map remain legible and task-focused.
6. Report exactly which files changed, checks run, results, and any remaining blockers. Do not mark incomplete work as complete.
