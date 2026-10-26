# Scroll-world playbook

How Burnell's home page works (portal → transition video → layered scroll
world), and everything we learned fixing it, so the next artist site starts
from here instead of from scratch.

## Where the code is

| What | File |
| --- | --- |
| Picks the phone or desktop world (`max-width: 767px`) | `frontend/src/components/site/CinematicExperience.jsx`, `frontend/src/hooks/useIsMobile.js` |
| Phone: portal, transition, world, chapters, every iOS safeguard | `frontend/src/components/site/WorldHome.jsx` |
| Desktop: the same, plus mouse parallax, logo intro, enter button | `frontend/src/components/site/DesktopWorld.jsx` |
| Layer and media data (positions, depths, `MEDIA_V`) | `frontend/src/data/site.js` (`WORLD_LAYERS`, `DESKTOP_WORLD_LAYERS`, `*_CANVAS`, `MOBILE_HOME_MEDIA`) |
| Phone tilt for parallax | `frontend/src/hooks/useTilt.js` |
| Animated deer (stands in for the deer layer) | `frontend/src/components/site/DeerRig.jsx` |
| Scroll guide, water cursor | `WorldProgress.jsx`, `WaterCursor.jsx` |
| Layers | `frontend/public/burnell-world-*.webp` (phone, 941×1672), `burnell-world-desktop-*.webp` (desktop, 1672×941) |

Good places to start reading in `WorldHome.jsx`: `afterFirstFrame` (~line
314), the transition blob preload (~585), layers-ready (~640), the freeze
detector (~652), `watchStall` (~803), the scroll engine's `frame` (~926), and
the `rgba(0,0,0,0.012)` overlay (~1224). In `DesktopWorld.jsx`: `warm`
(~325), the blob preload (~577), and the engine (~690–740).

## How it works

### Phases

`portal` (an intro clip, then a loop; desktop adds a 1.5s logo intro) →
`transition` (the drop / dive video) → `world` (the layered scene plus the
story chapters). The page can't scroll until `world`.

### Layers

Every layer is a full-canvas transparent WebP at the same canvas size,
listed back to front:

```
sky, mountains, forest-far, forest-near, stream, deer, boulders, trees-left, trees-right, meadow
```

Each entry in `site.js`:

```js
{ key, src, w, start: [x, y], end: [x, y], span: [a, b], depth, anchor? }
```

- `start` is where the layer sits when the world appears. It must match the
  transition's last frame, so the swap is invisible.
- `end` is where it sits at the bottom of the descent (the landing, "the B").
- `span` is the part of the descent this layer moves over (0–1).
  Foreground layers start later.
- `depth` (0 = sky, 1 = nearest) scales the tilt/mouse parallax.
- `w` is the drawn width in canvas px. Use it for narrower pieces, such as
  the trees or the deer.

### Scroll engine (one rAF loop, no React re-renders)

```js
ys += (window.scrollY - ys) * (1 - Math.exp(-dt * SCROLL_EASE)); // eased scroll
const p = ys / D;                                               // descent progress
const t = smooth(clamp01((p - L.span[0]) / (L.span[1] - L.span[0])));
let gx = lerp(L.start[0], L.end[0], t), gy = lerp(L.start[1], L.end[1], t);
gx += tiltX * (L.depth - 0.3) * TILT_X;                          // parallax
gy += tiltY * Math.max(0, L.depth - 0.1) * TILT_Y;
const k = Math.max(W / CANVAS.width, H / CANVAS.height) * OVERSCAN; // cover-fit
el.style.transform = `translate3d(${ox + gx * k}px, ${oy + gy * k}px, 0) scale(${g})`;
```

- Phones use device tilt; desktop uses the mouse, eased with `TILT_EASE`.
- The scroll track has a spacer per section. Proximity scroll-snap applies
  only to the chapters; the descent scrolls freely.
- Creatures (birds, fish, ripples, clouds, leaves) are pose functions placed
  in a layer's coordinates, so they ride along with that layer.

### Loading order (what makes the swap seamless)

1. **Portal first.** Nothing else loads until the portal has started
   playing, so it gets all the bandwidth.
2. **Warm.** Shortly after (700–800ms, or 3.5s if the intro never plays,
   such as in Low Power Mode), the transition is downloaded in full with
   `fetch` and played from a blob URL. It plays from memory and never
   buffers mid-dive.
3. **World layers.** On phones they load only once the world phase starts.
   Loading them during the transition starved and froze the video on iOS.
   On desktop they load during warm.
4. **Layers ready.** An `onLoad`/`onError` count reaches the layer count,
   or a 6s fallback fires. Until then, the transition's last frame stays up,
   blurred and dimmed exactly like the world's landing. Then it fades.
5. **Song.** It loads after the transition.

## Lessons (do these from day one)

### Making the layers

- **One canvas size** for every layer of a world, with no cropping. Number
  the layers back to front, and keep the sky fully opaque.
- **Paint behind things.** Each layer must continue behind whatever covers
  it, because parallax reveals those areas. Ground layers must reach the
  bottom edge.
- **Clean the edges.** Remove the coloured fringe from the cutouts, and snap
  alpha values above ~250 to 255, or the edges shimmer.
- Export WebP at quality ~74–82. Animated parts (such as the deer) get their
  own cutouts in the same frame as the full image, so each piece lands
  exactly where it was drawn.
- **Generate the transition from the world.** Its end keyframe must be the
  world's start state. Set the `start` positions so the layers reproduce
  that frame, then check the swap with a screenshot pair.
- **A separate desktop set.** Don't stretch the phone world to 16:9. Make
  separate 16:9 layers and a 16:9 transition.

### iOS video (phone) — the hard-won ones

- **No Web Audio** during the transition: it froze the video. Drive anything
  beat-synced from a precomputed beat map (`.bin`).
- **No priming play()/pause()** on the transition to unlock it. Rewinding a
  primed video is what froze its picture.
- **`afterFirstFrame`** (requestVideoFrameCallback, else `timeupdate`, else
  a 150ms timeout) before hiding anything that covers a video. iOS reports
  `playing` before it has drawn anything.
- **Stall watcher.** Every 250ms, resume the video if it is paused. If its
  clock is stuck, kick it once, then go on to the world.
- **Picture-freeze detector.** iOS can keep the clock running while the
  picture freezes. Sample the frame at 24×24 every 300ms. If it hasn't
  changed for 0.6s, put a fresh `<video>` on top at the same time. If that
  one freezes too, enter the world.
- **A 9s failsafe** always reaches the world.
- **The `rgba(0,0,0,0.012)` overlay** over the playing video. It keeps iOS
  off the direct-display path that froze the picture. It's invisible.
- **Keep the world hidden** (`visibility: hidden`) until the world phase, to
  save memory during the transition.
- Once something works on iOS, **stop touching it**. Most regressions came
  from "small" changes near the transition.

### Encoding

- **Always tag BT.709** (`-colorspace bt709 -color_primaries bt709
  -color_trc bt709`). Untagged clips render brighter on iOS, so a graded
  clip "flashes" against its poster.
- Phone transition: 720×1280, 30fps, x264 crf 25,
  `keyint=30:min-keyint=16:scenecut=0`, vbv ~2000k, High@4.0.
- Desktop: 1080p, crf 22, keyint 30, vbv ~3500k.
- Loops: 2-pass at ~1000–1500k, with the same `-g` in both passes.
- **Cache-bust** every re-encode (`?v=` per file, or `MEDIA_V` globally).
  Otherwise phones keep the old file.

### Flashes and shifts

- **Posters must be the exact first frame** of the video they cover: the
  loop's first frame, not a nicer still. Better still, keep the video black
  until it has drawn a frame.
- **Shading that goes over the video belongs in the video.** If the portal
  has CSS gradients, bake them into the transition's first second with an
  ffmpeg overlay. Otherwise they snap off at the hand-off.
- **Never fade an overlay as soon as the video "starts".** iOS can take
  ~0.5s to draw. Keep it until `afterFirstFrame`. Test by simulating a
  0.6s play delay.
- **No parallax at the moment of the swap.** The mouse is still over the
  enter button, so the first world frame shifts sideways. Ease the parallax
  in over the first ~12% of the descent.
- **Hide the scrollbar** (`no-scrollbar`) in the world. When it appears, the
  layout shifts sideways.
- Don't switch a scrim or dimmer off at landing. Bake the dim into the
  engine (`STORY_DIM`).

### Performance (stutter = something expensive over moving layers)

- **No `backdrop-filter`, `mix-blend-mode`, animated `filter`/`blur`, or
  `drop-shadow`** over or on the moving world, including the navbar's
  backdrop blur.
- Bake glows into images rather than CSS filters.
- **`visibility: hidden`** on anything faded out or finished (the transition
  video, the hidden deer heads, the carry layers). `opacity: 0` alone still
  costs.
- Once landed, **freeze the layers** (no zoom, no parallax updates). The
  story's dimming over moving layers is what glitched on desktop.
- Animate creatures only in the world phase. Write styles imperatively and
  skip frames where nothing changed.
- Animate logo intros with opacity and scale only.

### Safari quirks

- `loading="lazy"` images inside CSS columns never load. Don't lazy-load
  them.
- iOS won't apply a CSS mask to an `<svg>`. Mask a wrapper `<div>`.
- Thin SVG lines vanish on small screens. Use
  `vector-effect: non-scaling-stroke`.
- iPhone doesn't always send `pointerdown` for a tap on a scrolling page.
  Listen for `touchstart` too, and hit-test with padding.

### Tooling

- CRA can't build `url("/public-file")` inside CSS. Set those URLs from JS
  (inline style or injected CSS).
- Test with a SPA server so routes like `/epk` resolve. Headless Chromium
  can't play H.264, so route WebM copies in Playwright.
- Vercel Hobby allows ~100 deploys a day, and a push to the branch and to
  main is two. If changes "aren't live", check the Deployments page first.
- Kill dev servers by PID (`ps`/`awk`). `pkill -f` can kill your own shell.

### AI video (Kling / Higgsfield / Motionleap)

- Use start and end keyframes. The end keyframe is the world's first frame.
- Describe the subject as a "frozen photograph" so the person doesn't move
  (no looking up), and allow a single drop only.
- The world inside the drop is an image in it, not a reflection. A
  horizontal whip only; never let the landscape morph.
- Join clips at a shared bridge frame, and speed-ramp in CapCut.
- Keep prompts to one copy-paste block of at most 2500 characters.

## Starting a new artist site

1. Copy `WorldHome.jsx`, `DesktopWorld.jsx`, `CinematicExperience.jsx`, the
   hooks, and the layer arrays from `site.js`.
2. Make the layers (above), then the transitions ending on the layers'
   start frame.
3. Set the `start`/`end`/`span`/`depth` values, then screenshot the swap
   and the landing on both a phone and desktop.
4. Leave the iOS transition safeguards exactly as they are.
