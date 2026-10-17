import { useCallback, useEffect, useRef } from "react";

// Phone tilt for the mobile Home world: how far the phone is tilted from
// the way it was being held, as x (left/right) and y (toward/away), each
// -1..1. The resting angle slowly re-centers, so changing how you hold the
// phone never leaves the world stuck off-center. Published as --tilt-x and
// --tilt-y on <html> too, for CSS (the B leans with the phone).
//
// iOS only gives motion data after asking permission, and only from inside
// a tap: call `enable()` from the Tap to Enter handler. Android needs no
// permission, so it starts on its own.
const RANGE_DEG = 10; // this much tilt = full effect
const RECENTER = 0.004; // per reading: how quickly the resting angle follows you

export const useTilt = () => {
  const tilt = useRef({ x: 0, y: 0 });
  const base = useRef(null);
  const listening = useRef(false);

  const onOrient = useCallback((e) => {
    if (e.gamma == null || e.beta == null) return;
    if (!base.current) base.current = { g: e.gamma, b: e.beta };
    const b = base.current;
    b.g += (e.gamma - b.g) * RECENTER;
    b.b += (e.beta - b.b) * RECENTER;
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    tilt.current.x = clamp((e.gamma - b.g) / RANGE_DEG);
    tilt.current.y = clamp((e.beta - b.b) / RANGE_DEG);
  }, []);

  const listen = useCallback(() => {
    if (listening.current) return;
    listening.current = true;
    window.addEventListener("deviceorientation", onOrient);
  }, [onOrient]);

  const enable = useCallback(() => {
    const DOE = typeof window !== "undefined" && window.DeviceOrientationEvent;
    if (!DOE) return;
    if (typeof DOE.requestPermission === "function") {
      DOE.requestPermission()
        .then((r) => r === "granted" && listen())
        .catch(() => {});
    } else {
      listen();
    }
  }, [listen]);

  useEffect(() => {
    const DOE = window.DeviceOrientationEvent;
    // no permission needed (Android): start right away
    if (DOE && typeof DOE.requestPermission !== "function") listen();
    return () => {
      window.removeEventListener("deviceorientation", onOrient);
      document.documentElement.style.removeProperty("--tilt-x");
      document.documentElement.style.removeProperty("--tilt-y");
    };
  }, [listen, onOrient]);

  return { tilt, enable };
};

export default useTilt;
