import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

// A thin line of water along the bottom of the Home world that fills from
// left to right as you scroll, with a glowing drop riding its leading edge,
// so it's clear there's more below and how far along you are. If they stop
// partway, "Keep scrolling" rises above it after a moment. Used by both the
// phone (WorldHome) and computer (DesktopWorld) worlds.
const IDLE_MS = 2200;

export const WorldProgress = ({ active }) => {
  const fillRef = useRef(null);
  const dropRef = useRef(null);
  const hintRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    let idle = 0;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
      if (dropRef.current) dropRef.current.style.left = `${(p * 100).toFixed(2)}%`;
      if (hintRef.current) hintRef.current.style.opacity = "0";
      clearTimeout(idle);
      // the landing has its own Scroll to Explore cue; the end needs none
      if (p > 0.02 && p < 0.97) idle = setTimeout(() => hintRef.current && (hintRef.current.style.opacity = "1"), IDLE_MS);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      clearTimeout(idle);
    };
  }, [active]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[45]"
      style={{ opacity: active ? 1 : 0, transition: "opacity 1.2s ease 1.5s", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* a soft shadow along the bottom, so the line reads over the bright world */}
      <div className="absolute inset-x-0 bottom-0 h-10" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />
      <div ref={hintRef} className="absolute inset-x-0 bottom-8 flex flex-col items-center text-[#f3dfb0]" style={{ opacity: 0, transition: "opacity 0.8s ease" }}>
        <div className="animate-cue-bob relative flex flex-col items-center">
          <div className="absolute left-1/2 top-1/2 -z-10 h-[260%] w-[180%] -translate-x-1/2 -translate-y-1/2" style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, transparent 75%)", filter: "blur(8px)" }} />
          <span className="font-cinzel text-[0.7rem] uppercase tracking-[0.34em] text-legible" style={{ marginRight: "-0.34em" }}>
            Keep scrolling
          </span>
          <ChevronDown size={15} className="chevron-cascade mt-1" />
        </div>
      </div>
      <div className="world-progress relative h-[4px] w-full">
        <div ref={fillRef} className="world-progress-fill absolute inset-0 origin-left" style={{ transform: "scaleX(0)" }} />
        <div ref={dropRef} className="world-progress-drop absolute top-1/2" style={{ left: "0%" }} />
      </div>
    </div>
  );
};

export default WorldProgress;
