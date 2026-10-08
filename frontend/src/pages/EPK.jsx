import { useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/site/Reveal";
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
} from "@/data/site";

// Two source sets: EPK's own numbered photo set (mostly stage/performance
// shots) and the general Gallery photos (mostly personal/candid) folded in
// from the removed standalone Photos page. Kept as separate arrays here only
// so they can be deliberately interleaved below — the previous pass had them
// clustered as two visually separate blocks (all stage shots, then all
// candid shots), which read as segmented rather than varied.
const EPK_PHOTOS = Array.from({ length: 13 }, (_, i) => `/burnell-epk-${String(i + 1).padStart(2, "0")}.jpg`);

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
          <p className="font-accent mt-4 text-base italic text-white/60">{EPK_SUBTITLE}</p>
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
        {/* Thin gold divider between the gallery and info column, styled
            like a subtle spotlight beam (angled, tapering at both ends) —
            desktop only, where the two-column layout actually applies. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-10 hidden w-px lg:block"
          style={{
            left: "44.5%",
            transform: "rotate(4deg)",
            background: "linear-gradient(to bottom, transparent 0%, rgba(214,179,101,0.32) 20%, rgba(214,179,101,0.32) 80%, transparent 100%)",
          }}
        />
        <Reveal className="order-2 lg:order-1" delay={0.2}>
          <div className="columns-3 gap-2 sm:columns-4 lg:columns-3">
            {EPK_GALLERY.map((src) => (
              <div key={src} className="mb-2 break-inside-avoid overflow-hidden rounded-lg border border-white/10 bg-black/40">
                <img src={src} alt={ARTIST_NAME} className="w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </Reveal>

        <div className="order-1 text-center lg:order-2 lg:text-left">
          {/* New EPK performance video — leads the info column now, stats
              follow beneath it. */}
          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-xl border border-white/10 shadow-[0_40px_140px_-30px_rgba(214,179,101,0.3)]">
              <iframe
                data-testid="epk-performance-video"
                className="aspect-video w-full"
                src={`https://www.youtube.com/embed/${FEATURED_VIDEO.id}`}
                title={`${ARTIST_NAME} — ${FEATURED_VIDEO.title}`}
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
