import { Navbar } from "@/components/site/Navbar";
import { CinematicExperience } from "@/components/site/CinematicExperience";
import { Fireflies } from "@/components/site/Fireflies";

// Hard stop: Portal -> Hero is the entire homepage. No scrollable content
// beneath the hero loop — Music/Videos/Tour/Photos/Community/stats all live
// on their own dedicated pages (see App.js routes), not here.
export default function Home() {
  return (
    <div data-testid="home-page" className="relative bg-[var(--sm-black)]">
      <Fireflies />
      <Navbar />
      <CinematicExperience />
    </div>
  );
}
