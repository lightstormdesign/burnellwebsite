import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Volume2, VolumeOff } from "lucide-react";
import {
  ABOUT_STAGES,
  ARTIST_NAME,
  HERO_BIO_MOBILE,
  HERO_TAGLINE,
  LOGO,
  SITE_GENRE_TAGS,
  MOBILE_HOME_MEDIA as MEDIA,
  WORLD_CANVAS,
  WORLD_LAYERS,
} from "@/data/site";

// Mobile Home: Burnell's portal, the transition into his world, then his
// story told inside it.
//
//   portal      intro loop (3D + birds) plays once, then the hold loop runs
//               until the tap. "Tap to Enter". The tap also starts
//               "Beautiful" at half volume (unless they've muted it with the
//               speaker button, top-left, which works from the first frame).
//               The intro's last frame is the loop's first frame, and the
//               intro stays on screen until the loop has actually drawn a
//               frame, so there's no black between them.
//   transition  the whip-pan / water-drop video. Its first frame is the hold
//               loop's first frame; its last frame is the world at landing.
//   world       the illustrated layers, starting exactly where the video
//               ended: blurred and dimmed under the glowing B, the tagline,
//               and a scroll cue. Scrolling lifts the blur and descends into
//               the world (each layer at its own pace). Then the story
//               chapters play, settling gently on each one (proximity
//               scroll-snap), while the world keeps drifting toward you, each
//               layer growing at its own rate, so it never stops being 3D.
//
// About in the menu (/#story) skips straight here and glides down to the
// first chapter: the story lives on the Home page now.
//
// The world layers are mounted from the start, underneath everything, so
// they've loaded by the time the video ends and the handoff is just the
// video fading out over an identical picture. They (and the transition and
// the story photos) only start downloading once the portal is on screen, so
// the portal gets the connection to itself first.

const DESCENT_SVH = 260; // scroll distance of the descent into the world
const CHAPTER_SVH = 110; // scroll distance per story chapter
const SCROLL_EASE = 5; // how quickly the world catches up to the finger (per second)
const STORY_ZOOM = 0.5; // how much the nearest layer grows over the whole story
const STORY_DIM = 0.55; // how dark the world gets behind the chapters
const ZOOM_CENTER = [WORLD_CANVAS.width / 2, WORLD_CANVAS.height / 2];
const TRANSITION_FAILSAFE_MS = 9000;
const WARM_DELAY_MS = 800; // after the intro starts playing
const STORY_HASH = "#story";
const WARM_FALLBACK_MS = 3500; // if it never does (Low Power Mode)
const SONG_VOLUME = 0.5;
const SONG_FADE_S = 2.5;
const EMBLEM = "/burnell-emblem.png";
const EMBLEM_DEPTH = 7; // stacked copies behind the face, 1px apart

const FEATHER = "radial-gradient(ellipse 72% 76% at 50% 50%, #000 40%, rgba(0,0,0,0.35) 72%, transparent 100%)";
// soft dark pool behind chapter text so it reads over the painted world
const TEXT_POOL = "radial-gradient(ellipse at center, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.38) 48%, transparent 75%)";

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Run cb once the video has actually put a frame on screen (not just
// started), so whatever is covering it can be removed without a flash.
const afterFirstFrame = (v, cb) => {
  if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(() => cb());
  else requestAnimationFrame(() => requestAnimationFrame(cb));
};

// Buffer and decode a hidden video by playing it for a moment (muted, so
// it's allowed), so it starts instantly later. iOS ignores preload.
const prime = (v, shouldStop) => {
  if (!v || v.dataset.primed) return;
  v.dataset.primed = "1";
  v.play()
    ?.then(() => {
      if (!shouldStop()) return;
      v.pause();
      v.currentTime = 0;
    })
    .catch(() => {});
};
const smooth = (t) => t * t * (3 - 2 * t);

// The story: every photo/bridge chapter from the About page, then a closing
// invitation. (The About page's performance video and its own closing card
// stay on that page.)
const CHAPTERS = [...ABOUT_STAGES.filter((s) => s.media || s.bridge), { id: "home-invitation", invitation: true }];

const Chapter = ({ s, load }) => {
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
        src={load ? s.media : undefined}
        alt=""
        className="max-h-[min(46svh,calc(100svh-26rem))] w-auto max-w-[88%] select-none object-contain"
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

// The B, glowing and turning slowly in 3D. Darkened copies stacked behind
// the face give it thickness as it turns.
const Emblem3D = () => (
  <div className="relative" style={{ perspective: "700px" }}>
    <div
      aria-hidden
      className="animate-emblem-halo absolute left-1/2 top-1/2 h-[170%] w-[170%] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ background: "radial-gradient(circle, rgba(214,179,101,0.32) 0%, rgba(214,179,101,0.1) 40%, transparent 68%)" }}
    />
    <div className="animate-emblem-sway relative w-[clamp(7.5rem,36vw,10rem)]">
      {Array.from({ length: EMBLEM_DEPTH }, (_, i) => (
        <img
          key={i}
          src={EMBLEM}
          alt=""
          aria-hidden
          className="absolute inset-0 h-auto w-full"
          style={{ transform: `translateZ(${-(EMBLEM_DEPTH - i)}px)`, filter: `brightness(${0.3 + (0.25 * i) / EMBLEM_DEPTH}) sepia(0.6)` }}
        />
      ))}
      <img src={EMBLEM} alt={ARTIST_NAME} className="animate-emblem-glow relative h-auto w-full" style={{ transform: "translateZ(0.5px)" }} />
    </div>
  </div>
);

export const WorldHome = () => {
  const [phase, setPhase] = useState("portal"); // portal | transition | world
  const [introDone, setIntroDone] = useState(false);
  const [transitionPlaying, setTransitionPlaying] = useState(false);
  const [warm, setWarm] = useState(false); // start loading everything past the portal

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
  const songRef = useRef(null);
  const audioRef = useRef(null); // { ctx, gain } once the song is routed through Web Audio
  const [songOn, setSongOn] = useState(false);
  const mutedRef = useRef(false); // they turned the music off themselves
  const primingRef = useRef(false);
  const pendingStoryRef = useRef(false);
  const introEndedRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  // Intro -> loop with no black: the intro holds its last frame (which is
  // the loop's first) until the loop is really on screen underneath it.
  const handleIntroEnded = () => {
    introEndedRef.current = true;
    const loop = loopRef.current;
    if (!loop) return setIntroDone(true);
    try {
      loop.currentTime = 0;
    } catch (e) {}
    loop
      .play()
      .then(() => afterFirstFrame(loop, () => setIntroDone(true)))
      .catch(() => setIntroDone(true));
  };

  // Once the portal is up, get the loop and the transition decoded and
  // ready so neither has to load when it's needed.
  useEffect(() => {
    if (!warm) return;
    prime(loopRef.current, () => !introEndedRef.current);
    primingRef.current = true;
    prime(transitionRef.current, () => {
      primingRef.current = false;
      return !enteringRef.current;
    });
  }, [warm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (warm) return;
    const t = setTimeout(() => setWarm(true), WARM_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [warm]);
  const warmSoon = () => setTimeout(() => setWarm(true), WARM_DELAY_MS);

  // No page scroll until the world is entered; scroll-snap only in the world.
  useEffect(() => {
    const root = document.documentElement;
    if (phase === "world") {
      window.scrollTo(0, 0);
      root.style.overflow = "";
      root.style.scrollSnapType = "y proximity";
      introRef.current?.pause();
      loopRef.current?.pause();
      if (pendingStoryRef.current) {
        pendingStoryRef.current = false;
        requestAnimationFrame(() => scrollToStory());
      }
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

  // "Beautiful" at half volume. iOS ignores media.volume, so the volume is
  // a Web Audio gain node. Everything here has to happen inside the tap
  // (that's what unlocks audio on iOS).
  const startSong = () => {
    const el = songRef.current;
    if (!el) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC && !audioRef.current) {
        const ctx = new AC();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(SONG_VOLUME, ctx.currentTime + SONG_FADE_S);
        ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination);
        audioRef.current = { ctx, gain };
      }
      audioRef.current?.ctx.resume();
    } catch (e) {
      audioRef.current = null;
    }
    if (!audioRef.current) el.volume = SONG_VOLUME;
    el.play().then(() => setSongOn(true)).catch(() => {});
  };

  const toggleSong = () => {
    const el = songRef.current;
    if (!el) return;
    if (songOn) {
      mutedRef.current = true;
      el.pause();
      setSongOn(false);
    } else {
      mutedRef.current = false;
      startSong();
    }
  };

  // About (menu) -> the first chapter. The scroll engine eases the world
  // down to it, so it glides through the descent rather than jumping.
  const scrollToStory = () => {
    const a = anchorRefs.current[2];
    if (a) window.scrollTo(0, a.offsetTop);
  };

  useEffect(() => {
    if (location.hash !== STORY_HASH) return;
    navigate("/", { replace: true });
    if (phase === "world") {
      scrollToStory();
      return;
    }
    enteringRef.current = true;
    clearTimeout(failsafeRef.current);
    transitionRef.current?.pause();
    setWarm(true);
    pendingStoryRef.current = true;
    setPhase("world");
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      songRef.current?.pause();
      audioRef.current?.ctx.close().catch(() => {});
    },
    []
  );

  const handleTap = () => {
    if (enteringRef.current) return;
    enteringRef.current = true;
    primingRef.current = false;
    setWarm(true);
    if (!mutedRef.current && !songOn) startSong();
    const v = transitionRef.current;
    if (reduceMotion || !v) {
      enterWorld();
      return;
    }
    setPhase("transition");
    try {
      v.currentTime = 0;
    } catch (e) {}
    // already running (tapped while it was being primed): no new
    // "playing" event will come, so hand off from here
    if (!v.paused) afterFirstFrame(v, () => setTransitionPlaying(true));
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
      ys += (target - ys) * (1 - Math.exp(-dt * SCROLL_EASE));
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
          const sizeChanged = !lastKey.startsWith(`${W}|${H}|`);
          lastKey = key;
          // cover-fit the painted canvas, centered (same fit as the video)
          const k = Math.max(W / WORLD_CANVAS.width, H / WORLD_CANVAS.height);
          const ox = (W - WORLD_CANVAS.width * k) / 2;
          const oy = (H - WORLD_CANVAS.height * k) / 2;
          const p = clamp01(ys / D);
          // story: 0 at the end of the descent, 1 at the last chapter
          const z = clamp01((ys - D) / (C * CHAPTERS.length));
          WORLD_LAYERS.forEach((L, i) => {
            const el = layerRefs.current[i];
            if (!el) return;
            if (sizeChanged) el.style.width = `${(L.w * k).toFixed(1)}px`;
            const t = smooth(clamp01((p - L.span[0]) / (L.span[1] - L.span[0])));
            const x = L.start[0] + (L.end[0] - L.start[0]) * t;
            const y = L.start[1] + (L.end[1] - L.start[1]) * t;
            // grow from the layer's anchor: nearer layers faster, so they
            // slide past each other like you're moving into the world
            const g = 1 + L.depth * STORY_ZOOM * z;
            const [ax, ay] = L.anchor || ZOOM_CENTER;
            const gx = ax + (x - ax) * g;
            const gy = ay + (y - ay) * g;
            el.style.transform = `translate3d(${(ox + gx * k).toFixed(1)}px, ${(oy + gy * k).toFixed(1)}px, 0) scale(${g.toFixed(4)})`;
          });

          // landing: blurred + dimmed under the copy, lifting as the descent begins
          const veil = 1 - smooth(clamp01(p / 0.3));
          if (blurRef.current) blurRef.current.style.filter = veil > 0.02 ? `blur(${(6 * veil).toFixed(1)}px)` : "none";
          // story: the world dims behind the chapters
          const q = (ys - D) / C;
          const storyDim = STORY_DIM * smooth(clamp01(q / 0.6));
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
            const o = d <= 0.22 ? 1 : d >= 0.5 ? 0 : (0.5 - d) / 0.28;
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
              src={warm ? L.src : undefined}
              alt=""
              decoding="async"
              className="absolute left-0 top-0 max-w-none select-none"
              style={{ willChange: "transform", transformOrigin: "0 0" }}
            />
          ))}
        </div>
        <div ref={shadeRef} className="absolute inset-0 bg-black" style={{ opacity: 0.5 }} />
      </div>

      {/* Landing, over the blurred world: the B, the tagline, a scroll cue */}
      <div
        ref={landingRef}
        className="pointer-events-none fixed inset-x-0 top-0 z-20 px-6 text-center"
        style={{ height: "100svh", visibility: inWorld ? "visible" : "hidden" }}
      >
        <div className="flex h-full flex-col items-center justify-center pb-[4svh]">
          <div
            style={{
              opacity: inWorld ? 1 : 0,
              transform: inWorld ? "none" : "scale(0.86)",
              filter: inWorld ? "none" : "blur(10px)",
              transition: "opacity 1.6s ease 0.3s, transform 2.2s cubic-bezier(0.16,1,0.3,1) 0.3s, filter 1.6s ease 0.3s",
            }}
          >
            <Emblem3D />
          </div>
          <div
            className="flex flex-col items-center"
            style={{ opacity: inWorld ? 1 : 0, transform: inWorld ? "none" : "translateY(10px)", transition: "opacity 1.4s ease 1.4s, transform 1.4s ease 1.4s" }}
          >
            <p className="font-display text-metallic-grad mt-10 text-[1.7rem] leading-tight" style={{ textWrap: "balance" }}>
              {HERO_TAGLINE}
            </p>
            <p className="font-cinzel mt-4 text-[0.6rem] tracking-[0.34em] text-[var(--sm-gold)] text-legible">{SITE_GENRE_TAGS.split(" | ").join("  ·  ")}</p>
            <p className="font-body mt-6 max-w-[20.5rem] text-[0.95rem] font-light leading-relaxed text-white/85 text-legible" style={{ textWrap: "balance" }}>
              {HERO_BIO_MOBILE}
            </p>
          </div>
        </div>
        <div
          className="absolute inset-x-0 bottom-[6svh] flex flex-col items-center"
          style={{ opacity: inWorld ? 1 : 0, transition: "opacity 1.2s ease 2.4s" }}
        >
          <span className="font-cinzel text-[0.6rem] uppercase tracking-[0.45em] text-[var(--sm-gold-light)] text-legible" style={{ marginRight: "-0.45em" }}>
            Scroll
          </span>
          <div className="relative mt-3 h-10 w-px overflow-hidden bg-gradient-to-b from-white/35 to-white/0">
            <span className="animate-scroll-drop absolute left-1/2 top-0 block h-2 w-[3px] -translate-x-1/2 rounded-full bg-[var(--sm-gold-light)]" style={{ boxShadow: "0 0 6px rgba(240,210,140,0.9)" }} />
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
            <Chapter s={s} load={warm} />
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
        preload={warm ? "auto" : "none"}
        onPlaying={(e) => {
          if (primingRef.current || !enteringRef.current) return;
          afterFirstFrame(e.currentTarget, () => setTransitionPlaying(true));
        }}
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
          onPlaying={warmSoon}
          onEnded={handleIntroEnded}
          tabIndex={-1}
        />
        <div
          className="absolute inset-0 flex flex-col items-center"
          style={{ opacity: phase === "portal" ? 1 : 0, transition: "opacity 0.3s ease" }}
        >
          <div aria-hidden className="absolute inset-x-0 top-0 h-[34%]" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)" }} />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[24%]" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }} />
          <div className="relative mt-[12svh] flex w-full flex-col items-center">
            <img src={LOGO} alt={ARTIST_NAME} className="gold-glow w-[78%] max-w-[22rem]" />
            <span className="mt-5 flex items-center gap-3 text-[var(--sm-gold-light)]" style={{ animation: "breathe 3.2s ease-in-out infinite" }}>
              <span aria-hidden className="h-px w-6 bg-gradient-to-r from-transparent to-[var(--sm-gold)]" />
              <span className="font-cinzel text-[0.62rem] uppercase tracking-[0.42em] text-legible" style={{ marginRight: "-0.42em" }}>
                Tap to Enter
              </span>
              <span aria-hidden className="h-px w-6 bg-gradient-to-l from-transparent to-[var(--sm-gold)]" />
            </span>
          </div>
        </div>
      </button>

      <audio ref={songRef} src={MEDIA.song} preload="metadata" loop playsInline />
      {/* Music: mirrors the menu icon (same size, same inset from the
          other corner). Slashed until the music is on. */}
      <button
        type="button"
        onClick={toggleSong}
        data-testid="world-music-toggle"
        aria-label={songOn ? "Mute music" : "Play music"}
        aria-pressed={songOn}
        className="fixed left-[14px] top-[2px] z-[60] p-[10px] text-white"
      >
        {songOn ? <Volume2 size={25} /> : <VolumeOff size={25} />}
      </button>

      {/* Scroll track: landing, end of the descent, then one stop per chapter */}
      <div
        className="relative"
        style={{ height: inWorld ? `${DESCENT_SVH + CHAPTER_SVH * CHAPTERS.length + 100}svh` : "100svh" }}
        aria-hidden
      >
        {[0, DESCENT_SVH, ...CHAPTERS.map((_, i) => DESCENT_SVH + CHAPTER_SVH * (i + 1))].map((top, i) => (
          // the descent scrolls freely; only the chapters are snap points
          <div key={i} ref={(el) => (anchorRefs.current[i] = el)} style={{ ...snap, top: `${top}svh`, scrollSnapAlign: i >= 2 ? "start" : "none" }} />
        ))}
      </div>
    </div>
  );
};
