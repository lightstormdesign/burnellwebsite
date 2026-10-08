import { useEffect, useState } from "react";

// Matches Tailwind's `md` breakpoint (768px), same threshold already used
// site-wide for the Navbar's hamburger/desktop-links split — so "mobile" here
// means the same thing it means everywhere else in this codebase.
const MOBILE_QUERY = "(max-width: 767px)";

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
};
