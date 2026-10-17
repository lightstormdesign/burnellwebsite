import { useRef, useState } from "react";
import { Pointer } from "lucide-react";
import { LOGO, NEW_RELEASE } from "@/data/site";

// CD case that opens on tap: pure CSS 3D transforms over layered images, no
// video. Ported from the Sierra site, art from NEW_RELEASE. `scale` renders
// the same geometry smaller (it's sized in rem at scale=1).
//
//   1. Tap: the cover swings open on its left hinge while the case widens
//      from one square panel to two (its height never changes).
//   2. Then the disc slides out from behind a slit just right of the fold
//      (clipped until it crosses it) and settles on the left panel; the
//      fold crease and slit fade in and the inside photo softens as it goes.
//   3. Once it lands, `onSettled` fires.
const PANEL = 20; // rem, one square panel at scale=1
const OPEN_MS = 1600;
const SLIDE_MS = 2000;

export const CDAnimation = ({ onSettled, scale = 1 }) => {
  const [phase, setPhase] = useState("closed"); // closed | opening | sliding | settled
  const audioRef = useRef(null);
  const panel = PANEL * scale;

  const handleClick = () => {
    if (phase !== "closed") return;
    setPhase("opening");
    // inside the tap, so the browser allows sound
    audioRef.current?.play().catch(() => {});
    setTimeout(() => {
      setPhase("sliding");
      setTimeout(() => {
        setPhase("settled");
        onSettled?.();
      }, SLIDE_MS);
    }, OPEN_MS);
  };

  const opened = phase !== "closed";
  const sliding = phase === "sliding" || phase === "settled";

  const discWidth = panel * 0.62;
  const discRestLeft = (panel - discWidth) / 2; // centered on the left panel
  const discHiddenLeft = panel * 2.05; // past the slit entirely
  const slitX = panel * 1.06; // just right of the fold

  return (
    <div
      className="relative"
      style={{
        perspective: `${90 * scale}rem`,
        height: `${panel}rem`,
        width: opened ? `${panel * 2}rem` : `${panel}rem`,
        transition: `width ${OPEN_MS}ms cubic-bezier(0.65,0,0.35,1)`,
      }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-xl shadow-2xl">
        {/* Inside: a photo from his mountain shoot, across both panels */}
        <img
          src={NEW_RELEASE.insideSpread}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: "60% 40%",
            filter: sliding ? "blur(2.25px) brightness(0.8)" : "brightness(0.8)",
            transition: `filter ${SLIDE_MS}ms ease`,
          }}
        />

        {/* Slit the disc comes out of */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-[16%] z-[1] rounded-full bg-black/70"
          style={{ left: `${slitX}rem`, width: `${0.15 * scale}rem`, opacity: sliding ? 1 : 0, transition: `opacity ${SLIDE_MS}ms ease` }}
        />

        {/* Center fold: a highlight on one side, shadow on the other */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-[2] -translate-x-1/2"
          style={{
            left: `${panel}rem`,
            width: `${2.4 * scale}rem`,
            background:
              "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(255,255,255,0.14) 44%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.18) 56%, rgba(0,0,0,0) 100%)",
            opacity: sliding ? 1 : 0,
            transition: `opacity ${SLIDE_MS}ms ease`,
          }}
        />

        <img
          src={LOGO}
          alt=""
          aria-hidden
          className="pointer-events-none absolute top-[6%] z-[5] object-contain"
          style={{
            left: `${panel}rem`,
            width: `${panel * 0.72}rem`,
            transform: "translateX(-50%)",
            opacity: opened ? 1 : 0,
            transition: `opacity 500ms ease ${Math.round(OPEN_MS * 0.5)}ms`,
            filter: "drop-shadow(0 4px 18px rgba(0,0,0,0.9))",
          }}
        />

        {/* Disc, clipped to the left of the slit */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 overflow-hidden" style={{ width: `${slitX}rem` }}>
          <img
            src={NEW_RELEASE.disc}
            alt=""
            aria-hidden
            className="absolute top-1/2 -translate-y-1/2 object-contain"
            style={{
              width: `${discWidth}rem`,
              left: `${sliding ? discRestLeft : discHiddenLeft}rem`,
              transition: `left ${SLIDE_MS}ms cubic-bezier(0.22,1,0.36,1)`,
              filter: "drop-shadow(0 24px 50px rgba(0,0,0,0.5)) drop-shadow(0 6px 24px rgba(0,0,0,0.32))",
            }}
          />
        </div>

        {/* Front cover, hinged on the left edge */}
        <button
          type="button"
          onClick={handleClick}
          data-testid="cd-front-cover"
          aria-label={`Open ${NEW_RELEASE.title}`}
          className="absolute left-0 top-0 z-20 cursor-pointer focus:outline-none"
          style={{
            height: `${panel}rem`,
            width: `${panel}rem`,
            transformStyle: "preserve-3d",
            transformOrigin: "left center",
            transform: opened ? "rotateY(-115deg)" : "rotateY(0deg)",
            transition: `transform ${OPEN_MS}ms cubic-bezier(0.65,0,0.35,1)`,
            pointerEvents: opened ? "none" : "auto",
          }}
        >
          <img
            src={NEW_RELEASE.cover}
            alt={`${NEW_RELEASE.title} cover`}
            className="h-full w-full object-cover"
            style={{ backfaceVisibility: "hidden" }}
          />
        </button>
      </div>

      {/* Tap hint: a pointing hand that moves in from the right and taps */}
      {phase === "closed" && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 z-20 -translate-y-1/2"
          style={{ right: `${-0.4 * scale}rem`, animation: "tap-approach 2.6s ease-in-out infinite" }}
        >
          <Pointer size={Math.max(24, 38 * scale)} className="text-[var(--sm-gold-light)]" style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.7))" }} />
        </div>
      )}

      {NEW_RELEASE.audioClip && <audio ref={audioRef} src={NEW_RELEASE.audioClip} preload="auto" />}
    </div>
  );
};

export default CDAnimation;
