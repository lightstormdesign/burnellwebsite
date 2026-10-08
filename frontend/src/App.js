import "@/App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "@/pages/Home";
import About from "@/pages/About";
import EPK from "@/pages/EPK";
import Contact from "@/pages/Contact";
import Music from "@/pages/Music";
import Tour from "@/pages/Tour";
import Community from "@/pages/Community";
import { TrackingPixel } from "@/components/site/TrackingPixel";
import { GlowCursor } from "@/components/site/GlowCursor";
import { SacredGeometryField } from "@/components/site/SacredGeometryField";
import { WorldDim } from "@/components/site/WorldDim";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ScrollToTop />
        <TrackingPixel />
        <SacredGeometryField />
        <WorldDim />
        <GlowCursor />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/epk" element={<EPK />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/music" element={<Music />} />
          <Route path="/tour" element={<Tour />} />
          <Route path="/community" element={<Community />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
