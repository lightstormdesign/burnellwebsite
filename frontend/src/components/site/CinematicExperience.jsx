import { WorldHome } from "./WorldHome";
import { DesktopWorld } from "./DesktopWorld";
import { useIsMobile } from "@/hooks/useIsMobile";

// Thin switcher: phones get WorldHome (tap to enter, the transition video,
// the portrait world), computers get DesktopWorld (click to enter, the 16:9
// world). Two fully separate component trees, so neither one's hooks are
// ever conditionally skipped across a breakpoint-crossing re-render.
export const CinematicExperience = () => {
  const isMobile = useIsMobile();
  return isMobile ? <WorldHome /> : <DesktopWorld />;
};
