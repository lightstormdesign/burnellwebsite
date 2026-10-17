import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import {
  ABOUT_STAGES,
  ARTIST_NAME,
  HERO_BIO_MOBILE,
  HERO_TAGLINE,
  LOGO,
  MOBILE_HOME_MEDIA as MEDIA,
  WORLD_CANVAS,
  WORLD_LAYERS,
} from "@/data/site";

// Mobile Home: Burnell's portal, the transition into his world, then his
// story told inside it.
//
//   portal      intro loop (3D + birds) plays once, then the hold loop runs
//               until the tap. "Tap to Enter".
//   transition  the whip-pan / water-drop video. Its first frame is the hold
//               loop's first frame; its last frame is the world at landing.
//   world       the illustrated layers, starting exactly where the video
//               ended: blurred and dimmed under the logo and "Scroll to read
//               my story". The first scroll lifts the blur and descends into
//               the world (each layer at its own pace), then the world dims
//               and the story chapters play one per swipe (scroll-snap).
//
// The world layers are mounted from the start, underneath everything, so
// they've loaded by the time the video ends and the handoff is just the
// video fading out over an identical picture.

const DESCENT_SVH = 170; // scroll distance of the descent into the world
const CHAPTER_SVH = 90; // scroll distance per story chapter
const TRANSITION_FAILSAFE_MS = 9000;

const FEATHER = "radial-gradient(ellipse 72% 76% at 50% 50%, #000 40%, rgba(0,0,0,0.35) 72%, transparent 100%)";
// soft dark pool behind chapter text so it reads over the painted world
const TEXT_POOL = "radial-gradient(ellipse at center, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.38) 48%, transparent 75%)";

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (t) => t * t * (3 - 2 * t);

// The story: every photo/bridge chapter from the About page, then a closing
// invitation. (The About page's performance video and its own closing card
// stay on that page.)
const CHAPTERS = [...ABOUT_STAGES.filter((s) => s.media || s.bridge), { id: "home-invitation", invitation: true }];

const Chapter = ({ s }) => {
  if (s.invitation) {
    return (
      <div className="relative flex flex-col items-center px-8 text-center">
        <div aria-hidden className="absolute left-1/2 top-1/2 -z-10 h-[150%] w-[140%] -translate-x-1/2 -translate-y-1/2" style={{ background: TEXT_POOL, filter: "blur(16px)" }} />
        <img src="/burnell-emblem.png" alt="" aria-hidden className="h-14 w-auto opacity-90" />
        <h2 className="font-display mt-7 text-3xl leading-tight text-white text-legible">
          If you feel it, <span className="text-gold-grad">you’re already soul fam.</span>
        </h2>
        <div className="mt-9 flex flex-col items-center gap-4">
          <Link to="/community" className="rounded-full bg-[var(--sm-gold)] px-8 py-3.5 font-body text-sm font-medium text-black">
            Join the Family
          </Link>
          <Link to="/music" className="font-accent text-xs uppercase tracking-[0.28em] text-[var(--sm-gold-light)]">
            Hear the music
          </Link>
        </div>
        <p className="font-display mt-10 text-lg text-white text-legible">— {ARTIST_NAME}</p>
      </div>
    );
  }
  if (s.bridge) {
    return <p style={{ background: TEXT_POOL }} className="font-accent max-w-xs py-16 px-8 text-center text-2xl italic leading-snug text-white/90 text-legible">{s.body}</p>;
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 pt-14 text-center">
      <img
        src={s.media}
        alt=""
        className="max-h-[46svh] w-auto max-w-[88%] select-none object-contain"
        style={{ WebkitMaskImage: FEATHER, maskImage: FEATHER }}
      />
      {s.kicker && <span className="font-accent mt-4 text-[0.6rem] uppercase tracking-[0.4em] text-[var(--sm-gold)]">{s.kicker}</span>}
      {s.title && <h2 className="font-display mt-2 text-3xl leading-tight text-white text-legible">{s.title}</h2>}
      <div className="relative mt-3 max-w-sm space-y-3">
        <div aria-hidden className="absolute -inset-x-10 -inset-y-12 -z-10" style={{ background: TEXT_POOL, filter: "blur(14px)" }} />
        {s.body.map((b, i) => (
          <p key={i} className="font-body text-[0.98rem] font-light leading-relaxed text-white/90 text-legible">
            {b}
          </p>
        ))}
      </div>
    </div>
  );
};

export const WorldHome = () => {
  const [phase, setPhase] = useState("portal"); // portal | transition | world
  const [introDone, setIntroDone] = useState(false);
  const [transitionPlaying, setTransitionPlaying] = useState(false);

  const introRef = useRef(null);
  const loopRef = useRef(null);
  const transitionRef = useRef(null);
  const stageRef = useRef(null);
  const layerRefs = useRef([]);
  const blurRef = useRef(null);
  const shadeRef = useRef(null);
  const landingRef = useRef(null);
  const chapterRefs = useRef([]);
  const anchorRefs = useRef([]);
  const enteringRef = useRef(false);
  const failsafeRef = useRef(null);

  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Portal: intro once, then the hold loop. Autoplay can be refused (Low
  // Power Mode); the posters cover that and the tap still works.
  useEffect(() => {
    const intro = introRef.current;
    if (reduceMotion || !intro) {
      setIntroDone(true);
      return;
    }
    intro.play().catch(() => setIntroDone(true));
  }, [reduceMotion]);

  useEffect(() => {
    if (introDone && phase === "portal") loopRef.current?.play().catch(() => {});
  }, [introDone, phase]);

  // No page scroll until the world is entered; scroll-snap only in the world.
  useEffect(() => {
    const root = document.documentElement;
    if (phase === "world") {
      window.scrollTo(0, 0);
      root.style.overflow = "";
      root.style.scrollSnapType = "y mandatory";
    } else {
      root.style.overflow = "hidden";
    }
    return () => {
      root.style.overflow = "";
      root.style.scrollSnapType = "";
    };
  }, [phase]);

  const enterWorld = () => {
    clearTimeout(failsafeRef.current);
    setPhase("world");
  };

  const handleTap = () => {
    if (enteringRef.current) return;
    enteringRef.current = true;
    const v = transitionRef.current;
    if (reduceMotion || !v) {
      enterWorld();
      return;
    }
    setPhase("transition");
    try {
      v.currentTime = 0;
    } catch (e) {}
    v.play().catch(enterWorld);
    failsafeRef.current = setTimeout(enterWorld, TRANSITION_FAILSAFE_MS);
  };

  useEffect(() => () => clearTimeout(failsafeRef.current), []);

  // The world: every frame, ease toward the real scroll position and place
  // each layer between its landing and landed position. Imperative style
  // writes (no React state), so scrolling never re-renders.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let ys = window.scrollY;
    let lastKey = "";

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = window.scrollY;
      ys += (target - ys) * (1 - Math.exp(-dt * 3.2));
      if (Math.abs(target - ys) < 0.3) ys = target;

      const stage = stageRef.current;
      const anchors = anchorRefs.current;
      if (stage && anchors[1] && anchors[2]) {
        const W = stage.clientWidth;
        const H = stage.clientHeight;
        const D = anchors[1].offsetTop;
        const C = anchors[2].offsetTop - D;
        const key = `${W}|${H}|${ys.toFixed(1)}|${target}`;
        if (key !== lastKey) {
          lastKey = key;
          // cover-fit the painted canvas, centered (same fit as the video)
          const k = Math.max(W / WORLD_CANVAS.width, H / WORLD_CANVAS.height);
          const ox = (W - WORLD_CANVAS.width * k) / 2;
          const oy = (H - WORLD_CANVAS.height * k) / 2;
          const p = clamp01(ys / D);
          WORLD_LAYERS.forEach((L, i) => {
            const el = layerRefs.current[i];
            if (!el) return;
            const t = smooth(clamp01((p - L.span[0]) / (L.span[1] - L.span[0])));
            const x = L.start[0] + (L.end[0] - L.start[0]) * t;
            const y = L.start[1] + (L.end[1] - L.start[1]) * t;
            el.style.width = `${(L.w * k).toFixed(1)}px`;
            el.style.transform = `translate3d(${(ox + x * k).toFixed(1)}px, ${(oy + y * k).toFixed(1)}px, 0)`;
          });

          // landing: blurred + dimmed under the copy, lifting as the descent begins
          const veil = 1 - smooth(clamp01(p / 0.3));
          if (blurRef.current) blurRef.current.style.filter = veil > 0.02 ? `blur(${(6 * veil).toFixed(1)}px)` : "none";
          // story: the world dims behind the chapters
          const q = (ys - D) / C;
          const storyDim = 0.66 * smooth(clamp01(q / 0.6));
          if (shadeRef.current) shadeRef.current.style.opacity = Math.max(0.5 * veil, storyDim).toFixed(3);
          // the landing copy dissolves on the very first bit of scroll
          if (landingRef.current) {
            const o = 1 - clamp01(target / (H * 0.12));
            landingRef.current.style.opacity = o.toFixed(3);
            landingRef.current.style.filter = `blur(${((1 - o) * 8).toFixed(1)}px)`;
          }
          chapterRefs.current.forEach((el, i) => {
            if (!el) return;
            const d = Math.abs(q - (i + 1));
            const o = d <= 0.18 ? 1 : d >= 0.5 ? 0 : (0.5 - d) / 0.32;
            el.style.opacity = o.toFixed(3);
            el.style.pointerEvents = o > 0.6 ? "auto" : "none";
            el.style.transform = `translateY(${((q - (i + 1)) * -24).toFixed(1)}px)`;
          });
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const inWorld = phase === "world";
  const snap = { scrollSnapAlign: "start", position: "absolute", left: 0, height: 1, width: 1 };

  return (
    <div data-testid="world-home" className="relative">
      {/* The world (always mounted, so it's loaded before the video ends) */}
      <div ref={stageRef} className="fixed inset-x-0 top-0 z-10 overflow-hidden bg-black" style={{ height: "100lvh" }} aria-hidden>
        <div ref={blurRef} className="absolute inset-0" style={{ filter: "blur(6px)" }}>
          {WORLD_LAYERS.map((L, i) => (
            <img
              key={L.key}
              ref={(el) => (layerRefs.current[i] = el)}
              src={L.src}
              alt=""
              decoding="async"
              className={`absolute left-0 top-0 max-w-none select-none ${L.breathe ? "animate-deer-breathe" : ""}`}
              style={{ willChange: "transform" }}
            />
          ))}
        </div>
        <div ref={shadeRef} className="absolute inset-0 bg-black" style={{ opacity: 0.5 }} />
      </div>

      {/* Landing copy, over the blurred world */}
      <div
        ref={landingRef}
        className="pointer-events-none fixed inset-x-0 top-0 z-20 flex flex-col items-center px-6 text-center"
        style={{ height: "100svh", visibility: inWorld ? "visible" : "hidden" }}
      >
        <div
          className="flex h-full flex-col items-center"
          style={{ opacity: inWorld ? 1 : 0, transform: inWorld ? "none" : "translateY(12px)", transition: "opacity 1.4s ease 0.5s, transform 1.4s ease 0.5s" }}
        >
          <img src={LOGO} alt={ARTIST_NAME} className="gold-glow mt-[18svh] w-[80%] max-w-[22rem]" />
          <p className="font-display text-metallic-grad mt-7 text-[1.8rem] leading-tight">{HERO_TAGLINE}</p>
          <p className="font-body mt-5 max-w-[21rem] text-[1rem] font-light leading-relaxed text-[var(--sm-gold-light)] text-legible" style={{ textWrap: "balance" }}>
            {HERO_BIO_MOBILE}
          </p>
          <div className="mt-auto mb-[7svh] flex flex-col items-center">
            <span className="font-accent text-xs uppercase tracking-[0.32em] text-[var(--sm-gold-light)] text-legible">Scroll to read my story</span>
            <ChevronDown size={22} className="mt-3 text-[var(--sm-gold)]" style={{ animation: "breathe 2.4s ease-in-out infinite" }} />
          </div>
        </div>
      </div>

      {/* Story chapters, faded in and out by scroll position */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20" style={{ height: "100svh" }}>
        {CHAPTERS.map((s, i) => (
          <div
            key={s.id}
            ref={(el) => (chapterRefs.current[i] = el)}
            data-testid={`world-chapter-${s.id}`}
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: 0, pointerEvents: "none" }}
          >
            <Chapter s={s} />
          </div>
        ))}
      </div>

      {/* Transition video, over the world until it ends */}
      <video
        ref={transitionRef}
        data-testid="world-transition-video"
        className="fixed inset-x-0 top-0 z-30 w-full object-cover"
        style={{
          height: "100lvh",
          opacity: transitionPlaying && phase === "transition" ? 1 : 0,
          transition: phase === "world" ? "opacity 0.7s ease" : "none",
          pointerEvents: "none",
        }}
        src={MEDIA.transition}
        muted
        playsInline
        preload="auto"
        onPlaying={() => setTransitionPlaying(true)}
        onEnded={enterWorld}
        tabIndex={-1}
      />

      {/* Portal: intro, then hold loop, until the tap (and until the
          transition's first frame is actually on screen) */}
      <button
        type="button"
        onClick={handleTap}
        data-testid="world-portal"
        aria-label="Tap to enter"
        className="fixed inset-x-0 top-0 z-40 block w-full overflow-hidden bg-black"
        style={{
          height: "100lvh",
          opacity: phase === "portal" || (phase === "transition" && !transitionPlaying) ? 1 : 0,
          transition: phase === "world" ? "opacity 0.7s ease" : "opacity 0.15s linear",
          pointerEvents: phase === "portal" ? "auto" : "none",
        }}
      >
        <video
          ref={loopRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={MEDIA.portalLoop}
          poster={MEDIA.portalLoopPoster}
          muted
          loop
          playsInline
          preload="auto"
          tabIndex={-1}
        />
        <video
          ref={introRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: introDone ? 0 : 1 }}
          src={MEDIA.portalIntro}
          poster={MEDIA.portalIntroPoster}
          muted
          playsInline
          preload="auto"
          onEnded={() => setIntroDone(true)}
          tabIndex={-1}
        />
        <div
          className="absolute inset-0 flex flex-col items-center"
          style={{ opacity: phase === "portal" ? 1 : 0, transition: "opacity 0.3s ease" }}
        >
          <div aria-hidden className="absolute inset-x-0 top-0 h-[34%]" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)" }} />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[24%]" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }} />
          <img src={LOGO} alt={ARTIST_NAME} className="gold-glow relative mt-[12svh] w-[78%] max-w-[22rem]" />
          <span
            className="font-accent relative mt-auto mb-[9svh] text-sm uppercase tracking-[0.32em] text-[var(--sm-gold-light)] text-legible"
            style={{ animation: "breathe 2.4s ease-in-out infinite" }}
          >
            Tap to Enter
          </span>
        </div>
      </button>

      {/* Scroll track: landing, end of the descent, then one stop per chapter */}
      <div
        className="relative"
        style={{ height: inWorld ? `${DESCENT_SVH + CHAPTER_SVH * CHAPTERS.length + 100}svh` : "100svh" }}
        aria-hidden
      >
        {[0, DESCENT_SVH, ...CHAPTERS.map((_, i) => DESCENT_SVH + CHAPTER_SVH * (i + 1))].map((top, i) => (
          <div key={i} ref={(el) => (anchorRefs.current[i] = el)} style={{ ...snap, top: `${top}svh` }} />
        ))}
      </div>
    </div>
  );
};
