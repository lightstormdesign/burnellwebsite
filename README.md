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
- **Mobile Home** (`WorldHome.jsx`): the portal (a Motionleap intro loop with 3D and birds that plays once, then a calm hold loop) with a small Cinzel "TAP TO ENTER" under the logo. The tap starts "Beautiful" (from 0:11, fading up to half volume over 2.5s; the slashed speaker top-left, opposite the menu, plays or mutes it any time) (with a mute button once inside), and the transition plays (whip pan, then the aspen-leaf water drop, then the dive into his world), and the site hands off to Burnell's illustrated world. The world is made of live PNG layers (`WORLD_LAYERS` in `site.js`) that start exactly on the video's last frame. The landing is blurred and dimmed under the glowing, slowly turning 3D B, the tagline, a short bio, and a falling-drop scroll cue. Scrolling lifts the blur and descends into the world, each layer at its own pace. Then the story chapters (`ABOUT_STAGES`, shared with the About page) play, settling gently on each one, while the world keeps drifting toward you: each layer grows at its own rate (`depth` in `WORLD_LAYERS`) and the meadow grows up from the bottom. Desktop keeps the original still-image hero for now.
- **Removed**: New Album / CD animation (no album out yet), Shop (merch is in-person only), Sync EPK.
- **Pages**: Home, About, Music, Tour, Community, EPK, Contact. On mobile there is no separate About page: the story is on Home, and About (menu or `/about`) glides down to its first chapter. Desktop keeps the About page until the desktop world exists.

## Pending from Burnell

- [ ] Laylo URL (`LAYLO_URL`). Every text-list CTA points at a placeholder for now.
- [ ] Unreleased opt-in song (the list incentive)
- [ ] Links for Patreon, beat packs, greatest hits, and Quantum Visions (`COMMUNITY_OFFERS`)
- [ ] Tour dates and locations (`TOUR_DATES` has the events from the form, marked TBA)
- [ ] Streaming numbers for EPK stats
- [ ] Review of all drafted copy (tagline "Sacred Hip Hop Rooted in Nature", hero bio, About chapters, Music subtitle)
- [ ] Desktop portal/transition/world footage (16:9)
- [ ] More photo variety: every upload is from one canyon shoot, and there are no childhood, early-days, or live performance photos yet
