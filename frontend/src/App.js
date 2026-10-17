import "@/App.css";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "@/pages/Home";
import { useIsMobile } from "@/hooks/useIsMobile";

// Home ships in the main bundle; every other page loads on its own, and is
// fetched in the background once Home has had the connection to itself.
const PAGES = {
  about: () => import("@/pages/About"),
  epk: () => import("@/pages/EPK"),
  contact: () => import("@/pages/Contact"),
  music: () => import("@/pages/Music"),
  tour: () => import("@/pages/Tour"),
  community: () => import("@/pages/Community"),
};
const About = lazy(PAGES.about);
const EPK = lazy(PAGES.epk);
const Contact = lazy(PAGES.contact);
const Music = lazy(PAGES.music);
const Tour = lazy(PAGES.tour);
const Community = lazy(PAGES.community);
const PREFETCH_DELAY_MS = 8000;
import { TrackingPixel } from "@/components/site/TrackingPixel";
import { GlowCursor } from "@/components/site/GlowCursor";
import { SacredGeometryField } from "@/components/site/SacredGeometryField";
import { WorldDim } from "@/components/site/WorldDim";

// On mobile the About page is gone: the story is told on Home, after the
// world, so /about goes there. Desktop keeps the About page until the
// desktop version of the world exists.
function AboutRoute() {
  const isMobile = useIsMobile();
  return isMobile ? <Navigate to="/#story" replace /> : <About />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function App() {
  useEffect(() => {
    const t = setTimeout(() => Object.values(PAGES).forEach((load) => load().catch(() => {})), PREFETCH_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <ScrollToTop />
        <TrackingPixel />
        <SacredGeometryField />
        <WorldDim />
        <GlowCursor />
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutRoute />} />
            <Route path="/epk" element={<EPK />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/music" element={<Music />} />
            <Route path="/tour" element={<Tour />} />
            <Route path="/community" element={<Community />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;
