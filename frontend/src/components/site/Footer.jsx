import { Link, useLocation } from "react-router-dom";
import { NAV_LINKS, SOCIALS, ARTIST_NAME, LOGO } from "@/data/site";
import { MoonPhase } from "./MoonPhase";

export const Footer = () => {
  const location = useLocation();
  return (
    <footer data-testid="site-footer" className="relative border-t border-white/10 bg-black/85 py-12 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-7 px-6 lg:px-8">
        <img src={LOGO} alt={ARTIST_NAME} className="h-12 w-auto object-contain" />

        <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className={`font-accent text-[0.65rem] uppercase tracking-[0.2em] transition-colors ${
                location.pathname === l.to
                  ? "text-[var(--sm-gold-light)] hover:text-white"
                  : "text-white/55 hover:text-[var(--sm-gold-light)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`footer-social-${s.label.toLowerCase()}`}
              className="font-accent text-[0.65rem] uppercase tracking-[0.2em] text-white/55 transition-colors hover:text-[var(--sm-gold-light)]"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <MoonPhase />

        <p className="font-body text-xs font-light text-white/35">© {new Date().getFullYear()} {ARTIST_NAME}. All rights reserved.</p>
      </div>
    </footer>
  );
};
