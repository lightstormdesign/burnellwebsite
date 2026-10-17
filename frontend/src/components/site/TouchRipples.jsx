import { useEffect } from "react";

// A gold water drop wherever a finger touches, on every page: two rings
// spreading out from the touch point (Burnell's water-drop motif). Touch
// only (mouse clicks on desktop don't ripple), never blocks the touch, and
// each ripple removes itself when it's done.
const MAX_LIVE = 8;
const LIFETIME_MS = 1400;

export const TouchRipples = () => {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const live = [];
    const onDown = (e) => {
      if (e.pointerType !== "touch") return;
      for (const cls of ["touch-ripple", "touch-ripple touch-ripple--outer"]) {
        const el = document.createElement("div");
        el.className = cls;
        el.style.left = `${e.clientX}px`;
        el.style.top = `${e.clientY}px`;
        document.body.appendChild(el);
        live.push(el);
        setTimeout(() => {
          el.remove();
          const i = live.indexOf(el);
          if (i >= 0) live.splice(i, 1);
        }, LIFETIME_MS);
      }
      while (live.length > MAX_LIVE) live.shift().remove();
    };
    window.addEventListener("pointerdown", onDown, { passive: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", onDown, { capture: true });
      live.forEach((el) => el.remove());
    };
  }, []);
  return null;
};

export default TouchRipples;
