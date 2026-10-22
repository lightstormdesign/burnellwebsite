import "@/App.css";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "@/pages/Home";
import { useIsMobile } from "@/hooks/useIsMobile";
import { LAYLO_URL, TEXT_LIST_ON } from "@/data/site";

// Home ships in the main bundle; every other page loads on its own, and is
// fetched in the background once Home has had the connection to itself.
const PAGES = {
  about: () => import("@/pages/About"),
  epk: () => import("@/pages/EPK"),
  contact: () => import("@/pages/Contact"),
  music: () => import("@/pages/Music"),
  tour: () => import("@/pages/Tour"),
  community: () => import("@/pages/Community"),
  onlyHueman: () => import("@/pages/OnlyHueman"),
};
const About = lazy(PAGES.about);
const EPK = lazy(PAGES.epk);
const Contact = lazy(PAGES.contact);
const Music = lazy(PAGES.music);
const Tour = lazy(PAGES.tour);
const Community = lazy(PAGES.community);
const OnlyHueman = lazy(PAGES.onlyHueman);
// The site editor (/admin): its own screen, none of the site's effects.
const AdminApp = lazy(() => import("@/admin/AdminApp"));
const PREFETCH_DELAY_MS = 8000;
import { TrackingPixel } from "@/components/site/TrackingPixel";
import { WaterCursor } from "@/components/site/WaterCursor";
import { TouchRipples } from "@/components/site/TouchRipples";
import { SacredGeometryField } from "@/components/site/SacredGeometryField";

// On mobile the About page is gone: the story is told on Home, after the
// world, so /about goes there. Desktop keeps the About page until the
// desktop version of the world exists.
function AboutRoute() {
  const isMobile = useIsMobile();
  return isMobile ? <Navigate to="/#story" replace /> : <About />;
}

// /connect is dormant until ENTREE's backend can take sign-ups (the page
// itself is kept in src/pages/Connect.jsx). Old links go to his text-list
// link (Laylo) once it's set, or home until then.
function ConnectRoute() {
  const external = TEXT_LIST_ON && !LAYLO_URL.startsWith("/");
  useEffect(() => {
    if (external) window.location.replace(LAYLO_URL);
  }, [external]);
  if (external) return null;
  return <Navigate to={TEXT_LIST_ON ? LAYLO_URL : "/"} replace />;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function Site() {
  const { pathname } = useLocation();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  useEffect(() => {
    if (isAdmin) return;
    const t = setTimeout(() => Object.values(PAGES).forEach((load) => load().catch(() => {})), PREFETCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [isAdmin]);

  if (isAdmin) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#08090a]" />}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <>
      <TrackingPixel />
      <SacredGeometryField />
      <WaterCursor />
      <TouchRipples />
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutRoute />} />
          <Route path="/epk" element={<EPK />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/music" element={<Music />} />
          <Route path="/tour" element={<Tour />} />
          <Route path="/community" element={<Community />} />
          <Route path="/only-hueman" element={<OnlyHueman />} />
          <Route path="/connect" element={<ConnectRoute />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ScrollToTop />
        <Site />
      </BrowserRouter>
    </div>
  );
}

export default App;
