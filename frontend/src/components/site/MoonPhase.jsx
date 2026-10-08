import { useState } from "react";

// Tonight's actual moon phase — no API, just the synodic month (29.53059
// days) measured against a known reference new moon (Jan 6 2000, 18:14 UTC).
// Computed once per page load (this is a quiet decorative detail, not a
// live clock).
const SYNODIC_MONTH_DAYS = 29.53058867;
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

function getMoonPhase(date = new Date()) {
  const daysSince = (date.getTime() - KNOWN_NEW_MOON_MS) / 86400000;
  let phase = (daysSince % SYNODIC_MONTH_DAYS) / SYNODIC_MONTH_DAYS;
  if (phase < 0) phase += 1;
  return phase; // 0 = new, 0.5 = full, back to 1 = new
}

function phaseName(phase) {
  if (phase < 0.03 || phase > 0.97) return "New Moon";
  if (phase < 0.22) return "Waxing Crescent";
  if (phase < 0.28) return "First Quarter";
  if (phase < 0.47) return "Waxing Gibbous";
  if (phase < 0.53) return "Full Moon";
  if (phase < 0.72) return "Waning Gibbous";
  if (phase < 0.78) return "Last Quarter";
  return "Waning Crescent";
}

// Two same-size circles, the "lit" one slid sideways inside a circular clip
// — the classic overlap trick for a crescent/gibbous silhouette. Not an
// astronomically exact terminator curve, but a correct, recognizable shape
// at every phase (0/±size offset = fully new, 0 offset = fully full), which
// is what a small decorative footer glyph needs.
const MoonGlyph = ({ phase, size = 20 }) => {
  const illum = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  const waxing = phase < 0.5;
  const offset = (1 - illum) * size * (waxing ? -1 : 1);
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
        background: "#241c12",
        boxShadow: "inset 0 0 5px rgba(214,179,101,0.3)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: offset,
          width: size,
          height: size,
          borderRadius: "50%",
          background: "var(--sm-gold-light)",
        }}
      />
    </div>
  );
};

export const MoonPhase = () => {
  const [phase] = useState(getMoonPhase);
  return (
    <div
      data-testid="moon-phase"
      title={`Tonight: ${phaseName(phase)}`}
      className="flex items-center gap-2"
    >
      <MoonGlyph phase={phase} />
      <span className="font-accent text-[0.6rem] uppercase tracking-[0.15em] text-white/40">{phaseName(phase)}</span>
    </div>
  );
};
