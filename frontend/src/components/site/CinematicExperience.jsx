import { useEffect, useRef, useState } from "react";
import { HeroContent } from "./HeroContent";
import { HeroFrame, HERO_BG_FILTER, HERO_SCRIM } from "./HeroFrame";
import { MobilePortal } from "./MobilePortal";
import { StardustMist } from "./StardustMist";
import { useIsMobile } from "@/hooks/useIsMobile";
import { makeGlowSprite } from "@/utils/glowSprite";
import { HOME_MEDIA, ARTIST_NAME, LOGO } from "@/data/site";

// Still-image mode: when no custom portal/transition/hero footage exists yet
// (HOME_MEDIA.*Loop/transition null), the Portal and Hero layers render
// stills with a slow Ken Burns drift and crossfade directly into each other
// instead of scrubbing a transition video. Drop footage into HOME_MEDIA and
// the original video choreography takes over again, no code changes.
const STILLS_MODE = !HOME_MEDIA.transition;

// Thin switcher — mobile gets an entirely separate tap-to-enter component
// (MobilePortal), desktop keeps its scroll-scrub exactly as it was. Kept as
// two fully separate component trees (not an isMobile branch inside one
// component) so the desktop implementation's hooks are never conditionally
// skipped across a breakpoint-crossing re-render. StardustMist is mounted
// once here (outside that branch) since it handles its own mobile/desktop
// behavior internally — this just guarantees it's Home-page-scoped, since
// CinematicExperience only ever renders on Home.
export const CinematicExperience = () => {
  const isMobile = useIsMobile();
  return (
    <>
      <StardustMist />
      {isMobile ? <MobilePortal /> : <DesktopExperience />}
    </>
  );
};

// Pinned Portal -> Hero scroll-scrub, desktop only (no mobile branching at all).
// A tall section (280vh) holds a sticky 100svh viewport; scroll progress `p`
// (0..1) drives everything below via seg(a,b) crossfade envelopes, and a
// requestAnimationFrame loop eases the transition video's currentTime toward
// a target derived from `p` — this is also what makes the whole thing
// reversible for free: p is a pure function of scroll position regardless of
// direction, so scrolling up just decreases p and the RAF loop eases back.
const DesktopExperience = () => {
  const sectionRef = useRef(null);
  const stickyRef = useRef(null);
  const portalLoopRef = useRef(null);
  const heroLoopRef = useRef(null);
  const transitionRef = useRef(null);
  const audioRef = useRef(null);

  const targetTime = useRef(0);
  const durationRef = useRef(10);
  const rafRef = useRef(null);
  const audioStartedRef = useRef(false);

  // Portal depth-fx (parallax, cursor-spotlight, cast shadow, foreground
  // dust) — cursor position is tracked and eased here, then published as
  // CSS custom properties on stickyRef once per frame inside the existing
  // tick() loop below, imperatively (not React state), so mousemove never
  // triggers a re-render. Same rAF-chase technique as MagicCursor.jsx.
  const cursorTargetRef = useRef({ x: 0.5, y: 0.5 });
  const cursorEasedRef = useRef({ x: 0.5, y: 0.5 });
  const dustCanvasRef = useRef(null);
  const dustParticlesRef = useRef([]);
  const reduceMotionRef = useRef(false);
  const DUST_COUNT = 46;

  const [p, setP] = useState(0);
  const [portalLoopBlocked, setPortalLoopBlocked] = useState(false);
  const [heroLoopBlocked, setHeroLoopBlocked] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const transition = transitionRef.current;

    const onMeta = () => {
      if (transition && transition.duration) durationRef.current = transition.duration;
    };
    if (transition) {
      transition.addEventListener("loadedmetadata", onMeta);
      if (transition.readyState >= 1) onMeta();
    }

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const vh = stickyRef.current ? stickyRef.current.clientHeight : window.innerHeight;
      const total = rect.height - vh;
      const prog = Math.min(1, Math.max(0, -rect.top / total));
      setP(prog);

      // Portal-fx intensity (world-dim + sacred-geometry reveal, both read
      // this as --portal-fx-intensity): full strength through the first
      // half of the transition, then fades to 0 by p=0.85 — roughly where
      // the transition video itself starts dissolving into Hero — so this
      // whole atmospheric system recedes as you leave the Portal rather
      // than persisting into Hero. Home-page-only: every other page never
      // sets this var, so the CSS fallback of 1 (full effect) applies there.
      const fxFadeStart = 0.42;
      const fxFadeEnd = 0.85;
      const fxIntensity = 1 - Math.min(1, Math.max(0, (prog - fxFadeStart) / (fxFadeEnd - fxFadeStart)));
      document.documentElement.style.setProperty("--portal-fx-intensity", fxIntensity.toFixed(3));

      // Scrub starts at p=0 (not after the Portal fade finishes) so the
      // scroll-scrub and the portrait/text/loop fade-out begin concurrently
      // — fixes the "dead gap" where scrubbing used to wait for the fade to
      // complete first.
      const transitionStart = 0;
      const transitionEnd = 0.85;
      const tProg = Math.min(1, Math.max(0, (prog - transitionStart) / (transitionEnd - transitionStart)));
      targetTime.current = tProg * durationRef.current;

      // Synchronous, in-handler .play() call (not a useEffect reacting to
      // state a tick later) — matters for autoplay-with-sound policies.
      if (!audioStartedRef.current && prog > 0.02) {
        audioStartedRef.current = true;
        audioRef.current?.play().catch(() => {});
      }
    };

    // Depth-fx setup: fine-pointer-only cursor tracking (skipped entirely on
    // touch, so a stylus/finger never leaves the spotlight stuck off-center),
    // plus the foreground dust canvas — sized to the sticky viewport and
    // reduced-motion-gated the same way MagicCursor's spark trail is.
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onPointerMove = (e) => {
      const rect = stickyRef.current?.getBoundingClientRect();
      if (!rect) return;
      cursorTargetRef.current = {
        x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
        y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
      };
    };
    if (finePointer) window.addEventListener("mousemove", onPointerMove, { passive: true });

    // Pre-rendered once — see glowSprite.js. Replaces per-particle
    // shadowBlur in the dust draw loop below (46 particles, every frame,
    // only while the Portal page is visible — a real, avoidable cost).
    const dustSprite = makeGlowSprite(24, "232,207,154");

    const initDust = () => {
      const w = stickyRef.current?.clientWidth || window.innerWidth;
      const h = stickyRef.current?.clientHeight || window.innerHeight;
      dustParticlesRef.current = Array.from({ length: DUST_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 0.8 + Math.random() * 1.6,
        speed: 0.06 + Math.random() * 0.12,
        alpha: 0.15 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
      }));
    };
    const resizeDust = () => {
      const canvas = dustCanvasRef.current;
      if (!canvas || !stickyRef.current) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = stickyRef.current.clientWidth;
      const h = stickyRef.current.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeDust();
    initDust();
    window.addEventListener("resize", resizeDust);

    const tick = () => {
      const v = transitionRef.current;
      if (v && durationRef.current) {
        const cur = v.currentTime || 0;
        const diff = targetTime.current - cur;
        if (Math.abs(diff) > 0.0015) {
          try {
            v.currentTime = cur + diff * 0.2;
          } catch (e) {}
        }
      }

      // Ease the cursor position and publish it as --fx-dx/--fx-dy
      // (normalized -1..1 offset from center) on stickyRef — descendant
      // elements reference these directly in static style strings (e.g.
      // `calc(var(--fx-dx) * 6px)`) for parallax translates and the cast
      // shadow offset, so only the custom property value needs updating
      // each frame, no re-render. (The cursor-spotlight reveal that used to
      // live here has moved to SacredGeometryField.jsx / MagicCursor.jsx's
      // --wand-mx/--wand-my, which are viewport-relative by construction —
      // no per-element box math needed.)
      const ct = cursorTargetRef.current;
      const ce = cursorEasedRef.current;
      ce.x += (ct.x - ce.x) * 0.08;
      ce.y += (ct.y - ce.y) * 0.08;
      if (stickyRef.current) {
        stickyRef.current.style.setProperty("--fx-dx", `${(ce.x - 0.5) * 2}`);
        stickyRef.current.style.setProperty("--fx-dy", `${(ce.y - 0.5) * 2}`);
      }

      // Foreground dust — ambient upward drift, gently parallaxed opposite
      // the cursor (the closest "plane", so it moves the most). Drawn in
      // logical CSS pixels; resizeDust() already applied the dpr transform.
      if (!reduceMotionRef.current && dustCanvasRef.current && stickyRef.current) {
        const canvas = dustCanvasRef.current;
        const dctx = canvas.getContext("2d");
        const w = stickyRef.current.clientWidth;
        const h = stickyRef.current.clientHeight;
        dctx.clearRect(0, 0, w, h);
        const parX = (ce.x - 0.5) * 36;
        const parY = (ce.y - 0.5) * 20;
        const now = performance.now();
        for (const particle of dustParticlesRef.current) {
          particle.y -= particle.speed;
          particle.x += Math.sin(now * 0.0003 + particle.phase) * 0.12;
          if (particle.y < -10) {
            particle.y = h + 10;
            particle.x = Math.random() * w;
          }
          const d = particle.size * 6;
          dctx.globalAlpha = particle.alpha;
          dctx.drawImage(dustSprite, particle.x + parX - d / 2, particle.y + parY - d / 2, d, d);
          dctx.globalAlpha = 1;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (finePointer) window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("resize", resizeDust);
      if (transition) transition.removeEventListener("loadedmetadata", onMeta);
      cancelAnimationFrame(rafRef.current);
      // Leaving the Home page — clear so every other page's world-dim /
      // sacred-geometry reveal falls back to full intensity (1), not
      // whatever value scrolling happened to leave behind here.
      document.documentElement.style.removeProperty("--portal-fx-intensity");
    };
  }, []);

  // Portal/hero loop backgrounds: always-mounted, muted+loop+autoPlay, just
  // revealed via opacity — same philosophy as FixedLoopBackground.jsx, not
  // MobilePortalGate's mount/unmount-per-phase approach. Autoplay-blocked
  // fallback (e.g. Low Power Mode) swaps to the poster image, permanently
  // for this page load, matching the pattern already proven on the
  // LightStorm build.
  useEffect(() => {
    const v = portalLoopRef.current;
    if (!v) return;
    v.play().catch(() => setPortalLoopBlocked(true));
  }, []);
  useEffect(() => {
    const v = heroLoopRef.current;
    if (!v) return;
    v.play().catch(() => setHeroLoopBlocked(true));
  }, []);

  const seg = (a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));

  // All three fades now start at p=0 (concurrent), not staggered one-after-
  // another, matching the transition video's scrub also starting at p=0.
  const portalTextOp = 1 - seg(0, 0.08);
  // Stills mode: no transition video to bridge the gap, so the Portal
  // still dissolves straight into the Hero still over the first half.
  const portalLoopOp = STILLS_MODE ? 1 - seg(0.05, 0.5) : 1 - seg(0, 0.15);
  const transitionOp = seg(0, 0.1) * (1 - seg(0.85, 0.93));
  const heroLoopOp = STILLS_MODE ? seg(0.05, 0.45) : seg(0.78, 0.9);
  const heroContentOp = STILLS_MODE ? seg(0.45, 0.65) : seg(0.86, 0.95);
  const pe = (o) => (o > 0.5 ? "auto" : "none");

  return (
    <section id="experience" ref={sectionRef} className="relative" style={{ height: STILLS_MODE ? "220vh" : "280vh" }}>
      <div ref={stickyRef} className="sticky top-0 h-screen w-full overflow-hidden" style={{ height: "100svh" }}>
        {/* Layer 0: Hero loop background — bottom-most, always playing underneath */}
        <div className="absolute inset-0 bg-black" style={{ opacity: heroLoopOp }}>
          {heroLoopBlocked || !HOME_MEDIA.heroLoop ? (
            <>
              {/* Pushed back behind "smoked glass" (blur + dim) so the
                  illustrated HeroFrame and the copy read as the foreground
                  layer. Oversized wrapper hides the blur's soft edges. */}
              <div className="absolute -inset-[4%]">
                <img
                  data-testid="hero-loop-poster"
                  className="animate-kenburns absolute inset-0 h-full w-full object-cover"
                  style={{ filter: HERO_BG_FILTER }}
                  src={HOME_MEDIA.heroImage}
                  alt=""
                />
              </div>
              <div aria-hidden className="absolute inset-0" style={{ background: HERO_SCRIM }} />
            </>
          ) : (
            <video
              ref={heroLoopRef}
              data-testid="hero-loop-video"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: HERO_BG_FILTER, transform: "scale(1.08)" }}
              src={HOME_MEDIA.heroLoop}
              poster={HOME_MEDIA.heroImage}
              muted
              loop
              playsInline
              preload="auto"
              tabIndex={-1}
            />
          )}
          {HOME_MEDIA.heroLoop && !heroLoopBlocked && <div aria-hidden className="absolute inset-0" style={{ background: HERO_SCRIM }} />}
        </div>

        {/* Living illustrated frame — above the Hero background, below the
            copy. Enters with the Hero content and leaves with it. */}
        <div className="pointer-events-none absolute inset-0 z-20">
          <HeroFrame active={heroContentOp > 0.3} />
        </div>

        {/* Layer 1: Transition video — scrubbed via currentTime, fades out into the hero loop */}
        {!STILLS_MODE && (
          <video
            ref={transitionRef}
            data-testid="transition-video"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: transitionOp }}
            src={HOME_MEDIA.transition}
            muted
            playsInline
            preload="auto"
            tabIndex={-1}
          />
        )}

        {/* Layer 2: Portal loop background — topmost initially, fades out first */}
        <div className="absolute inset-0 bg-black" style={{ opacity: portalLoopOp }}>
          {portalLoopBlocked || !HOME_MEDIA.portalLoop ? (
            <img
              data-testid="portal-loop-poster"
              className="animate-kenburns absolute inset-0 h-full w-full object-cover"
              src={HOME_MEDIA.portalImage}
              alt=""
            />
          ) : (
            <video
              ref={portalLoopRef}
              data-testid="portal-loop-video"
              className="absolute inset-0 h-full w-full object-cover"
              src={HOME_MEDIA.portalLoop}
              poster={HOME_MEDIA.portalImage}
              muted
              loop
              playsInline
              preload="auto"
              tabIndex={-1}
            />
          )}
        </div>

        {/* Portal portrait + depth-fx (god-rays, cast shadow, cursor-
            spotlight reveal, foreground dust) + "Scroll to Enter" — all
            nested in this one opacity wrapper so the whole depth scene
            fades with the portrait on scroll, matching. Depth-fx values
            (--fx-mx/my/dx/dy) are CSS custom properties set imperatively on
            stickyRef each frame (see tick() above); every element below
            just references them in a static style string, so nothing here
            re-renders on mousemove. z-[510] (not z-20) is deliberate: this
            wrapper's own `opacity` style makes it a stacking context, so
            nothing inside it could ever out-rank WorldDim (z-500) no matter
            what z-index it carried internally — only raising the wrapper
            itself gets the whole Portal foreground, Sierra included, in
            front of the world-dim scrim, since the "lights up the world"
            effect is about the environment behind her, not her. */}
        <div
          className="absolute inset-0 z-[510]"
          style={{ opacity: portalTextOp, pointerEvents: pe(portalTextOp) }}
        >
          {/* God rays: a slow-rotating light-beam wedge, screen-blended so it
              only ever brightens the footage beneath, never darkens it.
              Rotation isolated to an inner div (Tailwind's translate utility
              on the parent uses its own transform var, so an `animation`
              here can't clobber it) and killed under reduced motion via the
              .godray-layer override in index.css. */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
            <div className="absolute left-1/2 top-[-20%] h-[140%] w-[140%] -translate-x-1/2">
              <div
                className="godray-layer h-full w-full"
                style={{
                  background:
                    "conic-gradient(from 200deg at 50% 30%, transparent 0deg, rgba(232,207,154,0.16) 8deg, transparent 20deg, transparent 160deg, rgba(214,179,101,0.12) 172deg, transparent 184deg, transparent 360deg)",
                  mixBlendMode: "screen",
                  animation: "godray-rotate 90s linear infinite",
                }}
              />
            </div>
          </div>

          {/* Cast shadow: a soft dark pool at her feet, offset opposite the
              cursor — reads as though the wand's light is casting it. */}
          {HOME_MEDIA.portrait && (<div
            aria-hidden
            className="pointer-events-none absolute bottom-[6%] left-[33%] z-[1] h-[10vh] w-[36vh] -translate-x-1/2 rounded-[50%]"
            style={{
              background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 55%, transparent 78%)",
              filter: "blur(6px)",
              transform: "translateX(calc(-50% + var(--fx-dx, 0) * -18px))",
            }}
          />)}

          {/* Portrait: bottom of her body sits at the bottom of the screen,
              head horizontally centered on the video's pathway (~33% from
              left — 40% minus the requested 7% shift left — measured
              directly from the footage). Size +5% over the previous pass
              (71vh -> 74.6vh). Full opacity, full color/brightness — no
              effect in this file touches her at all; the wand's "reveal"
              magic happens entirely in the environment around her
              (SacredGeometryField reveal layer + cast shadow). This wrapper
              is z-[510], above WorldDim's z-500, specifically so she's never
              caught by its dimming either. Tiny parallax offset (--fx-dx/dy)
              so she reads as a nearer plane than the background loop
              behind her. */}
          {HOME_MEDIA.portrait && <img
            src={HOME_MEDIA.portrait}
            alt={ARTIST_NAME}
            data-testid="portal-portrait"
            className="pointer-events-none absolute bottom-0 z-[2] h-[74.6vh] w-auto object-contain"
            style={{
              left: "33%",
              transform: "translateX(calc(-50% + var(--fx-dx, 0) * 6px)) translateY(calc(var(--fx-dy, 0) * 4px))",
              WebkitMaskImage: "linear-gradient(to bottom, #000 82%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, #000 82%, transparent 100%)",
            }}
          />}

          {/* Foreground dust: soft drifting motes rendered in front of the
              portrait — the plane most sites skip (background-only
              parallax), so it's what actually sells the depth. Ambient
              (always drifting, not just cursor-triggered), gently
              parallaxed for a closer-plane feel. Drawn/skipped in tick(). */}
          <canvas ref={dustCanvasRef} className="pointer-events-none absolute inset-0 z-[4]" aria-hidden />

          {/* Stills mode: the name isn't baked into footage, so the
              wordmark sits over the Portal still itself. */}
          {!HOME_MEDIA.portalLoop && (
            <>
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-[45%]" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)" }} />
              <img
                src={LOGO}
                alt={ARTIST_NAME}
                data-testid="portal-wordmark"
                className="gold-glow pointer-events-none absolute left-1/2 top-[13%] z-[5] w-[min(44rem,70vw)] -translate-x-1/2"
              />
            </>
          )}

          {/* "Scroll to Enter" — centered under the mandala/moon symbol baked
              into the portal-loop footage itself (measured via pixel
              analysis of the poster frame: emblem center sits at ~71.5% of
              frame width, NOT under the portrait), nudged 2.5% right / 17%
              up per Round 3, then 2% left / 5% up per Round 4, then
              re-measured and nudged 1.1% right (72% -> 73.1%) per Round 5
              to align exactly with the emblem's true horizontal center.
              Soft radial shadow behind the text (not a hard box) for
              legibility, plus the scroll-cue dot restored from the
              original template. */}
          <div
            className="absolute z-[5] flex -translate-x-1/2 flex-col items-center"
            style={HOME_MEDIA.portalLoop ? { left: "73.1%", bottom: "calc(2.5rem + 22vh)" } : { left: "50%", bottom: "3.5rem" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[220%] w-[260%] -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
              style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 48%, rgba(0,0,0,0) 76%)", filter: "blur(10px)" }}
            />
            <span className="font-accent text-sm uppercase tracking-[0.32em] text-[var(--sm-gold-light)] text-legible">
              Scroll to Enter
            </span>
            <div className="mt-4 flex h-9 w-5 items-end justify-center rounded-full border border-white/30 p-1">
              <span className="block h-2 w-1 rounded-full bg-[var(--sm-gold)]" style={{ animation: "scroll-cue 1.8s ease-in-out infinite" }} />
            </div>
          </div>

          {/* Hidden hold-to-unlock easter egg (SecretThreshold.jsx) is
              retired here — file's untouched/unused, kept as a reference
              for future sites. */}
        </div>

        {/* Hero content: logo, tagline, My Story CTA, email-signup placeholder */}
        <div className="absolute inset-0 z-30" style={{ opacity: heroContentOp, pointerEvents: pe(heroContentOp) }}>
          <HeroContent active={heroContentOp > 0.3} />
        </div>

        {/* "Love Is the Medicine" — trimmed to 1:14-1:39 with a fade-out
            baked into the file itself (see asset prep). Plays once on first
            scroll, does not loop. Sourced via YouTube-to-MP3 for this first
            draft — flag as pending, needs an official/studio source before
            public launch. */}
        {HOME_MEDIA.audio && <audio ref={audioRef} src={HOME_MEDIA.audio} preload="auto" />}

        {/* Progress hairline */}
        <div
          className="absolute bottom-0 left-0 z-40 h-[2px] bg-gradient-to-r from-[var(--sm-gold-accent)] to-[var(--sm-gold-light)]"
          style={{ width: `${p * 100}%`, opacity: 0.7 }}
        />
      </div>
    </section>
  );
};
