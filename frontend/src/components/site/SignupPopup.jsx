import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import SignupForm, { JOINED_KEY, SignupThanks } from "@/components/site/SignupForm";
import { SIGNUP } from "@/data/site";

// A gentle invitation to the text list: after 15s on the site it fades in,
// small, in a corner. A tap opens the light form inside it; closing it keeps
// it away for a month, and anyone who has joined from any form never sees
// it again. Not on the pages that already have the form, and on the home
// page only once they're scrolling through the world (never over the
// portal or the transition video), and not while the story's own closing
// form is on screen. Plain opacity fades and no backdrop blur, so it costs
// the scroll world nothing.
const DELAY_MS = 15000;
const SNOOZE_DAYS = 30;
const SKIP = ["/admin", "/connect", "/community", "/privacy"];

const read = () => {
  try {
    return localStorage.getItem(JOINED_KEY);
  } catch {
    return null;
  }
};
const write = (v) => {
  try {
    localStorage.setItem(JOINED_KEY, v);
  } catch {}
};
const snoozed = () => {
  const v = read();
  if (v === "joined") return true;
  const t = Number(v?.split(":")[1]);
  return !!t && Date.now() - t < SNOOZE_DAYS * 864e5;
};

export default function SignupPopup() {
  const { pathname } = useLocation();
  const [due, setDue] = useState(false); // the 15s are up
  const [blocked, setBlocked] = useState(true); // somewhere it shouldn't show right now
  const [gone, setGone] = useState(() => snoozed());
  const [open, setOpen] = useState(false); // the form is showing
  const [done, setDone] = useState(false);
  const p = SIGNUP.popup;
  const doneTimer = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDue(true), DELAY_MS);
    return () => {
      clearTimeout(t);
      clearTimeout(doneTimer.current);
    };
  }, []);

  // Where it may show. Home: only once the page has scrolled (the world),
  // and not while the closing chapter (with its own form) is up.
  useEffect(() => {
    if (!due || gone) return;
    const check = () => {
      if (SKIP.some((s) => pathname.startsWith(s))) return setBlocked(true);
      if (pathname !== "/") return setBlocked(false);
      const closing = document.querySelector('[data-testid="world-chapter-home-invitation"]');
      setBlocked(window.scrollY < 40 || (closing && Number(closing.style.opacity) > 0.05));
    };
    check();
    const iv = setInterval(check, 500);
    return () => clearInterval(iv);
  }, [due, gone, pathname]);

  const close = () => {
    if (!done) write(`snoozed:${Date.now()}`);
    setGone(true);
  };
  const joined = () => {
    setDone(true);
    doneTimer.current = setTimeout(() => setGone(true), 5000);
  };

  if (gone || !due) return null;
  const shown = !blocked || open; // once they're filling it in, it stays
  return (
    <div
      role="dialog"
      aria-label={p.headline}
      data-testid="signup-popup"
      className="fixed inset-x-3 z-[46] sm:inset-x-auto sm:left-6 sm:w-[22rem]"
      style={{
        bottom: "calc(1rem + env(safe-area-inset-bottom))",
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(10px)",
        visibility: shown ? "visible" : "hidden",
        transition: shown ? "opacity 1.4s ease, transform 1.4s ease, visibility 0s" : "opacity 0.6s ease, transform 0.6s ease, visibility 0s 0.6s",
      }}
    >
      <div className="relative max-h-[80svh] overflow-y-auto rounded-2xl border border-[var(--sm-gold)]/25 bg-[#0b0a08]/95 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.55)]">
        <button type="button" onClick={close} aria-label="Close" className="absolute right-2.5 top-2.5 rounded-full p-1.5 text-white/40 hover:bg-white/5 hover:text-white">
          <X size={16} />
        </button>
        {done ? (
          <SignupThanks small headline={p.thanksHeadline} text={p.thanksText} />
        ) : (
          <>
            <div className="flex items-start gap-3 pr-6">
              <img src="/burnell-emblem.png" alt="" aria-hidden className="mt-0.5 h-8 w-auto opacity-90" />
              <div>
                <p className="font-display text-lg leading-snug text-white">{p.headline}</p>
                <p className="font-body mt-1 text-sm font-light leading-relaxed text-white/65">{p.text}</p>
              </div>
            </div>
            {open ? (
              <SignupForm form="popup" buttonText={p.buttonText} onDone={joined} className="mt-4" />
            ) : (
              <button
                type="button"
                onClick={() => setOpen(true)}
                data-testid="signup-popup-open"
                className="mt-4 w-full rounded-full bg-[var(--sm-gold)] px-5 py-2.5 font-body text-sm font-medium text-black transition-colors hover:bg-[var(--sm-gold-light)]"
              >
                {p.buttonText}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
