import { useEffect, useRef } from "react";

// The deer in Burnell's world, alive. The body, tail and the original
// side-on head are cut from the illustration, each sitting exactly where it
// was; three more heads (drawn in the same style) turn it: three-quarter,
// facing you, and head down. Scrolling turns the head through those angles
// (scroll back and it turns back), and tapping it makes it look at you.
// Ear flicks, a tail swish and breathing run on their own (CSS).
// Stands in for the deer layer's <img>: the world positions and sizes it
// the same way (the ref gets the layer's width and transform).
const P = (k) => `/burnell-world-deer-${k}.webp`;

// The extra heads, placed in the 300x430 deer's own frame:
// [left %, top %, width %] (they can reach past its edges).
const HEADS = [
  { key: "down", look: -1, box: [37.01, 4.314, 66.65] },
  { key: "side", look: 0 },
  { key: "three", look: 1, box: [33.28, 1.271, 64.17] },
  { key: "front", look: 2, box: [42.395, 2.971, 75.02] },
];
const LOOK_MIN = -1;
const LOOK_MAX = 2;
const SCROLL_PER_TURN = 0.55; // screen heights of scroll for one radian of the sweep
const TAP_LOOK_MS = 2600; // how long it holds your gaze after a tap
const EASE = 0.12;

export const DeerRig = ({ refFn, load, onLoad }) => {
  const rootRef = useRef(null);
  const headRefs = useRef([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let look = 0;
    let shown = null;
    let tapUntil = 0;
    let raf = 0;

    // A tap anywhere over the deer (the story's layers sit above the world,
    // so this listens on the page and checks the deer's box).
    const onDown = (e) => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pad = r.width * 0.15;
      if (e.clientX > r.left - pad && e.clientX < r.right + pad && e.clientY > r.top - pad && e.clientY < r.bottom + pad) {
        tapUntil = performance.now() + TAP_LOOK_MS;
      }
    };
    window.addEventListener("pointerdown", onDown, { passive: true, capture: true });

    const frame = (now) => {
      // where the scroll says to look: a gentle sweep from head-down through
      // side-on to facing you and back, as you scroll down
      const s = window.scrollY / (window.innerHeight * SCROLL_PER_TURN);
      const fromScroll = 0.5 + 1.5 * Math.sin(s);
      const target = now < tapUntil ? LOOK_MAX : fromScroll;
      look += (target - look) * (reduce ? 1 : EASE);
      const key = look.toFixed(3);
      if (key !== shown) {
        shown = key;
        const L = Math.max(LOOK_MIN, Math.min(LOOK_MAX, look));
        HEADS.forEach((h, i) => {
          const el = headRefs.current[i];
          if (el) el.style.opacity = Math.max(0, 1 - Math.abs(L - h.look)).toFixed(3);
        });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", onDown, { capture: true });
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
            <div key={h.key} ref={(el) => (headRefs.current[i] = el)} className="absolute inset-0">
              <img src={load ? P("head") : undefined} alt="" className="absolute inset-0 h-full w-full" />
              <img src={load ? P("ear") : undefined} alt="" className="deer-ear absolute inset-0 h-full w-full" />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default DeerRig;
