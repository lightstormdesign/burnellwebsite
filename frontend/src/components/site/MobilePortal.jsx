import { useEffect, useRef, useState } from "react";
import { HeroContent } from "./HeroContent";
import { HeroFrame, HERO_BG_FILTER, HERO_SCRIM } from "./HeroFrame";
import { makeGlowSprite } from "@/utils/glowSprite";
import { HOME_MEDIA, ARTIST_NAME, LOGO } from "@/data/site";

// Still-image mode (no mobile footage yet) — see CinematicExperience.jsx.
// Tap dissolves the Portal still straight into the Hero still; no
// transition video to wait on.
const STILLS_MODE = !HOME_MEDIA.transition;

// Known duration of sierra-mobile-transition.mp4 (~6.06s) — used only as a
// failsafe if 'ended' never fires (autoplay blocked, decode error, etc.), so
// a tap can never leave the user stuck on a frozen transition frame.
const TRANSITION_FALLBACK_MS = 6200;

// Portal content: fades IN on page load (no delay before starting) over
// 1.5s, and fades OUT on tap (glow/dissolve, not a plain opacity fade) over
// 1.3s, concurrently with the transition video starting — not sequentially.
const PORTAL_FADE_IN_MS = 1500;
const PORTAL_FADE_OUT_MS = 1300;

// Seam 2 (transition -> hero), final behavior: the transition video's own
// opacity starts fading out 1s before it ends, revealing the hero loop
// underneath (already playing beneath it the whole time, not started fresh
// at reveal). Its brightness also dims 100%->85%, starting 2s before the
// end — the two windows overlap, both finishing exactly on the last frame.
const SEAM2_FADE_WINDOW_S = 1;
const SEAM2_DIM_WINDOW_S = 2;
const SEAM2_DIM_TARGET = 85; // brightness %, at the very end

// Mobile-only Portal -> Transition -> Hero sequence. Tap-to-enter replaces
// the desktop's scroll-scrub entirely (no scroll involved at all) — a fixed
// 100svh viewport, three discrete phases driven by a single tap. Debounced
// against rapid/double taps via a ref checked synchronously before any state
// update, so a second tap during the transition can never double-trigger
// audio or re-enter the sequence.
export const MobilePortal = () => {
  const [phase, setPhase] = useState("portal"); // portal | transitioning | hero
  const [entered, setEntered] = useState(false); // drives the on-load fade-in
  const [portalLoopBlocked, setPortalLoopBlocked] = useState(false);
  const [heroLoopBlocked, setHeroLoopBlocked] = useState(false);

  const enteringRef = useRef(false);
  const audioRef = useRef(null);
  const transitionRef = useRef(null);
  const heroLoopRef = useRef(null);
  const portalLoopRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const seam2RafRef = useRef(null);
  const rippleCanvasRef = useRef(null);
  const rippleParticlesRef = useRef([]);
  const rippleRafRef = useRef(null);
  const rippleSpritesRef = useRef(null);

  // Tap ripple: a short-lived burst of small bright sparks from the exact
  // tap point. Back to the bigger/brighter/more-particles version (tight,
  // bright sprite core; count/size/speed roughly double the previous pass),
  // then every one of those halved again — count, size, and travel speed
  // all at 50% of that baseline. The rAF loop only runs while particles are
  // alive — nothing ticking in the background otherwise.
  const spawnRipple = (x, y) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = rippleCanvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Pre-rendered once — see glowSprite.js. Replaces per-particle
    // shadowBlur (same fix applied to MagicCursor.jsx's desktop trail).
    // Tight core (coreStop/coreOpacity) — the default sprite's soft falloff
    // read as mushy/low-opacity once scaled up for this burst.
    if (!rippleSpritesRef.current) {
      rippleSpritesRef.current = {
        white: makeGlowSprite(40, "255,255,255", { coreStop: 0.15, coreOpacity: 0.9 }),
        gold: makeGlowSprite(40, "232,207,154", { coreStop: 0.15, coreOpacity: 0.9 }),
      };
    }
    const sprites = rippleSpritesRef.current;

    const particles = rippleParticlesRef.current;
    const COUNT = 15;
    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.35;
      const speed = 0.65 + Math.random() * 1.2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        born: performance.now(),
        size: 0.6 + Math.random() * 0.9,
        hue: Math.random() < 0.3 ? "255,255,255" : "232,207,154",
      });
    }

    if (rippleRafRef.current) return;
    const LIFE = 900;
    const tick = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, w, h);
      let alive = false;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const age = now - p.born;
        if (age > LIFE) {
          particles.splice(i, 1);
          continue;
        }
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        const t = age / LIFE;
        // Stays fully bright for the first ~55% of life, then drops — a
        // crisp burst that holds its punch instead of dimming from frame 1.
        const alpha = t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45;
        const size = p.size * (1 - t * 0.3);
        const sprite = p.hue === "255,255,255" ? sprites.white : sprites.gold;
        const d = size * 3.5;
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprite, p.x - d / 2, p.y - d / 2, d, d);
        ctx.globalAlpha = 1;
      }
      rippleRafRef.current = alive ? requestAnimationFrame(tick) : null;
    };
    rippleRafRef.current = requestAnimationFrame(tick);
  };

  // Fade-in starts immediately on mount (no delay) — the rAF hop just
  // ensures the initial opacity:0 actually paints on its own frame first,
  // so the browser has something to transition FROM rather than collapsing
  // the mount + the opacity:1 update into a single, un-animated paint.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleTap = (e) => {
    if (enteringRef.current || phase !== "portal") return;
    enteringRef.current = true;
    setPhase("transitioning");

    const rect = rippleCanvasRef.current?.getBoundingClientRect();
    if (rect) spawnRipple(e.clientX - rect.left, e.clientY - rect.top);

    // Synchronous, in-tap .play() call — required for mobile autoplay-with-
    // sound policies. Fade in/out is baked directly into this track's
    // waveform now (not JS-driven), so this is just a plain, un-faded
    // play() call — verify there's a real, loaded source first.
    const audio = audioRef.current;
    if (audio && audio.src) {
      audio.play().catch(() => {});
    }

    const v = transitionRef.current;
    if (v) {
      try {
        v.currentTime = 0;
      } catch (e) {}
      v.style.opacity = 1;
      v.style.filter = "brightness(100%)";
      v.play().catch(() => {});
    }

    fallbackTimerRef.current = setTimeout(() => setPhase("hero"), STILLS_MODE ? PORTAL_FADE_OUT_MS * 0.6 : TRANSITION_FALLBACK_MS);
  };

  const handleTransitionEnded = () => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    setPhase("hero");
  };

  useEffect(
    () => () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    },
    []
  );

  // Seam 2: drive the transition video's opacity/brightness directly off its
  // own playback position (not a discrete phase flag), so the fade-out and
  // brightness dim are genuinely tied to "how close to the end" it is. Runs
  // via rAF (not `timeupdate`, which fires too coarsely for a smooth 1s
  // fade) for the entire "transitioning" phase; imperative DOM writes (not
  // React state) since this needs to update every frame without triggering
  // a re-render each time.
  useEffect(() => {
    if (phase !== "transitioning") return;
    const v = transitionRef.current;
    if (!v) return;

    const tick = () => {
      const dur = v.duration;
      if (dur && isFinite(dur)) {
        const remaining = dur - v.currentTime;
        const opacity = Math.max(0, Math.min(1, remaining / SEAM2_FADE_WINDOW_S));
        const dimProgress = Math.max(0, Math.min(1, remaining / SEAM2_DIM_WINDOW_S));
        const brightness = SEAM2_DIM_TARGET + dimProgress * (100 - SEAM2_DIM_TARGET);
        v.style.opacity = opacity;
        v.style.filter = `brightness(${brightness}%)`;
      }
      seam2RafRef.current = requestAnimationFrame(tick);
    };
    seam2RafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(seam2RafRef.current);
  }, [phase]);

  useEffect(() => {
    heroLoopRef.current?.play().catch(() => setHeroLoopBlocked(true));
  }, []);
  useEffect(() => {
    portalLoopRef.current?.play().catch(() => setPortalLoopBlocked(true));
  }, []);

  const portalOn = phase === "portal";
  // Hero loop: "already playing beneath it, not starting fresh at reveal" —
  // on from the moment the sequence leaves the portal phase, well before
  // Seam 2's own fade actually uncovers it. Always full opacity; blurred and
  // dimmed (HERO_BG_FILTER) so the illustrated HeroFrame reads in front.
  const heroLoopOn = phase !== "portal";
  const pe = (on) => (on ? "auto" : "none");

  return (
    <section data-testid="mobile-portal" className="relative w-full overflow-hidden" style={{ height: "100svh" }}>
      {/* Layer 0: Hero loop background — full opacity, blurred and dimmed,
          the entire time it's revealed (see Seam 2 above). */}
      <div className="absolute inset-0 bg-black" style={{ opacity: heroLoopOn ? 1 : 0 }}>
        {heroLoopBlocked || !HOME_MEDIA.heroLoop ? (
          <>
            <div className="absolute -inset-[4%]">
              <img
                data-testid="mobile-hero-loop-poster"
                className="animate-kenburns absolute inset-0 h-full w-full object-cover"
                style={{ filter: HERO_BG_FILTER }}
                src={HOME_MEDIA.heroImageMobile}
                alt=""
              />
            </div>
            <div aria-hidden className="absolute inset-0" style={{ background: HERO_SCRIM }} />
          </>
        ) : (
          <video
            ref={heroLoopRef}
            data-testid="mobile-hero-loop-video"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: HERO_BG_FILTER, transform: "scale(1.08)" }}
            src={HOME_MEDIA.heroLoop}
            poster={HOME_MEDIA.heroImageMobile}
            muted
            loop
            playsInline
            preload="auto"
            tabIndex={-1}
          />
        )}
      </div>

      {/* Layer 1: Transition video — Seam 1: appears/starts instantly on
          tap (no fade-in of its own; the portal layer above it dissolves
          away over it instead, see below). Seam 2: opacity/brightness are
          driven imperatively by the rAF loop above during the final 1-2s;
          the style prop here only sets the *entering* state (tap moment). */}
      {!STILLS_MODE && (
        <video
          ref={transitionRef}
          data-testid="mobile-transition-video"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: phase === "portal" ? 0 : undefined }}
          src={HOME_MEDIA.transition}
          muted
          playsInline
          preload="auto"
          onEnded={handleTransitionEnded}
          tabIndex={-1}
        />
      )}

      {/* Layer 2: Portal — loop background + 3 pre-positioned transparent
          PNGs (portrait, logo, tap-to-enter), all sharing the exact same
          canvas aspect ratio as the video, so no independent repositioning
          is needed — laid directly on top at their native exported position.
          Fades IN on mount (1.5s), fades OUT on tap via a glow/dissolve —
          brightness + blur ramp alongside the opacity fade, not a plain
          opacity-only fade — over 1.3s. The poster/fallback image (a
          dedicated asset, not an auto-extracted video frame) covers any
          loading delay so the screen is never blank.

          object-contain (not object-cover) on all 4 layers here, deliberately
          different from every other full-bleed video/image in this app: the
          canvas is 1080x1919 (ratio ~0.563), noticeably wider than a real
          phone's viewport (iPhone ~0.46) — object-cover was cropping the
          sides to fill that narrower shape, slicing "SIERRA"/"MARIN" off the
          wordmark on real devices. contain keeps the whole composite (and
          the baked-in text) on-screen, letterboxed top/bottom instead; the
          bg-black on the button below makes those bars invisible against the
          already-near-black scene. */}
      <button
        type="button"
        onClick={handleTap}
        data-testid="mobile-portal-tap-target"
        aria-label="Tap to enter"
        className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-black"
        style={{
          opacity: !entered ? 0 : portalOn ? 1 : 0,
          filter: portalOn ? "brightness(1) blur(0px)" : "brightness(1.9) blur(20px)",
          pointerEvents: pe(portalOn && entered),
          transition: portalOn
            ? `opacity ${PORTAL_FADE_IN_MS}ms ease-out`
            : `opacity ${PORTAL_FADE_OUT_MS}ms ease-out, filter ${PORTAL_FADE_OUT_MS}ms ease-out`,
        }}
      >
        {STILLS_MODE || portalLoopBlocked || !HOME_MEDIA.portalLoop ? (
          <>
            <img
              data-testid="mobile-portal-loop-poster"
              className="animate-kenburns absolute inset-0 h-full w-full object-cover"
              src={HOME_MEDIA.portalImageMobile}
              alt=""
            />
            <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 38%, transparent 70%, rgba(0,0,0,0.65) 100%)" }} />
            <img
              src={LOGO}
              alt={ARTIST_NAME}
              className="gold-glow pointer-events-none absolute left-1/2 top-[14%] w-[82%] -translate-x-1/2"
            />
            <span
              className="font-accent pointer-events-none absolute inset-x-0 bottom-[9%] text-center text-sm uppercase tracking-[0.32em] text-[var(--sm-gold-light)] text-legible"
              style={{ animation: "breathe 2.4s ease-in-out infinite" }}
            >
              Tap to Enter
            </span>
          </>
        ) : (
          <video
            ref={portalLoopRef}
            data-testid="mobile-portal-loop-video"
            className="absolute inset-0 h-full w-full object-contain"
            src={HOME_MEDIA.portalLoop}
            poster={HOME_MEDIA.portalImageMobile}
            muted
            loop
            playsInline
            preload="auto"
            tabIndex={-1}
          />
        )}
      </button>

      {/* Tap ripple burst — see spawnRipple above. Sits above the portal
          button so the spark burst reads on top of it as it dissolves. */}
      <canvas ref={rippleCanvasRef} aria-hidden className="pointer-events-none absolute inset-0 z-[15] h-full w-full" />

      {/* Hero content — logo/tagline/bio/CTA, mobile variant (emblem-only
          logo, no text wordmark, see HeroContent's `mobile` prop). z-[32]
          keeps it (and its announcement bubble) above the HeroFrame. */}
      <div className="absolute inset-0 z-[32]" style={{ opacity: phase === "hero" ? 1 : 0, pointerEvents: pe(phase === "hero") }}>
        <HeroContent active={phase === "hero"} mobile />
      </div>

      {/* Persistent background treatment — always on, unrelated to the tap/
          transition phase timing above. Soft gradient dissolve to black at
          the top and bottom edges (so the header/footer areas never show a
          hard line), plus a light vignette on the left/right. Sits above
          every layer including hero content but is pointer-events-none, so
          it never blocks the tap target or any Hero CTA underneath. The
          fixed Navbar (z-50, rendered by the page above this component)
          paints over this — on the Home page it renders with no background
          on mobile, so this top fade is what makes its header area read as
          "faded into black" rather than a hard bar. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          background:
            "linear-gradient(to bottom, #000 0%, transparent 14%, transparent 86%, #000 100%), linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      {/* Living illustrated frame — above the edge-fade treatment so the
          stream isn't dimmed, still pointer-events-none throughout. */}
      <div className="pointer-events-none absolute inset-0 z-[31]">
        <HeroFrame active={phase === "hero"} mobile />
      </div>

      {/* "Love Is the Medicine" tap track — fade in/out is baked directly
          into the file's waveform (not JS), so this is just a plain
          <audio> tag; playback is triggered synchronously in handleTap. */}
      {HOME_MEDIA.audio && <audio ref={audioRef} src={HOME_MEDIA.audio} preload="auto" />}
    </section>
  );
};
