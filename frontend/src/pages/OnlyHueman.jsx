import { useState } from "react";
import { Link } from "react-router-dom";
import { Apple, Music2, Youtube } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { CDAnimation } from "@/components/site/CDAnimation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { NEW_RELEASE } from "@/data/site";

const PLATFORM_ICONS = { Spotify: Music2, "Apple Music": Apple, YouTube: Youtube };

// Once the disc lands, the case fades out slowly and the streaming links
// fade in quickly over the same spot (overlapping the fade-out); the title
// clears first so the two never sit on top of each other.
const FADE_OUT_MS = 2000;
const FADE_IN_MS = 600;
const TITLE_FADE_OUT_MS = 400;

// The new single: tap the case to open it, then stream it. The link the
// announcement bubble points at, and a link-in-bio destination.
export default function OnlyHueman() {
  const isMobile = useIsMobile();
  const [revealed, setRevealed] = useState(false);
  // the opened case is two panels wide: 0.55 keeps it inside a phone screen
  const scale = isMobile ? 0.55 : 1;

  return (
    <div className="starfield relative min-h-screen bg-[var(--sm-black)]">
      <div className="fixed inset-0 z-0" style={{ background: "radial-gradient(ellipse at 50% 20%, rgba(120,150,190,0.16) 0%, transparent 60%)" }} />
      <Navbar />
      <main className="relative z-10 flex min-h-screen flex-col items-center px-4 pb-24 pt-28">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="text-center" style={{ opacity: revealed ? 0 : 1, transition: `opacity ${TITLE_FADE_OUT_MS}ms ease` }}>
            <span className="font-cinzel text-[0.62rem] uppercase tracking-[0.4em] text-[var(--sm-gold)]">{NEW_RELEASE.kind}</span>
            <h1 className="font-display mt-3 text-4xl font-normal text-[var(--sm-text)] sm:text-5xl">{NEW_RELEASE.title}</h1>
            <p className="font-body mt-2 text-sm font-light italic text-white/50">{NEW_RELEASE.subtitle}</p>
          </div>

          <div className="relative mt-8 flex items-center justify-center" style={{ minHeight: isMobile ? "15rem" : undefined }}>
            <div style={{ opacity: revealed ? 0 : 1, transition: `opacity ${FADE_OUT_MS}ms ease`, pointerEvents: revealed ? "none" : "auto" }}>
              <CDAnimation onSettled={() => setRevealed(true)} scale={scale} />
            </div>

            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
              style={{ opacity: revealed ? 1 : 0, transition: `opacity ${FADE_IN_MS}ms ease`, pointerEvents: revealed ? "auto" : "none" }}
            >
              <h2 className="font-cinzel text-xs uppercase tracking-[0.32em] text-[var(--sm-gold)]">Listen Now</h2>
              <div className="mt-7 flex w-full max-w-xs flex-col items-center gap-4">
                {NEW_RELEASE.links.map((s) => {
                  const Icon = PLATFORM_ICONS[s.label] || Music2;
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`release-link-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-2.5 font-accent text-xs uppercase tracking-[0.18em] text-white/85 transition-all duration-300 hover:border-[var(--sm-gold)]/60 hover:text-[var(--sm-gold-light)]"
                    >
                      <Icon size={14} /> {s.label}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 flex w-full flex-col items-center text-center">
          <span className="overline">Stay Close</span>
          <h2 className="font-display mt-3 text-2xl font-normal text-[var(--sm-text)] sm:text-3xl">Hear it first, every time</h2>
          <p className="font-body mt-3 max-w-sm text-sm font-light text-white/60">New music, shows, and the stories behind the songs, straight from Burnell.</p>
          <Link
            to="/community"
            className="mt-7 inline-flex rounded-full bg-[var(--sm-gold)] px-8 py-3.5 font-body text-sm font-medium text-black transition-colors hover:bg-[var(--sm-gold-light)]"
          >
            Join the Family
          </Link>
        </div>
      </main>
    </div>
  );
}
