import { useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { makeGlowSprite } from "@/utils/glowSprite";

// Replaces the old cursor-spotlight reveal on the Home page: instead of
// revealing hidden geometry, a field of drifting dust motes gets swirled
// as the wand passes through it — like the wand is stirring suspended
// stardust in the air. One canvas, one rAF loop, sprite-drawn particles
// (no shadowBlur — see glowSprite.js), so it stays cheap regardless of
// particle count. Reuses .sacred-geometry-portal-fx for the same
// fade-through-the-Portal-transition behavior the old reveal had on
// desktop; that class is a no-op on mobile (the var it reads is never set
// there), which is exactly right — "just there and swirls by itself".
// Sparse and crisp, matching the site's other particle effects (Fireflies,
// the mobile tap burst): a handful of small bright motes, not a dense field
// of soft blurry ones.
const PARTICLE_COUNT = 10;
const INFLUENCE_RADIUS = 150; // px — how far the wand's swirl reaches
const SWIRL_STRENGTH = 1.1; // tangential push near the wand
const REPEL_STRENGTH = 0.35; // slight outward drift so motes don't just orbit forever

export const StardustMist = () => {
  const isMobile = useIsMobile();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Tighter/brighter core than the default sprite — the default's soft
    // falloff at low alpha was what made this read as a hazy blur field.
    const sprite = makeGlowSprite(20, "232,207,154", { coreStop: 0.15, coreOpacity: 0.9 });

    let w = window.innerWidth;
    let h = window.innerHeight;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.06,
      vy: (Math.random() - 0.5) * 0.06,
      size: 0.5 + Math.random() * 0.6,
      alpha: 0.4 + Math.random() * 0.35,
      angle: Math.random() * Math.PI * 2,
      angleSpeed: (0.006 + Math.random() * 0.01) * (Math.random() < 0.5 ? 1 : -1),
      orbitR: 10 + Math.random() * 26,
      ox: 0,
      oy: 0,
    }));
    particles.forEach((p) => {
      p.ox = p.x;
      p.oy = p.y;
    });

    let rafId;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      let wandX = null;
      let wandY = null;
      if (!isMobile) {
        const mxStr = document.documentElement.style.getPropertyValue("--wand-mx");
        if (mxStr) {
          wandX = parseFloat(mxStr);
          wandY = parseFloat(document.documentElement.style.getPropertyValue("--wand-my"));
        }
      }

      for (const p of particles) {
        if (isMobile) {
          // Autonomous swirl: each particle orbits a slowly-drifting anchor
          // point — no cursor involved, just a self-sustained curl.
          p.angle += p.angleSpeed;
          p.ox += p.vx;
          p.oy += p.vy;
          if (p.ox < 0) p.ox = w;
          if (p.ox > w) p.ox = 0;
          if (p.oy < 0) p.oy = h;
          if (p.oy > h) p.oy = 0;
          p.x = p.ox + Math.cos(p.angle) * p.orbitR;
          p.y = p.oy + Math.sin(p.angle) * p.orbitR;
        } else {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10;
          if (p.y > h + 10) p.y = -10;

          if (wandX !== null) {
            const dx = p.x - wandX;
            const dy = p.y - wandY;
            const dist = Math.hypot(dx, dy);
            if (dist < INFLUENCE_RADIUS && dist > 0.01) {
              const falloff = 1 - dist / INFLUENCE_RADIUS;
              // Tangential (perpendicular) push reads as a swirl, not a
              // shove — plus a light outward drift so motes don't just
              // orbit the tip forever once caught.
              const tx = -dy / dist;
              const ty = dx / dist;
              p.x += tx * falloff * SWIRL_STRENGTH;
              p.y += ty * falloff * SWIRL_STRENGTH;
              p.x += (dx / dist) * falloff * REPEL_STRENGTH;
              p.y += (dy / dist) * falloff * REPEL_STRENGTH;
            }
          }
        }

        const d = p.size * 4;
        ctx.globalAlpha = p.alpha;
        ctx.drawImage(sprite, p.x - d / 2, p.y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [isMobile]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="sacred-geometry-portal-fx pointer-events-none fixed inset-0 z-[1]"
    />
  );
};
