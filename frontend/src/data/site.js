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
export const SITE_TAGLINE = "Life Is So Beautiful";
export const SITE_GENRE_TAGS = "HIP HOP | PRODUCER | PRAYERFORMER";

export const HERO_BIO =
  "Burnell Washburn is a hip hop artist, producer, and prayerformer from Salt Lake City, Utah. Since 2009 he has shared stages with legends, headlined festivals, and poured his whole heart into a craft he treats as sacred service — music that reminds us we are one with nature, divine and powerful, and that this existence is truly a magical gift.";

export const HERO_BIO_MOBILE =
  "Hip hop artist, producer, and prayerformer from Salt Lake City. Music that reminds us we are one with nature — and that life is truly a magical gift.";

export const BIO = [
  "Burnell Washburn is a Salt Lake City hip hop artist and producer who has been releasing music and prayerforming since 2009.",
  "From open mics to amphitheaters, he has performed over 1,000 shows, shared stages with icons from Snoop Dogg to Wu-Tang Clan, and brings a message of gratitude, awakening, and connection to nature everywhere he goes.",
];

// Swappable announcement bubble on the Hero (bottom-right). Points at the
// featured single for now — swap to the new album when it's ready.
export const HERO_ANNOUNCEMENT = {
  image: "/burnell-about-portrait.jpg",
  message: "Watch the video for “Beautiful.”",
  linkLabel: "Watch now",
  to: "/music",
  appearDelayMs: 6500,
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
// footage yet) — CinematicExperience/MobilePortal fall back to crossfading
// stills with a slow Ken Burns drift. Audio is null until a trimmed clip of
// "Beautiful" is prepared.
export const HOME_MEDIA = {
  portalImage: "/burnell-portal.jpg",
  portalImageMobile: "/burnell-portal-mobile.jpg",
  portalLoop: null,
  transition: null,
  heroImage: "/burnell-hero.jpg",
  heroImageMobile: "/burnell-hero-mobile.jpg",
  heroLoop: null,
  audio: null,
};

// Living illustrated frame around the Hero (HeroFrame.jsx). Each piece is a
// transparent painting plus an "-fx" mask (red = water, green = gold) that
// tells the shader where to flow and where to catch light. Width/height are
// the art's pixel size, used for layout before the image loads.
export const HERO_FRAME = {
  bottom: { src: "/burnell-frame-bottom.webp", fx: "/burnell-frame-bottom-fx.png", width: 2172, height: 458 },
  bottomMobile: { src: "/burnell-frame-bottom-mobile.webp", fx: "/burnell-frame-bottom-mobile-fx.png", width: 1536, height: 514 },
  side: { src: "/burnell-frame-side.webp", fx: "/burnell-frame-side-fx.png", width: 394, height: 1530 },
};

export const LOGO = "/burnell-logo.png";

export const TRACKING_PIXEL_IDS = {
  metaPixelId: null,
  googleAnalyticsId: null,
};
