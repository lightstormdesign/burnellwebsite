# Burnell Washburn — Artist Website

First draft of Burnell Washburn's artist site, built on the Sierra Marin template (React + Tailwind + Framer Motion). Content comes from his LightStorm Artist Discovery Form submission (9/8/2026) and the photos he uploaded.

```bash
cd frontend
npm install
npm start
```

## What changed from the Sierra template

- **Content**: everything lives in `frontend/src/data/site.js`. Look for `PENDING` comments.
- **Palette/fonts**: the `--sm-*` variables in `src/index.css` are now gold, tan, slate/stream blue, and earth on black. Display font is Marcellus instead of Cinzel.
- **Motif**: water-drop ripples replace the Flower of Life (`SacredGeometryField.jsx`).
- **Home**: still-image mode. `HOME_MEDIA` in `site.js` has null video and audio slots, so the Portal and Hero crossfade between stills with a Ken Burns drift. Add the footage paths there and the original scroll-scrub and tap-transition choreography comes back with no code changes.
- **Removed**: New Album / CD animation (no album out yet), Shop (merch is in-person only), Sync EPK.
- **Pages**: Home, About, Music, Tour, Community, EPK, Contact.

## Pending from Burnell

- [ ] Laylo URL (`LAYLO_URL`). Every text-list CTA points at a placeholder for now.
- [ ] Unreleased opt-in song (the list incentive)
- [ ] Links for Patreon, beat packs, greatest hits, and Quantum Visions (`COMMUNITY_OFFERS`)
- [ ] Tour dates and locations (`TOUR_DATES` has the events from the form, marked TBA)
- [ ] Streaming numbers for EPK stats
- [ ] Review of all drafted copy (hero bio, About chapters, Music subtitle)
- [ ] Portal/transition/hero footage (Higgsfield) and a trimmed audio clip of "Beautiful"
- [ ] More photo variety: every upload is from one canyon shoot, and there are no childhood, early-days, or live performance photos yet
