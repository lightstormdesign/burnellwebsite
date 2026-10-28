import { useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/site/Reveal";
import SignupForm, { SignupThanks } from "@/components/site/SignupForm";
import { useIsMobile } from "@/hooks/useIsMobile";
import { SIGNUP } from "@/data/site";

// /connect: the unreleased-song offer. Fans join his text list and get the
// song; they're saved with everyone from the site's other sign-up forms in
// /admin → Sign-ups. The words and the song link are edited in the site
// editor (Sign-up forms). Nobody is texted until his number is registered
// with the carriers.
export default function Connect() {
  const isMobile = useIsMobile();
  const [done, setDone] = useState(false);
  const o = SIGNUP.connect;

  return (
    <div className={`relative flex min-h-screen flex-col ${isMobile ? "bg-[var(--sm-black)]" : ""}`}>
      <div
        className={isMobile ? "fixed inset-x-0 top-0 z-0 overflow-hidden" : "fixed inset-0 z-0 overflow-hidden"}
        style={isMobile ? { height: "58vh" } : undefined}
      >
        <img src="/burnell-community.webp" alt="" aria-hidden className="animate-kenburns h-full w-full object-cover" />
        <div aria-hidden className="haze-drift" />
        <div className="absolute inset-0 bg-black/70" />
        {isMobile && <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-[var(--sm-black)]" />}
      </div>
      <Navbar />
      <main
        className={`relative z-10 mx-auto w-full max-w-md flex-1 px-6 text-center ${isMobile ? "pb-16" : "pb-28"}`}
        style={{ paddingTop: isMobile ? "calc(4rem + 6vh)" : "calc(8rem + 5vh)" }}
      >
        <div>
          <span className="overline">{o.kicker}</span>
          <h1 className={`font-display font-normal leading-tight text-[var(--sm-text)] text-legible ${isMobile ? "text-3xl" : "text-5xl"}`}>
            {o.headline}
          </h1>
          <p className="font-body mx-auto mt-4 max-w-sm text-sm font-light text-white/75 text-legible">{o.subheadline}</p>
        </div>

        <Reveal delay={0.15}>
          {done ? (
            <div className="animate-glow-pulse mt-10 rounded-xl border border-[var(--sm-gold)]/30 bg-black/55 px-6 py-10 backdrop-blur-sm">
              {o.rewardUrl ? (
                <SignupThanks headline={o.thanksHeadline} text={o.thanksText}>
                  <a
                    href={o.rewardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="connect-reward"
                    className="mt-6 inline-flex rounded-full bg-[var(--sm-gold)] px-7 py-3 font-body text-sm font-medium text-black transition-colors hover:bg-[var(--sm-gold-light)]"
                  >
                    {o.rewardLabel || "Listen Now"}
                  </a>
                </SignupThanks>
              ) : (
                // No song link set yet: never promise "here's your song".
                <SignupThanks headline={o.thanksHeadline} text="Your song is coming to you first. Thank you for being here." />
              )}
            </div>
          ) : (
            <div className="mt-10 rounded-xl border border-white/10 bg-black/45 p-5 backdrop-blur-sm">
              <SignupForm form="connect" full buttonText={o.buttonText} onDone={() => setDone(true)} />
            </div>
          )}
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}
