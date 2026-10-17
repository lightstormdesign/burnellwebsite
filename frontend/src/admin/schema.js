// What the site editor (/admin) lets you change: one entry per content file
// in src/content/. Each field is a plain form control; nothing here is
// required to be filled in unless marked `required`.
//
// Field types: text (one line), textarea, url, email, list (a list of
// one-line values), items (a list of small cards, e.g. shows), group (a few
// fields that belong together), image, audio, youtube, select.

const linkItems = (key, label, hint, addLabel = "Add link") => ({
  key,
  label,
  hint,
  type: "items",
  addLabel,
  summary: (it) => it.label || "New link",
  fields: [
    { key: "label", label: "Button text", type: "text", placeholder: "e.g. Spotify" },
    { key: "href", label: "Link", type: "url", placeholder: "https://…" },
  ],
});

const names = (key, label, hint, addLabel) => ({ key, label, hint, type: "list", addLabel });

export const PAGES = [
  {
    file: "home",
    title: "Home",
    blurb: "Tagline, bio and the new-release pop-up",
    fields: [
      { key: "tagline", label: "Tagline", type: "text", hint: "Shows under the B on phones and on the desktop home." },
      names("genreTags", "Genre words", "Shown in small capitals, separated by dots.", "Add word"),
      { key: "heroBioMobile", label: "Bio on phones", type: "textarea", hint: "Keep this one short: 2–3 sentences." },
      { key: "heroBio", label: "Bio on computers", type: "textarea" },
      { key: "bio", label: "Short bio paragraphs", hint: "Used on other pages.", type: "list", multiline: true, addLabel: "Add paragraph" },
      {
        key: "announcement",
        label: "New release pop-up",
        hint: "The small card in the corner pointing to the new release.",
        type: "group",
        fields: [
          { key: "kicker", label: "Label on phones", type: "text", placeholder: "e.g. New song" },
          { key: "message", label: "Message on computers", type: "text" },
          { key: "linkLabel", label: "Link text on computers", type: "text", placeholder: "e.g. Listen now" },
        ],
      },
    ],
  },
  {
    file: "release",
    title: "New Release",
    blurb: "The CD page: cover, title and listen links",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "kind", label: "Type of release", type: "text", placeholder: "e.g. New Single" },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "cover", label: "Cover art", type: "image", hint: "Square image." },
      { key: "disc", label: "Disc face", type: "image", hint: "Square, ideally a transparent PNG." },
      { key: "insideSpread", label: "Inside of the case", type: "image", hint: "A wide photo." },
      { key: "audioClip", label: "Clip that plays as the case opens", type: "audio", hint: "Optional. A short MP3 or M4A." },
      linkItems("links", "Listen links", "The buttons that appear once the CD opens."),
    ],
  },
  {
    file: "story",
    title: "Story",
    blurb: "The chapters of Burnell's story",
    fields: [
      {
        key: "chapters",
        label: "Chapters",
        hint: "Shown one per swipe on phones. Use the arrows to change the order.",
        type: "items",
        addLabel: "Add chapter",
        newItem: () => ({ id: `chapter-${Date.now().toString(36)}`, type: "photo", kicker: "", title: "", image: "", body: [] }),
        summary: (it) =>
          it.type === "bridge"
            ? `“${(it.body && it.body[0]) || "Short line"}”`
            : it.type === "video"
              ? "Performance video"
              : it.type === "invitation"
                ? "Closing invitation"
                : it.title || "Photo chapter",
        badge: (it) => ({ photo: "Photo", bridge: "Line", video: "Video", invitation: "Ending" })[it.type] || "",
        fields: [
          {
            key: "type",
            label: "Kind of chapter",
            type: "select",
            options: [
              { value: "photo", label: "Photo with text" },
              { value: "bridge", label: "One short line (no photo)" },
              { value: "video", label: "Performance video" },
              { value: "invitation", label: "Closing invitation" },
            ],
          },
          { key: "kicker", label: "Small label above the title", type: "text", showIf: (it) => it.type === "photo" },
          { key: "title", label: "Title", type: "text", showIf: (it) => it.type === "photo" },
          { key: "image", label: "Photo", type: "image", showIf: (it) => it.type === "photo" },
          { key: "body", label: "Paragraphs", type: "list", multiline: true, addLabel: "Add paragraph", showIf: (it) => it.type === "photo" },
          { key: "body", label: "The line", type: "list", max: 1, addLabel: "Add the line", showIf: (it) => it.type === "bridge" },
          {
            key: "_note",
            type: "note",
            text: "This chapter shows the performance video and the closing invitation automatically. Nothing to fill in.",
            showIf: (it) => it.type === "video" || it.type === "invitation",
          },
        ],
      },
    ],
  },
  {
    file: "tour",
    title: "Tour & Booking",
    blurb: "Show dates and booking status",
    fields: [
      {
        key: "dates",
        label: "Shows",
        type: "items",
        addLabel: "Add show",
        summary: (it) => [it.date, it.event].filter(Boolean).join(" · ") || "New show",
        fields: [
          { key: "date", label: "Date", type: "text", placeholder: "e.g. Jun 14 or TBA" },
          { key: "event", label: "Event", type: "text" },
          { key: "location", label: "City or venue", type: "text" },
        ],
      },
      { key: "ticketsUrl", label: "Tickets link", type: "url", hint: "e.g. Bandsintown." },
      { key: "bookingStatus", label: "Booking status", type: "text", placeholder: "e.g. Now Booking for 2027" },
      { key: "bookingCopy", label: "Booking line", type: "text" },
      { key: "flyerTitle", label: "Shows card title", type: "text" },
      { key: "introLine1", label: "Intro line 1", type: "text" },
      { key: "introLine2", label: "Intro line 2", type: "text" },
    ],
  },
  {
    file: "music",
    title: "Music",
    blurb: "Videos, Spotify and streaming links",
    fields: [
      { key: "subtitle", label: "Intro line", type: "textarea" },
      {
        key: "featuredVideo",
        label: "Featured video",
        type: "group",
        fields: [
          { key: "id", label: "YouTube video", type: "youtube" },
          { key: "title", label: "Title", type: "text" },
        ],
      },
      {
        key: "videos",
        label: "Music videos",
        type: "items",
        addLabel: "Add video",
        summary: (it) => it.title || "New video",
        fields: [
          { key: "id", label: "YouTube video", type: "youtube" },
          { key: "title", label: "Title", type: "text" },
        ],
      },
      { key: "spotifyArtistUrl", label: "Spotify artist link", type: "url", hint: "Powers the Spotify player." },
      linkItems("platformLinks", "Streaming buttons", null),
    ],
  },
  {
    file: "epk",
    title: "Press Kit",
    blurb: "Numbers, credits and press for bookers",
    fields: [
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "bannerText", label: "Banner line", type: "text" },
      {
        key: "stats",
        label: "Big numbers",
        type: "items",
        addLabel: "Add number",
        summary: (it) => [it.value, it.label].filter(Boolean).join(" ") || "New number",
        fields: [
          { key: "value", label: "Number", type: "text", placeholder: "e.g. 15+" },
          { key: "label", label: "What it counts", type: "text", placeholder: "e.g. Years performing" },
        ],
      },
      names("sharedStages", "Shared the stage with", null, "Add artist"),
      names("producedFor", "Produced for", null, "Add artist"),
      names("writtenWith", "Written with", null, "Add artist"),
      names("festivals", "Festivals", null, "Add festival"),
      names("venues", "Notable venues", null, "Add venue"),
      names("pressFeatures", "Press features", null, "Add feature"),
      linkItems("pressLinks", "Press links", null),
    ],
  },
  {
    file: "links",
    title: "Links & Contact",
    blurb: "Socials, contact details and offers",
    fields: [
      linkItems("socials", "Social links", null),
      {
        key: "contact",
        label: "Contact details",
        type: "group",
        fields: [
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone", type: "text" },
          { key: "location", label: "Location", type: "text" },
        ],
      },
      { key: "bookingEmail", label: "Booking email", type: "email" },
      {
        key: "textList",
        label: "Text list",
        type: "group",
        fields: [
          { key: "url", label: "Sign-up page", type: "text", hint: "/connect is the site's own sign-up page." },
          { key: "leadMagnet", label: "What fans get for joining", type: "textarea" },
        ],
      },
      {
        key: "communityOffers",
        label: "Community offers",
        hint: "An offer with no link shows as “coming soon”.",
        type: "items",
        addLabel: "Add offer",
        summary: (it) => it.label || "New offer",
        fields: [
          { key: "label", label: "Name", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "href", label: "Link", type: "url" },
        ],
      },
    ],
  },
];
