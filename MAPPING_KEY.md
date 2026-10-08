# LightStorm — Intake Form → Template Mapping Key (v2)

Standing reference for mapping the LightStorm Artist Discovery Form to the
template codebase — supplied by Trevor, matches the final form structure.
Applies to Cody's build and future artist builds going forward. `{client}`
= new artist's name-slug.

## Section 1 — Basic Information

- Artist Name → `{client}_artist_name` (wordmark alt text, meta tags, page titles)
- Primary Booking Contact → `{client}_booking_contact` (EPK booking form)
- Current Website → reference only, not used in build
- Location → `{client}_location` (optional footer/EPK detail)

## Section 2 — Your Story

- All narrative answers → raw material for `{client}_about_section_copy` — requires creative drafting into the About page's sectioned narrative arc (5 sections, matching Sierra's structure), not direct copy-paste
- 3-5 words describing identity → feeds font/color/motif derivation (Production Pipeline doc)
- "One song to understand you" + why → candidate for the Hero/Portal hook song — cross-reference with Section 6/11 answers

## Section 3 — Your Brand

- "If your music were a place" + emotions + symbols → feeds visual world/motif derivation (Production Pipeline doc's methodology) — not a direct file
- Colors (HEX) → `{client}_primary_color_hex`, `{client}_secondary_color_hex`
- Fonts → only used if provided; otherwise derived per the font methodology
- Inspiration links → reference only, informs Creative Direction Proposal

## Section 4 — Your Audience / Section 5 — Website Goals

- Feeds Production Pipeline Step 1 (IA choice: story-first/music-first/booking-first/community-first) — not a direct file

## Section 6 — Music

- Spotify/Apple Music/YouTube/SoundCloud/Bandcamp → `{client}_spotify_url`, `{client}_apple_music_url`, `{client}_youtube_url`, `{client}_soundcloud_url`, `{client}_bandcamp_url`
- Featured release for homepage → informs Hero content + `{client}_album_spotify_url` / `{client}_album_apple_url` / `{client}_album_youtube_music_url` if it's a specific album
- Hook song timestamp → `{client}-audio-portaltap-clip.mp3` (trim point specified by client)

## Section 7 — Community

- Laylo setup answer → `{client}_laylo_url` if using; otherwise note native list status
- List incentive → `{client}_leadmagnet_description`
- Merch status/platform/link → `{client}_merch_status`, informs Shop page setup
- Patreon/Discord/Skool/GoFundMe/etc. → `{client}_community_links` (flexible field, matches whichever checked)

## Section 8 — Press & Career

- Festivals/venues → `{client}_selected_performances_list`
- Artists opened for → `{client}_direct_support_list`
- Stats (performances, streaming) → `{client}_epk_stats`
- Proudest accomplishment → optional EPK/About supporting copy

## Section 9 — Social Links

- Instagram/Facebook/TikTok/X/Threads/etc. → `{client}_instagram_url`, `{client}_facebook_url`, `{client}_tiktok_url`, `{client}_twitter_url`, `{client}_threads_url`
- Bandsintown profile link → `{client}_bandsintown_url` (Tour page)

## Section 10 — Assets

- Logo files → `{client}-logo-wordmark-transparent.png`
- Hero Photos (3-5) → candidates for `{client}-final-portal-portrait.png` / Hero imagery — Trevor selects final pick
- About Section Photos (5-10) → `{client}-about-01-the-dream.jpg` through `{client}-about-05-portrait.jpg` (map in submission order; confirm sequence with Trevor if unclear)
- EPK/Press Photos → `{client}-epk-gallery-01.jpg` through `-10.jpg`
- Live Performance Photos → merged into EPK gallery pool
- Behind-the-Scenes Photos → candidate pool for About page or Music page "Moments" section
- Album Artwork → client uploads whatever they have as one simple "Album Artwork" field (no need to ask them to distinguish front cover/inside spread/disc art — that's too technical for the client). Behind the scenes: Trevor/Claude Code sorts whatever comes in — if only one image is provided, it becomes `{client}-cd-front-cover.jpg` and Claude Code either requests one more image directly from Trevor (not the client) for the inside spread, or builds a simpler non-CD-animation album display if only one image exists.
- Released Music Videos → `{client}_music_video_urls` (Music page, embedded normally, not gated)
- Unreleased Music Videos → source for the gated teaser clip, `{client}-music-video-teaser.mp4` (trimmed per Trevor's selection)
- Press Kit PDF → reference only, not used directly in build
- Brand Guidelines → informs Creative Direction Proposal

## Section 11 — Creative Direction

- All answers here → primary input for Production Pipeline Step 1 (Creative Direction Proposal) — feeds visual language, motion philosophy, world-building, not direct files
- Rights confirmation → `{client}_rights_confirmed` (Yes/No — add as final question before submission; gate before using any submitted asset)
- Tour dates (raw text) → `{client}_tour_dates_raw` (add as new question, likely under Section 8)

## Note on Cody Shepherd specifically

- Brand name to weave in: "S.o.U.L. — Sounds of Unconditional Love"
- Recurring symbols: Maltese Cross, Hamsa Hand, Flower of Life, Metatron's Cube — sacred geometry motifs, usable as subtle background/divider elements
- Palette: earthen tones (moved away from rainbow), warm golden internal glow
- Explicitly wants inclusivity over exclusivity in tone — avoid anything that reads "elite" or "gated"

---

**Applied to this build**: see `ASSET_MANIFEST.md` for exactly which real
files landed where. Two gaps against this key, both now closed:
`ARTIST_NAME` and `SITE_LOCATION` didn't exist as dedicated constants in
`data/site.js` (the name was hardcoded per-component instead) — added below
per Section 1's mapping.

**Also saved to the shared template**: per Trevor's confirmation, this same
file is also committed to `lightstormdesign/sierra-marin-website` (the
master template every future artist build clones from), so it's in place
from the start of the next build rather than something to remember to
port over.

**Album Artwork**: the altar/devotional-space photo submitted under
"Album Artwork" was confirmed by Trevor as the real, intended artwork (not
a mix-up) — see `ASSET_MANIFEST.md` for where it landed.
