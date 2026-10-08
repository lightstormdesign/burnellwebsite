import { useEffect, useRef, useState } from "react";

// Replaces MagicCursor.jsx — the twisted-root wand, sparkle trail, and
// constellation trail are retired (kept in that file, just unused, in case
// they're wanted again or reused on another site later). This is the
// "basically a normal mouse, subtly glowing, a little whimsical, 90%
// professional" version: the native OS cursor stays visible (no
// `cursor: none` anywhere), and a small soft glow trails it — no shape, no
// particles, no magnetism. Desktop-with-a-real-mouse only, same
// `(hover: hover) and (pointer: fine)` gate as before.
//
// Still publishes --wand-mx/--wand-my/--wand-ndx/--wand-ndy (kept under
// their original names rather than renamed, to avoid touching every
// consumer) — SacredGeometryField's reveal, WorldDim, and StardustMist all
// read these and keep working unmodified, now lit by this plain cursor
// instead of a wand.
const EASE = 0.6;

const INTERACTIVE_SELECTOR = "a, button, [role='button'], input, select, textarea, label, [tabindex]:not([tabindex='-1'])";
const isInteractive = (el) => !!el.closest?.(INTERACTIVE_SELECTOR);

export const GlowCursor = () => {
  const dotRef = useRef(null);
  // Computed once, not re-checked — a device's pointer capability doesn't
  // change mid-session. Gates the *render*, not just the effect: the old
  // version returned early from the effect on touch devices (so the dot's
  // position was never set via transform) but still rendered the div with
  // its default `left:0; top:0`, leaving a small glow permanently stuck in
  // the corner of the screen on every mobile device.
  const [enabled] = useState(() => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches);

  useEffect(() => {
    if (!enabled) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const eased = { ...target };
    let hoverCheckPending = false;

    const onMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!hoverCheckPending) {
        hoverCheckPending = true;
        requestAnimationFrame(() => {
          hoverCheckPending = false;
          const el = document.elementFromPoint(target.x, target.y);
          const active = el && isInteractive(el);
          dotRef.current?.classList.toggle("glow-cursor--active", !!active);
        });
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    let rafId;
    const tick = () => {
      eased.x += (target.x - eased.x) * EASE;
      eased.y += (target.y - eased.y) * EASE;

      document.documentElement.style.setProperty("--wand-mx", `${eased.x}px`);
      document.documentElement.style.setProperty("--wand-my", `${eased.y}px`);
      document.documentElement.style.setProperty("--wand-ndx", `${(eased.x / window.innerWidth - 0.5) * 2}`);
      document.documentElement.style.setProperty("--wand-ndy", `${(eased.y / window.innerHeight - 0.5) * 2}`);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${eased.x}px, ${eased.y}px, 0)`;
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.style.removeProperty("--wand-mx");
      document.documentElement.style.removeProperty("--wand-my");
      document.documentElement.style.removeProperty("--wand-ndx");
      document.documentElement.style.removeProperty("--wand-ndy");
    };
  }, [enabled]);

  if (!enabled) return null;

  return <div ref={dotRef} aria-hidden className="glow-cursor pointer-events-none fixed left-0 top-0 z-[9999]" style={{ willChange: "transform" }} />;
};
