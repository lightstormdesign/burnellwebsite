import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/site/Reveal";
import SignupForm, { SignupThanks } from "@/components/site/SignupForm";
import { useIsMobile } from "@/hooks/useIsMobile";
import { SOCIALS, SIGNUP, COMMUNITY_OFFERS } from "@/data/site";

// Community: his text list (an embedded sign-up form, saved with the site's
// other forms in /admin → Sign-ups) and the offers. Stats/performance
// numbers live only on the EPK page, not here.
export default function Community() {
  const isMobile = useIsMobile();
  const photoRef = useRef(null);
  const boxRef = useRef(null);
  const cardsRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const c = SIGNUP.community;

  // Computers: size and place the crowd photo so Burnell's face (kneeling,
  // brown hat) sits in the gap between the sign-up box and the offer cards,
  // whatever the window's shape. The photo is 960x720; his face is at
  // (615, 430) in it.
  useEffect(() => {
    if (isMobile) return;
    const place = () => {
      const img = photoRef.current;
      const box = boxRef.current;
      const cards = cardsRef.current;
      if (!img || !cards) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const cardsTop = cards.getBoundingClientRect().top;
      // between the sign-up box and the cards
      const target = box ? (box.getBoundingClientRect().bottom + cardsTop) / 2 : cardsTop - 40;
      let k = Math.max(W / 960, H / 720);
      // face lower than the photo allows: grow it until it reaches
      if (430 * k < target) k = target / 430;
      // face higher than the photo allows (its bottom would show): grow it from the bottom
      if (H - 720 * k > target - 430 * k) k = Math.max(k, (H - target) / 290);
      img.style.width = `${(960 * k).toFixed(0)}px`;
      img.style.height = `${(720 * k).toFixed(0)}px`;
      img.style.left = `${((W - 960 * k) / 2).toFixed(0)}px`;
      img.style.top = `${Math.min(0, Math.max(H - 720 * k, target - 430 * k)).toFixed(0)}px`;
    };
    place();
    const t = setTimeout(place, 1200); // once the cards have finished rising in
    window.addEventListener("resize", place);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", place);
    };
  }, [isMobile]);
  return (
    // flex column + min-h-screen: the standard "sticky footer" pattern —
    // <main> below gets flex-1, so it stretches to fill any leftover
    // viewport height itself, meaning <Footer/> always lands exactly at
    // the true bottom with nothing showing beneath it, regardless of how
    // short this page's own content is. Mobile: explicit black background
    // on the root, since the photo below is now a bounded block (not a
    // full-page fixed cover) — the area below it needs its own backdrop.
    <div className={`relative flex min-h-screen flex-col ${isMobile ? "bg-[var(--sm-black)]" : ""}`}>
      {/* Mobile: the crowd photo is a bounded block pinned to the top of
          the viewport (NOT a full-height fixed cover like desktop) — a
          reversal of an earlier pass that stretched/zoomed it to fill
          nearly the whole screen. Shrunk back down so the label/headline/
          card sit naturally within it, with the socials row and footer
          following in normal black-background flow below, reachable with
          a short, ordinary scroll (not zero, not excessive). Desktop is
          completely untouched (fixed inset-0, unchanged). */}
      <div
        className={isMobile ? "fixed inset-x-0 top-0 z-0 overflow-hidden" : "fixed inset-0 z-0 overflow-hidden"}
        style={isMobile ? { height: "58vh" } : undefined}
      >
        {/* on computers placed so Burnell's face shows between the sign-up
            box and the offer cards (see above) */}
        <img
          ref={photoRef}
          src="/burnell-community-crowd.webp"
          alt=""
          aria-hidden
          className={isMobile ? "animate-kenburns h-full w-full object-cover" : "absolute max-w-none"}
        />
        <div aria-hidden className="haze-drift" />
        <div className="absolute inset-0 bg-black/65" />
      </div>
      <Navbar />
      {/* Header group (title + signup box + socials) shifted down ~7vh as
          one unit, per client request, once the footer-position bug above
          was fixed. Mobile: repositioned to sit centered within the
          shorter photo block above, instead of the desktop offset. */}
      <main
        className={`relative z-10 mx-auto w-full max-w-3xl flex-1 px-6 text-center ${isMobile ? "pb-16" : "pb-32"}`}
        style={{ paddingTop: isMobile ? "calc(4rem + 8vh)" : "calc(10rem + 7vh)" }}
      >
        <Reveal>
          <span className="overline">Community</span>
          {/* Mobile: must render on one line — a smaller guaranteed-fit size
              instead of the desktop text-5xl/6xl, which wraps at phone
              widths. */}
          <h1
            className={`font-display font-normal text-[var(--sm-text)] text-legible whitespace-nowrap ${
              isMobile ? "text-3xl" : "text-5xl sm:text-6xl"
            }`}
          >
            Come Be Soul Fam.
          </h1>
        </Reveal>

        {/* The text-list sign-up. Rendered directly (no Reveal-driven
            transform/opacity animation): browsers delay backdrop-blur on a
            box while an ancestor's transform is animating. */}
        <div
          ref={boxRef}
          data-testid="community-signup"
          className={`animate-glow-pulse mx-auto max-w-2xl rounded-xl border border-[var(--sm-gold)]/25 bg-black/45 px-6 py-5 backdrop-blur-sm sm:px-8 ${
            isMobile ? "mt-6" : "mt-10"
          }`}
        >
          {joined ? (
            <SignupThanks small headline={c.thanksHeadline} text={c.thanksText} />
          ) : (
            <div className="grid gap-5 text-left sm:grid-cols-[1fr_1.25fr] sm:items-start">
              <div>
                <p className="font-display text-xl text-white">{c.headline}</p>
                <ul className="mt-3 space-y-1.5">
                  {c.benefits.map((b) => (
                    <li key={b} className="font-body flex gap-2 text-sm font-light text-white/70">
                      <span aria-hidden className="text-[var(--sm-gold)]">✦</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <SignupForm form="community" buttonText={c.buttonText} onDone={() => setJoined(true)} />
            </div>
          )}
        </div>

        {/* Offerings — form: Patreon, low-barrier offer (greatest hits /
            beat packs), Quantum Visions. Cards without a link yet render as
            "coming soon". */}
        <Reveal delay={0.2}>
          <div ref={cardsRef} className={`grid grid-cols-1 gap-4 text-left sm:grid-cols-2 ${isMobile ? "mt-10" : "mt-14"}`}>
            {COMMUNITY_OFFERS.map((o) => {
              const inner = (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg text-white">{o.label}</span>
                    {o.href ? (
                      <ArrowUpRight size={16} className="text-[var(--sm-gold)]" />
                    ) : (
                      <span className="font-accent text-[0.6rem] uppercase tracking-[0.2em] text-white/40">Coming soon</span>
                    )}
                  </div>
                  {o.description && <p className="font-body mt-1.5 text-sm font-light text-white/60">{o.description}</p>}
                </>
              );
              const cls = "block rounded-xl border border-white/10 bg-black/45 px-5 py-4 backdrop-blur-sm transition-colors";
              return o.href ? (
                <a key={o.label} href={o.href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:border-[var(--sm-gold)]/50`}>
                  {inner}
                </a>
              ) : (
                <div key={o.label} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <div className={`flex items-center justify-center gap-7 ${isMobile ? "mt-10" : "mt-14"}`}>
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-accent text-xs uppercase tracking-[0.2em] text-white/70 text-legible transition-colors hover:text-[var(--sm-gold-light)]"
              >
                {s.label}
              </a>
            ))}
          </div>
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}
