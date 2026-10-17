import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/site/Reveal";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ARTIST_NAME } from "@/data/site";

// The exact words a fan agrees to. Sent with every sign-up and kept with it
// as their consent record, so if this ever changes, earlier fans still have
// the version they actually saw. The box is never pre-checked.
const CONSENT_TEXT =
  `Yes, text me about ${ARTIST_NAME}'s new music, shows and merch at the number above. ` +
  "Up to 4 msgs/month. Msg & data rates may apply. Reply STOP to opt out, HELP for help. " +
  "Consent is not a condition of any purchase. See the SMS privacy & terms below.";

// The offer is edited in LightStorm's admin (like a Laylo drop) and comes
// from GET /api/connect. This copy only shows if that can't be reached, and
// matches the backend's own defaults.
const FALLBACK_OFFER = {
  kicker: "Free for the family",
  headline: "Get my unreleased song, free",
  subheadline:
    "Join my text list and I'll send you a brand-new song nobody else has heard yet. Plus first word on new music and shows near you.",
  button_text: "Send Me the Song",
};
const OFFER_WAIT_MS = 1500;

const field =
  "w-full rounded-lg border border-white/15 bg-black/50 px-4 py-3 font-body text-sm text-white placeholder-white/35 outline-none transition-colors focus:border-[var(--sm-gold)]/70";

// /connect: Burnell's own text-list sign-up (replaces the Laylo link). The
// list lives in ENTREE's backend via /api/connect; nobody is texted until
// his number is registered with the carriers.
export default function Connect() {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", sms: false });
  const [status, setStatus] = useState("idle"); // idle | sending | done
  const [error, setError] = useState("");
  const [offer, setOffer] = useState(null);
  const [thanks, setThanks] = useState(null);

  // Hidden until the offer arrives (or briefly times out), so the headline
  // never visibly swaps from the fallback to the real one.
  useEffect(() => {
    let done = false;
    const finish = (o) => {
      if (done) return;
      done = true;
      setOffer({ ...FALLBACK_OFFER, ...o });
    };
    const t = setTimeout(() => finish({}), OFFER_WAIT_MS);
    fetch("/api/connect")
      .then((r) => (r.ok ? r.json() : {}))
      .then(finish, () => finish({}));
    return () => clearTimeout(t);
  }, []);
  const o = offer || FALLBACK_OFFER;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: k === "sms" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.phone.replace(/\D/g, "").length < 10) return setError("Enter your phone number with area code.");
    if (!form.sms) return setError("Tick the box to join the text list.");
    setStatus("sending");
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, consent_text: CONSENT_TEXT, page: window.location.href.split("#")[0] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setThanks(data);
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

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
        <div style={{ opacity: offer ? 1 : 0, transition: "opacity 500ms ease" }}>
          <span className="overline">{o.kicker}</span>
          <h1 className={`font-display font-normal leading-tight text-[var(--sm-text)] text-legible ${isMobile ? "text-3xl" : "text-5xl"}`}>
            {o.headline}
          </h1>
          <p className="font-body mx-auto mt-4 max-w-sm text-sm font-light text-white/75 text-legible">{o.subheadline}</p>
        </div>

        <Reveal delay={0.15}>
          {status === "done" ? (
            <div data-testid="connect-done" className="animate-glow-pulse mt-10 rounded-xl border border-[var(--sm-gold)]/30 bg-black/55 px-6 py-10 backdrop-blur-sm">
              <img src="/burnell-emblem.png" alt="" aria-hidden className="mx-auto h-12 w-auto opacity-90" />
              <p className="font-display mt-5 text-2xl text-white">{thanks?.thanks_headline || "You're in the family."}</p>
              {thanks?.reward_url ? (
                <>
                  {thanks.thanks_text && <p className="font-body mt-2 text-sm font-light text-white/65">{thanks.thanks_text}</p>}
                  <a
                    href={thanks.reward_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="connect-reward"
                    className="mt-6 inline-flex rounded-full bg-[var(--sm-gold)] px-7 py-3 font-body text-sm font-medium text-black transition-colors hover:bg-[var(--sm-gold-light)]"
                  >
                    {thanks.reward_label || "Listen Now"}
                  </a>
                </>
              ) : (
                // No reward link set yet: never promise "here's your song".
                <p className="font-body mt-2 text-sm font-light text-white/65">
                  Your song is coming to you first. Thank you for being here.
                </p>
              )}
            </div>
          ) : (
            <form
              onSubmit={submit}
              noValidate
              data-testid="connect-form"
              className="mt-10 space-y-3 rounded-xl border border-white/10 bg-black/45 p-5 text-left backdrop-blur-sm"
            >
              <input className={field} type="text" autoComplete="given-name" placeholder="First name" value={form.name} onChange={set("name")} maxLength={100} />
              <input className={field} type="tel" autoComplete="tel" inputMode="tel" placeholder="Phone number *" value={form.phone} onChange={set("phone")} maxLength={30} required />
              <input className={field} type="email" autoComplete="email" placeholder="Email (optional)" value={form.email} onChange={set("email")} maxLength={254} />
              <input className={field} type="text" autoComplete="address-level2" placeholder="Your city (for shows near you)" value={form.city} onChange={set("city")} maxLength={100} />
              <label className="flex cursor-pointer items-start gap-3 pt-1">
                <input type="checkbox" checked={form.sms} onChange={set("sms")} className="mt-1 h-4 w-4 shrink-0 accent-[var(--sm-gold)]" data-testid="connect-consent" />
                <span className="font-body text-[0.72rem] font-light leading-relaxed text-white/60">{CONSENT_TEXT}</span>
              </label>
              {error && <p className="font-body text-sm text-red-300">{error}</p>}
              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--sm-gold)] px-6 py-3 font-body text-sm font-medium text-black transition-colors hover:bg-[var(--sm-gold-light)] disabled:opacity-60"
              >
                {status === "sending" && <Loader2 size={15} className="animate-spin" />}
                {o.button_text}
              </button>
            </form>
          )}
        </Reveal>

        <details id="privacy" className="mx-auto mt-10 max-w-sm text-left">
          <summary className="cursor-pointer text-center font-accent text-[0.62rem] uppercase tracking-[0.2em] text-white/45 hover:text-white/70">
            SMS privacy &amp; terms
          </summary>
          <div className="font-body mt-4 space-y-3 text-xs font-light leading-relaxed text-white/55">
            <p>
              {ARTIST_NAME}'s text list sends updates about new music, shows and merch, up to 4 messages a month. Message and data rates
              may apply. Reply STOP at any time to stop all messages, or HELP for help. Carriers are not liable for delayed or
              undelivered messages.
            </p>
            <p>
              Your number and details are used only to send you these messages. They are never sold, rented or shared with anyone for
              their own marketing. Mobile opt-in information is never shared with third parties.
            </p>
            <p>To stop messages, reply STOP. For help or to remove your details, reply HELP or use the contact page on this site.</p>
          </div>
        </details>
      </main>
      <Footer />
    </div>
  );
}
