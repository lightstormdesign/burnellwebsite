import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnnouncementBubble } from "@/components/site/AnnouncementBubble";
import { PortalFlower } from "@/components/site/PortalFlower";
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
const BEAT_MAP = "/burnell-beautiful-beat.bin?v=8";
const BEAT_FPS = 30;
const EMBLEM = "/burnell-emblem.png";
const EMBLEM_DEPTH = 7; // stacked copies behind the face, 1px apart
const LANDING_EARLY_S = 1.3; // the B starts fading in this long before the transition ends
const STALL_MS = 1200; // transition's clock stuck this long: kick it once, then move on
const TILT_X = 95; // canvas px of sideways shift at full tilt, nearest layer
const TILT_Y = 62;

// Creatures. Coordinates are in the space of the layer each one lives in
// (so it rides along with that layer through the descent, the story zoom
// and the tilt). `pose(t, p)` gives where it is at time t (seconds) and
// descent progress p, or null when it's off stage.
const BIRD = { up: "/burnell-world-bird-up.webp", down: "/burnell-world-bird-down.webp" };
const FISH = "/burnell-world-fish.webp"; // rising
const FISH_DIVE = "/burnell-world-fish-dive.webp"; // heading back down
const BUTTERFLY = "/burnell-world-butterfly.webp";
const CLOUD = {
  large: "/burnell-world-cloud-large.webp",
  medium: "/burnell-world-cloud-medium.webp",
  small: "/burnell-world-cloud-small.webp",
};
// The parting clouds aren't in any layer: the scroll drives them (see
// PARTING_CLOUDS), and the tilt moves each by its own depth.
const CLOUD_TILT = 0.6;
const PART_RANGE = 0.9; // how much of the descent the parting takes (slow)
const wrap = (v, lo, hi) => lo + ((((v - lo) % (hi - lo)) + (hi - lo)) % (hi - lo));
const FAR_FLOCK = [[0, 0], [-56, -22], [-56, 24], [-112, -42], [-110, 46]];
const NEAR_FLOCK = [[0, 0], [95, -34], [108, 40]];
const FISH_CYCLE_S = 7.5;
const FISH_LEAP_S = 1.5;
const WATERLINE = 928; // the pool's surface, in the stream layer
const FISH_X = [380, 580]; // where the leap starts and ends
const FISH_DEPTH = 62; // starts and ends this far under the surface (hidden)
const FISH_RISE = 700; // 4x the height of the arc
// when it breaks the surface on the way out, and on the way back in
const FISH_SURFACE_U = (1 - Math.sqrt(1 - (4 * FISH_DEPTH) / FISH_RISE)) / 2;
const RIPPLE_S = 1.2;
// Falling aspen leaves: six, at three distances, each tumbling (turning
// and flipping edge-on) as it drifts down. Near ones are bigger and fall
// faster, and like everything else they rise past you as you scroll down.
// Kept deliberately light: one small image each, moved and turned only.
const LEAF = [1, 2, 3, 4].map((n) => `/burnell-world-leaf-${n}.webp`);
const LEAVES = [
  { src: LEAF[3], after: "meadow", depth: 1, w: 120, x0: 180, off: 0, ph: 0 },
  { src: LEAF[1], after: "meadow", depth: 1, w: 105, x0: 760, off: 1100, ph: 2.1 },
  { src: LEAF[0], after: "forest-far", depth: 0.6, w: 78, x0: 560, off: 400, ph: 4.2 },
  { src: LEAF[2], after: "forest-far", depth: 0.6, w: 70, x0: 250, off: 1500, ph: 1.3 },
  { src: LEAF[3], after: "mountains", depth: 0.35, w: 46, x0: 700, off: 900, ph: 3.3 },
  { src: LEAF[2], after: "mountains", depth: 0.35, w: 42, x0: 330, off: 200, ph: 5.1 },
];
const PARTING_CLOUDS = [
  // far: behind the near forest, small, slow
  { src: CLOUD.small, after: "mountains", depth: 0.35, w: 300, x0: 400, y0: 470, dir: -1, op: 0.85 },
  { src: CLOUD.medium, after: "mountains", depth: 0.35, w: 320, x0: 580, y0: 560, dir: 1, op: 0.85 },
  // middle distance
  { src: CLOUD.large, after: "forest-far", depth: 0.65, w: 470, x0: 320, y0: 680, dir: -1, op: 0.9 },
  { src: CLOUD.small, after: "forest-far", depth: 0.65, w: 400, x0: 660, y0: 790, dir: 1, op: 0.9 },
  // near: in front of everything, biggest, fastest
  { src: CLOUD.medium, after: "meadow", depth: 1, w: 640, x0: 340, y0: 930, dir: -1, op: 0.95 },
  { src: CLOUD.large, after: "meadow", depth: 1, w: 680, x0: 620, y0: 1120, dir: 1, op: 0.95 },
];
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
  // the trout: rises out of the pool, arcs, dives back in (once you've
  // landed). It's drawn inside a window whose bottom edge is the water's
  // surface, so it's revealed as it breaks out and swallowed as it goes
  // back under, rather than fading.
  {
    id: "fish",
    kind: "fish",
    layer: "stream",
    w: 105,
    clip: [230, 640, 730, WATERLINE],
    pose: (t, p) => {
      const u = (t % FISH_CYCLE_S) / FISH_LEAP_S;
      if (p < 0.75 || u > 1) return null;
      return {
        x: FISH_X[0] + (FISH_X[1] - FISH_X[0]) * u,
        y: WATERLINE + FISH_DEPTH - FISH_RISE * u * (1 - u),
        // rising pose up to the top of the arc, then the diving pose; each
        // turned so the fish heads along its path (the two images are drawn
        // at different angles, so the swap at the top is seamless)
        dive: u > 0.5,
        rot: u > 0.5 ? -40 + 110 * (u - 0.5) : -20 + 110 * u,
      };
    },
  },
  // its splashes: a ripple where it breaks the surface, and where it goes back in
  ...[FISH_SURFACE_U, 1 - FISH_SURFACE_U].map((u, i) => [[FISH_X[0] + (FISH_X[1] - FISH_X[0]) * u, WATERLINE], u * FISH_LEAP_S]).map(([[x, y], start], i) => ({
    id: `ripple-${i}`,
    kind: "ripple",
    layer: "stream",
    w: 130,
    pose: (t, p) => {
      const r = ((t % FISH_CYCLE_S) - start) / RIPPLE_S;
      if (p < 0.75 || r < 0 || r > 1) return null;
      return { x, y, scale: 0.25 + 0.95 * r, op: (1 - r) * 0.9 };
    },
  })),
  // a small cloud far off, drifting slowly across the high sky
  {
    id: "cloud-far",
    kind: "cloud",
    src: CLOUD.small,
    layer: "mountains",
    w: 200,
    pose: (t) => ({ x: wrap(320 + t * 6, -200, 1140), y: 110, op: 0.8 }),
  },
  // The parting clouds: gathered toward the middle at the start, at three
  // distances, they part to the sides as you scroll down to reveal the
  // canyon. Nearer ones are bigger, part further and rise faster; far
  // ones are smaller and move less. (x0, y0 is where each starts in the
  // 941x1672 canvas; dir is which side it parts to.)
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
        x: c.x0 + c.dir * (300 + 650 * c.depth) * e + 8 * Math.sin(t * 0.3 + i),
        y: c.y0 - p * (250 + 650 * c.depth),
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
      const speed = 45 + 95 * c.depth; // canvas px per second
      return {
        x: c.x0 + 70 * Math.sin(t * 0.5 + c.ph) + 25 * Math.sin(t * 1.3 + c.ph * 2),
        y: wrap(c.off + t * speed - p * (250 + 650 * c.depth), -220, 1890),
        rot: 30 * Math.sin(t * 0.7 + c.ph) + c.ph * 40,
        flip: Math.cos(t * (1.1 + 0.4 * c.depth) + c.ph),
        op: c.depth < 0.5 ? 0.85 : 1,
      };
    },
  })),
  // two butterflies wandering over the meadow: a big one up close, a small
  // one further off
  ...[
    [415, 330, 0, 115, 1.6],
    [995, 380, 2.1, 46, 1],
  ].map(([cx, cy, ph, w, roam], i) => ({
    id: `butterfly-${i}`,
    kind: "butterfly",
    layer: "meadow",
    w,
    pose: (t) => ({
      x: cx + roam * (60 * Math.sin(t * 0.55 + ph) + 18 * Math.sin(t * 1.7 + ph)),
      y: cy + roam * 32 * Math.sin(t * 0.85 + ph * 2),
      rot: 10 * Math.cos(t * 0.55 + ph),
    }),
  })),
];

const CreatureBody = ({ c, load }) => (
    <div className="creature-body">
      {c.kind === "bird" && (
        <div className="bird-frames" style={{ "--flap": `${c.flap}s`, transform: c.flip ? "scaleX(-1)" : undefined }}>
          <img className="bird-up" src={load ? BIRD.up : undefined} alt="" />
          <img className="bird-down" src={load ? BIRD.down : undefined} alt="" />
        </div>
      )}
      {c.kind === "fish" && (
        <div className="relative w-full">
          <img src={load ? FISH : undefined} alt="" className="block w-full" />
          <img src={load ? FISH_DIVE : undefined} alt="" className="absolute inset-0 block w-full" style={{ opacity: 0 }} />
        </div>
      )}
      {c.kind === "butterfly" && <img src={load ? BUTTERFLY : undefined} alt="" className="butterfly-wings block w-full" />}
      {c.kind === "cloud" && <img src={load ? c.src : undefined} alt="" className="block w-full" />}
      {c.kind === "leaf" && <img src={load ? c.src : undefined} alt="" className="block w-full" />}
      {c.kind === "ripple" && (
        <div className="relative w-full" style={{ aspectRatio: "3.2 / 1" }}>
          <span className="ripple-ring" style={{ transform: "translate(-50%, -50%)" }} />
          <span className="ripple-ring" style={{ transform: "translate(-50%, -50%) scale(0.55)", opacity: 0.8 }} />
        </div>
      )}
    </div>
);

// A creature with `clip` lives inside a window (in its layer's coordinates)
// and is only seen within it: the fish below the water's surface is hidden.
export const Creature = ({ c, load, refFn }) =>
  c.clip ? (
    <div ref={refFn} className="creature overflow-hidden" style={{ opacity: 0 }}>
      <div className="creature-inner absolute left-0 top-0" style={{ transformOrigin: "0 0" }}>
        <CreatureBody c={c} load={load} />
      </div>
    </div>
  ) : (
    <div ref={refFn} className="creature" style={{ opacity: 0 }}>
      <CreatureBody c={c} load={load} />
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
export const Emblem3D = () => (
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
        transform: "rotateY(calc(var(--tilt-x, 0) * 27deg)) rotateX(calc(var(--tilt-y, 0) * -20deg))",
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
  const [transitionReady, setTransitionReady] = useState(false); // downloaded (or given up on)
  const [layersReady, setLayersReady] = useState(false);
  const layersLoaded = useRef(0);
  const fetchAbortRef = useRef(null);
  const recoveredRef = useRef(null); // the fresh transition video, if one was needed
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
  // ?debug&solo: never load the world (layers, creatures, story photos), to
  // test the transition video entirely on its own
  const solo = debug && window.location.search.includes("solo");
  // The world only starts loading once the transition is over: until then
  // the connection belongs to the portal, the transition and the song (on a
  // slow connection, background downloads during the transition froze it).
  // The B and the bio hold people while the layers arrive, over the
  // transition's last frame, which is the same picture.
  const loadWorld = phase === "world" && !solo;
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

  // Once the portal is up, get the loop ready, and download the transition
  // whole into memory and load it (load only: playing it briefly to warm it
  // up, then pausing and rewinding it, is what made iOS freeze its picture
  // partway through later). If it's tapped before the download finishes, it
  // just plays from the network.
  useEffect(() => {
    if (!warm) return;
    prime(loopRef.current, () => !introEndedRef.current);
    const loadTransition = () => {
      const v = transitionRef.current;
      if (!v) return;
      v.preload = "auto";
      v.load();
    };
    let cancelled = false;
    const abort = typeof AbortController !== "undefined" ? new AbortController() : null;
    fetchAbortRef.current = abort;
    fetch(MEDIA.transition, abort ? { signal: abort.signal } : undefined)
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((blob) => {
        const v = transitionRef.current;
        if (cancelled || enteringRef.current || !v) return;
        blobUrlRef.current = URL.createObjectURL(blob);
        v.src = blobUrlRef.current;
        dlog("transition downloaded");
        loadTransition();
      })
      .catch(() => !cancelled && !enteringRef.current && loadTransition())
      .finally(() => !cancelled && setTransitionReady(true));
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
    if (phase !== "world" || beatMapRef.current) return;
    fetch(BEAT_MAP)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((b) => (beatMapRef.current = new Uint8Array(b)))
      .catch(() => {});
  }, [phase]);

  // The transition's last frame stays up (blurred and dimmed, exactly like
  // the world's landing) until every layer has arrived, then fades out. If
  // they take too long, it fades anyway.
  useEffect(() => {
    if (phase !== "world" || layersReady) return;
    const t = setTimeout(() => setLayersReady(true), 6000);
    return () => clearTimeout(t);
  }, [phase, layersReady]);
  const onLayerLoad = () => {
    layersLoaded.current += 1;
    if (layersLoaded.current >= WORLD_LAYERS.length) {
      dlog("world layers loaded");
      setLayersReady(true);
    }
  };

  // Freeze check during the transition. On iPhone the video can keep its
  // clock running while its picture stops changing. Every 300ms, sample the
  // current picture at 24x24; if it hasn't changed for 0.6s, put a fresh
  // video element over it to carry on from the same spot, and if that one
  // freezes too, go on to the world rather than sit on a frozen frame.
  useEffect(() => {
    if (phase !== "transition") return;
    const cur = () => recoveredRef.current || transitionRef.current;
    const c = document.createElement("canvas");
    c.width = c.height = 24;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!cur() || !ctx) return;
    let prev = null;
    let sameSince = 0;
    const iv = setInterval(() => {
      const v = cur();
      if (v.readyState < 2 || v.paused || v.ended) return;
      let px;
      try {
        ctx.drawImage(v, 0, 0, 24, 24);
        px = ctx.getImageData(0, 0, 24, 24).data;
      } catch (e) {
        return clearInterval(iv);
      }
      let diff = Infinity;
      if (prev) {
        diff = 0;
        for (let i = 0; i < px.length; i += 4) diff += Math.abs(px[i] - prev[i]) + Math.abs(px[i + 1] - prev[i + 1]);
      }
      prev = px;
      const now = performance.now();
      if (diff > 24) {
        sameSince = 0;
        return;
      }
      if (!sameSince) sameSince = now;
      if (now - sameSince < 600) return;
      if (!recoveredRef.current) {
        sameSince = 0;
        prev = null;
        dlog(`picture frozen at t=${v.currentTime.toFixed(2)}: fresh video`);
        recoverTransition(v);
      } else {
        dlog("picture still frozen: on to the world");
        enterWorld();
      }
    }, 300);
    return () => clearInterval(iv);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // No page scroll until the world is entered; scroll-snap only in the world.
  useEffect(() => {
    const root = document.documentElement;
    if (phase === "world") {
      window.scrollTo(0, 0);
      root.style.overflow = "";
      root.style.scrollSnapType = "y proximity";
      // no rubber-band past the ends: on iPhone it dragged the world up and
      // showed black below the last chapter
      root.style.overscrollBehaviorY = "none";
      document.body.style.overscrollBehaviorY = "none";
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
      root.style.overscrollBehaviorY = "";
      document.body.style.overscrollBehaviorY = "";
    };
  }, [phase]);

  // A frozen transition gets a brand-new video element (a new player) over
  // it, from the same file, picking up where the frozen one is. The frozen
  // one stays underneath until the new one is actually showing.
  const recoverTransition = (v) => {
    const t = v.currentTime;
    const nv = document.createElement("video");
    nv.muted = true;
    nv.playsInline = true;
    nv.setAttribute("playsinline", "");
    nv.setAttribute("aria-hidden", "true");
    nv.preload = "auto";
    nv.className = v.className;
    nv.style.cssText = v.style.cssText;
    nv.style.zIndex = "31";
    nv.style.opacity = "0";
    nv.src = v.src;
    nv.addEventListener("loadedmetadata", () => {
      try {
        nv.currentTime = t;
      } catch (e) {}
      nv.play().catch(enterWorld);
    }, { once: true });
    nv.addEventListener("playing", () => afterFirstFrame(nv, () => {
      nv.style.opacity = "1";
      v.pause();
      v.style.visibility = "hidden";
      dlog("fresh video showing");
    }), { once: true });
    nv.addEventListener("timeupdate", () => {
      if (nv.duration && nv.duration - nv.currentTime <= LANDING_EARLY_S) setLandingEarly(true);
    });
    nv.addEventListener("ended", enterWorld);
    v.parentNode.insertBefore(nv, v.nextSibling);
    recoveredRef.current = nv;
    clearTimeout(failsafeRef.current);
    failsafeRef.current = setTimeout(enterWorld, TRANSITION_FAILSAFE_MS);
  };

  // Once in the world, a fresh transition video (if there was one) does
  // what the original would have: holds its last frame, blurred and dimmed,
  // until the layers are in, then fades out and goes.
  useEffect(() => {
    const nv = recoveredRef.current;
    if (phase !== "world" || !nv) return;
    nv.style.transition = "opacity 0.9s ease, filter 1.2s ease";
    nv.style.filter = "blur(6px) brightness(0.5)";
    if (!layersReady) return;
    nv.style.opacity = "0";
    const t = setTimeout(() => nv.remove(), 1000);
    return () => clearTimeout(t);
  }, [phase, layersReady]);

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

  // Keeps the transition moving. Every 250ms: if iOS paused it, resume it;
  // if its clock has stopped, re-seek in place once to kick it, and if it's
  // still stuck, move on to the world rather than sit on a frozen frame.
  // (A picture that freezes while the clock runs is handled by drawing the
  // frames onto the canvas instead.)
  const watchStall = (first) => {
    let lastT = -1;
    let lastMoveAt = performance.now();
    let kicks = 0;
    clearInterval(stallRef.current);
    stallRef.current = setInterval(() => {
      const v = recoveredRef.current || first;
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
      if (now - lastMoveAt < STALL_MS) return;
      if (kicks < 1) {
        kicks++;
        dlog(`stuck at ${v.currentTime.toFixed(2)}s: kick`);
        lastMoveAt = now;
        try {
          v.currentTime = v.currentTime + 0.001;
        } catch (e) {}
        v.play().catch(() => {});
      } else {
        dlog("still stuck: on to the world");
        enterWorld();
      }
    }, 250);
  };
  // "Beautiful" (half volume and fade-in are in the file). Has to start
  // inside a tap, which is what lets a phone play sound.
  const startSong = () => {
    const el = songRef.current;
    if (!el || (debug && window.location.search.includes("nosong"))) return;
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
    if (!transitionReady) fetchAbortRef.current?.abort();
    dlog(`tap: video rs=${transitionRef.current?.readyState} ${transitionRef.current?.src.startsWith("blob:") ? "blob" : "network"}, song rs=${songRef.current?.readyState}`);
    setWarm(true);
    if (!mutedRef.current && !songOn) startSong();
    const v = transitionRef.current;
    if (reduceMotion || !v) {
      enterWorld();
      return;
    }
    setPhase("transition");
    // no rewind here: it has never played, and seeking a video right as it
    // starts is another way to freeze its picture on iOS
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
        tx += (tilt.current.x - tx) * 0.12;
        ty += (tilt.current.y - ty) * 0.12;
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
              if (!el) return;
              if (c.clip) {
                el.style.width = `${((c.clip[2] - c.clip[0]) * k).toFixed(1)}px`;
                el.style.height = `${((c.clip[3] - c.clip[1]) * k).toFixed(1)}px`;
                el.firstChild.style.width = `${(c.w * k).toFixed(1)}px`;
              } else {
                el.style.width = `${(c.w * k).toFixed(1)}px`;
              }
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
          // free creatures (the parting clouds) sit in canvas space, moved
          // by the tilt according to their own depth
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
            // the window rides with the layer; the creature moves inside it
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
          // `flip` squashes it along its own width (after the turn), so a
          // leaf tumbles edge-on and over
          el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) scale(${(at.g * (pose.scale ?? 1)).toFixed(4)}) rotate(${(pose.rot ?? 0).toFixed(1)}deg)${pose.flip != null ? ` scaleX(${pose.flip.toFixed(3)})` : ""}`;
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
      {/* Kept invisible (not painted) until the world itself: on iPhone, the
          whole painted world sitting decoded under the transition starved
          it of memory and froze its picture partway. The transition fades
          out over it, which covers the moment it takes to draw. */}
      <div
        ref={stageRef}
        className="fixed inset-x-0 top-0 z-10 overflow-hidden bg-black"
        style={{ height: "100lvh", visibility: inWorld ? "visible" : "hidden" }}
        aria-hidden
      >
        <div ref={blurRef} className="absolute inset-0" style={{ filter: "blur(6px)" }}>
          {WORLD_LAYERS.map((L, i) => (
            <Fragment key={L.key}>
              <img
                ref={(el) => (layerRefs.current[i] = el)}
                src={loadWorld ? L.src : undefined}
                onLoad={onLayerLoad}
                onError={onLayerLoad}
                alt=""
                decoding="async"
                className="absolute left-0 top-0 max-w-none select-none"
                style={{ willChange: "transform", transformOrigin: "0 0" }}
              />
              {/* the fish swims in front of the stream but behind the boulders */}
              {CREATURES.map((c, ci) =>
                (c.space === "free" ? c.after : c.layer) === L.key ? <Creature key={c.id} c={c} load={loadWorld} refFn={(el) => (creatureRefs.current[ci] = el)} /> : null
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
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20" style={{ height: "100svh", visibility: inWorld ? "visible" : "hidden" }}>
        {CHAPTERS.map((s, i) => (
          <div
            key={s.id}
            ref={(el) => (chapterRefs.current[i] = el)}
            data-testid={`world-chapter-${s.id}`}
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: 0, pointerEvents: "none" }}
          >
            <Chapter s={s} load={loadWorld && layersReady} />
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
          // once it's over it holds its last frame (= the world's landing),
          // blurred and dimmed like the landing, until the layers are in
          opacity: phase === "world" && (layersReady || !transitionPlaying) ? 0 : 1,
          filter: phase === "world" ? "blur(6px) brightness(0.5)" : "none",
          // fade out over the world only if it actually played (About can
          // skip straight to the world without it)
          transition: phase === "world" && transitionPlaying ? "opacity 0.9s ease, filter 1.2s ease" : "none",
          pointerEvents: "none",
        }}
        src={MEDIA.transition}
        muted
        playsInline
        // never loads itself: the in-memory copy is fetched separately (the
        // network copy only plays if they tap before that's done)
        preload="none"
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
      {/* An all-but-invisible layer over the transition while it plays. With
          nothing on top of it, iPhone can hand a full-screen video to a
          direct display path that sometimes stops updating the picture
          (the clock runs on, the frame stays); anything layered over it
          keeps it on the normal path. Found because the ?debug log box,
          which sits over the video, made the freeze much rarer. */}
      {(phase === "transition" || (phase === "world" && transitionPlaying && !layersReady)) && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[32]" style={{ background: "rgba(0,0,0,0.012)" }} />
      )}

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
          // once the transition has taken over, stop painting the portal
          // (and its two videos) at all
          visibility: phase === "transition" && transitionPlaying ? "hidden" : "visible",
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
          <PortalFlower />
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

      {/* buffered once the transition has downloaded (it comes first), so on
          the tap it can start at once */}
      <audio ref={songRef} src={MEDIA.song} preload={transitionReady ? "auto" : "none"} loop playsInline />
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
