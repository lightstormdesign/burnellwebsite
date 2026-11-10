import { useState } from "react";
import { Download } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/site/Reveal";
import { TrackPlayer } from "@/components/site/TrackPlayer";
import {
  ARTIST_NAME,
  EPK_STATS,
  EPK_SUBTITLE,
  EPK_BANNER_TEXT,
  EPK_SHARED_STAGES,
  EPK_PRODUCED_FOR,
  EPK_WRITTEN_WITH,
  FESTIVALS,
  NOTABLE_VENUES,
  PRESS_FEATURES,
  PRESS_LINKS,
  FEATURED_VIDEO,
  BOOKING_STATUS,
  BOOKING_COPY,
  BOOKING_EMAIL,
  SOCIALS,
  STREAMING_LINKS,
  EPK_TRACKS,
  EPK_COVER,
  EPK_PERFORMANCE_VIDEO,
  PRESS_QUOTES,
  TECH_RIDER,
} from "@/data/site";

// Two source sets: EPK's own numbered photo set (mostly stage/performance
// shots) and the general Gallery photos (mostly personal/candid) folded in
// from the removed standalone Photos page. Kept as separate arrays here only
// so they can be deliberately interleaved below — the previous pass had them
// clustered as two visually separate blocks (all stage shots, then all
// candid shots), which read as segmented rather than varied.
const EPK_PHOTOS = Array.from({ length: 14 }, (_, i) => `/burnell-epk-${String(i + 1).padStart(2, "0")}.webp`);

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const EPK_GALLERY = seededShuffle(EPK_PHOTOS, 42);
// each photo full size, to download (public/press: up to 3000px JPGs made
// from his camera originals, and all of them in one zip)
const pressPhoto = (src) => `/press/burnell-washburn-press-${src.match(/epk-(\d+)/)[1]}.jpg`;
const PRESS_ZIP = "/press/burnell-washburn-press-photos.zip";
// a live performance leads the video spot; the music video if there's none
const LEAD_VIDEO = EPK_PERFORMANCE_VIDEO || FEATURED_VIDEO;

// The stage plot: the stage from above, audience at the bottom. Burnell at
// center with his flute and bowls; the laptop / DJ table upstage; a guest's
// spot dashed (only when one's booked). A wedge in front of each.
const StagePlot = () => {
  const gold = "rgba(232,205,140,0.95)";
  const dim = "rgba(255,255,255,0.38)";
  const wedge = (x, y, dashed) => (
    <path d={`M${x - 14} ${y} h28 l-5 10 h-18 z`} fill="none" stroke={dashed ? dim : gold} strokeDasharray={dashed ? "3 3" : undefined} />
  );
  const spot = (x, y, label, sub, dashed) => (
    <g>
      <circle cx={x} cy={y} r={19} fill={dashed ? "none" : "rgba(214,179,101,0.16)"} stroke={dashed ? dim : gold} strokeDasharray={dashed ? "4 4" : undefined} />
      <text x={x} y={y + 34} textAnchor="middle" fill={dashed ? dim : gold} fontSize="10" letterSpacing="1">{label}</text>
      <text x={x} y={y + 46} textAnchor="middle" fill={dim} fontSize="8">{sub}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 320 250" className="w-full" role="img" aria-label="Stage plot">
      <rect x="6" y="6" width="308" height="220" rx="10" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.15)" />
      <text x="160" y="24" textAnchor="middle" fill={dim} fontSize="8.5" letterSpacing="2">UPSTAGE</text>
      {/* the laptop / DJ table, upstage center */}
      <rect x="120" y="34" width="80" height="22" rx="3" fill="none" stroke={gold} />
      <text x="160" y="49" textAnchor="middle" fill={gold} fontSize="8.5" letterSpacing="1">LAPTOP / DJ</text>
      <text x="160" y="68" textAnchor="middle" fill={dim} fontSize="8">ch 3–4 stereo DI · ⚡ power</text>
      {wedge(222, 40, false)}
      {spot(160, 118, "BURNELL", "ch 1 vocal · ch 2 flute · ch 5 bowls", false)}
      <text x="160" y="94" textAnchor="middle" fill={gold} fontSize="8.5">⚡</text>
      {spot(262, 118, "GUEST", "ch 6 vocal", true)}
      {wedge(160, 186, false)}
      {wedge(262, 186, true)}
      <text x="160" y="242" textAnchor="middle" fill={dim} fontSize="8.5" letterSpacing="2">AUDIENCE</text>
    </svg>
  );
};

// Folded until opened: the lineup shows on the closed card.
const TechRider = () => (
  <details data-testid="tech-rider" className="group mt-10 rounded-xl border border-white/12 bg-black/30 px-5 py-4 text-left sm:px-6">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
      <span>
        <span className="font-display block text-xl text-white">Stage Plot &amp; Tech Rider</span>
        <span className="font-body mt-1 block text-xs leading-relaxed text-white/45">{TECH_RIDER.lineup}</span>
      </span>
      <span className="font-accent shrink-0 text-xs uppercase tracking-[0.15em] text-[var(--sm-gold)] group-open:hidden">View</span>
      <span className="font-accent hidden shrink-0 text-xs uppercase tracking-[0.15em] text-[var(--sm-gold)] group-open:inline">Close</span>
    </summary>
    <div className="mt-5">
      <StagePlot />
      <p className="font-body mt-4 text-xs text-white/60">
        Set length: {TECH_RIDER.setLength} · {TECH_RIDER.changeover}
      </p>
      <p className="font-accent mt-5 text-xs uppercase tracking-[0.15em] text-[var(--sm-gold)]">Input List</p>
      <table className="font-body mt-2 w-full text-xs text-white/70">
        <thead>
          <tr className="border-b border-white/15 text-left text-[0.65rem] uppercase tracking-[0.12em] text-white/40">
            <th className="py-1.5 pr-3 font-normal">Ch</th>
            <th className="py-1.5 pr-3 font-normal">Source</th>
            <th className="py-1.5 font-normal">Mic / DI</th>
          </tr>
        </thead>
        <tbody>
          {TECH_RIDER.inputs.map((r) => (
            <tr key={r.ch} className="border-b border-white/[0.08] align-top">
              <td className="whitespace-nowrap py-1.5 pr-3 tabular-nums text-white/45">{r.ch}</td>
              <td className="py-1.5 pr-3 text-white/85">{r.source}</td>
              <td className="py-1.5 text-white/55">{r.mic}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="font-body mt-3 text-xs text-white/60">Monitors: {TECH_RIDER.monitors}</p>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {[
          ["Venue Provides", TECH_RIDER.venueProvides],
          ["Artist Brings", TECH_RIDER.artistBrings],
        ].map(([h, list]) => (
          <div key={h}>
            <p className="font-accent text-xs uppercase tracking-[0.15em] text-[var(--sm-gold)]">{h}</p>
            <ul className="font-body mt-2 space-y-1 text-xs text-white/65">
              {list.map((x) => (
                <li key={x}>· {x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </details>
);

// Real booking form fields, matching the live sierramarin.com EPK booking
// form's actual question set (re-fetched for this build) — new styling,
// same content/fields, not invented. No backend to submit to, so this opens
// a pre-filled mailto: to the dedicated booking inbox (see BOOKING_EMAIL) —
// a genuinely working, zero-backend submission path.
const BookingForm = () => {
  const [fields, setFields] = useState({
    name: "",
    email: "",
    event: "",
    dateLocation: "",
    budget: "",
    details: "",
  });

  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Booking Inquiry: ${fields.event || ARTIST_NAME}`);
    const body = encodeURIComponent(
      `First & Last Name: ${fields.name}\nEmail: ${fields.email}\nEvent/Festival: ${fields.event}\nEvent Date(s) & Location: ${fields.dateLocation}\nEstimated Budget Range: ${fields.budget}\nAdditional Details: ${fields.details}`
    );
    window.location.href = `mailto:${BOOKING_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
      <input
        required
        placeholder="First & Last Name*"
        value={fields.name}
        onChange={set("name")}
        className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/40 focus:border-[var(--sm-gold)]/60 focus:outline-none"
      />
      <input
        required
        type="email"
        placeholder="Email*"
        value={fields.email}
        onChange={set("email")}
        className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/40 focus:border-[var(--sm-gold)]/60 focus:outline-none"
      />
      <input
        required
        placeholder="Event/Festival*"
        value={fields.event}
        onChange={set("event")}
        className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/40 focus:border-[var(--sm-gold)]/60 focus:outline-none sm:col-span-2"
      />
      <input
        required
        placeholder="Event Date(s) & Location*"
        value={fields.dateLocation}
        onChange={set("dateLocation")}
        className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/40 focus:border-[var(--sm-gold)]/60 focus:outline-none sm:col-span-2"
      />
      <input
        placeholder="Estimated Budget Range"
        value={fields.budget}
        onChange={set("budget")}
        className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/40 focus:border-[var(--sm-gold)]/60 focus:outline-none sm:col-span-2"
      />
      <textarea
        placeholder="Additional Details"
        value={fields.details}
        onChange={set("details")}
        rows={3}
        className="rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/40 focus:border-[var(--sm-gold)]/60 focus:outline-none sm:col-span-2"
      />
      <button
        type="submit"
        className="mt-1 rounded-full bg-[var(--sm-gold)] px-8 py-3 font-body text-sm font-medium text-black transition-colors hover:bg-[var(--sm-gold-light)] sm:col-span-2"
      >
        Submit Booking Inquiry
      </button>
      <p className="font-body text-xs text-white/40 sm:col-span-2">
        We review all inquiries personally and respond with next steps.
      </p>
    </form>
  );
};

export default function EPK() {
  return (
    <div className="starfield relative min-h-screen">
      <Navbar />
      <main className="relative mx-auto max-w-4xl px-6 pb-10 pt-40 text-center">
        {/* Header / info */}
        <Reveal>
          <span className="overline">Electronic Press Kit</span>
          <h1 className="font-display mt-5 text-5xl font-normal text-[var(--sm-text)] sm:text-6xl">{ARTIST_NAME}</h1>
          {/* the location starts its own line, after the dash */}
          <p className="font-accent mt-4 text-base italic text-white/60">
            {EPK_SUBTITLE.split(/\s+—\s+/).map((part, i, all) => (
              <span key={i} className="block">
                {part}
                {i < all.length - 1 && " —"}
              </span>
            ))}
          </p>
          {/* his music first: songs to play right here, and where to hear the rest */}
          <TrackPlayer tracks={EPK_TRACKS} cover={EPK_COVER} className="mx-auto mt-7 max-w-sm" />
          <div className="mx-auto mt-4 flex max-w-md flex-wrap items-center justify-center gap-2">
            {STREAMING_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 px-4 py-1.5 font-accent text-[0.65rem] uppercase tracking-[0.18em] text-white/75 transition-colors hover:border-[var(--sm-gold)]/60 hover:text-[var(--sm-gold-light)]"
              >
                {l.label}
              </a>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="font-accent mt-10 text-sm uppercase tracking-[0.2em] text-[var(--sm-gold)]">{EPK_BANNER_TEXT}</p>
        </Reveal>

        {/* Slow-scrolling festival-name ticker — genuinely slow, ambient,
            readable at a glance without needing to track it. */}
        <Reveal delay={0.12}>
          <div
            className="mt-8 overflow-hidden"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
              maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            }}
          >
            <div className="marquee-track">
              {[...FESTIVALS, ...FESTIVALS].map((f, i) => (
                <span
                  key={i}
                  className="font-accent shrink-0 px-6 text-xs uppercase tracking-[0.25em] text-white/35"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-6 flex items-center justify-center gap-7">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-accent text-xs uppercase tracking-[0.2em] text-white/55 transition-colors hover:text-[var(--sm-gold-light)]"
              >
                {s.label}
              </a>
            ))}
          </div>
        </Reveal>

      </main>

      {/* Two-column layout: gallery (left, smaller thumbnails) / all EPK
          info — stats, performance video, Shared Stages, Direct Support,
          booking form (right) — so the booking CTA is reachable without
          scrolling past a large gallery block first. On mobile, the info
          column renders first (order-1) for the same reason; the gallery
          reads left-to-right as intended only at the lg breakpoint. */}
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pb-32 lg:grid-cols-[1fr_1.15fr] lg:items-start lg:gap-14">
        {/* The gallery stays in view (sticky) while the longer info column
            scrolls past it on computers. Photos load normally: Safari never
            loads lazy images inside a multi-column layout. */}
        <Reveal className="order-2 lg:sticky lg:top-24 lg:order-1" delay={0.2}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="overline">Press Photos</span>
            <a
              href={PRESS_ZIP}
              download
              data-testid="press-zip"
              className="flex items-center gap-1.5 rounded-full border border-[var(--sm-gold)]/40 px-4 py-1.5 font-body text-xs text-[var(--sm-gold-light)] transition-colors hover:bg-[var(--sm-gold)]/10"
            >
              <Download size={13} /> Download all
            </a>
          </div>
          <div className="columns-3 gap-2 sm:columns-4 lg:columns-3">
            {EPK_GALLERY.map((src) => (
              <a
                key={src}
                href={pressPhoto(src)}
                download
                aria-label="Download this photo, full size"
                className="group relative mb-2 block break-inside-avoid overflow-hidden rounded-lg border border-white/10 bg-black/40"
              >
                <img src={src} alt={ARTIST_NAME} className="block w-full object-cover" decoding="async" />
                <span className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white/85 transition-colors group-hover:bg-[var(--sm-gold)] group-hover:text-black">
                  <Download size={12} />
                </span>
              </a>
            ))}
          </div>
          <p className="font-body mt-2 text-[0.65rem] text-white/35">Tap any photo to download it full size.</p>
        </Reveal>

        <div className="order-1 text-center lg:order-2 lg:text-left">
          {/* A live performance leads the info column (his music video if
              there's none); stats follow beneath it. */}
          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-xl border border-white/10 shadow-[0_40px_140px_-30px_rgba(214,179,101,0.3)]">
              <iframe
                data-testid="epk-performance-video"
                className="aspect-video w-full"
                src={`https://www.youtube.com/embed/${LEAD_VIDEO.id}`}
                title={`${ARTIST_NAME} — ${LEAD_VIDEO.title}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-2">
              {EPK_STATS.map((s) => (
                <div key={s.label}>
                  <p className="font-display text-4xl text-[var(--sm-gold-light)]">{s.value}</p>
                  <p className="font-body mt-1 text-xs uppercase tracking-[0.15em] text-white/50">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Selected Performances — combined festival history + artists
              she's shared stages with, under one heading (industry-standard
              naming, not creative naming). Direct Support now leads, before
              the festival list, and stays visually distinct (its own
              labeled line), not blended in. */}
          <Reveal delay={0.2}>
            <div className="mt-10">
              <span className="overline">Selected Performances</span>
              <p className="font-accent mt-4 text-xs uppercase tracking-[0.15em] text-[var(--sm-gold)]">Shared Stages With</p>
              <p className="font-body mt-2 text-sm leading-relaxed text-white/70">{EPK_SHARED_STAGES.join(", ")} &amp; countless others.</p>
              <p className="font-accent mt-6 text-xs uppercase tracking-[0.15em] text-[var(--sm-gold)]">Produced For</p>
              <p className="font-body mt-2 text-sm leading-relaxed text-white/70">{EPK_PRODUCED_FOR.join(", ")} &amp; more.</p>
              <p className="font-accent mt-6 text-xs uppercase tracking-[0.15em] text-[var(--sm-gold)]">Songs Written With</p>
              <p className="font-body mt-2 text-sm leading-relaxed text-white/70">{EPK_WRITTEN_WITH.join(", ")} &amp; more.</p>
              <p className="font-accent mt-6 text-xs uppercase tracking-[0.15em] text-[var(--sm-gold)]">Festivals</p>
              <p className="font-body mt-2 text-sm leading-loose text-white/55">{FESTIVALS.join(" · ")}</p>
              <p className="font-accent mt-6 text-xs uppercase tracking-[0.15em] text-[var(--sm-gold)]">Notable Venues</p>
              <p className="font-body mt-2 text-sm leading-loose text-white/55">{NOTABLE_VENUES.join(" · ")}</p>
            </div>
          </Reveal>

          <Reveal delay={0.22}>
            <div className="mt-10">
              <span className="overline">Press</span>
              {PRESS_QUOTES.length > 0 && (
                <div className="mt-5 space-y-6">
                  {PRESS_QUOTES.map((q) => (
                    <figure key={q.quote}>
                      <blockquote className="font-accent text-lg italic leading-snug text-white/85">“{q.quote}”</blockquote>
                      <figcaption className="font-body mt-1.5 text-xs uppercase tracking-[0.15em] text-white/45">
                        {q.href ? (
                          <a href={q.href} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--sm-gold-light)]">
                            {q.source}
                          </a>
                        ) : (
                          q.source
                        )}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
              <p className="font-body mt-4 text-sm leading-loose text-white/70">{PRESS_FEATURES.join(" · ")}</p>
              <ul className="mt-4 space-y-2">
                {PRESS_LINKS.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-accent text-sm italic text-[var(--sm-gold-light)] underline decoration-[var(--sm-gold)]/40 underline-offset-4 transition-colors hover:text-white"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.24}>
            <TechRider />
          </Reveal>

          {/* Booking — directly beneath the info column, no gallery block
              between it and the rest of the page content. */}
          <Reveal delay={0.25}>
            <div className="mt-10 rounded-xl border border-[var(--sm-gold)]/30 px-6 py-8 sm:px-8">
              <h2 className="font-display text-2xl text-white sm:text-3xl">Submit a Booking Request</h2>
              <p className="font-accent mt-2 text-sm italic text-white/60">{BOOKING_STATUS}</p>
              <p className="font-body mt-1 text-xs text-white/45">{BOOKING_COPY}</p>
              <BookingForm />
            </div>
          </Reveal>
        </div>
      </div>
      <Footer />
    </div>
  );
}
