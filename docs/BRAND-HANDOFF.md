# Cholo Bondhu — Brand & UI Handoff
Version: 1.0  
Product: Cholo Bondhu (চলো বন্ধু)  
Tagline: Kolkata’s Pujo. Your Adventure.  
Secondary line: Pandal dekho. Route pao. Pujo jomao.

## 1. Brand idea
Cholo Bondhu is a Kolkata Durga Puja pandal-hopping companion. It should feel like Pujo memories, friendship, discovery, and the city—expressed through a modern, dependable product. It is not a generic travel app with a festive skin.

Brand promise: help people make a personal, feasible Pujo plan and discover pandals and food with clear information about what is known, estimated, curated, or unverified.

## 2. Logo usage
- Master campaign artwork: use the full illustrated logo supplied separately by the founder for launch campaigns, posters, social content, and splash/intro moments where there is enough space.
- App icon: use the supplied simplified icon artwork for the app icon, favicon, browser tab, PWA manifest, and home-screen icon.
- Never redraw, distort, stretch, recolour, or add effects to supplied artwork without approval.
- Keep generous clear space around the mark; never put small tagline text inside a tiny app icon.
- At small sizes, favour the simplified symbol over the full campaign illustration. Check legibility at 16, 32, 48, 180, 192, 512, and 1024 px.
- If the icon contains too much detail at 16–32 px, make a separately simplified vector mark rather than shrinking the full illustration blindly.
- The source image may be a raster illustration; do not claim it is SVG/vector. If vector assets are needed, recreate them deliberately and review before replacing the original.

## 3. Colour tokens
Use these as the initial design tokens; maintain contrast and don't use every accent everywhere.
- `pujo-maroon`: #6F1830 — primary brand, headings, primary actions
- `vermilion`: #E74732 — energetic accent, selected states, key highlights
- `warm-ivory`: #FFF5E6 — primary warm canvas
- `antique-gold`: #D99B32 — decorative accent and route details, not small body text
- `ink`: #211A1B — primary readable text
- `soft-rose`: #E8D1C9 — secondary surfaces
- `paper-white`: #FFFCF7 — cards and elevated surfaces
- `muted-olive`: #74764C — restrained secondary accent
- `deep-night`: #17141A — night-map/dark-mode context only where needed

Suggested CSS variables:
--color-brand: #6F1830;
--color-accent: #E74732;
--color-canvas: #FFF5E6;
--color-gold: #D99B32;
--color-ink: #211A1B;
--color-surface: #FFFCF7;
--color-soft-rose: #E8D1C9;
--color-olive: #74764C;
--color-night: #17141A;

## 4. Typography
- Headings: expressive editorial serif with Bengali-capable fallback, e.g. `DM Serif Display` or `Noto Serif Bengali` where appropriate.
- Body/UI: highly readable sans serif, e.g. `Inter` with `Noto Sans Bengali` for Bengali text.
- Use Bengali script correctly: `চলো বন্ধু`. Do not fake Bengali with Latin characters or generate unreviewed Bengali text as artwork.
- Body text should normally be at least 16 px on mobile. Respect user text scaling.
- Keep display typography expressive but do not sacrifice navigation, map, time, or route readability.

## 5. Voice and copy
Warm, clear, inviting, locally grounded, never condescending or overly slang-heavy.
Preferred:
- “Ei Pujo, tomar moto kore.”
- “Cholo, tomar Pujo plan kori.”
- “Kolkata’s Pujo. Your Adventure.”
- “Pandal dekho. Route pao. Pujo jomao.”
Use English as the complete functional language, with Bengali as a deliberate optional cultural layer. Avoid machine-translated or incorrect Bengali.

## 6. Visual principles
- Mobile-first. Design for one-handed use, bright daylight, crowds, and variable network conditions.
- Cultural details should be specific and restrained: shiuli, alpana geometry, dhaak-inspired rhythm, pandal architecture, heritage streets, trams, warm lights, food, and shared moments.
- Do not place text over busy imagery without a reliable contrast layer.
- Avoid generic gradients, excessive gold borders, constant particles, ornamental overload, and nightclub/neon styling.
- Motion should explain state or create a small sense of delight. Honour `prefers-reduced-motion`; no forced audio; don't trivialise sacred imagery with playful motion.
- Use authentic imagery where possible. Clearly label illustration, editorial imagery, and real place photography; never imply illustrative art depicts a verified current pandal.

## 7. UX principles
- WCAG 2.2 AA target; visible focus, keyboard support, sufficient contrast, descriptive labels, 44×44 px minimum touch targets where practical.
- Provide a usable list alternative wherever a map is shown.
- Map and list selection must stay in sync.
- Make time budget, starting point, preferences, travel mode, and group needs easy to edit.
- Explain why a stop is recommended and show alternatives.
- Distinguish verified facts, curated editorial content, external Places results, user-submitted content, and estimates.
- Never invent opening hours, prices, ratings, crowd levels, live traffic, route times, or official endorsements.
- If map/API data is unavailable, gracefully use curated data and list-based planning; don't render a fake Google map.
- Don't force sign-in for basic planning or local saved plans.

## 8. UI component direction
- Primary button: maroon fill, warm-ivory/white text, clear hover/focus/disabled states.
- Secondary button: transparent or paper-white surface with maroon border/text.
- Cards: paper-white or soft-rose surfaces, generous spacing, clear content hierarchy.
- Chips: clear selected/unselected state; do not rely on colour alone.
- Route line: vermilion or gold accent, with distinct numbered stop markers and a list alternative.
- Map markers: high-contrast, large enough to tap; selected state visually obvious.
- Status labels: “Verified”, “Curated”, “External listing”, “Community submitted”, “Estimate”, “Needs verification” only when supported by actual data state.

## 9. Logo files
- `cholo-bondhu-app-icon-source.png`: generated icon artwork source.
- `app-icon-1024.png`, `app-icon-512.png`, `icon-192.png`, `apple-touch-icon-180.png`, `favicon-32.png`, `favicon-16.png`: convenience raster exports. Review at target sizes before production.
- These are convenience PNG exports, not a complete vector identity. Keep original campaign logo as a separate master asset supplied by the founder.

## 10. Implementation notes
- Store assets under `public/brand/`.
- Set `metadata.icons` and the web app manifest to the supplied icon assets.
- Use `alt="Cholo Bondhu"` for informative logo use; use empty alt text when decorative next to a visible wordmark.
- Do not use the icon as a substitute for the full wordmark in page navigation; show a readable “Cholo Bondhu” wordmark in the header.
- Do not put the full tagline inside the app icon.
- Add an `About` or footer credit only if useful: “Made for Kolkata’s Pujo.” Do not add founder names or CODEVERSE branding unless explicitly approved.
