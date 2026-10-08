import { useIsMobile } from "@/hooks/useIsMobile";

// Template-driven flyer generator — takes raw tour-date data and renders the
// visual layout automatically. Reusable for future artists/tours: swap the
// `dates` prop for new raw text/data and the flyer regenerates itself, no
// design work required each time Sierra has new dates.
export const TourFlyer = ({ title, intro, dates }) => {
  const isMobile = useIsMobile();
  return (
    <div
      data-testid="tour-flyer"
      className={`relative mx-auto max-w-2xl rounded-xl border border-[var(--sm-gold)]/25 bg-black/40 py-14 ${
        isMobile ? "px-3" : "px-6 sm:px-10"
      }`}
    >
      <img src="/favicon-512.png" alt="" aria-hidden className="mx-auto h-12 w-12 object-contain opacity-90" />
      <h2 className="font-display mt-4 text-3xl text-[var(--sm-gold-light)] sm:text-4xl">{title}</h2>
      {intro && <p className="font-body mx-auto mt-4 max-w-md text-sm font-light italic text-white/60">{intro}</p>}

      <div className="mx-auto mt-8 h-px w-32 bg-gradient-to-r from-transparent via-[var(--sm-gold)] to-transparent" />

      <ul className="relative mt-8 space-y-0 text-left">
        {dates.map((d, i) =>
          isMobile ? (
            // Mobile: even after trimming font size and padding, the two
            // longest entries ("Day Retreat/Ceremony w/ TREV" + "Fernville,
            // Michigan") still wrapped fighting for room on one row with
            // the date column — location drops to its own row below
            // date+event instead, which guarantees a fit for any length
            // without cramping the shorter names.
            <li
              key={i}
              data-testid="tour-flyer-date"
              className="border-b border-white/10 py-5 last:border-b-0"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-accent w-14 shrink-0 text-sm text-[var(--sm-gold)]">{d.date}</span>
                <span className="font-display flex-1 text-sm text-white">{d.event}</span>
              </div>
              <p className="font-body mt-1 pl-16 text-xs text-white/50">{d.location}</p>
            </li>
          ) : (
            <li
              key={i}
              data-testid="tour-flyer-date"
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-white/10 py-5 last:border-b-0"
            >
              <span className="font-accent w-16 shrink-0 text-sm text-[var(--sm-gold)]">{d.date}</span>
              <span className="font-display flex-1 text-base text-white sm:text-lg">{d.event}</span>
              <span className="font-body text-xs text-white/50 sm:text-sm">{d.location}</span>
            </li>
          )
        )}
      </ul>
    </div>
  );
};
