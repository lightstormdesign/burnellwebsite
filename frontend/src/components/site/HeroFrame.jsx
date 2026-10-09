import { LivingArt } from "./LivingArt";
import { HERO_FRAME } from "@/data/site";

// Illustrated "living" frame around the Hero: the deer-and-stream scene along
// the bottom, plus the forest-and-waterfall side piece up both edges (the
// right side is the same art mirrored; LivingArt's `phase` offsets its light
// so the two sides never shimmer in sync). Sides sit behind the bottom piece
// so their waterfalls read as pouring into the stream.
//
// `active` drives the entrance: the bottom scene rises out of the dark and
// the sides grow in from the edges as the Hero content arrives.

// The Hero photo sits behind "smoked glass" (blur + dim) wherever this frame
// is shown, so the illustration and copy read as the foreground layer.
export const HERO_BG_FILTER = "blur(9px) brightness(0.5) saturate(0.85)";
export const HERO_SCRIM = "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.7) 100%)";

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

const SIDE_ASPECT = HERO_FRAME.side.width / HERO_FRAME.side.height;

export const HeroFrame = ({ active, mobile = false }) => {
  const bottom = mobile ? HERO_FRAME.bottomMobile : HERO_FRAME.bottom;
  const bottomAspect = bottom.width / bottom.height;

  // Desktop: the scene is capped so it never climbs past ~28% of the screen;
  // on wide screens the sides cover the space past its ends (their edges
  // are feathered so the seam never shows). Mobile: full width, slightly
  // over-wide so the stream runs off both edges.
  const bottomWidth = mobile ? "112vw" : `min(100vw, ${(28 * bottomAspect).toFixed(1)}svh)`;
  const sideHeight = mobile ? "36svh" : "88svh";

  const enter = (delay, from) => ({
    opacity: active ? 1 : 0,
    transform: active ? "translate3d(0,0,0)" : from,
    transition: `opacity 1.6s ${ease} ${delay}s, transform 1.8s ${ease} ${delay}s`,
  });

  const sideStyle = {
    height: sideHeight,
    width: `calc(${sideHeight} * ${SIDE_ASPECT.toFixed(4)})`,
    WebkitMaskImage: "linear-gradient(to top, #000 70%, transparent 100%)",
    maskImage: "linear-gradient(to top, #000 70%, transparent 100%)",
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute bottom-0 left-0" style={enter(0.35, "translate3d(-40%,0,0)")}>
        <LivingArt src={HERO_FRAME.side.src} fx={HERO_FRAME.side.fx} style={sideStyle} phase={0} />
      </div>
      <div className="absolute bottom-0 right-0" style={enter(0.35, "translate3d(40%,0,0)")}>
        <LivingArt src={HERO_FRAME.side.src} fx={HERO_FRAME.side.fx} flip style={sideStyle} phase={7.3} />
      </div>

      <div className="absolute bottom-0 left-1/2" style={{ width: bottomWidth, marginLeft: `calc(${bottomWidth} / -2)` }}>
        <div style={enter(0.1, "translate3d(0,30%,0)")}>
          <LivingArt
            src={bottom.src}
            fx={bottom.fx}
            style={{
              width: "100%",
              aspectRatio: `${bottom.width} / ${bottom.height}`,
              // Sink the stream's lower lip a touch below the fold.
              marginBottom: mobile ? "-3%" : "-1.5%",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 5%, #000 95%, transparent 100%)",
              maskImage: "linear-gradient(to right, transparent 0%, #000 5%, #000 95%, transparent 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
};
