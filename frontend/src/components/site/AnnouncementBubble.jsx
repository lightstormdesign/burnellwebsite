import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HERO_ANNOUNCEMENT } from "@/data/site";

// Swappable "current announcement" bubble, bottom-left. Appears a few
// seconds after `active` turns on (not immediately). Content comes entirely
// from HERO_ANNOUNCEMENT in data/site.js, so a new release is a one-line
// edit, not a code change. `compact` is the mobile size: narrow enough to
// sit beside the mobile Home's centered scroll cue without touching it.
export const AnnouncementBubble = ({ active, compact = false }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), compact ? HERO_ANNOUNCEMENT.appearDelayMobileMs : HERO_ANNOUNCEMENT.appearDelayMs);
    return () => clearTimeout(t);
  }, [active, compact]);

  return (
    <div
      data-testid="hero-announcement"
      className={`pointer-events-none fixed z-40 ${compact ? "bottom-4 left-4" : "bottom-6 left-6"}`}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      <Link
        to={HERO_ANNOUNCEMENT.to}
        tabIndex={show ? 0 : -1}
        className={`flex items-center rounded-2xl border border-white/15 bg-black/55 backdrop-blur-md transition-colors hover:border-[var(--sm-gold)]/50 ${
          show ? "pointer-events-auto" : ""
        } ${compact ? "gap-2.5 py-2 pl-2 pr-3.5" : "gap-3 px-4 py-3"}`}
      >
        <img
          src={active ? HERO_ANNOUNCEMENT.image : undefined}
          alt=""
          className={`rounded-md object-cover shadow-lg ${compact ? "h-10 w-10" : "h-12 w-12"}`}
        />
        <span className={`text-left ${compact ? "max-w-[6.5rem]" : "max-w-[13rem]"}`}>
          {compact ? (
            <>
              <span className="font-cinzel block text-[0.5rem] uppercase tracking-[0.22em] text-[var(--sm-gold)]">{HERO_ANNOUNCEMENT.kicker}</span>
              <span className="font-display block text-sm leading-tight text-white">{HERO_ANNOUNCEMENT.title}</span>
            </>
          ) : (
            <>
              <span className="font-body block text-xs leading-snug text-white/85">{HERO_ANNOUNCEMENT.message}</span>
              <span className="font-accent mt-0.5 block text-[0.6rem] uppercase tracking-[0.15em] text-[var(--sm-gold-light)]">
                {HERO_ANNOUNCEMENT.linkLabel}
              </span>
            </>
          )}
        </span>
      </Link>
    </div>
  );
};

export default AnnouncementBubble;
