// BurnellWashburn — site content.
//
// The words, links, dates and story live in src/content/*.json, which
// Burnell edits himself at /admin (the site editor in src/admin, saving
// straight into this repo; Vercel redeploys on every publish). This file reads them and exports
// the same names the components have always used, alongside the things that
// are code, not content (navigation, media, the world's layers).
import home from "@/content/home.json";
import release from "@/content/release.json";
import story from "@/content/story.json";
import tour from "@/content/tour.json";
import music from "@/content/music.json";
import epk from "@/content/epk.json";
import links from "@/content/links.json";

export const ARTIST_NAME = "Burnell Washburn";

// Top-level site navigation — multi-page routes. No Album/Shop pages for
// this build: no new album is out yet (featured release is the single
// "Beautiful"), and merch is in-person only for now.
export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Music", to: "/music" },
  { label: "Tour", to: "/tour" },
  { label: "Community", to: "/community" },
  { label: "EPK", to: "/epk" },
  { label: "Contact", to: "/contact" },
];

export const SITE_TAGLINE = home.tagline;
export const SITE_GENRE_TAGS = home.genreTags.join(" | ");
export const HERO_BIO = home.heroBio;
export const HERO_BIO_MOBILE = home.heroBioMobile;
export const BIO = home.bio;

// The new single: the CD-opening page (/only-hueman) and the announcement
// bubble both read from here.
export const NEW_RELEASE = {
  ...release,
  path: "/only-hueman",
  audioClip: release.audioClip || null,
};

// Swappable announcement bubble (bottom-left): desktop Hero and the mobile
// Home landing. Points at the new single.
export const HERO_ANNOUNCEMENT = {
  image: NEW_RELEASE.cover,
  ...home.announcement,
  title: NEW_RELEASE.title,
  to: NEW_RELEASE.path,
  appearDelayMs: 6500,
  appearDelayMobileMs: 3500,
};

export const HERO_CTA = { label: "My Story", to: "/about" };
export const HERO_TAGLINE = SITE_TAGLINE;

export const SOCIALS = links.socials;

// The text-list signup. Every text-list button routes here: "/connect" is
// the site's own sign-up page (the list is kept in ENTREE's admin), or an
// outside link such as Laylo. While it's empty the buttons are hidden.
export const LAYLO_URL = links.textList.url;
export const TEXT_LIST_ON = !!LAYLO_URL;
export const LEADMAGNET_DESCRIPTION = links.textList.leadMagnet;
// Our own page opens in place; an outside link opens in a new tab.
export const TEXT_LIST_LINK_PROPS = LAYLO_URL.startsWith("/") ? {} : { target: "_blank", rel: "noopener noreferrer" };

// Offer cards render as "coming soon" while a link is empty.
export const COMMUNITY_OFFERS = links.communityOffers.map((o) => ({ ...o, href: o.href || null }));

export const SITE_CONTACT = { ...links.contact, phone: links.contact.phone || null };
export const BOOKING_EMAIL = links.bookingEmail;

export const EPK_STATS = epk.stats;
export const EPK_SUBTITLE = epk.subtitle;
export const EPK_BANNER_TEXT = epk.bannerText;
export const EPK_SHARED_STAGES = epk.sharedStages;
export const EPK_PRODUCED_FOR = epk.producedFor;
export const EPK_WRITTEN_WITH = epk.writtenWith;
export const FESTIVALS = epk.festivals;
export const NOTABLE_VENUES = epk.venues;
export const PRESS_FEATURES = epk.pressFeatures;
export const PRESS_LINKS = epk.pressLinks;

export const BOOKING_STATUS = tour.bookingStatus;
export const BOOKING_COPY = tour.bookingCopy;
export const TOUR_DATES = tour.dates;
export const TOUR_TICKETS_URL = tour.ticketsUrl;
export const TOUR_FLYER_TITLE = tour.flyerTitle;
export const TOUR_INTRO_LINE_1 = tour.introLine1;
export const TOUR_INTRO_LINE_2 = tour.introLine2;

export const SPOTIFY_ARTIST_URL = music.spotifyArtistUrl;
export const MUSIC_SUBTITLE = music.subtitle;
export const MUSIC_PLATFORM_LINKS = music.platformLinks;
export const FEATURED_VIDEO = music.featuredVideo;
export const MUSIC_VIDEOS = music.videos;

// Home/portal media. Video slots are null for this draft (no custom
// footage yet) — CinematicExperience falls back to crossfading
// stills with a slow Ken Burns drift. Audio is null until a trimmed clip of
// "Beautiful" is prepared.
export const HOME_MEDIA = {
  portalImage: "/burnell-portal.webp",
  portalLoop: null,
  transition: null,
  heroImage: "/burnell-hero.webp",
  heroLoop: null,
  audio: null,
};

// Mobile Home (WorldHome.jsx): portal -> transition -> Burnell's world.
// The intro plays once (3D + birds), then the hold loop runs until the tap;
// the hold loop's first frame is the transition video's first frame, and the
// transition's last frame is WORLD_LAYERS at their `start` positions, so
// every handoff is seamless.
// Bumped whenever the videos or the song are re-encoded: these keep their
// file names and phones cache them, so without it a phone can keep playing
// an old encode.
const MEDIA_V = "?v=12";

export const MOBILE_HOME_MEDIA = {
  portalIntro: `/burnell-portal-intro-mobile.mp4${MEDIA_V}`,
  // the fallback before the intro plays is the loop's first frame, the
  // picture the portal settles on, so nothing visibly shifts
  portalIntroPoster: "/burnell-portal-loop-mobile.webp?v=2",
  portalLoop: `/burnell-portal-loop-mobile.mp4${MEDIA_V}`,
  portalLoopPoster: "/burnell-portal-loop-mobile.webp?v=2",
  transition: `/burnell-transition-mobile.mp4${MEDIA_V}`,
  // "Beautiful", started by the Tap to Enter (half volume)
  song: `/burnell-beautiful.m4a${MEDIA_V}`,
};

// Burnell's illustrated world, back to front. Coordinates are px on the
// 941x1672 canvas the layers were painted on: `start` is the landing (the
// sky, matching the transition's last frame), `end` is the landed world.
// `span` is the slice of the descent each layer moves in, so nearer layers
// sweep in later and faster. `depth` is how fast a layer grows during the
// story that follows (0 = far away, 1 = right in front of you), which keeps
// the world drifting toward you in 3D the whole way down; `anchor` is the
// canvas point it grows from (the meadow grows up from the bottom edge).
export const WORLD_CANVAS = { width: 941, height: 1672 };
export const WORLD_LAYERS = [
  { key: "sky", src: "/burnell-world-sky.webp", w: 941, start: [0, 0], end: [0, 0], span: [0, 1], depth: 0.04 },
  { key: "mountains", src: "/burnell-world-mountains.webp", w: 941, start: [0, 500], end: [0, -20], span: [0, 1], depth: 0.1 },
  { key: "forest-far", src: "/burnell-world-forest-far.webp", w: 941, start: [0, 940], end: [0, 40], span: [0, 1], depth: 0.18 },
  { key: "forest-near", src: "/burnell-world-forest-near.webp", w: 941, start: [0, 1240], end: [0, 90], span: [0.05, 1], depth: 0.28 },
  { key: "stream", src: "/burnell-world-stream.webp", w: 941, start: [0, 1660], end: [0, 260], span: [0.1, 1], depth: 0.4 },
  { key: "deer", src: "/burnell-world-deer.webp", w: 150, start: [455, 2081], end: [455, 681], span: [0.1, 1], depth: 0.4 },
  { key: "boulders", src: "/burnell-world-boulders.webp", w: 941, start: [0, 1850], end: [0, 150], span: [0.18, 1], depth: 0.55 },
  { key: "trees-left", src: "/burnell-world-trees-left.webp", w: 470, start: [-300, 0], end: [-110, 0], span: [0, 1], depth: 0.7 },
  { key: "trees-right", src: "/burnell-world-trees-right.webp", w: 471, start: [770, 0], end: [580, 0], span: [0, 1], depth: 0.7 },
  { key: "meadow", src: "/burnell-world-meadow.webp", w: 1411, start: [-235, 1820], end: [-235, 920], span: [0.25, 1], depth: 1, anchor: [470, 1672] },
];

// The same world for computers (DesktopWorld.jsx), painted 16:9 on a
// 1672x941 canvas. Same keys, order and meaning as WORLD_LAYERS: `start` is
// the landing (as on the phone: the mandala sky, the peaks rising out of the
// clouds in the lower half, the far forest's tops along the bottom; the rest
// waiting below the screen, the trees fully off each side), `end` is the
// landed world. The landing is the desktop transition's end keyframe.
const DW = (k) => `/burnell-world-desktop-${k}.webp`;
export const DESKTOP_WORLD_CANVAS = { width: 1672, height: 941 };
export const DESKTOP_WORLD_LAYERS = [
  { key: "sky", src: DW("sky"), w: 1672, start: [0, 0], end: [0, 0], span: [0, 1], depth: 0.04 },
  { key: "mountains", src: DW("mountains"), w: 1672, start: [0, 240], end: [0, -30], span: [0, 1], depth: 0.1 },
  { key: "forest-far", src: DW("forest-far"), w: 1672, start: [0, 440], end: [0, 40], span: [0, 1], depth: 0.18 },
  { key: "forest-near", src: DW("forest-near"), w: 1672, start: [0, 950], end: [0, 90], span: [0.05, 1], depth: 0.28 },
  { key: "stream", src: DW("stream"), w: 1672, start: [0, 900], end: [0, 120], span: [0.1, 1], depth: 0.4 },
  { key: "deer", src: "/burnell-world-deer.webp", w: 100, start: [790, 1242], end: [790, 462], span: [0.1, 1], depth: 0.4 },
  { key: "boulders", src: DW("boulders"), w: 1672, start: [0, 1000], end: [0, 330], span: [0.18, 1], depth: 0.55 },
  { key: "trees-left", src: DW("trees-left"), w: 1672, start: [-560, 0], end: [-60, 0], span: [0, 1], depth: 0.7 },
  { key: "trees-right", src: DW("trees-right"), w: 1672, start: [560, 0], end: [60, 0], span: [0, 1], depth: 0.7 },
  { key: "meadow", src: DW("meadow"), w: 1672, start: [0, 1100], end: [0, 220], span: [0.25, 1], depth: 1, anchor: [836, 941] },
];

export const LOGO = "/burnell-logo.webp";

export const TRACKING_PIXEL_IDS = {
  metaPixelId: null,
  googleAnalyticsId: null,
};

// The story, chapter by chapter. Drives the About page and the story that
// follows the world on the mobile Home page (WorldHome.jsx). In the CMS each
// chapter has a type (photo / bridge / video / invitation); the components
// expect the older flag shape, so it's translated here.
export const ABOUT_STAGES = story.chapters.map((c, i) => {
  const base = { id: c.id || `chapter-${i + 1}`, showChevron: c.type !== "invitation" };
  if (c.type === "invitation") return { ...base, cta: true };
  if (c.type === "video") return { ...base, video: true };
  if (c.type === "bridge") return { ...base, bridge: true, body: (c.body || []).join(" ") };
  return {
    ...base,
    opening: i === 0,
    kicker: c.kicker || undefined,
    title: c.title || undefined,
    media: c.image || undefined,
    body: c.body || [],
  };
});
