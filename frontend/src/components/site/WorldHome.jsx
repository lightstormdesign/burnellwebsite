import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnnouncementBubble } from "@/components/site/AnnouncementBubble";
import { ChevronDown, Volume2, VolumeOff } from "lucide-react";
import { useTilt } from "@/hooks/useTilt";
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
// Alive on top of that: birds cross the sky, a trout leaps in the stream,
// butterflies drift over the meadow (CREATURES, placed in the coordinates of
// the layer they live in, so they move with it); the layers shift with the
// phone's tilt; and the B's glow follows the bass of the song.
//
// About in the menu (/#story) skips straight here and glides down to the
// first chapter: the story lives on the Home page now.
//
// The world layers are mounted from the start, underneath everything, so
// they've loaded by the time the video ends and the handoff is just the
// video fading out over an identical picture. They (and the transition and
// the story photos) only start downloading once the portal is on screen, so
// the portal gets the connection to itself first.

const DESCENT_SVH = 236; // scroll distance of the descent into the world
const CHAPTER_SVH = 100; // scroll distance per story chapter
const SCROLL_EASE = 5; // how quickly the world catches up to the finger (per second)
const STORY_ZOOM = 0.5; // how much the nearest layer grows over the whole story
const STORY_DIM = 0.55; // how dark the world gets behind the chapters
const ZOOM_CENTER = [WORLD_CANVAS.width / 2, WORLD_CANVAS.height / 2];
const TRANSITION_FAILSAFE_MS = 9000;
const WARM_DELAY_MS = 800; // after the intro starts playing
const STORY_HASH = "#story";
const WARM_FALLBACK_MS = 3500; // if it never does (Low Power Mode)
// Half volume and the 2.5s fade-in are baked into the song file itself, and
// its beat is a precomputed map (one byte per 1/30s), so no Web Audio runs:
// on iPhone, Web Audio starting up froze the transition video mid-play.
const BEAT_MAP = "/burnell-beautiful-beat.bin";
const BEAT_FPS = 30;
const EMBLEM = "/burnell-emblem.png";
const EMBLEM_DEPTH = 7; // stacked copies behind the face, 1px apart
const LANDING_EARLY_S = 1.3; // the B starts fading in this long before the transition ends
const STALL_MS = 700; // transition frozen this long: kick it (a few times), then move on
const TILT_X = 40; // canvas px of sideways shift at full tilt, nearest layer
const TILT_Y = 26;

// Creatures. Coordinates are in the space of the layer each one lives in
// (so it rides along with that layer through the descent, the story zoom
// and the tilt). `pose(t, p)` gives where it is at time t (seconds) and
// descent progress p, or null when it's off stage.
const BIRD = { up: "/burnell-world-bird-up.webp", down: "/burnell-world-bird-down.webp" };
const FISH = "/burnell-world-fish.webp";
const BUTTERFLY = "/burnell-world-butterfly.webp";
const FAR_FLOCK = [[0, 0], [-56, -22], [-56, 24], [-112, -42], [-110, 46]];
const NEAR_FLOCK = [[0, 0], [95, -34], [108, 40]];
const FISH_CYCLE_S = 7.5;
const FISH_LEAP_S = 1.35;
const FISH_FROM = [400, 925];
const FISH_TO = [560, 930];
const RIPPLE_S = 1.2;
const CREATURES = [
  // a far flock drifting across the high sky, small and slow
  ...FAR_FLOCK.map(([dx, dy], i) => ({
    id: `far-${i}`,
    kind: "bird",
    layer: "mountains",
    w: 44,
    flap: 0.3 + i * 0.035,
    pose: (t) => {
      const u = (t / 34 + 0.12) % 1;
      return { x: -140 + u * 1240 + dx, y: 240 + dy + 7 * Math.sin(t * 1.1 + i) };
    },
  })),
  // a near flock sweeping the other way now and then, bigger and faster
  ...NEAR_FLOCK.map(([dx, dy], i) => ({
    id: `near-${i}`,
    kind: "bird",
    flip: true,
    layer: "forest-near",
    w: 84,
    flap: 0.26 + i * 0.04,
    pose: (t) => {
      const u = ((t + 4) % 24) / 11;
      if (u > 1) return null;
      return { x: 1150 - u * 1500 + dx, y: 190 + dy + 10 * Math.sin(t * 1.5 + i) };
    },
  })),
  // the trout: leaps from the pool, arcs, dives back in (once you've landed)
  {
    id: "fish",
    kind: "fish",
    layer: "stream",
    w: 105,
    pose: (t, p) => {
      const u = (t % FISH_CYCLE_S) / FISH_LEAP_S;
      if (p < 0.75 || u > 1) return null;
      return {
        x: FISH_FROM[0] + (FISH_TO[0] - FISH_FROM[0]) * u,
        y: FISH_FROM[1] - 440 * u * (1 - u),
        rot: -15 + 100 * u,
        op: Math.min(1, u / 0.08, (1 - u) / 0.08),
      };
    },
  },
  // its splashes: a ripple where it leaves the water and where it lands
  ...[
    [FISH_FROM, 0],
    [FISH_TO, FISH_LEAP_S - 0.05],
  ].map(([[x, y], start], i) => ({
    id: `ripple-${i}`,
    kind: "ripple",
    layer: "stream",
    w: 130,
    pose: (t, p) => {
      const r = ((t % FISH_CYCLE_S) - start) / RIPPLE_S;
      if (p < 0.75 || r < 0 || r > 1) return null;
      return { x, y: y + 4, scale: 0.25 + 0.95 * r, op: (1 - r) * 0.9 };
    },
  })),
  // two butterflies wandering over the meadow
  ...[
    [415, 330, 0],
    [995, 380, 2.1],
  ].map(([cx, cy, ph], i) => ({
    id: `butterfly-${i}`,
    kind: "butterfly",
    layer: "meadow",
    w: 46,
    pose: (t) => ({
      x: cx + 60 * Math.sin(t * 0.55 + ph) + 18 * Math.sin(t * 1.7 + ph),
      y: cy + 32 * Math.sin(t * 0.85 + ph * 2),
      rot: 10 * Math.cos(t * 0.55 + ph),
    }),
  })),
];

const Creature = ({ c, load, refFn }) => (
  <div ref={refFn} className="creature" style={{ opacity: 0 }}>
    <div className="creature-body">
      {c.kind === "bird" && (
        <div className="bird-frames" style={{ "--flap": `${c.flap}s`, transform: c.flip ? "scaleX(-1)" : undefined }}>
          <img className="bird-up" src={load ? BIRD.up : undefined} alt="" />
          <img className="bird-down" src={load ? BIRD.down : undefined} alt="" />
        </div>
      )}
      {c.kind === "fish" && <img src={load ? FISH : undefined} alt="" className="block w-full" />}
      {c.kind === "butterfly" && <img src={load ? BUTTERFLY : undefined} alt="" className="butterfly-wings block w-full" />}
      {c.kind === "ripple" && (
        <div className="relative w-full" style={{ aspectRatio: "3.2 / 1" }}>
          <span className="ripple-ring" style={{ transform: "translate(-50%, -50%)" }} />
          <span className="ripple-ring" style={{ transform: "translate(-50%, -50%) scale(0.55)", opacity: 0.8 }} />
        </div>
      )}
    </div>
  </div>
);

const FEATHER = "radial-gradient(ellipse 72% 76% at 50% 50%, #000 40%, rgba(0,0,0,0.35) 72%, transparent 100%)";
// soft dark pool behind chapter text so it reads over the painted world
const TEXT_POOL = "radial-gradient(ellipse at center, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.38) 48%, transparent 75%)";

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Run cb once the video has actually put a frame on screen (not just
// started), so whatever is covering it can be removed without a flash.
// Whichever signal comes first: a presented frame, playback moving past
// zero, or a short timeout. (iOS Safari doesn't always report presented
// frames, and nothing here may ever wait on just one signal.)
const FRAME_WAIT_MAX_MS = 150;
const afterFirstFrame = (v, cb) => {
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    v.removeEventListener("timeupdate", onTime);
    clearTimeout(t);
    cb();
  };
  const onTime = () => v.currentTime > 0 && go();
  v.addEventListener("timeupdate", onTime);
  const t = setTimeout(go, FRAME_WAIT_MAX_MS);
  if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(go);
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
// It also leans with the phone's tilt (--tilt-x/--tilt-y) and flares with
// the bass of the song (--beat): a brighter, blurred copy of the B and a
// second halo, both following --beat. (Both variables are set on the
// landing only, so updating them every frame never restyles the whole page.)
const Emblem3D = () => (
  <div className="relative" style={{ perspective: "700px" }}>
    <div
      aria-hidden
      className="animate-emblem-halo absolute left-1/2 top-1/2 h-[170%] w-[170%] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ background: "radial-gradient(circle, rgba(214,179,101,0.32) 0%, rgba(214,179,101,0.1) 40%, transparent 68%)" }}
    />
    <div
      aria-hidden
      className="beat-halo absolute left-1/2 top-1/2 h-[190%] w-[190%] rounded-full"
      style={{ background: "radial-gradient(circle, rgba(255,226,160,0.42) 0%, rgba(214,179,101,0.14) 38%, transparent 66%)" }}
    />
    <div
      style={{
        transformStyle: "preserve-3d",
        transform: "rotateY(calc(var(--tilt-x, 0) * 16deg)) rotateX(calc(var(--tilt-y, 0) * -12deg))",
      }}
    >
    <div className="animate-emblem-sway relative w-[clamp(6.5rem,min(36vw,18svh),10rem)]">
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
      <img src={EMBLEM} alt="" aria-hidden className="beat-glow absolute inset-0 h-auto w-full" />
      <img src={EMBLEM} alt={ARTIST_NAME} className="animate-emblem-glow relative h-auto w-full" style={{ transform: "translateZ(0.5px)" }} />
    </div>
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
  const beatMapRef = useRef(null); // Uint8Array, one value per 1/30s of the song
  const phaseRef = useRef("portal");
  const [songOn, setSongOn] = useState(false);
  const mutedRef = useRef(false); // they turned the music off themselves
  const primingRef = useRef(false);
  const pendingStoryRef = useRef(false);
  const introEndedRef = useRef(false);
  const creatureRefs = useRef([]);
  const blobUrlRef = useRef(null);
  const songOnRef = useRef(false);
  const stallRef = useRef(null);
  const [landingEarly, setLandingEarly] = useState(false);
  const { tilt, enable: enableTilt } = useTilt();

  // ?debug: a small on-screen log of what the transition and the song do,
  // for diagnosing playback on a real phone
  const debug = typeof window !== "undefined" && window.location.search.includes("debug");
  const debugRef = useRef(null);
  const debugLines = useRef([]);
  const t0Ref = useRef(typeof performance !== "undefined" ? performance.now() : 0);
  const dlog = (msg) => {
    if (!debug) return;
    debugLines.current = [...debugLines.current.slice(-14), `${((performance.now() - t0Ref.current) / 1000).toFixed(2)} ${msg}`];
    if (debugRef.current) debugRef.current.textContent = debugLines.current.join("\n");
  };

  // Tilt: iOS shows a permission prompt, and a system prompt over the
  // transition can freeze it, so ask on their first touch in the world.
  useEffect(() => {
    if (phase !== "world") return;
    const ask = () => enableTilt();
    window.addEventListener("touchend", ask, { once: true });
    window.addEventListener("click", ask, { once: true });
    return () => {
      window.removeEventListener("touchend", ask);
      window.removeEventListener("click", ask);
    };
  }, [phase, enableTilt]);

  useEffect(() => {
    if (!debug) return;
    const v = transitionRef.current;
    const a = songRef.current;
    const evs = ["play", "playing", "pause", "waiting", "stalled", "suspend", "seeking", "seeked", "ended", "error", "emptied"];
    const onV = (e) => dlog(`video ${e.type} t=${v.currentTime.toFixed(2)} rs=${v.readyState}${v.src.startsWith("blob:") ? " blob" : ""}`);
    const onA = (e) => dlog(`song ${e.type}`);
    evs.forEach((ev) => v.addEventListener(ev, onV));
    ["playing", "pause", "waiting", "stalled"].forEach((ev) => a.addEventListener(ev, onA));
    return () => {
      evs.forEach((ev) => v.removeEventListener(ev, onV));
      ["playing", "pause", "waiting", "stalled"].forEach((ev) => a.removeEventListener(ev, onA));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
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
  //
  // The transition is downloaded whole first (into memory) and played from
  // there, so it can never stall halfway waiting on the network. If it's
  // tapped before that finishes, it just plays from the network.
  useEffect(() => {
    if (!warm) return;
    prime(loopRef.current, () => !introEndedRef.current);
    const primeTransition = () => {
      primingRef.current = true;
      prime(transitionRef.current, () => {
        primingRef.current = false;
        return !enteringRef.current;
      });
    };
    let cancelled = false;
    fetch(MEDIA.transition)
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((blob) => {
        const v = transitionRef.current;
        if (cancelled || enteringRef.current || !v) return;
        blobUrlRef.current = URL.createObjectURL(blob);
        v.src = blobUrlRef.current;
        primeTransition();
      })
      .catch(() => !cancelled && !enteringRef.current && primeTransition());
    return () => {
      cancelled = true;
    };
  }, [warm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      clearInterval(stallRef.current);
    },
    []
  );

  // Once the transition is on screen, stop the portal videos underneath it
  // (fewer videos decoding at once, so the transition stays smooth).
  useEffect(() => {
    if (!transitionPlaying) return;
    introRef.current?.pause();
    loopRef.current?.pause();
  }, [transitionPlaying]);

  useEffect(() => {
    if (warm) return;
    const t = setTimeout(() => setWarm(true), WARM_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [warm]);
  const warmSoon = () => setTimeout(() => setWarm(true), WARM_DELAY_MS);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (!warm || beatMapRef.current) return;
    fetch(BEAT_MAP)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((b) => (beatMapRef.current = new Uint8Array(b)))
      .catch(() => {});
  }, [warm]);

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
    clearInterval(stallRef.current);
    setPhase("world");
  };

  // Play the transition; if the in-memory copy won't play, fall back to the
  // network copy once before giving up and going straight to the world.
  const playTransition = (v) =>
    v.play().catch(() => {
      if (!v.src.startsWith("blob:")) return enterWorld();
      v.src = MEDIA.transition;
      v.play().catch(enterWorld);
    });

  // Keeps the transition moving. iOS can pause a playing video, or keep its
  // clock running while the picture stops updating, when audio starts or a
  // system prompt appears. Every 250ms: if it was paused, resume it; if no
  // new frame has reached the screen for a moment, re-seek in place to kick
  // the decoder. If it's still frozen after a few tries, move on to the
  // world rather than sit on a frozen frame.
  const watchStall = (v) => {
    let lastT = -1;
    let lastMoveAt = performance.now();
    let lastFrameAt = 0; // from requestVideoFrameCallback, once it's proven to fire
    let frames = 0;
    let kicks = 0;
    const onFrame = () => {
      frames++;
      if (frames >= 5) lastFrameAt = performance.now();
      if (!v.ended) v.requestVideoFrameCallback(onFrame);
    };
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(onFrame);
    clearInterval(stallRef.current);
    stallRef.current = setInterval(() => {
      if (v.ended) return clearInterval(stallRef.current);
      const now = performance.now();
      if (v.paused) {
        dlog("paused mid-transition: resuming");
        v.play().catch(() => {});
      }
      if (v.currentTime !== lastT) {
        lastT = v.currentTime;
        lastMoveAt = now;
      }
      // frozen = the clock stopped, or (where frame reports work) the
      // picture stopped while the clock kept going
      const frozenFor = Math.max(now - lastMoveAt, lastFrameAt ? now - lastFrameAt : 0);
      if (frozenFor < STALL_MS) return;
      if (kicks < 1) {
        kicks++;
        dlog(`frozen ${Math.round(frozenFor)}ms at ${v.currentTime.toFixed(2)}s: kick ${kicks}`);
        lastMoveAt = now;
        if (lastFrameAt) lastFrameAt = now;
        try {
          v.currentTime = v.currentTime + 0.001;
        } catch (e) {}
        v.play().catch(() => {});
      } else {
        dlog("still frozen: on to the world");
        enterWorld();
      }
    }, 250);
  };
  // "Beautiful" (half volume and fade-in are in the file). Has to start
  // inside a tap, which is what lets a phone play sound.
  const startSong = () => {
    const el = songRef.current;
    if (!el) return;
    el.play()
      .then(() => {
        songOnRef.current = true;
        setSongOn(true);
      })
      .catch(() => {});
  };

  const toggleSong = () => {
    const el = songRef.current;
    if (!el) return;
    if (songOn) {
      mutedRef.current = true;
      el.pause();
      songOnRef.current = false;
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
    },
    []
  );

  const handleTap = () => {
    if (enteringRef.current) return;
    enteringRef.current = true;
    primingRef.current = false;
    dlog(`tap: video rs=${transitionRef.current?.readyState} ${transitionRef.current?.src.startsWith("blob:") ? "blob" : "network"}, song rs=${songRef.current?.readyState}`);
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
    playTransition(v);
    watchStall(v);
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
    let tx = 0;
    let ty = 0;
    let beat = 0;
    let fit = null; // { k, ox, oy } from the last layout
    const placed = {}; // layer key -> { gx, gy, g } in canvas px
    const t0 = performance.now();

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
        // phone tilt, eased so it glides rather than jitters
        tx += (tilt.current.x - tx) * 0.08;
        ty += (tilt.current.y - ty) * 0.08;
        const key = `${W}|${H}|${ys.toFixed(1)}|${target}|${tx.toFixed(3)}|${ty.toFixed(3)}`;
        if (key !== lastKey) {
          const sizeChanged = !lastKey.startsWith(`${W}|${H}|`);
          landingRef.current?.style.setProperty("--tilt-x", tx.toFixed(3));
          landingRef.current?.style.setProperty("--tilt-y", ty.toFixed(3));
          lastKey = key;
          // cover-fit the painted canvas, centered (same fit as the video)
          const k = Math.max(W / WORLD_CANVAS.width, H / WORLD_CANVAS.height);
          const ox = (W - WORLD_CANVAS.width * k) / 2;
          const oy = (H - WORLD_CANVAS.height * k) / 2;
          fit = { k, ox, oy, p: clamp01(ys / D) };
          if (sizeChanged)
            CREATURES.forEach((c, i) => {
              const el = creatureRefs.current[i];
              if (el) el.style.width = `${(c.w * k).toFixed(1)}px`;
            });
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
            // tilt: far layers slide one way, near ones the other, around
            // the middle distance (the sky never moves up or down, so its
            // edges never show)
            const gx = ax + (x - ax) * g + tx * (L.depth - 0.3) * TILT_X;
            const gy = ay + (y - ay) * g + ty * Math.max(0, L.depth - 0.1) * TILT_Y;
            placed[L.key] = { gx, gy, g };
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
            // faded out: nothing in it (the release bubble) should catch taps
            landingRef.current.classList.toggle("is-gone", o < 0.05);
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
      // creatures: every frame, in the space of the layer each lives in
      // (only once the world is showing: nothing extra runs during the
      // transition video)
      const live = phaseRef.current === "world";
      if (fit && !reduceMotion && live) {
        const t = (now - t0) / 1000;
        CREATURES.forEach((c, i) => {
          const el = creatureRefs.current[i];
          const at = placed[c.layer];
          if (!el || !at) return;
          const pose = c.pose(t, fit.p);
          if (!pose) {
            if (el.style.opacity !== "0") el.style.opacity = "0";
            return;
          }
          const sx = fit.ox + (at.gx + pose.x * at.g) * fit.k;
          const sy = fit.oy + (at.gy + pose.y * at.g) * fit.k;
          el.style.opacity = (pose.op ?? 1).toFixed(3);
          el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) scale(${(at.g * (pose.scale ?? 1)).toFixed(4)}) rotate(${(pose.rot ?? 0).toFixed(1)}deg)`;
        });
      }

      // the beat: read from the precomputed map at the song's position
      const song = songRef.current;
      const map = beatMapRef.current;
      const target01 = map && song && songOnRef.current && !song.paused ? (map[Math.floor(song.currentTime * BEAT_FPS)] ?? 0) / 255 : 0;
      beat += (target01 - beat) * 0.5;
      if (live) landingRef.current?.style.setProperty("--beat", beat.toFixed(3));

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const inWorld = phase === "world";
  const showLanding = inWorld || landingEarly;
  const snap = { scrollSnapAlign: "start", position: "absolute", left: 0, height: 1, width: 1 };

  return (
    <div data-testid="world-home" className="relative">
      {/* The world (always mounted, so it's loaded before the video ends) */}
      <div ref={stageRef} className="fixed inset-x-0 top-0 z-10 overflow-hidden bg-black" style={{ height: "100lvh" }} aria-hidden>
        <div ref={blurRef} className="absolute inset-0" style={{ filter: "blur(6px)" }}>
          {WORLD_LAYERS.map((L, i) => (
            <Fragment key={L.key}>
              <img
                ref={(el) => (layerRefs.current[i] = el)}
                src={warm ? L.src : undefined}
                alt=""
                decoding="async"
                className="absolute left-0 top-0 max-w-none select-none"
                style={{ willChange: "transform", transformOrigin: "0 0" }}
              />
              {/* the fish swims in front of the stream but behind the boulders */}
              {CREATURES.map((c, ci) =>
                c.layer === L.key ? <Creature key={c.id} c={c} load={warm} refFn={(el) => (creatureRefs.current[ci] = el)} /> : null
              )}
            </Fragment>
          ))}
        </div>
        <div ref={shadeRef} className="absolute inset-0 bg-black" style={{ opacity: 0.5 }} />
      </div>

      {/* Landing, over the blurred world: the B, the tagline, a scroll cue */}
      <div
        ref={landingRef}
        // above the transition video, so the B can rise over its last moment
        className="pointer-events-none fixed inset-x-0 top-0 z-[35] px-6 text-center"
        style={{ height: "100svh", visibility: showLanding ? "visible" : "hidden" }}
      >
        <div className="flex h-full flex-col items-center justify-center pb-[22svh]">
          <div
            style={{
              opacity: showLanding ? 1 : 0,
              transform: showLanding ? "none" : "scale(0.86)",
              filter: showLanding ? "none" : "blur(10px)",
              transition: "opacity 1.5s ease, transform 2.2s cubic-bezier(0.16,1,0.3,1), filter 1.5s ease",
            }}
          >
            <Emblem3D />
          </div>
          <div
            className="flex flex-col items-center"
            style={{ opacity: showLanding ? 1 : 0, transform: showLanding ? "none" : "translateY(10px)", transition: "opacity 1.4s ease 0.5s, transform 1.4s ease 0.5s" }}
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
        {/* Scroll cue: a capsule with a gold drop falling through it and a
            cascade of chevrons, under a clear label */}
        <div
          className="absolute inset-x-0 bottom-[88px] flex justify-center"
          style={{ opacity: showLanding ? 1 : 0, transition: "opacity 1.2s ease 1.6s" }}
        >
          <div className="animate-cue-bob relative flex flex-col items-center">
            <div aria-hidden className="absolute left-1/2 top-1/2 -z-10 h-[150%] w-[200%] -translate-x-1/2 -translate-y-1/2" style={{ background: TEXT_POOL, filter: "blur(12px)" }} />
            <span className="font-cinzel text-[0.66rem] uppercase tracking-[0.34em] text-[var(--sm-gold-light)] text-legible" style={{ marginRight: "-0.34em" }}>
              Scroll to Explore
            </span>
            <div className="scroll-capsule mt-3">
              <span className="scroll-capsule-drop" />
            </div>
            <div className="mt-1 flex flex-col items-center text-[var(--sm-gold-light)]" aria-hidden>
              <ChevronDown size={16} className="chevron-cascade -mb-2.5" />
              <ChevronDown size={16} className="chevron-cascade" style={{ animationDelay: "0.25s" }} />
            </div>
          </div>
        </div>
        {/* New release, bottom-left; fades with the rest of the landing */}
        <AnnouncementBubble active={inWorld} compact />
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
          // fully visible (but underneath the portal) until the world: an
          // invisible video isn't drawn on iOS, so it would never report
          // its first frame and the portal would never hand off
          opacity: phase === "world" ? 0 : 1,
          // fade out over the world only if it actually played (About can
          // skip straight to the world without it)
          transition: phase === "world" && transitionPlaying ? "opacity 0.7s ease" : "none",
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
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (!landingEarly && enteringRef.current && v.duration && v.duration - v.currentTime <= LANDING_EARLY_S) setLandingEarly(true);
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
          {/* Everything fades in over the opening seconds: the shading,
              then the logo out of a soft blur, then Tap to Enter opening up
              (which also buys the transition time to load) */}
          <div aria-hidden className="animate-cine-shade absolute inset-x-0 top-0 h-[34%]" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)" }} />
          <div aria-hidden className="animate-cine-shade absolute inset-x-0 bottom-0 h-[24%]" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }} />
          <div className="relative mt-[12svh] flex w-full flex-col items-center">
            <img src={LOGO} alt={ARTIST_NAME} className="animate-cine-logo gold-glow w-[78%] max-w-[22rem]" />
            <span className="mt-5 flex items-center gap-3 text-[var(--sm-gold-light)]" style={{ animation: "breathe 3.2s ease-in-out infinite" }}>
              <span aria-hidden className="animate-cine-shade h-px w-6 bg-gradient-to-r from-transparent to-[var(--sm-gold)]" style={{ animationDelay: "2.4s" }} />
              <span className="animate-cine-tap font-cinzel text-[0.62rem] uppercase tracking-[0.42em] text-legible" style={{ marginRight: "-0.42em" }}>
                Tap to Enter
              </span>
              <span aria-hidden className="animate-cine-shade h-px w-6 bg-gradient-to-l from-transparent to-[var(--sm-gold)]" style={{ animationDelay: "2.4s" }} />
            </span>
          </div>
        </div>
      </button>

      {/* fully buffered once the portal is up, so on the tap it starts at once
          rather than a second later in the middle of the transition */}
      <audio ref={songRef} src={MEDIA.song} preload={warm ? "auto" : "metadata"} loop playsInline />
      {debug && (
        <pre
          ref={debugRef}
          className="pointer-events-none fixed inset-x-2 bottom-2 z-[9999] max-h-[45svh] overflow-hidden whitespace-pre-wrap rounded bg-black/75 p-2 font-mono text-[10px] leading-tight text-green-300"
        />
      )}
      {/* Music: mirrors the menu icon (same size, same inset from the
          other corner). Slashed until the music is on. */}
      <button
        type="button"
        onClick={toggleSong}
        data-testid="world-music-toggle"
        aria-label={songOn ? "Mute music" : "Play music"}
        aria-pressed={songOn}
        className={`fixed left-[14px] top-[2px] z-[60] p-[10px] text-white ${location.hash ? "" : "animate-ui-in"}`}
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
