import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Volume2, VolumeOff } from "lucide-react";
import { AnnouncementBubble } from "@/components/site/AnnouncementBubble";
import { PortalFlower } from "@/components/site/PortalFlower";
import { Creature, Emblem3D } from "@/components/site/WorldHome";
import {
  ABOUT_STAGES,
  ARTIST_NAME,
  DESKTOP_WORLD_CANVAS as CANVAS,
  DESKTOP_WORLD_LAYERS as LAYERS,
  HERO_BIO,
  HERO_TAGLINE,
  MOBILE_HOME_MEDIA,
  SITE_GENRE_TAGS,
} from "@/data/site";

// Desktop Home: the same world as the phone's (WorldHome.jsx), painted
// 16:9. Portal -> Tap Here to Enter (or scroll) -> the transition (whip
// pan to the aspen leaf, the drop falls, the camera dives into the world
// inside it) -> the landing over the blurred sky (the B, the tagline, the
// bio), starting exactly where the video ends -> scrolling descends into the
// world, each layer rising at its own pace -> Burnell's story, chapter by
// chapter, while the world keeps drifting toward you.
//
// Everything alive on the phone is here too: the two flocks, the leaping
// trout and its ripples, the parting clouds, the falling aspen leaves, the
// butterflies and the deer. The mouse does what tilting the phone does:
// far layers slide one way and near ones the other, around the middle
// distance. Clicking to enter starts "Beautiful", and the B glows with its
// bass.
//
// Its own component (not a branch inside WorldHome), so the phone's portal
// and transition code is never touched by desktop changes.

const DESCENT_VH = 200; // scroll distance of the descent into the world
const CHAPTER_VH = 100; // scroll distance per story chapter
const SCROLL_EASE = 5; // how quickly the world catches up to the wheel (per second)
const STORY_ZOOM = 0.45; // how much the nearest layer grows over the whole story
const STORY_DIM = 0.55; // how dark the world gets behind the chapters
// Drawn a little larger than the screen, so the parallax never shows an edge.
// The portal and the transition video are drawn at the same size, so every
// handoff lines up.
const OVERSCAN = 1.04;
const ZOOM_CENTER = [CANVAS.width / 2, CANVAS.height / 2];
const TILT_X = 95; // canvas px of sideways shift at full parallax, nearest layer
const TILT_Y = 50;
const TILT_EASE = 0.06; // the mouse is jumpier than a phone's tilt: glide more
const ENTER_LOCK_MS = 900; // after landing, the wheel waits a moment (no momentum carry-over)
// Whip pan to the leaf, then the drop falls into the world. Its first frame
// is the portal photo; its last is the world's landing.
const TRANSITION = "/burnell-transition-desktop.mp4?v=2";
const TRANSITION_FAILSAFE_MS = 14000;
const LANDING_EARLY_S = 1.3; // the B starts rising this long before the video ends
const WARM_DELAY_MS = 700;
const STORY_HASH = "#story";
// The portal: the Motionleap loop (3D drift and birds, then the same without
// the birds), joined into one file that loops forever. The poster is its
// first frame.
const PORTAL_LOOP = "/burnell-portal-loop-desktop.mp4?v=1";
const PORTAL_POSTER = "/burnell-portal-loop-desktop.webp";
// rings that spread from wherever they tap to enter, like the drop landing
const ENTER_BURST = [
  { size: 260, ms: 1100, delay: 0 },
  { size: 440, ms: 1500, delay: 90 },
  { size: 680, ms: 1900, delay: 200 },
];
const BEAT_MAP = "/burnell-beautiful-beat.bin?v=8";
const BEAT_FPS = 30;

const CLOUD = {
  large: "/burnell-world-cloud-large.webp",
  medium: "/burnell-world-cloud-medium.webp",
  small: "/burnell-world-cloud-small.webp",
};
const LEAF = [1, 2, 3, 4].map((n) => `/burnell-world-leaf-${n}.webp`);

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (t) => t * t * (3 - 2 * t);
const wrap = (v, lo, hi) => lo + ((((v - lo) % (hi - lo)) + (hi - lo)) % (hi - lo));

// Creatures, as on the phone, in the coordinates of the 1672x941 canvas
// (or of the layer each lives in, so it rides along with it).
const CLOUD_TILT = 0.6;
const PART_RANGE = 0.9;
const FAR_FLOCK = [[0, 0], [-50, -20], [-50, 22], [-100, -38], [-98, 42]];
const NEAR_FLOCK = [[0, 0], [86, -30], [98, 36]];
const FISH_CYCLE_S = 5;
const FISH_LEAP_S = 1.6;
// The trout leaps from the middle pool, right under the deer on the
// center mound, over to the next pool to the right (stream-layer coordinates).
const WATERLINE = 652;
const FISH_X = [840, 1140];
const FISH_DEPTH = 50;
const FISH_RISE = 640;
const FISH_SURFACE_U = (1 - Math.sqrt(1 - (4 * FISH_DEPTH) / FISH_RISE)) / 2;
const RIPPLE_S = 1.2;
const LEAVES = [
  { src: LEAF[3], after: "meadow", depth: 1, w: 110, x0: 260, off: 0, ph: 0 },
  { src: LEAF[1], after: "meadow", depth: 1, w: 96, x0: 1420, off: 600, ph: 2.1 },
  { src: LEAF[0], after: "forest-far", depth: 0.6, w: 70, x0: 980, off: 250, ph: 4.2 },
  { src: LEAF[2], after: "forest-far", depth: 0.6, w: 64, x0: 520, off: 850, ph: 1.3 },
  { src: LEAF[3], after: "mountains", depth: 0.35, w: 42, x0: 1240, off: 500, ph: 3.3 },
  { src: LEAF[2], after: "mountains", depth: 0.35, w: 38, x0: 640, off: 120, ph: 5.1 },
];
const PARTING_CLOUDS = [
  { src: CLOUD.small, after: "mountains", depth: 0.35, w: 340, x0: 690, y0: 300, dir: -1, op: 0.85 },
  { src: CLOUD.medium, after: "mountains", depth: 0.35, w: 360, x0: 980, y0: 360, dir: 1, op: 0.85 },
  { src: CLOUD.large, after: "forest-far", depth: 0.65, w: 520, x0: 600, y0: 470, dir: -1, op: 0.9 },
  { src: CLOUD.small, after: "forest-far", depth: 0.65, w: 440, x0: 1080, y0: 540, dir: 1, op: 0.9 },
  { src: CLOUD.medium, after: "meadow", depth: 1, w: 700, x0: 560, y0: 640, dir: -1, op: 0.95 },
  { src: CLOUD.large, after: "meadow", depth: 1, w: 760, x0: 1110, y0: 760, dir: 1, op: 0.95 },
];
const CREATURES = [
  ...FAR_FLOCK.map(([dx, dy], i) => ({
    id: `far-${i}`,
    kind: "bird",
    layer: "mountains",
    w: 40,
    flap: 0.3 + i * 0.035,
    pose: (t) => {
      const u = (t / 40 + 0.12) % 1;
      return { x: -140 + u * 1960 + dx, y: 150 + dy + 7 * Math.sin(t * 1.1 + i) };
    },
  })),
  ...NEAR_FLOCK.map(([dx, dy], i) => ({
    id: `near-${i}`,
    kind: "bird",
    flip: true,
    layer: "forest-near",
    w: 74,
    flap: 0.26 + i * 0.04,
    pose: (t) => {
      const u = ((t + 4) % 26) / 13;
      if (u > 1) return null;
      return { x: 1900 - u * 2200 + dx, y: 110 + dy + 10 * Math.sin(t * 1.5 + i) };
    },
  })),
  {
    id: "fish",
    kind: "fish",
    layer: "stream",
    w: 110,
    clip: [720, 380, 1200, WATERLINE],
    pose: (t, p) => {
      const u = (t % FISH_CYCLE_S) / FISH_LEAP_S;
      if (p < 0.75 || u > 1) return null;
      return {
        x: FISH_X[0] + (FISH_X[1] - FISH_X[0]) * u,
        y: WATERLINE + FISH_DEPTH - FISH_RISE * u * (1 - u),
        dive: u > 0.5,
        rot: u > 0.5 ? -40 + 110 * (u - 0.5) : -20 + 110 * u,
      };
    },
  },
  ...[FISH_SURFACE_U, 1 - FISH_SURFACE_U].map((u, i) => {
    const x = FISH_X[0] + (FISH_X[1] - FISH_X[0]) * u;
    const start = u * FISH_LEAP_S;
    return {
      id: `ripple-${i}`,
      kind: "ripple",
      layer: "stream",
      w: 120,
      pose: (t, p) => {
        const r = ((t % FISH_CYCLE_S) - start) / RIPPLE_S;
        if (p < 0.75 || r < 0 || r > 1) return null;
        return { x, y: WATERLINE, scale: 0.25 + 0.95 * r, op: (1 - r) * 0.9 };
      },
    };
  }),
  {
    id: "cloud-far",
    kind: "cloud",
    src: CLOUD.small,
    layer: "mountains",
    w: 200,
    pose: (t) => ({ x: wrap(520 + t * 7, -220, 1880), y: 60, op: 0.8 }),
  },
  ...PARTING_CLOUDS.map((c, i) => ({
    id: `cloud-part-${i}`,
    kind: "cloud",
    src: c.src,
    space: "free",
    after: c.after,
    depth: c.depth,
    w: c.w,
    pose: (t, p) => {
      const e = smooth(clamp01(p / PART_RANGE));
      return {
        x: c.x0 + c.dir * (420 + 760 * c.depth) * e + 8 * Math.sin(t * 0.3 + i),
        y: c.y0 - p * (180 + 520 * c.depth),
        op: c.op,
      };
    },
  })),
  ...LEAVES.map((c, i) => ({
    id: `leaf-${i}`,
    kind: "leaf",
    src: c.src,
    space: "free",
    after: c.after,
    depth: c.depth,
    w: c.w,
    pose: (t, p) => {
      const speed = 40 + 80 * c.depth;
      return {
        x: c.x0 + 80 * Math.sin(t * 0.5 + c.ph) + 25 * Math.sin(t * 1.3 + c.ph * 2),
        y: wrap(c.off + t * speed - p * (180 + 520 * c.depth), -200, 1140),
        rot: 30 * Math.sin(t * 0.7 + c.ph) + c.ph * 40,
        flip: Math.cos(t * (1.1 + 0.4 * c.depth) + c.ph),
        op: c.depth < 0.5 ? 0.85 : 1,
      };
    },
  })),
  ...[
    [380, 540, 0, 100, 1.6],
    [1300, 560, 2.1, 42, 1],
  ].map(([cx, cy, ph, w, roam], i) => ({
    id: `butterfly-${i}`,
    kind: "butterfly",
    layer: "meadow",
    w,
    pose: (t) => ({
      x: cx + roam * (70 * Math.sin(t * 0.55 + ph) + 18 * Math.sin(t * 1.7 + ph)),
      y: cy + roam * 30 * Math.sin(t * 0.85 + ph * 2),
      rot: 10 * Math.cos(t * 0.55 + ph),
    }),
  })),
];

// fades fully out before the photo's edges, so no rectangle ever shows
const FEATHER = "radial-gradient(closest-side, #000 50%, rgba(0,0,0,0.45) 78%, transparent 100%)";
const TEXT_POOL = "radial-gradient(ellipse at center, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.38) 48%, transparent 75%)";

const CHAPTERS = [...ABOUT_STAGES.filter((s) => s.media || s.bridge), { id: "home-invitation", invitation: true }];

const Chapter = ({ s, i, load }) => {
  if (s.invitation) {
    return (
      <div className="relative flex flex-col items-center px-8 text-center">
        <div aria-hidden className="absolute left-1/2 top-1/2 -z-10 h-[160%] w-[150%] -translate-x-1/2 -translate-y-1/2" style={{ background: TEXT_POOL, filter: "blur(18px)" }} />
        <img src="/burnell-emblem.png" alt="" aria-hidden className="h-20 w-auto opacity-90" />
        <h2 className="font-display mt-8 text-5xl leading-tight text-white text-legible">
          If you feel it, <span className="text-gold-grad">you’re already soul fam.</span>
        </h2>
        <div className="mt-10 flex items-center gap-8">
          <Link to="/community" className="rounded-full bg-[var(--sm-gold)] px-9 py-4 font-body text-sm font-medium text-black transition-colors hover:bg-[var(--sm-gold-light)]">
            Join the Family
          </Link>
          <Link to="/music" className="font-accent text-xs uppercase tracking-[0.28em] text-[var(--sm-gold-light)] hover:text-white">
            Hear the music
          </Link>
        </div>
        <p className="font-display mt-12 text-xl text-white text-legible">— {ARTIST_NAME}</p>
      </div>
    );
  }
  if (s.bridge) {
    return (
      <p style={{ background: TEXT_POOL }} className="font-accent max-w-3xl px-16 py-24 text-center text-4xl italic leading-snug text-white/90 text-legible">
        {s.body}
      </p>
    );
  }
  // photo and words side by side, swapping sides chapter to chapter
  return (
    <div className={`flex w-full max-w-6xl items-center gap-14 px-16 pt-16 ${i % 2 ? "flex-row-reverse" : ""}`}>
      <img
        src={load ? s.media : undefined}
        alt=""
        className="max-h-[66vh] w-auto max-w-[46%] select-none object-contain"
        style={{ WebkitMaskImage: FEATHER, maskImage: FEATHER }}
      />
      <div className="relative min-w-0 flex-1 text-left">
        <div aria-hidden className="absolute -inset-x-14 -inset-y-16 -z-10" style={{ background: TEXT_POOL, filter: "blur(16px)" }} />
        {s.kicker && <span className="font-accent text-[0.68rem] uppercase tracking-[0.4em] text-[var(--sm-gold)]">{s.kicker}</span>}
        {s.title && <h2 className="font-display mt-3 text-5xl leading-tight text-white text-legible">{s.title}</h2>}
        <div className="mt-5 max-w-xl space-y-4">
          {s.body.map((b, j) => (
            <p key={j} className="font-body text-[1.05rem] font-light leading-relaxed text-white/90 text-legible">
              {b}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export const DesktopWorld = () => {
  const [phase, setPhase] = useState("portal"); // portal | world
  const [warm, setWarm] = useState(false); // start loading the world
  const [layersReady, setLayersReady] = useState(false);
  const [songOn, setSongOn] = useState(false);
  const [locked, setLocked] = useState(false); // no scrolling for a moment after entering
  const [transitionPlaying, setTransitionPlaying] = useState(false);
  const [landingEarly, setLandingEarly] = useState(false);
  const videoRef = useRef(null);
  const failsafeRef = useRef(null);

  const stageRef = useRef(null);
  const layerRefs = useRef([]);
  const creatureRefs = useRef([]);
  const blurRef = useRef(null);
  const shadeRef = useRef(null);
  const landingRef = useRef(null);
  const chapterRefs = useRef([]);
  const anchorRefs = useRef([]);
  const songRef = useRef(null);
  const songOnRef = useRef(false);
  const beatMapRef = useRef(null);
  const phaseRef = useRef("portal");
  const mouse = useRef({ x: 0, y: 0 });
  const portalLoopRef = useRef(null);
  const layersLoaded = useRef(0);
  const pendingStoryRef = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const inWorld = phase === "world";

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // the portal gets the connection first, then the world loads underneath it
  useEffect(() => {
    const t = setTimeout(() => setWarm(true), WARM_DELAY_MS);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!warm || layersReady) return;
    const t = setTimeout(() => setLayersReady(true), 6000);
    return () => clearTimeout(t);
  }, [warm, layersReady]);
  const onLayerLoad = () => {
    layersLoaded.current += 1;
    if (layersLoaded.current >= LAYERS.length) setLayersReady(true);
  };

  useEffect(() => {
    if (!inWorld || beatMapRef.current) return;
    fetch(BEAT_MAP)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((b) => (beatMapRef.current = new Uint8Array(b)))
      .catch(() => {});
  }, [inWorld]);

  // The mouse is the tilt: -1..1 from the middle of the screen.
  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Page scroll only in the world; chapters settle gently (proximity snap).
  // In the world the site-wide wand dimming and flower watermark step aside:
  // the world has its own light, and a full-screen backdrop filter over a
  // moving scene costs every frame.
  useEffect(() => {
    const root = document.documentElement;
    if (inWorld && !locked) {
      root.style.overflow = "";
      root.style.scrollSnapType = "y proximity";
    } else {
      root.style.overflow = "hidden";
    }
    if (inWorld) root.style.setProperty("--portal-fx-intensity", "0");
    return () => {
      root.style.overflow = "";
      root.style.scrollSnapType = "";
    };
  }, [inWorld, locked]);
  useEffect(() => () => document.documentElement.style.removeProperty("--portal-fx-intensity"), []);

  const scrollToStory = () => {
    const a = anchorRefs.current[2];
    if (a) window.scrollTo(0, a.offsetTop);
  };

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
      el.pause();
      songOnRef.current = false;
      setSongOn(false);
    } else {
      startSong();
    }
  };

  // Enter: play the transition (or go straight to the world when motion is
  // reduced, or for About's #story link). Muted video may always play; the
  // song needs the click, so only a click or a key starts it.
  const enter = (withSong, skipVideo = false, at = null) => {
    if (phaseRef.current !== "portal") return;
    if (at && !reduceMotion) burst(at.clientX, at.clientY);
    setWarm(true);
    if (withSong) startSong();
    window.scrollTo(0, 0);
    const v = videoRef.current;
    if (skipVideo || reduceMotion || !v) return startWorld();
    phaseRef.current = "transition";
    setPhase("transition");
    v.play().catch(startWorld);
    failsafeRef.current = setTimeout(startWorld, TRANSITION_FAILSAFE_MS);
  };

  // Gold rings spreading from the tap, over everything, each removing itself.
  const burst = (x, y) =>
    ENTER_BURST.forEach(({ size, ms, delay }) => {
      const el = document.createElement("div");
      el.className = "touch-ripple";
      Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px`, animationDuration: `${ms}ms`, animationDelay: `${delay}ms`, opacity: "0" });
      document.body.appendChild(el);
      setTimeout(() => el.remove(), ms + delay + 50);
    });

  const startWorld = () => {
    if (phaseRef.current === "world") return;
    clearTimeout(failsafeRef.current);
    phaseRef.current = "world";
    setLocked(true);
    setPhase("world");
    setTimeout(() => {
      setLocked(false);
      if (pendingStoryRef.current) {
        pendingStoryRef.current = false;
        requestAnimationFrame(scrollToStory);
      }
    }, ENTER_LOCK_MS);
  };

  // Scrolling down (or Space / arrow down / Enter) on the portal enters too.
  useEffect(() => {
    if (phase !== "portal") return;
    const onWheel = (e) => e.deltaY > 0 && enter(false);
    const onKey = (e) => ["ArrowDown", "PageDown", " ", "Enter"].includes(e.key) && enter(e.key === "Enter" || e.key === " ");
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // About in the menu (/#story): straight into the world, down to the first chapter.
  useEffect(() => {
    if (location.hash !== STORY_HASH) return;
    navigate("/", { replace: true });
    if (phaseRef.current === "world") scrollToStory();
    else {
      pendingStoryRef.current = true;
      enter(false, true);
    }
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      songRef.current?.pause();
      clearTimeout(failsafeRef.current);
    },
    []
  );

  // The world, every frame: ease toward the real scroll position, place each
  // layer between its landing and landed position, grow it through the
  // story, shift it with the mouse, and move the creatures. Imperative style
  // writes only, so scrolling never re-renders.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let ys = window.scrollY;
    let lastKey = "";
    let tx = 0;
    let ty = 0;
    let beat = 0;
    let fit = null;
    const placed = {};
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
        // near layers move against the mouse, far ones with it
        tx += (-mouse.current.x - tx) * TILT_EASE;
        ty += (-mouse.current.y - ty) * TILT_EASE;
        const key = `${W}|${H}|${ys.toFixed(1)}|${target}|${tx.toFixed(3)}|${ty.toFixed(3)}`;
        if (key !== lastKey) {
          const sizeChanged = !lastKey.startsWith(`${W}|${H}|`);
          landingRef.current?.style.setProperty("--tilt-x", (-tx).toFixed(3));
          landingRef.current?.style.setProperty("--tilt-y", (-ty).toFixed(3));
          lastKey = key;
          const k = Math.max(W / CANVAS.width, H / CANVAS.height) * OVERSCAN;
          const ox = (W - CANVAS.width * k) / 2;
          const oy = (H - CANVAS.height * k) / 2;
          const p = clamp01(ys / D);
          fit = { k, ox, oy, p };
          if (sizeChanged)
            CREATURES.forEach((c, i) => {
              const el = creatureRefs.current[i];
              if (!el) return;
              if (c.clip) {
                el.style.width = `${((c.clip[2] - c.clip[0]) * k).toFixed(1)}px`;
                el.style.height = `${((c.clip[3] - c.clip[1]) * k).toFixed(1)}px`;
                el.firstChild.style.width = `${(c.w * k).toFixed(1)}px`;
              } else {
                el.style.width = `${(c.w * k).toFixed(1)}px`;
              }
            });
          const z = clamp01((ys - D) / (C * CHAPTERS.length));
          LAYERS.forEach((L, i) => {
            const el = layerRefs.current[i];
            if (!el) return;
            if (sizeChanged) el.style.width = `${(L.w * k).toFixed(1)}px`;
            const t = smooth(clamp01((p - L.span[0]) / (L.span[1] - L.span[0])));
            const x = L.start[0] + (L.end[0] - L.start[0]) * t;
            const y = L.start[1] + (L.end[1] - L.start[1]) * t;
            const g = 1 + L.depth * STORY_ZOOM * z;
            const [ax, ay] = L.anchor || ZOOM_CENTER;
            const gx = ax + (x - ax) * g + tx * (L.depth - 0.3) * TILT_X;
            const gy = ay + (y - ay) * g + ty * Math.max(0, L.depth - 0.1) * TILT_Y;
            placed[L.key] = { gx, gy, g };
            el.style.transform = `translate3d(${(ox + gx * k).toFixed(1)}px, ${(oy + gy * k).toFixed(1)}px, 0) scale(${g.toFixed(4)})`;
          });

          const veil = 1 - smooth(clamp01(p / 0.3));
          if (blurRef.current) blurRef.current.style.filter = veil > 0.02 ? `blur(${(6 * veil).toFixed(1)}px)` : "none";
          const q = (ys - D) / C;
          const storyDim = STORY_DIM * smooth(clamp01(q / 0.6));
          if (shadeRef.current) shadeRef.current.style.opacity = Math.max(0.5 * veil, storyDim).toFixed(3);
          if (landingRef.current) {
            const o = 1 - clamp01(target / (H * 0.15));
            landingRef.current.style.opacity = o.toFixed(3);
            landingRef.current.style.filter = `blur(${((1 - o) * 8).toFixed(1)}px)`;
            landingRef.current.classList.toggle("is-gone", o < 0.05);
          }
          chapterRefs.current.forEach((el, i) => {
            if (!el) return;
            const d = Math.abs(q - (i + 1));
            const o = d <= 0.22 ? 1 : d >= 0.5 ? 0 : (0.5 - d) / 0.28;
            el.style.opacity = o.toFixed(3);
            el.style.pointerEvents = o > 0.6 ? "auto" : "none";
            el.style.transform = `translateY(${((q - (i + 1)) * -30).toFixed(1)}px)`;
          });
        }
      }

      const live = phaseRef.current === "world";
      if (fit && !reduceMotion && live) {
        const t = (now - t0) / 1000;
        CREATURES.forEach((c, i) => {
          const el = creatureRefs.current[i];
          const at =
            c.space === "free" ? { gx: tx * TILT_X * CLOUD_TILT * c.depth, gy: ty * TILT_Y * CLOUD_TILT * c.depth, g: 1 } : placed[c.layer];
          if (!el || !at) return;
          const pose = c.pose(t, fit.p);
          if (!pose) {
            if (el.style.opacity !== "0") el.style.opacity = "0";
            return;
          }
          el.style.opacity = (pose.op ?? 1).toFixed(3);
          if (c.clip) {
            const [x0, y0] = c.clip;
            const wx = fit.ox + (at.gx + x0 * at.g) * fit.k;
            const wy = fit.oy + (at.gy + y0 * at.g) * fit.k;
            el.style.transform = `translate3d(${wx.toFixed(1)}px, ${wy.toFixed(1)}px, 0) scale(${at.g.toFixed(4)})`;
            el.firstChild.style.transform = `translate3d(${((pose.x - x0) * fit.k).toFixed(1)}px, ${((pose.y - y0) * fit.k).toFixed(1)}px, 0) rotate(${(pose.rot ?? 0).toFixed(1)}deg)`;
            if (pose.dive !== undefined) {
              const [rise, dive] = el.querySelectorAll("img");
              rise.style.opacity = pose.dive ? "0" : "1";
              dive.style.opacity = pose.dive ? "1" : "0";
            }
            return;
          }
          const sx = fit.ox + (at.gx + pose.x * at.g) * fit.k;
          const sy = fit.oy + (at.gy + pose.y * at.g) * fit.k;
          el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) scale(${(at.g * (pose.scale ?? 1)).toFixed(4)}) rotate(${(pose.rot ?? 0).toFixed(1)}deg)${pose.flip != null ? ` scaleX(${pose.flip.toFixed(3)})` : ""}`;
        });
      }

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

  const snap = { position: "absolute", left: 0, height: 1, width: 1 };
  const showLanding = inWorld || landingEarly;

  return (
    <div data-testid="desktop-world" className="relative">
      {/* The world */}
      <div ref={stageRef} className="fixed inset-0 z-10 overflow-hidden bg-black" aria-hidden>
        <div ref={blurRef} className="absolute inset-0" style={{ filter: "blur(6px)" }}>
          {LAYERS.map((L, i) => (
            <Fragment key={L.key}>
              <img
                ref={(el) => (layerRefs.current[i] = el)}
                src={warm ? L.src : undefined}
                onLoad={onLayerLoad}
                onError={onLayerLoad}
                alt=""
                decoding="async"
                className="absolute left-0 top-0 max-w-none select-none"
                style={{ willChange: "transform", transformOrigin: "0 0" }}
              />
              {CREATURES.map((c, ci) =>
                (c.space === "free" ? c.after : c.layer) === L.key ? <Creature key={c.id} c={c} load={warm} refFn={(el) => (creatureRefs.current[ci] = el)} /> : null
              )}
            </Fragment>
          ))}
        </div>
        <div ref={shadeRef} className="absolute inset-0 bg-black" style={{ opacity: 0.5 }} />
      </div>

      {/* Landing: the B, the tagline, the bio, a scroll cue */}
      <div ref={landingRef} className="pointer-events-none fixed inset-0 z-[35] px-8 text-center" style={{ visibility: showLanding ? "visible" : "hidden" }}>
        <div className="flex h-full flex-col items-center justify-center pb-[12vh] pt-16">
          <div
            style={{
              opacity: showLanding ? 1 : 0,
              transform: showLanding ? "none" : "scale(0.86)",
              filter: showLanding ? "none" : "blur(10px)",
              transition: "opacity 1.5s ease 0.5s, transform 2.2s cubic-bezier(0.16,1,0.3,1) 0.5s, filter 1.5s ease 0.5s",
            }}
          >
            <Emblem3D />
          </div>
          <div
            className="flex flex-col items-center"
            style={{ opacity: showLanding ? 1 : 0, transform: showLanding ? "none" : "translateY(10px)", transition: "opacity 1.4s ease 1s, transform 1.4s ease 1s" }}
          >
            <p className="font-display text-metallic-grad mt-10 text-5xl leading-tight">{HERO_TAGLINE}</p>
            <p className="font-cinzel mt-5 text-[0.7rem] tracking-[0.34em] text-[var(--sm-gold)] text-legible">{SITE_GENRE_TAGS.split(" | ").join("  ·  ")}</p>
            <p className="font-body mt-6 max-w-2xl text-base font-light leading-relaxed text-white/85 text-legible" style={{ textWrap: "balance" }}>
              {HERO_BIO}
            </p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-10 flex justify-center" style={{ opacity: showLanding ? 1 : 0, transition: "opacity 1.2s ease 2s" }}>
          <div className="animate-cue-bob relative flex flex-col items-center">
            <div aria-hidden className="absolute left-1/2 top-1/2 -z-10 h-[150%] w-[200%] -translate-x-1/2 -translate-y-1/2" style={{ background: TEXT_POOL, filter: "blur(12px)" }} />
            <span className="font-cinzel text-[0.7rem] uppercase tracking-[0.34em] text-[var(--sm-gold-light)] text-legible" style={{ marginRight: "-0.34em" }}>
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
        <AnnouncementBubble active={inWorld} />
      </div>

      {/* Story chapters, faded in and out by scroll position */}
      <div className="pointer-events-none fixed inset-0 z-20" style={{ visibility: inWorld ? "visible" : "hidden" }}>
        {CHAPTERS.map((s, i) => (
          <div
            key={s.id}
            ref={(el) => (chapterRefs.current[i] = el)}
            data-testid={`world-chapter-${s.id}`}
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: 0, pointerEvents: "none" }}
          >
            <Chapter s={s} i={i} load={warm && layersReady} />
          </div>
        ))}
      </div>

      {/* The transition, over the world until it ends. It sits under the
          landing, so the B can rise over its last moment, and fades out
          (blurred and dimmed like the landing) once the layers are in. */}
      <video
        ref={videoRef}
        data-testid="desktop-transition-video"
        className="fixed inset-0 z-30 h-full w-full object-cover"
        style={{
          transform: `scale(${OVERSCAN})`,
          opacity: phase === "portal" || (inWorld && layersReady) ? 0 : 1,
          filter: inWorld ? "blur(6px) brightness(0.5)" : "none",
          transition: inWorld ? "opacity 0.9s ease, filter 1.2s ease" : "none",
          pointerEvents: "none",
        }}
        src={TRANSITION}
        muted
        playsInline
        preload={warm ? "auto" : "none"}
        onPlaying={(e) => {
          // hand over only once a frame is actually on screen, so nothing
          // behind it ever shows through
          const v = e.currentTarget;
          let done = false;
          const go = () => {
            if (done) return;
            done = true;
            v.removeEventListener("timeupdate", onTime);
            setTransitionPlaying(true);
            portalLoopRef.current?.pause();
          };
          const onTime = () => v.currentTime > 0.05 && go();
          v.addEventListener("timeupdate", onTime);
          if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(() => v.requestVideoFrameCallback(go));
          setTimeout(go, 400);
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (!landingEarly && v.duration && v.duration - v.currentTime <= LANDING_EARLY_S) setLandingEarly(true);
        }}
        onEnded={startWorld}
        tabIndex={-1}
      />

      {/* Portal: Burnell's loop, and the way in on the right.
          Clicking anywhere enters too. Stays up until the transition's first
          frame is actually playing underneath it. */}
      <div
        onClick={(e) => enter(true, false, e)}
        data-testid="desktop-portal"
        className="fixed inset-0 z-40 cursor-pointer overflow-hidden bg-black"
        style={{
          opacity: phase === "portal" || (phase === "transition" && !transitionPlaying) ? 1 : 0,
          // a short dissolve into the whip: the loop is mid-drift when they tap
          transition: inWorld ? "opacity 0.7s ease" : "opacity 0.3s ease",
          pointerEvents: phase === "portal" ? "auto" : "none",
          visibility: phase === "portal" || (phase === "transition" && !transitionPlaying) ? "visible" : "hidden",
        }}
      >
        {/* drawn at the same size as the transition and the world, so the handoff lines up */}
        <video
          ref={portalLoopRef}
          data-testid="desktop-portal-loop"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: `scale(${OVERSCAN})` }}
          src={PORTAL_LOOP}
          poster={PORTAL_POSTER}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          aria-label={ARTIST_NAME}
          tabIndex={-1}
        />
        <PortalFlower spin top="18%" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-[30%]" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)" }} />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[30%]" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />
        {/* Tap Here to Enter: a glass ring with a gold water drop (the drop
            the transition follows), rippling outward, on the right where
            he's looking */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            enter(true, false, e);
          }}
          data-testid="desktop-enter"
          className="animate-cine-tap group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: "83%", top: "43%" }}
        >
          <span aria-hidden className="absolute left-1/2 top-1/2 -z-10 h-[190%] w-[230%] -translate-x-1/2 -translate-y-1/2" style={{ background: TEXT_POOL, filter: "blur(18px)" }} />
          <span className="relative flex h-28 w-28 items-center justify-center">
            <span aria-hidden className="enter-ripple absolute inset-0 rounded-full border border-[var(--sm-gold)]" />
            <span aria-hidden className="enter-ripple absolute inset-0 rounded-full border border-[var(--sm-gold)]" style={{ animationDelay: "1.4s" }} />
            <span className="relative flex h-full w-full items-center justify-center rounded-full border-[1.5px] border-[var(--sm-gold-light)]/85 bg-black/35 shadow-[0_0_50px_rgba(214,179,101,0.5),inset_0_0_24px_rgba(214,179,101,0.25)] backdrop-blur-md transition duration-500 group-hover:scale-105 group-hover:bg-black/15 group-hover:shadow-[0_0_70px_rgba(214,179,101,0.6)]">
              <svg viewBox="0 0 24 24" className="h-12 w-12 drop-shadow-[0_0_10px_rgba(243,223,176,0.7)]" style={{ animation: "breathe 3.2s ease-in-out infinite" }} aria-hidden>
                <defs>
                  <linearGradient id="enter-drop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#f3dfb0" />
                    <stop offset="1" stopColor="#c9a24f" />
                  </linearGradient>
                </defs>
                <path d="M12 2.6C12 2.6 5.6 9.9 5.6 14.4a6.4 6.4 0 0 0 12.8 0C18.4 9.9 12 2.6 12 2.6z" fill="url(#enter-drop)" fillOpacity="0.35" stroke="url(#enter-drop)" strokeWidth="1.2" />
                <path d="M9.2 14.6a2.9 2.9 0 0 0 2.4 2.8" fill="none" stroke="#fff7e2" strokeOpacity="0.8" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </span>
          </span>
          <span className="font-cinzel mt-7 whitespace-nowrap text-base uppercase tracking-[0.42em] text-[#f3dfb0] text-legible" style={{ marginRight: "-0.42em" }}>
            Tap Here to Enter
          </span>
        </button>
      </div>

      <audio ref={songRef} src={MOBILE_HOME_MEDIA.song} preload={warm ? "auto" : "none"} loop />
      <button
        type="button"
        onClick={toggleSong}
        data-testid="world-music-toggle"
        aria-label={songOn ? "Mute music" : "Play music"}
        aria-pressed={songOn}
        className="fixed bottom-6 right-6 z-[60] rounded-full p-2.5 text-white/85 transition-colors hover:text-[var(--sm-gold-light)]"
      >
        {songOn ? <Volume2 size={24} /> : <VolumeOff size={24} />}
      </button>

      {/* Scroll track: landing, end of the descent, then one stop per chapter */}
      <div className="relative" style={{ height: inWorld ? `${DESCENT_VH + CHAPTER_VH * CHAPTERS.length + 100}vh` : "100vh" }} aria-hidden>
        {[0, DESCENT_VH, ...CHAPTERS.map((_, i) => DESCENT_VH + CHAPTER_VH * (i + 1))].map((top, i) => (
          <div key={i} ref={(el) => (anchorRefs.current[i] = el)} style={{ ...snap, top: `${top}vh`, scrollSnapAlign: i >= 2 ? "start" : "none" }} />
        ))}
      </div>
    </div>
  );
};

export default DesktopWorld;
