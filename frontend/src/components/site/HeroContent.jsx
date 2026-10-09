import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HERO_CTA, HERO_TAGLINE, HERO_BIO, HERO_BIO_MOBILE, HERO_ANNOUNCEMENT, ARTIST_NAME, LOGO } from "@/data/site";

const EASE = [0.22, 1, 0.36, 1];
const fade = (delay) => ({
  hidden: { opacity: 0, filter: "blur(10px)" },
  show: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.9, delay, ease: EASE } },
});
const wipeV = {
  hidden: { opacity: 0, clipPath: "inset(0 100% 0 0)" },
  show: { opacity: 1, clipPath: "inset(0 0% 0 0)", transition: { duration: 1.0, delay: 0.25, ease: EASE } },
};

// Mobile-only entrance pacing — each element's fade-in lasts a full 2s
// (cinematic, not the snappier desktop timing above). Desktop's `fade`/
// `wipeV` above are untouched.
const fadeMobile = (delay) => ({
  hidden: { opacity: 0, filter: "blur(10px)" },
  show: { opacity: 1, filter: "blur(0px)", transition: { duration: 2, delay, ease: EASE } },
});
const wipeVMobile = {
  hidden: { opacity: 0, clipPath: "inset(0 100% 0 0)" },
  show: { opacity: 1, clipPath: "inset(0 0% 0 0)", transition: { duration: 2, delay: 0.25, ease: EASE } },
};

// Swappable "current announcement" bubble — appears a few seconds after Hero
// content fades in (not immediately), bottom-right. Content driven entirely
// by HERO_ANNOUNCEMENT in data/site.js so it's a one-line edit to update for
// future releases, not a code change.
// Lifted clear of the HeroFrame illustration: centered above the deer on
// mobile, and inset past the right-hand forest edge on desktop.
const BUBBLE_POSITION = {
  mobile: { bottom: "19svh", left: 0, right: 0, display: "flex", justifyContent: "center" },
  desktop: { bottom: "31svh", right: "calc(22svh + 1.5rem)" },
};

const AnnouncementBubble = ({ active, mobile }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    // Bubble is `position: fixed`, so it doesn't inherit the Hero layer's
    // scroll-driven opacity — hide it explicitly when scrolling back toward
    // Portal, or it would stay visible on top of the wrong screen state.
    if (!active) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), HERO_ANNOUNCEMENT.appearDelayMs);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div
      data-testid="hero-announcement"
      className="pointer-events-none fixed z-40"
      style={{
        ...BUBBLE_POSITION[mobile ? "mobile" : "desktop"],
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      <Link
        to={HERO_ANNOUNCEMENT.to}
        className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/15 bg-black/55 px-4 py-3 backdrop-blur-md transition-colors hover:border-[var(--sm-gold)]/50"
      >
        <img
          src={HERO_ANNOUNCEMENT.image}
          alt={ARTIST_NAME}
          className="h-11 w-11 rounded-full object-cover object-top"
        />
        <span className="max-w-[13rem] text-left">
          <span className="font-body block text-xs leading-snug text-white/85">{HERO_ANNOUNCEMENT.message}</span>
          <span className="font-accent mt-0.5 block text-[0.6rem] uppercase tracking-[0.15em] text-[var(--sm-gold-light)]">
            {HERO_ANNOUNCEMENT.linkLabel}
          </span>
        </span>
      </Link>
    </div>
  );
};

export const HeroContent = ({ active, mobile = false }) => {
  const [shown, setShown] = useState(false);
  const taglineRef = useRef(null);
  const [bioWidth, setBioWidth] = useState(null);

  useEffect(() => {
    if (active) setShown(true);
  }, [active]);

  // Bio paragraph must be ~5% narrower than the tagline's own rendered
  // width (which is font-driven, not fixed) — measure the tagline directly
  // rather than guessing a fixed rem value. Runs on mount regardless of
  // `shown`/`active`: the tagline's layout width is already final as soon as
  // it's mounted (opacity/blur don't affect box width), and this component
  // is always mounted underneath the Portal, just not yet visible.
  useEffect(() => {
    const measure = () => {
      if (taglineRef.current) setBioWidth(taglineRef.current.offsetWidth);
    };
    measure();
    const t = setTimeout(measure, 950); // re-measure after fonts/the wipe-in transition settle
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const ctl = shown ? "show" : "hidden";

  return (
    <>
      <motion.div
        initial="hidden"
        animate={ctl}
        className={mobile ? "relative flex h-full w-full flex-col items-center justify-center px-4 text-center" : "relative flex h-full w-full flex-col items-center justify-center px-6 text-center"}
        style={{ transform: mobile ? undefined : "translateY(-5%)" }}
      >
        {/* Mobile: emblem/symbol only (no text wordmark), sized large, with
            tagline/bio positioned beneath it exactly as on desktop. Desktop
            keeps the full text+symbol wordmark, untouched.

            Logo and the text block below it (tagline/bio/CTA, see the
            wrapping div further down) now carry independent translateY
            offsets instead of one shared shift on the outer container —
            svh units (not %, which would resolve against each element's
            own — much smaller — height) so "Nsvh" reliably means N% of the
            actual screen regardless of which element it's on. */}
        <motion.img
          variants={mobile ? wipeVMobile : wipeV}
          src={LOGO}
          alt={ARTIST_NAME}
          data-testid="hero-logo"
          className="w-full object-contain"
          style={{ maxWidth: mobile ? "20rem" : "34rem", transform: mobile ? "translateY(-1svh)" : undefined }}
        />

        {/* Mobile: tagline+bio+CTA share one -4svh offset (see the outer
            comment above), independent of the logo's own -1svh — a plain
            div wrapper just for that, `display: contents` on desktop so it
            adds nothing to that layout. */}
        <div className={mobile ? "flex flex-col items-center" : "contents"} style={{ transform: mobile ? "translateY(-4svh)" : undefined }}>
          {/* Tagline + bio unified as one centered group (single fade-in, not
              two independently-timed elements). Desktop: tagline is
              intentionally unconstrained (whitespace-nowrap, no max-width) so
              it stretches to one full line at its natural large size — it's
              fine for it to end up wider than the logo once uncompressed. Bio
              width then tracks 5% narrower than whatever that measures out to.
              Mobile: nowrap-at-desktop-size would overflow a phone viewport
              (there was no mobile path to expose this before), so it wraps
              normally at a smaller size, and bio just uses the available
              width instead of the JS-measured desktop ratio. Gold/white/gold
              rhythm: logo stays gold, tagline goes metallic white, bio reads
              gold. */}
          <motion.div variants={mobile ? fadeMobile(0.55) : fade(0.55)} className="mt-8 flex flex-col items-center">
            <p
              ref={taglineRef}
              data-testid="hero-tagline"
              className={
                // Mobile: +20% over the previous 1.5rem (text-2xl) mobile
                // size, scaled up in place (font-size grows, text stays
                // centered — no repositioning).
                mobile
                  ? "font-display text-metallic-grad text-[1.8rem] leading-tight"
                  : "font-display text-metallic-grad whitespace-nowrap text-4xl leading-tight sm:text-5xl"
              }
            >
              {HERO_TAGLINE}
            </p>
            <p
              data-testid="hero-bio"
              className={
                // Mobile: a notch bigger than the previous 0.92rem, and the
                // column widened close to the full available space (freed up
                // by the outer container's px-4, down from px-6) — reads
                // more spread out instead of cramped. text-wrap: balance
                // evens out the line lengths so the last line never strands
                // 2-3 words alone (unsupported browsers just ignore it and
                // fall back to normal wrapping).
                mobile
                  ? "font-body mt-6 text-[1rem] font-light leading-relaxed text-[var(--sm-gold-light)] text-legible"
                  : "font-body mt-6 text-sm font-light leading-relaxed text-[var(--sm-gold-light)] text-legible sm:text-base"
              }
              // Floor of 40rem: a short tagline ("Life Is So Beautiful") would
              // otherwise squeeze the bio into a tall, narrow column.
              style={mobile ? { maxWidth: "21.5rem", textWrap: "balance" } : { maxWidth: Math.max((bioWidth || 0) * 0.95, 640), textWrap: "balance" }}
            >
              {mobile ? HERO_BIO_MOBILE : HERO_BIO}
            </p>
          </motion.div>

          {/* Mobile: slightly tighter than desktop's mt-9 — the bio block is
              now taller (bigger font + narrower column -> more wraps), so a
              proportionally smaller gap keeps the group feeling balanced
              rather than stretching further down the screen. */}
          <motion.div variants={mobile ? fadeMobile(1.0) : fade(1.0)} className={mobile ? "mt-7" : "mt-9"}>
            <Link
              to={HERO_CTA.to}
              data-testid="hero-my-story-btn"
              className="animate-glow-pulse pointer-events-auto rounded-full border border-white/25 bg-transparent px-8 py-2.5 font-accent text-[0.7rem] uppercase tracking-[0.28em] text-white/80 transition-all duration-300 hover:border-[var(--sm-gold)]/60 hover:text-[var(--sm-gold-light)]"
            >
              {HERO_CTA.label}
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <AnnouncementBubble active={active} mobile={mobile} />
    </>
  );
};
