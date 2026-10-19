import { useEffect, useState } from "react";

// Burnell's cursor (desktop, real mouse only): a small gold water drop in
// place of the arrow (a native cursor image, so it never lags), and as it
// moves it leaves faint rings on the surface, like a drop skimming water.
// A click sends a stronger ring. The page is never dimmed: everything is at
// full brightness from the start.
//
// Still publishes --wand-mx/--wand-my/--wand-ndx/--wand-ndy (the original
// names), which the gentle cursor-parallax backgrounds and the illustrated
// world reveal on the dark pages read.
const RIPPLE_EVERY_PX = 70; // distance travelled between rings
const RIPPLE_MIN_MS = 90;
const MAX_LIVE = 8;
const LIFETIME_MS = 1300;
// The drop for the arrow, a bigger, glowing one over anything clickable
// (the deer too, which sits under the story's layers); text
// fields keep their caret. (Set from here: the CSS build can't bundle
// images from /public.)
const CURSOR_CSS = `
html.water-cursor, html.water-cursor * { cursor: url("/burnell-cursor-drop.png") 16 2, auto; }
html.water-cursor :is(a, button, [role="button"], label, select, summary, [data-testid="desktop-portal"]),
html.water-cursor :is(a, button, [role="button"], label, select, summary, [data-testid="desktop-portal"]) *,
html.water-cursor.deer-hover, html.water-cursor.deer-hover * {
  cursor: url("/burnell-cursor-drop-active.png?v=2") 22 4, pointer;
}
html.water-cursor :is(input:not([type="checkbox"]):not([type="radio"]), textarea) { cursor: text; }
`;

export const WaterCursor = () => {
  const [enabled] = useState(() => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("water-cursor");
    const style = document.createElement("style");
    style.textContent = CURSOR_CSS;
    document.head.appendChild(style);
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const live = [];
    let last = null;
    let lastAt = 0;
    let pending = false;
    let pos = { x: 0, y: 0 };

    const ring = (x, y, cls) => {
      const el = document.createElement("div");
      el.className = cls;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      document.body.appendChild(el);
      live.push(el);
      setTimeout(() => {
        el.remove();
        const i = live.indexOf(el);
        if (i >= 0) live.splice(i, 1);
      }, LIFETIME_MS);
      while (live.length > MAX_LIVE) live.shift().remove();
    };

    const publish = () => {
      pending = false;
      root.style.setProperty("--wand-mx", `${pos.x}px`);
      root.style.setProperty("--wand-my", `${pos.y}px`);
      root.style.setProperty("--wand-ndx", `${(pos.x / window.innerWidth - 0.5) * 2}`);
      root.style.setProperty("--wand-ndy", `${(pos.y / window.innerHeight - 0.5) * 2}`);
    };

    const onMove = (e) => {
      pos = { x: e.clientX, y: e.clientY };
      if (!pending) {
        pending = true;
        requestAnimationFrame(publish);
      }
      if (calm) return;
      const now = performance.now();
      if (!last) last = pos;
      if (Math.hypot(pos.x - last.x, pos.y - last.y) >= RIPPLE_EVERY_PX && now - lastAt >= RIPPLE_MIN_MS) {
        ring(pos.x, pos.y, "water-ripple");
        last = pos;
        lastAt = now;
      }
    };
    const onDown = (e) => !calm && e.pointerType === "mouse" && ring(e.clientX, e.clientY, "water-ripple water-ripple--click");

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true, capture: true });
    return () => {
      root.classList.remove("water-cursor");
      style.remove();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("pointerdown", onDown, { capture: true });
      live.forEach((el) => el.remove());
      ["--wand-mx", "--wand-my", "--wand-ndx", "--wand-ndy"].forEach((v) => root.style.removeProperty(v));
    };
  }, [enabled]);

  return null;
};

export default WaterCursor;
