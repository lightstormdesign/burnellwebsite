// BurnellWashburn — site content. Everything here is drafted from Burnell's
// LightStorm Artist Discovery Form submission (9/8/2026). Copy is FIRST
// DRAFT — lightly edited from his own words, pending his review. Fields
// still waiting on real values are flagged with "PENDING".

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

// Form: "Gratitude, Mountains, Awakening, Water, Deer, Inner child, Lion" /
// "If your music were a place: Mountain Stream in the forest."
export const SITE_TAGLINE = "Sacred Hip Hop Rooted in Nature";
export const SITE_GENRE_TAGS = "HIP HOP | PRODUCER | PRAYERFORMER";

export const HERO_BIO =
  "Burnell Washburn is a hip hop artist, producer, and prayerformer from Salt Lake City, Utah. Since 2009 he has shared stages with legends, headlined festivals, and poured his whole heart into a craft he treats as sacred service — music that reminds us we are one with nature, divine and powerful, and that this existence is truly a magical gift.";

export const HERO_BIO_MOBILE =
  "Burnell Washburn is a hip hop artist, producer, and prayerformer from Salt Lake City. His songs are prayers for healing and awakening, reminders that we are one with nature, divine and powerful, and that this life is a magical gift.";

export const BIO = [
  "Burnell Washburn is a Salt Lake City hip hop artist and producer who has been releasing music and prayerforming since 2009.",
  "From open mics to amphitheaters, he has performed over 1,000 shows, shared stages with icons from Snoop Dogg to Wu-Tang Clan, and brings a message of gratitude, awakening, and connection to nature everywhere he goes.",
];

// The new single: the CD-opening page (/only-hueman) and the announcement
// bubble both read from here. PENDING: song-specific streaming links (the
// buttons point at his artist profiles until then) and a short audio clip
// to play as the case opens.
export const NEW_RELEASE = {
  title: "Only Hueman",
  kind: "New Single",
  subtitle: "The new song from Burnell Washburn.",
  path: "/only-hueman",
  cover: "/burnell-cd-front-cover.webp",
  disc: "/burnell-cd-disc-face.webp",
  insideSpread: "/burnell-cd-inside-spread.webp",
  audioClip: null,
  links: [
    { label: "Spotify", href: "https://open.spotify.com/artist/0mfsTVqnzTGoZorpqo8khM" },
    { label: "Apple Music", href: "https://music.apple.com/us/artist/burnell-washburn/432611468" },
    { label: "YouTube", href: "https://www.youtube.com/burnellwashburn" },
  ],
};

// Swappable announcement bubble (bottom-left): desktop Hero and the mobile
// Home landing. Points at the new single.
export const HERO_ANNOUNCEMENT = {
  image: NEW_RELEASE.cover,
  message: "Hey fam, my new song “Only Hueman” is here.",
  linkLabel: "Open it",
  kicker: "New song",
  title: NEW_RELEASE.title,
  to: NEW_RELEASE.path,
  appearDelayMs: 6500,
  appearDelayMobileMs: 3500,
};

export const HERO_CTA = { label: "My Story", to: "/about" };
export const HERO_TAGLINE = SITE_TAGLINE;

export const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/burnellwashburn" },
  { label: "Facebook", href: "https://www.facebook.com/burnellwashburn" },
  { label: "YouTube", href: "https://www.youtube.com/burnellwashburn" },
];

// PENDING — Burnell is setting up Laylo (form: "Yes"). Every text-list CTA
// routes here; swap in the real Laylo drop URL once it exists.
export const LAYLO_URL = "#laylo-pending";

// Form: what fans receive for joining — "new unreleased song & bts content".
export const LEADMAGNET_DESCRIPTION = "Get a brand-new unreleased song plus behind-the-scenes content, straight to your phone.";

// Form: "Patreon, Low-barrier Offer (greatest hits package or beat packs)"
// + "maybe include a link to Quantum Visions". PENDING — no URLs provided
// yet; cards render as "coming soon" while href is null.
export const COMMUNITY_OFFERS = [
  { label: "Patreon", description: "Go deeper — exclusive music, process, and community.", href: null },
  { label: "Beat Packs", description: "Original Burnell Washburn production for your own creations.", href: null },
  { label: "Greatest Hits", description: "A collection of the songs that built the journey.", href: null },
  { label: "Quantum Visions", description: "", href: null },
];

export const SITE_CONTACT = {
  email: "burnellwashburn@gmail.com",
  phone: null,
  location: "Salt Lake City, UT",
};

export const BOOKING_EMAIL = "burnellwashburn@gmail.com";

// EPK — form: "at least 1000" performances, releasing since 2009, cover of
// Slug Magazine / City Weekly / QSaltLake. Streaming numbers: "not sure" —
// left off until real numbers are pulled.
export const EPK_STATS = [
  { value: "1,000+", label: "Live Performances" },
  { value: "2009", label: "Releasing Since" },
  { value: "3", label: "Magazine Covers" },
  { value: "Dozens", label: "Collaborations" },
];

export const EPK_SUBTITLE = "Hip hop artist, producer, and prayerformer — Salt Lake City, Utah.";

export const EPK_BANNER_TEXT = "festivals ◦ concerts ◦ ceremonies ◦ private events";

export const EPK_SHARED_STAGES = [
  "Mac Miller", "Snoop Dogg", "Macklemore", "Logic", "Wiz Khalifa", "Wu-Tang Clan", "Nas",
  "Atmosphere", "Brother Ali", "Lupe Fiasco", "Juicy J", "Dilated Peoples", "Living Legends",
  "Hieroglyphics", "Freestyle Fellowship", "Del the Funky Homosapien", "Abstract Rude", "Myka 9",
  "Blue Scholars", "RJD2", "Pretty Lights", "Deya Dova", "Dirtwire", "Yaima", "Liquid Bloom",
  "Ruby Chase", "Shanin Blake",
];

export const EPK_PRODUCED_FOR = ["TREV", "NLE Choppa", "Schoolboy Q"];
export const EPK_WRITTEN_WITH = ["Sierra Marin", "Illuminati Congo", "Aura Da Prophet", "Abstract Rude", "TREV"];

export const FESTIVALS = [
  "Soundset",
  "Reggae Rise Up",
  "Unison",
  "ShangriLa",
  "Element 11",
  "Utah Arts Festival",
  "Urban Arts Festival",
  "Building Man",
  "Earth Vibe",
  "Yin on Fire",
  "Manafest",
  "Twilight Concert Series",
];

export const NOTABLE_VENUES = ["USANA Amphitheatre", "The Depot", "Kilby Court", "Urban Lounge", "Troubadour", "Cervantes", "Tico Time"];

export const PRESS_FEATURES = [
  "SLUG Magazine (Cover)",
  "Salt Lake City Weekly (Cover)",
  "QSaltLake (Cover)",
  "Salt Lake Tribune",
  "FOX 13 News",
  "Voyage Utah",
];

export const PRESS_LINKS = [
  { label: "Wake The Flock Up — Podcast Interview", href: "https://www.youtube.com/watch?v=DvuMeazhxXw" },
  { label: "I Am Salt Lake — Podcast Interview", href: "https://www.youtube.com/watch?v=8McJAi-cKfA" },
  { label: "Mormons on Mushrooms — Podcast Interview", href: "https://mormonsonmushrooms.supercast.com/" },
];

export const BOOKING_STATUS = "Now Booking for 2027";
export const BOOKING_COPY = "Festivals, concerts, retreats, ceremonies, and private events.";

// PENDING — form gave event names without dates: "ShangriLa, Vibe High,
// Illuminati Congo & Sol Disciple show in Boulder, Convergence wellness
// campout, & private show at Lava Hot Springs". Dates/locations need
// confirming; Bandsintown below is the source of truth once wired up.
export const TOUR_DATES = [
  { date: "TBA", event: "Illuminati Congo & Sol Disciple", location: "Boulder, Colorado" },
  { date: "TBA", event: "Convergence Wellness Campout", location: "Location TBA" },
  { date: "TBA", event: "Private Show", location: "Lava Hot Springs, Idaho" },
];

export const TOUR_TICKETS_URL = "https://www.bandsintown.com/a/967902";
export const TOUR_FLYER_TITLE = "Upcoming Shows";
export const TOUR_INTRO_LINE_1 = "From the mountains of Utah to stages around the world —";
export const TOUR_INTRO_LINE_2 = "come celebrate life with me.";

export const SPOTIFY_ARTIST_URL = "https://open.spotify.com/artist/0mfsTVqnzTGoZorpqo8khM";

export const MUSIC_SUBTITLE =
  "Potent lyrics, dope beats, and a simple message: the power is within, and life is so beautiful. Music for the healing and awakening journey — for the children, the plants, the animals, and all of humanity.";

export const MUSIC_PLATFORM_LINKS = [
  { label: "Spotify", href: "https://open.spotify.com/artist/0mfsTVqnzTGoZorpqo8khM" },
  { label: "Apple Music", href: "https://music.apple.com/us/artist/burnell-washburn/432611468" },
  { label: "YouTube", href: "https://www.youtube.com/burnellwashburn" },
  { label: "SoundCloud", href: "https://soundcloud.com/burnellwashburn" },
  { label: "Bandcamp", href: "https://burnellwashburn.bandcamp.com" },
];

// Featured release — form: "Probably my new album when it's ready but for
// now we can do 'Beautiful'".
export const FEATURED_VIDEO = { id: "A7bw2wmCy9Q", title: "Beautiful" };

// Released music videos (form), titles confirmed via YouTube.
export const MUSIC_VIDEOS = [
  { id: "A7bw2wmCy9Q", title: "Beautiful" },
  { id: "BXCjWzyDt3c", title: "Gotta Rise" },
  { id: "zX94YD8DVLM", title: "Let It Go" },
  { id: "2SsJl5io19E", title: "Soldiers of Peace ft. Ruby Chase" },
  { id: "CQCcOqOYpls", title: "Prana Flow" },
  { id: "jmcdIrmTEm4", title: "Cafe on 1st" },
  { id: "Iv7Z8P1w6jc", title: "Before You Know It" },
  { id: "D-Z5LCDcos4", title: "Sunshine & Rainbows (SUB|ROK Presents)" },
  { id: "4arYDIpFgE4", title: "The Reason I Can Smile So Big" },
];

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
const MEDIA_V = "?v=8";

export const MOBILE_HOME_MEDIA = {
  portalIntro: `/burnell-portal-intro-mobile.mp4${MEDIA_V}`,
  portalIntroPoster: "/burnell-portal-intro-mobile.webp",
  portalLoop: `/burnell-portal-loop-mobile.mp4${MEDIA_V}`,
  portalLoopPoster: "/burnell-portal-loop-mobile.webp",
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

export const LOGO = "/burnell-logo.webp";

export const TRACKING_PIXEL_IDS = {
  metaPixelId: null,
  googleAnalyticsId: null,
};

// The story, chapter by chapter. Drives the About page and the story that
// follows the world on the mobile Home page (WorldHome.jsx).
export const ABOUT_STAGES = [
  {
    id: "the-beginning",
    kicker: "My Story",
    title: "Where It Began",
    opening: true,
    media: "/burnell-about-01.webp",
    body: [
      "I started making music in my bedroom after a deep heartbreak when I was 15. Freestyle rapping and slam poetry were how I made sense of the pain.",
      "I didn’t know it yet, but that heartbreak was a doorway.",
    ],
    showChevron: true,
  },
  {
    id: "bridge-1",
    bridge: true,
    body: "Then the words found a beat.",
    showChevron: true,
  },
  {
    id: "the-craft",
    title: "The Craft",
    media: "/burnell-about-02.webp",
    body: [
      "I taught myself how to produce beats and record, and started performing at open mic nights. What began as a way to process my emotions quickly became a devotion — full-length albums, collaborations with local artists, and a whole lot of nights on small stages. I put my entire heart and soul into it.",
    ],
    showChevron: true,
  },
  {
    id: "the-rise",
    title: "The Rise",
    media: "/burnell-about-03.webp",
    body: [
      "Within a few short years I was hosting my own events, opening for huge names, and getting invited on tour with underground hip hop legends. I’ve released many full-length albums, collaborated with dozens of artists, and shared stages with heroes like Snoop Dogg, Mac Miller, Wu-Tang Clan, Nas, and Atmosphere — and I’ve been releasing music and prayerforming regularly since 2009.",
    ],
    showChevron: true,
  },
  {
    id: "the-service",
    title: "Sacred Service",
    media: "/burnell-about-04.webp",
    body: [
      "I make music because it hurts not to. It’s the most fun thing I’ve ever done, and my favorite way to transmute and alchemize what I feel. It feels like a sacred service to humanity. I sing for the children, the plants, the animals, and all of humanity.",
      "I love to inspire others, uplift the world, and share the codes I’ve learned through life school.",
    ],
    showChevron: true,
  },
  {
    id: "today",
    title: "Today",
    media: "/burnell-about-05.webp",
    body: [
      "Through the grace of God, I get to do what I love — travel the world, work with my heroes, and make amazing friends everywhere I go. I got here with the support of my fans, friends, community, mentors, and the Most High.",
    ],
    showChevron: true,
  },
  {
    id: "portrait",
    media: "/burnell-about-portrait.webp",
    body: [
      "We are one with nature. We are divine, powerful beings. And this existence is truly a magical gift.",
      "I’d love for my music to help people love life more, and appreciate nature more.",
    ],
    showChevron: true,
  },
  {
    id: "performance",
    video: true,
    showChevron: true,
  },
  {
    id: "invitation",
    cta: true,
  },
];
