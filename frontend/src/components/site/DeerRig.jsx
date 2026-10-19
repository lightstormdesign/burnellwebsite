import { useEffect, useRef } from "react";

// The deer in Burnell's world, alive. The body, tail and the original
// side-on head are cut from the illustration, each sitting exactly where it
// was. Scrolling tilts that head up and down (scroll back and it tilts
// back): the scroller is in control. Tapping the deer plays the two other
// heads (drawn in the same style): it turns to three-quarter, looks right
// at you, then turns back to side-on. Only the
// ear flicks and the tail swish run on their own (CSS), with a faint golden
// outline and an aura (rainbow glow, sacred geometry, rings) behind it.
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

// The extra heads, placed in the 300x430 deer's own frame:
// [left %, top %, width %] (they can reach past its edges).
const HEADS = [
  { key: "side", look: 0 },
  { key: "three", look: 1, box: [33.28, 1.871, 64.17] },
  { key: "front", look: 2, box: [42.395, 4.171, 75.02] },
];
// The tap: which head shows over time (s), as a "look" value matching the
// heads above; in between two heads they cross-fade.
const TAP_LOOK = [[0, 0], [0.35, 1], [0.7, 2], [2.3, 2], [2.65, 1], [3.0, 0]];
// The scroll: the side head's tilt, in degrees (negative lifts the muzzle).
// Lowest 9deg down, highest 4deg up (it doesn't throw its head back).
const TILT_MID = 2.5;
const TILT_SWING = 6.5;
const SCROLL_PER_TURN = 0.11; // screen heights of scroll for one radian of the swing (a full nod per ~1.25 screens)
const EASE = 0.18;
// where the antler tips are (percent of the 300x430 deer): sparkles rise off them
const TIPS = [[27.7, 5.1], [35.9, 2.6], [43.7, 0], [49.8, 0.5], [59.1, 7], [65.3, 8.1], [70.3, 9.1], [74, 8.1], [80, 15.8]];
const lookAt = (t) => {
  for (let i = 1; i < TAP_LOOK.length; i++) {
    const [t1, v1] = TAP_LOOK[i];
    const [t0, v0] = TAP_LOOK[i - 1];
    if (t <= t1) {
      const u = (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * u * u * (3 - 2 * u);
    }
  }
  return 0;
};

export const DeerRig = ({ refFn, load, onLoad }) => {
  const rootRef = useRef(null);
  const headRefs = useRef([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let tilt = TILT_MID;
    let shown = null;
    let tapAt = -1e9;
    let raf = 0;

    // A tap anywhere on or near the deer (the story's layers sit above the
    // world, so this listens on the page and checks the deer's box, with a
    // generous margin: it's small on a phone). Touch and pointer both, as
    // iPhone doesn't always send a pointer event for a tap on a scrolling page.
    const hit = (x, y) => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pad = Math.max(30, r.width * 0.4);
      if (x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad) {
        const now = performance.now();
        if (now - tapAt > 3000) tapAt = now; // a tap mid-turn lets it finish
      }
    };
    const onDown = (e) => hit(e.clientX, e.clientY);
    const onTouch = (e) => e.touches[0] && hit(e.touches[0].clientX, e.touches[0].clientY);
    window.addEventListener("pointerdown", onDown, { passive: true, capture: true });
    window.addEventListener("touchstart", onTouch, { passive: true, capture: true });

    const frame = (now) => {
      // the scroll tilts the side-on head up and down
      // (an even back-and-forth, so every bit of scroll moves it)
      const target = TILT_MID + TILT_SWING * (2 / Math.PI) * Math.asin(Math.sin(window.scrollY / (window.innerHeight * SCROLL_PER_TURN)));
      tilt += (target - tilt) * (reduce ? 1 : EASE);
      // a tap turns it to look at you, through the other heads
      const L = lookAt((now - tapAt) / 1000);
      const key = `${tilt.toFixed(2)}|${L.toFixed(3)}`;
      if (key !== shown) {
        shown = key;
        HEADS.forEach((h, i) => {
          const el = headRefs.current[i];
          if (!el) return;
          el.style.opacity = Math.max(0, 1 - Math.abs(L - h.look)).toFixed(3);
          if (!h.box) el.style.transform = `rotate(${tilt.toFixed(2)}deg)`;
        });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("touchstart", onTouch, { capture: true });
    };
  }, []);

  return (
    <div
      ref={(el) => {
        rootRef.current = el;
        refFn(el);
      }}
      className="absolute left-0 top-0 select-none"
      style={{ willChange: "transform", transformOrigin: "0 0", aspectRatio: "300 / 430" }}
    >
      {/* the aura, emanating from the deer: a soft rainbow glow, a faint
          golden Flower of Life turning slowly, and gold rings pulsing out */}
      <div aria-hidden className="deer-aura pointer-events-none absolute" style={{ left: "-30%", top: "-12%", width: "160%", height: "112%" }}>
        <div className="deer-aura-rainbow absolute inset-0" />
        {/* an open Flower of Life (no enclosing circle), large, around the
            whole deer, fading out at its edges into the world */}
        <svg className="deer-aura-geometry absolute" style={{ left: "-25%", top: "-25%", width: "150%", height: "150%" }} viewBox="-60 -60 120 120" preserveAspectRatio="xMidYMid meet">
          <g fill="none" stroke="rgba(255,232,180,1)" strokeWidth="0.3">
            {FLOWER.map(([x, y], i) => (
              <circle key={i} r="10" cx={x} cy={y} />
            ))}
          </g>
        </svg>
        <span className="deer-aura-ring" />
        <span className="deer-aura-ring" style={{ animationDelay: "2s" }} />
        <span className="deer-aura-ring" style={{ animationDelay: "4s" }} />
      </div>
      {/* the deer, with a fine golden outline */}
      <div className="deer-gold absolute inset-0">
      <img src={load ? P("tail") : undefined} alt="" className="deer-tail absolute inset-0 h-full w-full" />
      <img src={load ? P("body") : undefined} onLoad={onLoad} onError={onLoad} alt="" decoding="async" className="deer-body absolute inset-0 h-full w-full" />
      <div className="deer-head absolute inset-0">
        {HEADS.map((h, i) =>
          h.box ? (
            <img
              key={h.key}
              ref={(el) => (headRefs.current[i] = el)}
              src={load ? P(`head-${h.key}`) : undefined}
              alt=""
              className="absolute max-w-none"
              style={{ left: `${h.box[0]}%`, top: `${h.box[1]}%`, width: `${h.box[2]}%`, opacity: 0 }}
            />
          ) : (
            // pivots at the skull (behind the eye, at the ear's base), so it
            // nods up and down in place instead of swinging the antlers sideways
            <div key={h.key} ref={(el) => (headRefs.current[i] = el)} className="absolute inset-0" style={{ transformOrigin: "74% 27.5%" }}>
              <img src={load ? P("head") : undefined} alt="" className="absolute inset-0 h-full w-full" />
              {/* the antlers glow, and sparkles rise off their tips */}
              <img src={load ? P("antlers") : undefined} alt="" aria-hidden className="deer-antler-glow absolute inset-0 h-full w-full" />
              {TIPS.map(([x, y], k) => (
                <span key={k} aria-hidden className="deer-sparkle" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(k * 0.73) % 3.2}s`, animationDuration: `${2.6 + (k % 3) * 0.5}s` }} />
              ))}
              <img src={load ? P("ear") : undefined} alt="" className="deer-ear absolute inset-0 h-full w-full" />
            </div>
          )
        )}
      </div>
      </div>
    </div>
  );
};

export default DeerRig;
