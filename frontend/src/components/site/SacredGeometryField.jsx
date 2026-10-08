import { useLocation } from "react-router-dom";

// Water-drop ripples — Burnell's recurring motif (form: "Deer, Water drops,
// mountains"; "Mountain Stream in the forest"). Replaces Sierra's Flower of
// Life: each placement is one drop's set of concentric rings, spaced wider
// and fading as they travel outward, the way a real ripple decays.
const RIPPLE_RINGS = [0.32, 0.72, 1.18, 1.7, 2.28, 2.9].map((r, i) => ({ r, fade: 1 - i * 0.14 }));

const FlowerOfLifeSvg = ({ opacity, strokeWidth }) => (
  // viewBox spans -3..3 (outermost ring radius ~2.9)
  <svg viewBox="-3 -3 6 6" className="h-full w-full" aria-hidden>
    {RIPPLE_RINGS.map(({ r, fade }, i) => (
      <circle
        key={i}
        cx={0}
        cy={0}
        r={r}
        fill="none"
        stroke="var(--sm-gold-light)"
        strokeWidth={strokeWidth}
        strokeOpacity={opacity * fade}
      />
    ))}
  </svg>
);

// Five accent placements — the four screen corners plus dead center — each
// its own complete, readable flower (not one flower stretched to fill the
// screen). The first pass sized a single instance at 160vmax: each of its 19
// circles ended up wider than the viewport itself, so from anywhere on
// screen all you could ever see was one faint arc slice, and those slices
// only happened to cross visibly near the bottom-right. Sizing each flower
// to ~34vmax keeps the whole 19-circle bloom inside a recognizable area.
const FLOWER_LAYOUT = [
  { x: "9%", y: "12%" },
  { x: "91%", y: "12%" },
  { x: "9%", y: "90%" },
  { x: "91%", y: "90%" },
  { x: "50%", y: "50%" },
];
const FLOWER_SIZE = "34vmax";

const FlowerCluster = ({ opacity, strokeWidth, animated }) => (
  <>
    {FLOWER_LAYOUT.map((pos, i) => (
      <div
        key={i}
        className={animated ? "sacred-geometry-spin absolute aspect-square -translate-x-1/2 -translate-y-1/2" : "absolute aspect-square -translate-x-1/2 -translate-y-1/2"}
        style={{
          left: pos.x,
          top: pos.y,
          width: FLOWER_SIZE,
          animationDirection: i % 2 ? "reverse" : "normal",
          animationDuration: `${200 + i * 25}s`,
        }}
      >
        <FlowerOfLifeSvg opacity={opacity} strokeWidth={strokeWidth} />
      </div>
    ))}
  </>
);

// Two layers, same five-flower layout, fixed to the viewport:
//  1. Ambient — always mounted (all devices), extremely faint, purely
//     decorative, no cursor involved, cheap enough to leave running
//     everywhere.
//  2. Wand-reveal — a brighter/denser instance of the exact same five
//     flowers, but masked so only a small circle is visible at all,
//     positioned via --wand-mx/--wand-my (published every frame by
//     MagicCursor.jsx). The flowers themselves never move — only the reveal
//     window does — so sweeping the wand near a corner or the center brings
//     that particular bloom to life, while empty space between them stays
//     dark since there's nothing there to reveal. This is the same
//     fixed-inset-0 + mask-image(radial-gradient(... at var(--x) var(--y)))
//     technique Flint Blade's cursor-reveals-cymatics effect uses — the mask
//     must live on a full-viewport element, because mask position
//     percentages/px resolve against the MASKED element's own box, not the
//     page. Desktop-with-mouse only via .has-magic-cursor (MagicCursor only
//     ever adds that class after confirming a real fine pointer), so this
//     layer is simply inert — no wasted paint — everywhere else.
export const SacredGeometryField = () => {
  // The wand-reveal layer is replaced by StardustMist.jsx on the Home page
  // specifically ("replace the spotlight with stardust mist") — everywhere
  // else it's unchanged. The faint ambient watermark stays everywhere,
  // Home included.
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <>
      {/* Ambient opacity cut 60% (0.11 -> 0.044) — "very subtle" per
          feedback. Both layers also carry .sacred-geometry-portal-fx, which
          multiplies against --portal-fx-intensity (published by
          CinematicExperience.jsx, Home page only) so the whole system fades
          out as you scroll past the Portal — everywhere else it's just 1
          (no-op) via the CSS fallback. */}
      <div aria-hidden className="sacred-geometry-portal-fx pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <FlowerCluster opacity={0.07} strokeWidth={0.011} animated />
      </div>

      {!isHome && (
        <div aria-hidden className="sacred-geometry-reveal sacred-geometry-portal-fx pointer-events-none fixed inset-0 z-[1] hidden overflow-hidden md:block">
          <FlowerCluster opacity={0.85} strokeWidth={0.008} animated={false} />
        </div>
      )}
    </>
  );
};
