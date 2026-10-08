// Thin line-art heart, matching the moon/lotus logo's linework — used
// consistently across the site (Album, Tour, etc.) wherever a heart mark is
// called for. Always gold-outlined with a transparent center by default;
// deliberately not a filled red/purple emoji heart, which would clash with
// the site's gold/black/white palette.
export const HeartIcon = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.1"
    className={`text-[var(--sm-gold)] ${className}`}
    aria-hidden
  >
    <path d="M12 20.5C12 20.5 1.5 13.8 1.5 6.9C1.5 3.6 4.1 1.5 7 1.5C9 1.5 10.8 2.6 12 4.5C13.2 2.6 15 1.5 17 1.5C19.9 1.5 22.5 3.6 22.5 6.9C22.5 13.8 12 20.5 12 20.5Z" />
  </svg>
);
