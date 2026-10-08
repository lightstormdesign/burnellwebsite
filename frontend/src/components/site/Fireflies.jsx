// Fireflies drifting across a couple of pages (Community, About) rather than
// confining the motif to one spot. Each one glides in a straight line from
// its start point off toward (dx, dy) — see firefly-glide in index.css —
// fading in and out at the ends of that path so it reads as arriving and
// leaving naturally, not blinking in place. Deliberately sparse (8 total,
// each visible for under half its loop, staggered) and deliberately tiny —
// a small bright pinpoint, not a soft blurry blob.
const FIREFLIES = [
  { left: "6%", top: "78%", dx: "180px", dy: "-120px", delay: "0s", duration: "20s" },
  { left: "14%", top: "22%", dx: "-140px", dy: "90px", delay: "3.2s", duration: "24s" },
  { left: "28%", top: "55%", dx: "160px", dy: "60px", delay: "6.5s", duration: "18s" },
  { left: "42%", top: "14%", dx: "120px", dy: "150px", delay: "1.8s", duration: "26s" },
  { left: "58%", top: "82%", dx: "-180px", dy: "-100px", delay: "9s", duration: "22s" },
  { left: "70%", top: "38%", dx: "-150px", dy: "110px", delay: "4.4s", duration: "19s" },
  { left: "82%", top: "64%", dx: "140px", dy: "-140px", delay: "11.5s", duration: "25s" },
  { left: "90%", top: "20%", dx: "-120px", dy: "130px", delay: "0.6s", duration: "21s" },
];

export const Fireflies = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
    {FIREFLIES.map((f, i) => (
      <span
        key={i}
        className="absolute h-[2px] w-[2px] rounded-full"
        style={{
          left: f.left,
          top: f.top,
          "--fx": f.dx,
          "--fy": f.dy,
          background: "#fff8e8",
          boxShadow: "0 0 3px 1px rgba(232,207,154,1)",
          animation: `firefly-glide ${f.duration} ease-in-out ${f.delay} infinite`,
        }}
      />
    ))}
  </div>
);
