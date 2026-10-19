import { useEffect, useRef } from "react";

// The deer in Burnell's world, alive. The body, tail and the original
// side-on head are cut from the illustration, each sitting exactly where it
// was. Scrolling tilts that head up and down (scroll back and it tilts
// back): the scroller is in control. Tapping the deer plays the two other
// heads (drawn in the same style): it turns to three-quarter, looks right
// at you, then turns back to side-on, each head fading into the next.
// Every head's antlers glow, with motes of light rising off their tips.
// Around it: a golden outline that pulses out into the world, a faint open
// Flower of Life and a soft rainbow glow. Hovering brightens all of it.
// Only the ear flicks and the tail swish run on their own (CSS).
// Stands in for the deer layer's <img>: the world positions and sizes it
// the same way (the ref gets the layer's width and transform).
const P = (k) => `/burnell-world-deer-${k}.webp`;

// Flower of Life centres: a hexagonal lattice of circles out to three rings.
const FLOWER = (() => {
  const pts = [];
  for (let q = -3; q <= 3; q++)
    for (let r = -3; r <= 3; r++) {
      if (Math.abs(q + r) > 3) continue;
      pts.push([10 * (q + r / 2), 10 * r * Math.sin(Math.PI / 3)]);
    }
  return pts;
})();

// The heads. `box` places a drawn head in the 300x430 deer's own frame:
// [left %, top %, width %] (they can reach past its edges); `tips` are its
// antler tips, in percent of the deer frame.
const HEADS = [
  {
    key: "side",
    look: 0,
    tips: [[27.7, 5.1], [35.9, 2.6], [43.7, 0], [49.8, 0.5], [59.1, 7], [65.3, 8.1], [70.3, 9.1], [74, 8.1], [80, 15.8]],
  },
  {
    key: "three",
    look: 1,
    box: [33.28, 1.871, 64.17],
    tips: [[33.8, 6.9], [40.1, 4.5], [45.1, 5], [49.5, 2], [55.8, 2.2], [60.6, 4.5], [65, 10], [72.8, 13.2], [77.1, 5.6], [81, 5.6], [88.6, 7.1], [95.3, 14]],
  },
  {
    key: "front",
    look: 2,
    box: [42.395, 4.171, 75.02],
    tips: [[47.4, 6.6], [56.2, 7.1], [60.6, 4.2], [65.5, 5.2], [74.4, 13.7], [84.9, 13.9], [90.4, 7.5], [93.9, 5.2], [98.9, 4.2], [103.1, 6.7], [111.8, 6.4], [117.1, 10.6]],
  },
];

// The tap: which head shows over time (s), as a "look" value matching the
// heads above; between two heads they cross-fade.
const TAP_LOOK = [[0, 0], [0.6, 1], [1.2, 2], [2.8, 2], [3.4, 1], [4.0, 0]];
const TAP_S = 4.0;
// The scroll: the side head's tilt, in degrees (negative lifts the muzzle).
// Lowest 9deg down, highest 4deg up (it doesn't throw its head back).
const TILT_MID = 2.5;
const TILT_SWING = 6.5;
const SCROLL_PER_TURN = 0.11; // screen heights of scroll for one radian of the swing
const EASE = 0.18;
const lookAt = (t) => {
  for (let i = 1; i < TAP_LOOK.length; i++) {
    const [t1, v1] = TAP_LOOK[i];
    const [t0, v0] = TAP_LOOK[i - 1];
    if (t <= t1) {
      const u = Math.max(0, (t - t0) / (t1 - t0));
      return v0 + (v1 - v0) * u * u * (3 - 2 * u);
    }
  }
  return 0;
};

// the deer's silhouette, for the outline pulsing out
const SILHOUETTE = ["body", "head", "tail"].map((k) => `url("${P(k)}")`).join(", ");
const PULSE_MASK = { WebkitMaskImage: SILHOUETTE, maskImage: SILHOUETTE };

// rising motes of light off the antler tips (two per tip, staggered)
const Motes = ({ tips }) =>
  tips.flatMap(([x, y], k) =>
    [0, 1].map((n) => (
      <span
        key={`${k}-${n}`}
        aria-hidden
        className="deer-mote"
        style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${((k * 0.83 + n * 1.9) % 3.8).toFixed(2)}s`, animationDuration: `${3.2 + ((k + n) % 3) * 0.6}s` }}
      />
    ))
  );

export const DeerRig = ({ refFn, load, onLoad }) => {
  const rootRef = useRef(null);
  const headRefs = useRef([]);
  const sideRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let tilt = TILT_MID;
    let shown = null;
    let tapAt = -1e9;
    let hovering = false;
    let raf = 0;

    // The story's layers sit above the world, so the page listens and
    // checks the deer's box (with a margin: it's small on a phone). Touch
    // and pointer both, as iPhone doesn't always send a pointer event for a
    // tap on a scrolling page.
    const over = (x, y, margin) => {
      const el = rootRef.current;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (!r.width) return false;
      const pad = Math.max(margin, r.width * 0.25);
      return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;
    };
    const hit = (x, y) => {
      if (!over(x, y, 30)) return;
      const now = performance.now();
      if (now - tapAt > TAP_S * 1000) tapAt = now; // a tap mid-turn lets it finish
    };
    const onDown = (e) => hit(e.clientX, e.clientY);
    const onTouch = (e) => e.touches[0] && hit(e.touches[0].clientX, e.touches[0].clientY);
    // hovering brightens it all, and the cursor shows it can be clicked
    const onMove = (e) => {
      const h = over(e.clientX, e.clientY, 10);
      if (h === hovering) return;
      hovering = h;
      rootRef.current?.classList.toggle("is-hover", h);
      document.documentElement.classList.toggle("deer-hover", h);
    };
    window.addEventListener("pointerdown", onDown, { passive: true, capture: true });
    window.addEventListener("touchstart", onTouch, { passive: true, capture: true });
    if (fine) window.addEventListener("mousemove", onMove, { passive: true });

    const frame = (now) => {
      // the scroll tilts the side-on head up and down (an even
      // back-and-forth, so every bit of scroll moves it)
      const target = TILT_MID + TILT_SWING * (2 / Math.PI) * Math.asin(Math.sin(window.scrollY / (window.innerHeight * SCROLL_PER_TURN)));
      tilt += (target - tilt) * (reduce ? 1 : EASE);
      // a tap turns it to look at you, through the other heads
      const L = lookAt((now - tapAt) / 1000);
      const key = `${tilt.toFixed(2)}|${L.toFixed(3)}`;
      if (key !== shown) {
        shown = key;
        HEADS.forEach((h, i) => {
          const el = headRefs.current[i];
          if (el) el.style.opacity = Math.max(0, 1 - Math.abs(L - h.look)).toFixed(3);
        });
        if (sideRef.current) sideRef.current.style.transform = `rotate(${tilt.toFixed(2)}deg)`;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("touchstart", onTouch, { capture: true });
      window.removeEventListener("mousemove", onMove);
      document.documentElement.classList.remove("deer-hover");
    };
  }, []);

  return (
    <div
      ref={(el) => {
        rootRef.current = el;
        refFn(el);
      }}
      className="deer-rig absolute left-0 top-0 select-none"
      style={{ willChange: "transform", transformOrigin: "0 0", aspectRatio: "300 / 430" }}
    >
      {/* the aura, centred on the deer: a soft rainbow glow and a faint open
          Flower of Life, fading into the world */}
      <div aria-hidden className="deer-aura pointer-events-none absolute" style={{ left: "-40%", top: "-28%", width: "180%", height: "125.6%" }}>
        <div className="deer-aura-rainbow absolute inset-0" />
        <svg className="deer-aura-geometry absolute inset-0 h-full w-full" viewBox="-60 -60 120 120" preserveAspectRatio="xMidYMid meet">
          <g fill="none" stroke="rgba(255,232,180,1)" strokeWidth="0.3">
            {FLOWER.map(([x, y], i) => (
              <circle key={i} r="10" cx={x} cy={y} />
            ))}
          </g>
        </svg>
      </div>
      {/* its golden outline, pulsing out into the world */}
      {load && (
        <>
          <div aria-hidden className="deer-pulse" style={PULSE_MASK} />
          <div aria-hidden className="deer-pulse" style={{ ...PULSE_MASK, animationDelay: "2s" }} />
        </>
      )}
      {/* the deer, with a fine golden outline */}
      <div className="deer-gold absolute inset-0">
        <img src={load ? P("tail") : undefined} alt="" className="deer-tail absolute inset-0 h-full w-full" />
        <img src={load ? P("body") : undefined} onLoad={onLoad} onError={onLoad} alt="" decoding="async" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0">
          {HEADS.map((h, i) =>
            h.box ? (
              <div key={h.key} ref={(el) => (headRefs.current[i] = el)} className="absolute inset-0" style={{ opacity: 0 }}>
                <div className="absolute" style={{ left: `${h.box[0]}%`, top: `${h.box[1]}%`, width: `${h.box[2]}%` }}>
                  <img src={load ? P(`head-${h.key}`) : undefined} alt="" className="block w-full max-w-none" />
                  <img src={load ? P(`antlers-${h.key}`) : undefined} alt="" aria-hidden className="deer-antler-glow absolute inset-0 h-full w-full" />
                </div>
                <Motes tips={h.tips} />
              </div>
            ) : (
              // pivots at the skull (behind the eye, at the ear's base), so it
              // nods up and down in place instead of swinging the antlers sideways
              <div key={h.key} ref={(el) => (headRefs.current[i] = el)} className="absolute inset-0">
                <div ref={sideRef} className="absolute inset-0" style={{ transformOrigin: "74% 27.5%" }}>
                  <img src={load ? P("head") : undefined} alt="" className="absolute inset-0 h-full w-full" />
                  <img src={load ? P("antlers") : undefined} alt="" aria-hidden className="deer-antler-glow absolute inset-0 h-full w-full" />
                  <Motes tips={h.tips} />
                  <img src={load ? P("ear") : undefined} alt="" className="deer-ear absolute inset-0 h-full w-full" />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default DeerRig;
