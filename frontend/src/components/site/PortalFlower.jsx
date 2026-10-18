import { useMemo } from "react";

// One Flower of Life on the right side of the Portal screen, the same
// 19-circle construction as Cody Shepherd's portal blooms (1 center + a
// ring of 6 + a ring of 12, each circle's radius equal to its spacing),
// generated so the geometry is exact. At its brightest it's 0.23 (Cody's
// is 0.26) and it breathes: slowly brightening and dimming.
//
// Kept cheap for the phone portal: only opacity animates (the breath and
// the one-time fade-in), on nested elements so they never fight. The glow
// is a pre-blurred copy behind the lines that never changes, so it's
// painted once. Desktop also turns it very slowly, like Cody's.
function flowerOfLife() {
  const pts = [[0, 0]];
  for (let k = 0; k < 6; k++) {
    const a = (k * 60 * Math.PI) / 180;
    pts.push([Math.cos(a), Math.sin(a)]);
  }
  for (let k = 0; k < 6; k++) {
    const a = ((30 + k * 60) * Math.PI) / 180;
    pts.push([Math.cos(a) * Math.sqrt(3), Math.sin(a) * Math.sqrt(3)]);
  }
  for (let k = 0; k < 6; k++) {
    const a = (k * 60 * Math.PI) / 180;
    pts.push([Math.cos(a) * 2, Math.sin(a) * 2]);
  }
  return pts;
}

const Flower = ({ strokeWidth, className, style }) => {
  const points = useMemo(flowerOfLife, []);
  return (
    <svg viewBox="-3 -3 6 6" className={className} style={style} aria-hidden>
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1} fill="none" stroke="var(--sm-gold-light)" strokeWidth={strokeWidth} />
      ))}
    </svg>
  );
};

const PEAK_OPACITY = 0.23; // Cody's is 0.26
const SIZE = "44vmax"; // same as Cody's

export const PortalFlower = ({ spin = false }) => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    <div
      className="absolute aspect-square -translate-x-1/2 -translate-y-1/2"
      style={{
        left: "90%",
        top: "52%",
        width: SIZE,
        opacity: PEAK_OPACITY,
        maskImage: "radial-gradient(circle, black 0%, black 45%, transparent 78%)",
        WebkitMaskImage: "radial-gradient(circle, black 0%, black 45%, transparent 78%)",
      }}
    >
      <div className="portal-flower-fade-in h-full w-full" style={{ animationDelay: "1.2s" }}>
        <div className="portal-flower-breathe h-full w-full">
          <div className={spin ? "sacred-geometry-spin h-full w-full" : "h-full w-full"} style={spin ? { animationDuration: "520s" } : undefined}>
            <div className="relative h-full w-full">
              {/* the glow: a soft, wider copy of the lines */}
              <Flower strokeWidth={0.05} className="absolute inset-0 h-full w-full" style={{ filter: "blur(6px)", opacity: 0.9 }} />
              <Flower strokeWidth={0.012} className="absolute inset-0 h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
