import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Fireflies } from "@/components/site/Fireflies";
import { SOCIALS, ARTIST_NAME, FEATURED_VIDEO } from "@/data/site";
import { useIsMobile } from "@/hooks/useIsMobile";

// Mobile-only discrete slide gesture tuning. Desktop's continuous
// scroll-scrub (stageOpacity/p below) is completely untouched by any of
// this — mobile just picks a different opacity source per stage at render
// time (see `op` in the map below) and drives `slide` via its own
// touch/wheel handlers instead of `p`.
const SWIPE_THRESHOLD_PX = 60;
const WHEEL_THRESHOLD_PX = 35;
const CROSSFADE_MS = 500;

// Pinned documentary: chapter crossfades, feathered memory-media treatment,
// cinematic grading — mechanism carried over from the LightStorm template's
// About.jsx, now filled in with Sierra's real story (lightly trimmed/
// reordered for flow, two short connective bridge lines added — no content
// invented or reinterpreted beyond that).
//
// Ambient audio slot: intentionally left EMPTY on this page per the client's
// direction (an earlier candidate track was considered and removed — the
// closing performance video below carries the page's musical moment
// instead). No <audio> element is rendered here; this comment documents the
// decision so a future reader doesn't assume it was simply forgotten.

const GRADE_DREAM = "saturate(1.08) brightness(1.07) contrast(0.95) sepia(0.07)";
const GRADE_WARM = "saturate(1.2) brightness(1.05) contrast(1.04) sepia(0.03)";
const gradeFor = (i) => (i <= 2 ? GRADE_DREAM : GRADE_WARM);

const FEATHER =
  "radial-gradient(ellipse 80% 84% at 50% 50%, #000 56%, rgba(0,0,0,0.45) 80%, rgba(0,0,0,0) 100%)";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

// Four corner-fade overlays for the plain gallery-grid photos below (the
// pinned-stage photos already get a full elliptical feather via FEATHER
// above) — each is a small radial gradient anchored exactly on one corner,
// opaque at the corner point and fading to transparent moving inward, so
// that corner blends into the page's black background instead of showing
// a hard rectangular line.
const CORNER_FADES = [
  { key: "tl", style: { top: 0, left: 0, background: "radial-gradient(circle at top left, #000 0%, transparent 70%)" } },
  { key: "tr", style: { top: 0, right: 0, background: "radial-gradient(circle at top right, #000 0%, transparent 70%)" } },
  { key: "bl", style: { bottom: 0, left: 0, background: "radial-gradient(circle at bottom left, #000 0%, transparent 70%)" } },
  { key: "br", style: { bottom: 0, right: 0, background: "radial-gradient(circle at bottom right, #000 0%, transparent 70%)" } },
];

// Subtle, understated scroll-continuation cue — same restrained spirit as
// the Portal page's own scroll indicator, not a bold "scroll down" banner.
// Used after the closing portrait and after the performance video, where it
// would otherwise be ambiguous whether the page has more content below.
const ScrollChevron = () => (
  <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center" aria-hidden>
    <ChevronDown size={20} className="text-[var(--sm-gold)]/70" style={{ animation: "breathe 2.4s ease-in-out infinite" }} />
  </div>
);

// A few faint dust specks hugging the photo's inner edge, masked by the same
// FEATHER as the photo itself so they fade out together at the boundary —
// a light "stardust border" rather than a decorative frame.
const DUST_BORDER =
  "radial-gradient(1px 1px at 8% 12%, rgba(255,255,255,0.55), transparent), radial-gradient(1px 1px at 92% 18%, rgba(214,179,101,0.5), transparent), radial-gradient(1px 1px at 15% 88%, rgba(214,179,101,0.45), transparent), radial-gradient(1px 1px at 85% 82%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 50% 6%, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 6% 50%, rgba(255,255,255,0.4), transparent)";

const MemoryMedia = ({ src, scale, grade }) => {
  const mask = { WebkitMaskImage: FEATHER, maskImage: FEATHER };
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Soft starlight glow behind the photo, so it feels integrated into
          the starry background rather than sitting on top of it. */}
      <div
        aria-hidden
        className="animate-breathe pointer-events-none absolute h-[70%] w-[85%] max-w-[90%]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(232,207,154,0.16) 0%, rgba(255,255,255,0.06) 45%, transparent 75%)",
          filter: "blur(28px)",
        }}
      />
      <img
        src={src}
        alt=""
        aria-hidden
        className="pointer-events-none absolute max-h-[82%] max-w-[90%] w-auto"
        style={{ filter: "blur(48px) saturate(1.3)", opacity: 0.4, transform: `scale(${1.12 * scale})` }}
      />
      <img
        src={src}
        alt=""
        className="relative max-h-full max-w-full w-auto select-none"
        style={{ ...mask, filter: grade, transform: `scale(${scale})`, transition: "transform 0.12s linear" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ ...mask, backgroundImage: GRAIN, opacity: 0.1, mixBlendMode: "overlay" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ ...mask, backgroundImage: DUST_BORDER, backgroundRepeat: "no-repeat" }}
      />
    </div>
  );
};

const STAGES = [
  {
    id: "the-beginning",
    kicker: "My Story",
    title: "Where It Began",
    opening: true,
    media: "/burnell-about-01.jpg",
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
    media: "/burnell-about-02.jpg",
    body: [
      "I taught myself how to produce beats and record, and started performing at open mic nights. What began as a way to process my emotions quickly became a devotion — full-length albums, collaborations with local artists, and a whole lot of nights on small stages.",
    ],
    showChevron: true,
  },
  {
    id: "the-rise",
    title: "The Rise",
    media: "/burnell-about-03.jpg",
    body: [
      "Within a few short years I was hosting my own events, opening for huge names, and getting invited on tour with underground hip hop legends. I’ve shared stages with heroes like Snoop Dogg, Mac Miller, Wu-Tang Clan, Nas, and Atmosphere — and I’ve been releasing music and prayerforming regularly since 2009.",
    ],
    showChevron: true,
  },
  {
    id: "the-service",
    title: "Sacred Service",
    media: "/burnell-about-04.jpg",
    body: [
      "I make music because it hurts not to. It’s my favorite way to transmute and alchemize what I feel, and it feels like a sacred service to humanity. I sing for the children, the plants, the animals, and all of humanity.",
    ],
    showChevron: true,
  },
  {
    id: "today",
    title: "Today",
    media: "/burnell-about-05.jpg",
    body: [
      "Through the grace of God, I get to do what I love — travel the world, work with my heroes, and make amazing friends everywhere I go. I got here with the support of my fans, friends, community, mentors, and the Most High.",
    ],
    showChevron: true,
  },
  {
    id: "portrait",
    media: "/burnell-about-portrait.jpg",
    body: ["We are one with nature. We are divine, powerful beings. And this existence is truly a magical gift."],
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

const N = STAGES.length;

function stageOpacity(p, i) {
  const center = (i + 0.5) / N;
  const plateau = 0.3 / N;
  const half = 0.7 / N;
  let d = Math.abs(p - center);
  if (i === 0 && p < center) d = 0;
  if (i === N - 1 && p > center) d = 0;
  if (d <= plateau) return 1;
  if (d >= half) return 0;
  return (half - d) / (half - plateau);
}

export default function About() {
  const ref = useRef(null);
  const stickyRef = useRef(null);
  const [p, setP] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const section = ref.current;
    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const prog = Math.min(1, Math.max(0, -rect.top / total));
      setP(prog);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile: discrete slide index, advanced one at a time by a swipe/scroll
  // gesture rather than tied proportionally to scroll distance. The section
  // itself keeps the exact same DOM (tall spacer + sticky viewport, one
  // persistent fixed background) as desktop — only the gesture handling and
  // the opacity source per stage (see `op` below) differ.
  const [slide, setSlide] = useState(0);
  const lockedRef = useRef(false);
  const touchStartYRef = useRef(0);

  useEffect(() => {
    if (!isMobile) return;
    const el = stickyRef.current;
    if (!el) return;

    const exitForward = () => {
      const section = ref.current;
      const rect = section.getBoundingClientRect();
      // Section's bottom edge (absolute doc position) minus one viewport
      // height is exactly where the sticky viewport fully un-pins; a small
      // buffer past that guarantees the next section is clearly in view
      // rather than landing exactly on the pixel boundary.
      const unpinAt = window.scrollY + rect.bottom - window.innerHeight;
      window.scrollTo({ top: unpinAt + 80, behavior: "smooth" });
    };

    const advance = (dir) => {
      if (lockedRef.current) return;
      if (dir > 0) {
        if (slide < N - 1) {
          lockedRef.current = true;
          setSlide((s) => s + 1);
          setTimeout(() => (lockedRef.current = false), CROSSFADE_MS);
        } else {
          exitForward();
        }
      } else if (dir < 0 && slide > 0) {
        lockedRef.current = true;
        setSlide((s) => s - 1);
        setTimeout(() => (lockedRef.current = false), CROSSFADE_MS);
      }
      // slide === 0, dir < 0: first-slide-backward is an explicit no-op.
    };

    const onTouchStart = (e) => {
      touchStartYRef.current = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      e.preventDefault();
    };
    const onTouchEnd = (e) => {
      const delta = touchStartYRef.current - e.changedTouches[0].clientY;
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
      advance(delta > 0 ? 1 : -1);
    };

    let wheelAccum = 0;
    let wheelResetTimer = null;
    const onWheel = (e) => {
      e.preventDefault();
      wheelAccum += e.deltaY;
      clearTimeout(wheelResetTimer);
      wheelResetTimer = setTimeout(() => (wheelAccum = 0), 200);
      if (Math.abs(wheelAccum) < WHEEL_THRESHOLD_PX) return;
      advance(wheelAccum > 0 ? 1 : -1);
      wheelAccum = 0;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
      clearTimeout(wheelResetTimer);
    };
  }, [isMobile, slide]);

  const pe = (o) => (o > 0.5 ? "auto" : "none");

  return (
    <div data-testid="about-page" className="relative bg-black">
      {/* Fixed cinematic environment — reuses the hero loop asset as a
          placeholder background; no dedicated About video was provided. */}
      <div className="fixed inset-0 z-0 bg-black">
        <img
          data-testid="about-bg-image"
          className="animate-kenburns h-full w-full object-cover"
          src="/burnell-about-bg.jpg"
          alt=""
          aria-hidden
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)" }}
      />
      <div aria-hidden className="haze-drift pointer-events-none fixed inset-0 z-[1]" />
      <Fireflies />

      <Navbar />

      {/* 55vh per stage (down from 90vh) — shorter scroll distance per
          section transition, since the previous ratio made scrolling feel
          almost unresponsive. */}
      <section ref={ref} className="relative z-10" style={{ height: `${N * 55}vh` }}>
        <div ref={stickyRef} className="sticky top-0 h-screen w-full overflow-hidden">
          {STAGES.map((s, i) => {
            const op = isMobile ? (slide === i ? 1 : 0) : stageOpacity(p, i);
            const segStart = i / N;
            const segEnd = (i + 1) / N;
            const local = Math.min(1, Math.max(0, (p - segStart) / (segEnd - segStart)));
            const contentScale = 0.95 + 0.05 * op;
            const imgScale = 1 + 0.07 * local;

            // Invitation beat — closing CTA, routes to Community (the
            // text-list signup landing page), not Contact.
            if (s.cta) {
              return (
                <div
                  key={s.id}
                  data-testid={`about-stage-${s.id}`}
                  className="absolute inset-0 z-20 flex items-center justify-center px-6 text-center"
                  style={{ opacity: op, pointerEvents: pe(op), transition: isMobile ? `opacity ${CROSSFADE_MS}ms ease` : "none" }}
                >
                  <div
                    className="relative flex flex-col items-center"
                    style={{ transform: `scale(${contentScale})`, transition: "transform 0.1s linear" }}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[160%] w-[150%] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
                      style={{
                        background:
                          "radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.42) 45%, rgba(0,0,0,0) 74%)",
                        filter: "blur(18px)",
                      }}
                    />
                    <img src="/burnell-emblem.png" alt="" aria-hidden className="h-16 w-auto object-contain opacity-90" />
                    <h2 className="font-display mt-8 max-w-xl text-3xl font-normal leading-tight text-white sm:text-4xl text-legible">
                      If you feel it, <span className="text-gold-grad">you’re already soul fam.</span>
                    </h2>
                    <Link
                      to="/community"
                      data-testid="about-cta"
                      className="mt-9 inline-flex rounded-full bg-[var(--sm-gold)] px-8 py-3.5 font-body text-sm font-medium text-black transition-colors hover:bg-[var(--sm-gold-light)]"
                    >
                      Join the Family
                    </Link>
                    <p className="font-display mt-10 text-lg font-normal text-white text-legible">— {ARTIST_NAME}</p>
                  </div>
                </div>
              );
            }

            // Bridging beat — minimal, text-only, no image.
            if (s.bridge) {
              return (
                <div
                  key={s.id}
                  data-testid={`about-stage-${s.id}`}
                  className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center"
                  style={{ opacity: op, pointerEvents: pe(op), transition: isMobile ? `opacity ${CROSSFADE_MS}ms ease` : "none" }}
                >
                  <p
                    className="font-accent max-w-lg text-2xl font-normal italic leading-snug text-white/85 text-legible sm:text-3xl"
                    style={{ transform: `scale(${contentScale})`, transition: "transform 0.1s linear" }}
                  >
                    {s.body}
                  </p>
                  {s.showChevron && <ScrollChevron />}
                </div>
              );
            }

            // Closing performance video — introduced after Section 5's
            // portrait, before the invitation beat. Real title: "Dance:
            // Sierra's Musical Journey to Pure Hearts."
            if (s.video) {
              return (
                <div
                  key={s.id}
                  data-testid={`about-stage-${s.id}`}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
                  style={{ opacity: op, pointerEvents: pe(op), transition: isMobile ? `opacity ${CROSSFADE_MS}ms ease` : "none" }}
                >
                  <span className="font-accent text-[0.6rem] uppercase tracking-[0.4em] text-[var(--sm-gold)]">
                    The one song to understand me
                  </span>
                  <div className="relative mt-6 w-full max-w-3xl overflow-hidden rounded-xl border border-white/10 shadow-[0_40px_140px_-30px_rgba(214,179,101,0.3)]">
                    <iframe
                      data-testid="about-performance-video"
                      className="aspect-video max-h-[62vh] w-full bg-black"
                      src={`https://www.youtube.com/embed/${FEATURED_VIDEO.id}`}
                      title={`${ARTIST_NAME} — ${FEATURED_VIDEO.title}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                  <p className="font-body mt-5 max-w-md text-xs font-light italic text-white/50 text-legible">
                    "{FEATURED_VIDEO.title}" — a simple reminder that the power is within, and life is so beautiful.
                  </p>
                  {s.showChevron && <ScrollChevron />}
                </div>
              );
            }

            return (
              <div
                key={s.id}
                data-testid={`about-stage-${s.id}`}
                className="absolute inset-0 z-10 overflow-y-auto"
                style={{ opacity: op, pointerEvents: pe(op) }}
              >
                <div className="mx-auto grid min-h-full max-w-7xl grid-cols-1 items-start gap-7 px-6 pb-16 pt-24 lg:h-full lg:grid-cols-5 lg:items-center lg:gap-16 lg:px-8 lg:pb-12 lg:pt-16">
                  <div className="order-2 lg:order-1 lg:col-span-2">
                    <div
                      className="relative"
                      style={{ transform: `scale(${contentScale})`, transition: "transform 0.1s linear", transformOrigin: "left center" }}
                    >
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10 rounded-[40%]"
                        style={{
                          background:
                            "radial-gradient(ellipse at center, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.32) 50%, rgba(0,0,0,0) 78%)",
                          filter: "blur(20px)",
                        }}
                      />
                      {s.opening && (
                        <span className="font-accent block text-[0.6rem] uppercase tracking-[0.4em] text-[var(--sm-gold)] sm:text-xs">
                          {s.kicker}
                        </span>
                      )}
                      {s.title && (
                        <h2
                          className={`font-display text-2xl font-normal text-[var(--sm-text)] text-legible sm:text-3xl ${s.opening ? "mt-2" : ""}`}
                        >
                          {s.title}
                        </h2>
                      )}
                      {/* Body/paragraph text: Cormorant Garamond (font-accent),
                          a genuine reading serif — Cinzel (font-display) is
                          reserved for headlines/titles only, since a display
                          face styled at paragraph length is what made this
                          not read right in the previous pass. */}
                      <div className={`${s.opening || s.title ? "mt-4" : ""} space-y-4`}>
                        {s.body.map((para, j) => (
                          <p
                            key={j}
                            className="font-accent text-lg font-normal leading-relaxed text-white/90 text-legible sm:text-xl lg:text-2xl"
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="order-1 lg:order-2 lg:col-span-3">
                    <div className="relative flex h-[36vh] items-center justify-center sm:h-[46vh] lg:h-[78vh]">
                      <MemoryMedia src={s.media} scale={imgScale} grade={gradeFor(i)} />
                    </div>
                  </div>
                  {s.showChevron && <ScrollChevron />}
                </div>
              </div>
            );
          })}

          <div
            className="absolute bottom-0 left-0 z-40 h-[2px] bg-gradient-to-r from-[var(--sm-gold-accent)] to-[var(--sm-gold-light)]"
            style={{
              width: isMobile ? `${((slide + 1) / N) * 100}%` : `${p * 100}%`,
              opacity: 0.7,
              transition: isMobile ? `width ${CROSSFADE_MS}ms ease` : "none",
            }}
          />
        </div>
      </section>

      {/* Remaining childhood photos (only the strongest one is used above in
          Section 1) — overflow destination now that the standalone Photos
          page has been folded into EPK's gallery instead. Applies to both
          mobile and desktop: unlike the pinned-stage photos above (which
          already get a full elliptical feather + starlight glow via
          MemoryMedia), these had a plain hard-edged rectangular border —
          now get the same starlight glow behind them, plus each of the
          four corners fading into the background instead of a hard line. */}
      <div className="relative z-10 bg-black py-24 text-center">
        <span className="overline">From the Canyon</span>
        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-4 px-6">
          {["/burnell-cave.jpg", "/burnell-canyon.jpg"].map((src) => (
            <div key={src} className="relative w-72">
              <div
                aria-hidden
                className="animate-breathe pointer-events-none absolute -inset-4"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(232,207,154,0.18) 0%, rgba(255,255,255,0.06) 45%, transparent 75%)",
                  filter: "blur(20px)",
                }}
              />
              <div className="relative overflow-hidden rounded-lg">
                <img src={src} alt={ARTIST_NAME} className="w-full object-cover" />
                {CORNER_FADES.map((corner) => (
                  <div key={corner.key} aria-hidden className="pointer-events-none absolute h-16 w-16" style={corner.style} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex items-center justify-center gap-7">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-accent text-xs uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-[var(--sm-gold-light)]"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
