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
- **Motif**: water-drop ripples replace the Flower of Life (`SacredGeometryField.jsx`). On desktop, the cursor reveals them; on the dark pages (Tour, EPK, Contact, Only Hueman) it reveals Burnell's illustrated world instead (`burnell-world-reveal.webp`, the mobile Home layers at their landed positions), faint, through a soft window. The pages with photo backgrounds keep the ripples so the painting never sits over a photo.
- **Home**: still-image mode. `HOME_MEDIA` in `site.js` has null video and audio slots, so the Portal and Hero crossfade between stills with a Ken Burns drift. Add the footage paths there and the original scroll-scrub and tap-transition choreography comes back with no code changes.
- **Mobile Home** (`WorldHome.jsx`): the portal (a Motionleap intro loop with 3D and birds that plays once, then a calm hold loop) with a small Cinzel "TAP TO ENTER" under the logo. The tap starts "Beautiful" (from 0:11, fading up to half volume over 2.5s; the slashed speaker top-left, opposite the menu, plays or mutes it any time) (with a mute button once inside), and the transition plays (whip pan, then the aspen-leaf water drop, then the dive into his world), and the site hands off to Burnell's illustrated world. The world is made of live PNG layers (`WORLD_LAYERS` in `site.js`) that start exactly on the video's last frame. The landing is blurred and dimmed under the glowing, slowly turning 3D B, the tagline, a short bio, and a falling-drop scroll cue. Scrolling lifts the blur and descends into the world, each layer at its own pace. Then the story chapters (`ABOUT_STAGES`, shared with the About page) play, settling gently on each one, while the world keeps drifting toward you: each layer grows at its own rate (`depth` in `WORLD_LAYERS`) and the meadow grows up from the bottom. Desktop keeps the original still-image hero for now.
  - **Alive**: swallows cross the sky (a far flock and a near one), a cutthroat trout leaps from the stream pool with gold ripples, and butterflies drift over the meadow (`CREATURES` in `WorldHome.jsx`, each placed in its layer's coordinates so it rides along with the parallax). The layers shift with the phone's tilt (permission asked on Tap to Enter on iOS), the B's glow and the scroll cue follow the bass of the song, and every touch anywhere on the site leaves a gold ripple (`TouchRipples.jsx`).
  - **Loading order** (matters on slow connections, where background downloads during the transition froze it on iPhone): the portal's videos, then the transition (downloaded whole into memory), then the song. The world's layers, creatures, beat map and story photos only start loading once the transition has ended; its last frame (the same picture as the world's landing) holds, blurred and dimmed, until they're in. The song's half volume and fade-in are baked into the file and its beat is a precomputed map (no Web Audio, which also froze the video on iPhone). `?debug` shows an on-screen log; `?debug&solo` plays the transition without ever loading the world.
- **New single** (`/only-hueman`): the CD animation from the Sierra template. Tap the case: the cover (the "Only Hueman" art) swings open, the disc (printed from the same art) slides out over a photo from his mountain shoot, then the streaming links fade in. Everything comes from `NEW_RELEASE` in `site.js`. The announcement bubble (bottom-left on the desktop Hero and the mobile Home landing) links to it.
- **Removed**: Shop (merch is in-person only), Sync EPK.
- **Pages**: Home, About, Music, Tour, Community, EPK, Contact. On mobile there is no separate About page: the story is on Home, and About (menu or `/about`) glides down to its first chapter. Desktop keeps the About page until the desktop world exists.

## Editing the site (CMS)

Everything Burnell would want to change (words, links, tour dates, the new release, the story chapters, the EPK) lives in `frontend/src/content/*.json`, and he edits it himself at **`/admin`**: a visual editor (Decap CMS 3.16.3, served from this site, no outside service). Each save is a commit to this repo, and Vercel redeploys about a minute later. `frontend/src/data/site.js` reads those files and keeps exporting the same names the components use; code-level things (media, the world's layers, navigation) stay in `site.js`.

**One-time setup** (sign-in is GitHub, handled by `frontend/api/auth.js` and `frontend/api/callback.js` on this site):
1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App. Homepage URL: the site's URL. Authorization callback URL: `https://<site>/api/callback`.
2. In Vercel → Project → Settings → Environment Variables, add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` from that app, then redeploy.
3. Give Burnell's GitHub account write access to this repo (or let him log in with the owner account).

If the site moves to a custom domain, update the OAuth App's callback URL to match.

## Pending from Burnell

- [ ] "Only Hueman" streaming links (the buttons point at his artist profiles for now) and a short clip to play as the CD opens (`NEW_RELEASE`)
- [ ] Laylo URL (`LAYLO_URL`). Every text-list CTA points at a placeholder for now.
- [ ] Unreleased opt-in song (the list incentive)
- [ ] Links for Patreon, beat packs, greatest hits, and Quantum Visions (`COMMUNITY_OFFERS`)
- [ ] Tour dates and locations (`TOUR_DATES` has the events from the form, marked TBA)
- [ ] Streaming numbers for EPK stats
- [ ] Review of all drafted copy (tagline "Sacred Hip Hop Rooted in Nature", hero bio, About chapters, Music subtitle)
- [ ] Desktop portal/transition/world footage (16:9)
- [ ] More photo variety: every upload is from one canyon shoot, and there are no childhood, early-days, or live performance photos yet
