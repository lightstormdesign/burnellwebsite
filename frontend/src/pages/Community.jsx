import { ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/site/Reveal";
import { useIsMobile } from "@/hooks/useIsMobile";
import { SOCIALS, LAYLO_URL, ARTIST_NAME, COMMUNITY_OFFERS } from "@/data/site";

// Repurposed as the dedicated text-list signup landing page — this is where
// "join her world" lives (the About page's "Join the Family" button routes
// here). Stats/performance numbers live only on the EPK page, not here.
export default function Community() {
  const isMobile = useIsMobile();
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
        <img src="/burnell-community.jpg" alt="" aria-hidden className="animate-kenburns h-full w-full object-cover" />
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

        {/* Stretched horizontally instead of vertically (wide, short) so it
            reveals more of the blonde woman's head in the background crowd
            photo behind it. Copy condensed to 2 lines max at this width;
            routes to Sierra's real Laylo text-list landing page rather than
            a native form.

            Rendered directly (no Reveal-driven transform/opacity animation)
            — backdrop-blur-sm on this box was getting visibly delayed by a
            couple of seconds, which traced back to browsers not compositing
            backdrop-filter correctly while an ancestor's `transform` is
            actively animating (Reveal's translateY fade-in). Present from
            the very first frame is more reliable than fighting that.

            The soft pulsing glow (animate-glow-pulse) is applied directly
            to this box, for the same reason — it must be animating from
            the very first frame with no delayed entrance, so it can't live
            behind a Reveal-gated fade-in either. */}
        <div
          className={`animate-glow-pulse mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-6 rounded-xl border border-[var(--sm-gold)]/25 bg-black/45 px-8 py-4 backdrop-blur-sm ${
            isMobile ? "mt-6" : "mt-10"
          }`}
        >
          <p className="font-body max-w-sm text-left text-sm font-light text-white/70">
            Get texts from {ARTIST_NAME.split(" ")[0]} — an unreleased song, behind-the-scenes content, new music, and show dates.
          </p>
          <a
            href={LAYLO_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="community-signup-laylo-link"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--sm-gold)] px-6 py-2.5 font-body text-sm font-medium text-black transition-colors hover:bg-[var(--sm-gold-light)]"
          >
            Join the Family <ArrowUpRight size={15} />
          </a>
        </div>

        {/* Offerings — form: Patreon, low-barrier offer (greatest hits /
            beat packs), Quantum Visions. Cards without a link yet render as
            "coming soon". */}
        <Reveal delay={0.2}>
          <div className={`grid grid-cols-1 gap-4 text-left sm:grid-cols-2 ${isMobile ? "mt-10" : "mt-14"}`}>
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
