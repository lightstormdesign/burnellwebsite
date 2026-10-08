import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/site/Reveal";
import { TourFlyer } from "@/components/site/TourFlyer";
import { Droplet } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { TOUR_DATES, TOUR_INTRO_LINE_1, TOUR_INTRO_LINE_2, TOUR_TICKETS_URL, TOUR_FLYER_TITLE } from "@/data/site";

export default function Tour() {
  const isMobile = useIsMobile();
  return (
    <div className="starfield relative min-h-screen">
      <div
        className="fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(214,179,101,0.14) 0%, transparent 65%)" }}
      />
      <Navbar />
      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-32 pt-40 text-center">
        <Reveal>
          <span className="overline">Tour</span>
          <h1 className="font-display mt-5 text-5xl font-normal text-[var(--sm-text)] sm:text-6xl">Tour Dates</h1>
          <h2 className="font-accent mt-3 text-sm uppercase tracking-[0.2em] text-[var(--sm-gold)]">Where I'll Be Next</h2>
          {/* Desktop: explicit two-line break, first line ends with
              "communities," second begins "across" and ends with a period.
              Mobile: at phone widths this wrapped to 3 lines instead of 2 —
              the break point shifts one word earlier ("communities" moves
              to line 2) so it holds at 2 lines. Heart stays right after the
              text, inline, on whichever line it naturally ends up on. */}
          <p className="font-body mx-auto mt-6 max-w-lg text-sm font-light leading-relaxed text-white/60">
            {TOUR_INTRO_LINE_1}
            {isMobile ? " " : <br />}
            {TOUR_INTRO_LINE_2} <Droplet size={13} className="inline-block align-middle text-[var(--sm-turquoise)]" />
          </p>
        </Reveal>

        {/* The Virgo constellation visualization (VirgoConstellation.jsx)
            is retired here — file's untouched/unused, kept as a reference
            for future sites. */}
        <Reveal delay={0.2}>
          <div className="mt-16">
            <TourFlyer title={TOUR_FLYER_TITLE} dates={TOUR_DATES} />
          </div>
        </Reveal>

        {/* Single site-wide CTA (supersedes the earlier per-date ticket
            icons) — one consistent, understated link rather than repeating
            the same URL next to every row. */}
        <Reveal delay={0.25}>
          <a
            href={TOUR_TICKETS_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="tour-get-tickets-link"
            className="animate-text-glow-pulse font-accent mt-12 inline-block text-sm uppercase tracking-[0.2em] text-[var(--sm-gold-light)] underline decoration-[var(--sm-gold)]/50 underline-offset-4 transition-colors hover:text-white"
          >
            Follow on Bandsintown
          </a>
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}
