// Pre-rendered soft radial-gradient circle, reused via drawImage instead of
// per-shape ctx.shadowBlur. shadowBlur forces a real blur pass on every
// individual shape, every frame — at the particle counts this site's canvas
// effects use (up to 140 sparks + 24 trail points on the wand alone, plus 46
// dust motes on the Portal page, all concurrently), that's the actual cause
// of "the wand feels slow": frames were being spent re-blurring dozens of
// shapes instead of just compositing them. A single pre-blurred sprite,
// scaled per-particle via drawImage's destination-size overload, gets the
// same glow look for a fraction of the cost.
// coreStop/coreOpacity let a caller ask for a tighter, brighter core (a
// crisper point of light) instead of the default soft/diffuse falloff —
// used by MobilePortal's tap-burst, which read as mushy/low-quality at the
// default falloff once scaled up. Defaults are untouched so every existing
// caller (wand trail, dust motes) looks exactly as before.
export function makeGlowSprite(size, colorRgb, { coreStop = 0.4, coreOpacity = 0.55 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const r = size / 2;
  const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, `rgba(${colorRgb},1)`);
  grad.addColorStop(coreStop, `rgba(${colorRgb},${coreOpacity})`);
  grad.addColorStop(1, `rgba(${colorRgb},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}
