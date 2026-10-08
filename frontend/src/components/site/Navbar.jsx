import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { NAV_LINKS, ARTIST_NAME, LOGO } from "@/data/site";
import { useIsMobile } from "@/hooks/useIsMobile";

const NavLink = ({ to, label, active, testId, mobile }) => (
  <Link
    to={to}
    data-testid={testId}
    onClick={mobile ? mobile.onClick : undefined}
    className={
      mobile
        ? `border-b border-white/5 py-3 text-left font-accent text-sm uppercase tracking-[0.16em] ${
            active ? "text-[var(--sm-gold-light)]" : "text-white/80"
          }`
        : `font-accent text-[0.65rem] uppercase tracking-[0.12em] transition-colors duration-300 ${
            active ? "text-[var(--sm-gold-light)]" : "text-white/70 hover:text-[var(--sm-gold-light)]"
          }`
    }
  >
    {label}
  </Link>
);

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isMobile = useIsMobile();
  // Portal/Hero (the Home page, mobile only) gets a distinct faded-into-
  // black header treatment with no wordmark; every other mobile page (and
  // desktop everywhere) keeps a normal header bar.
  const isPortalHero = isMobile && isHome;

  return (
    // Fixed headers don't reserve document-flow space, so anything that
    // scrolls upward eventually passes underneath it. This header always
    // carries a solid backdrop (not just after a scroll threshold) so page
    // content is cleanly occluded rather than visually colliding with the
    // nav links as it scrolls past — a site-wide fix, not a per-page one.
    // Exception: mobile Portal/Hero, which intentionally has no bar at all
    // (see isPortalHero below) — its own persistent gradient overlay
    // (MobilePortal.jsx) provides the "fades into black" look instead.
    <header
      data-testid="site-navbar"
      className={
        isPortalHero
          ? "fixed inset-x-0 top-0 z-50"
          : isMobile
            ? "fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black"
            : "fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl"
      }
    >
      {/* Portal/Hero: hamburger is right-aligned, matching the same
          position used on every other page's header (supersedes an
          earlier "centered" spec). Since no wordmark renders for
          isPortalHero, the hamburger is the only flex child here, so
          `justify-between` alone wouldn't push it right — `justify-end`
          does. */}
      <nav
        className={`relative mx-auto flex max-w-7xl items-center px-6 py-3 lg:px-8 ${
          isPortalHero ? "justify-end" : "justify-between"
        }`}
      >
        {!isPortalHero && (
          <Link to="/" data-testid="nav-link-wordmark">
            {isMobile ? (
              // Mobile, every page except Portal/Hero: the newer,
              // higher-quality transparent-background wordmark. Note: the
              // source PNG used on the Portal page is a full-screen overlay
              // asset (1080x1919 canvas, logo content only in a thin ~11%-
              // tall band) — using it directly here at any reasonable
              // header height rendered as a near-invisible sliver, so this
              // uses a version pre-cropped to just that content band
              // (sierra-mobile-header-logo.png) instead. Sized to ~70% of
              // the header's height (h-14, with the fixed py-3 padding,
              // works out to 56/80 = 70% of the resulting bar height).
              <img
                src={LOGO}
                alt={ARTIST_NAME}
                className="animate-wordmark-float h-9 w-auto object-contain"
              />
            ) : isHome ? (
              // Desktop homepage only: her original plain-text wordmark (no
              // symbol), per Round 3 — everywhere else keeps the symbol+text
              // logo image. Untouched by the mobile treatment above.
              <span className="font-display text-xl uppercase tracking-[0.15em] text-[var(--sm-gold-light)]">
                {ARTIST_NAME}
              </span>
            ) : (
              <img src={LOGO} alt={ARTIST_NAME} className="h-10 w-auto object-contain" />
            )}
          </Link>
        )}
        {!isPortalHero && (
          <div className="hidden items-center gap-5 md:flex">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.label} to={l.to} label={l.label} active={location.pathname === l.to} testId={`nav-link-${l.label.toLowerCase()}`} />
            ))}
          </div>
        )}
        <div className="md:hidden">
          {/* Portal/Hero only: +15% over the standard 22px icon. */}
          <button data-testid="nav-mobile-toggle" onClick={() => setOpen((v) => !v)} className="text-white" aria-label="Menu">
            {open ? <X size={isPortalHero ? 25 : 22} /> : <Menu size={isPortalHero ? 25 : 22} />}
          </button>
        </div>
      </nav>

      {open && (
        <div data-testid="nav-mobile-menu" className="border-t border-white/10 bg-black/90 backdrop-blur-xl md:hidden">
          <div className="flex flex-col px-6 pb-4 pt-2">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                label={l.label}
                active={location.pathname === l.to}
                mobile={{ onClick: () => setOpen(false) }}
              />
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
