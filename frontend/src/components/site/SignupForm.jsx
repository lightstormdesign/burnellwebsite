import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ARTIST_NAME, SIGNUP } from "@/data/site";

// The exact words a fan agrees to. Sent with every sign-up and kept with it
// as their consent record, so if this ever changes, earlier fans still have
// the version they actually saw. The box is never pre-checked.
export const CONSENT_TEXT =
  `Yes, text me about ${ARTIST_NAME}'s new music, shows and merch at the number above. ` +
  "Up to 4 msgs/month. Msg & data rates may apply. Reply STOP to opt out, HELP for help. " +
  "Consent is not a condition of any purchase. See the SMS privacy & terms below.";

// 16px on phones: anything smaller and iPhone zooms the page in on focus
const FIELD =
  "w-full rounded-lg border border-white/15 bg-black/50 px-4 py-3 font-body text-base text-white placeholder-white/35 outline-none transition-colors focus:border-[var(--sm-gold)]/70 sm:text-sm";

export const SmsTerms = ({ className = "" }) => (
  <details className={`text-left ${className}`}>
    <summary className="cursor-pointer text-center font-accent text-[0.6rem] uppercase tracking-[0.2em] text-white/45 hover:text-white/70">
      SMS privacy &amp; terms
    </summary>
    <div className="font-body mt-3 space-y-2.5 text-xs font-light leading-relaxed text-white/55">
      <p>
        {ARTIST_NAME}'s text list sends updates about new music, shows and merch, up to 4 messages a month. Message and data rates may
        apply. Reply STOP at any time to stop all messages, or HELP for help. Carriers are not liable for delayed or undelivered
        messages.
      </p>
      <p>
        Your number and details are used only to send you these messages. They are never sold, rented or shared with anyone for their
        own marketing. Mobile opt-in information is never shared with third parties.
      </p>
      <p>To stop messages, reply STOP. For help or to remove your details, reply HELP or use the contact page on this site.</p>
    </div>
  </details>
);

// One sign-up form for the whole site; every one saves to the same list
// (/api/connect → /admin → Sign-ups). `form` says which one it is.
// `full` adds name and city (the /connect page); otherwise it's just a
// phone number and an optional email. `onDone` swaps in the thank-you.
export default function SignupForm({ form, full = false, buttonText, onDone, row = false, className = "" }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", city: "", sms: false, website: "" });
  const [status, setStatus] = useState("idle"); // idle | sending
  const [error, setError] = useState("");
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: k === "sms" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (f.phone.replace(/\D/g, "").length < 10) return setError("Enter your phone number with area code.");
    if (!f.sms) return setError("Tick the box to join the text list.");
    setStatus("sending");
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, form, consent_text: CONSENT_TEXT, page: window.location.href.split("#")[0] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      onDone?.();
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  return (
    <form onSubmit={submit} noValidate data-testid={`signup-${form}`} className={`space-y-3 text-left ${className}`}>
      {full && <input className={FIELD} type="text" autoComplete="given-name" placeholder="First name" value={f.name} onChange={set("name")} maxLength={100} />}
      <div className={row ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
        <input className={FIELD} type="tel" autoComplete="tel" inputMode="tel" placeholder="Phone number *" value={f.phone} onChange={set("phone")} maxLength={30} required />
        <input className={FIELD} type="email" autoComplete="email" placeholder="Email (optional)" value={f.email} onChange={set("email")} maxLength={254} />
      </div>
      {full && <input className={FIELD} type="text" autoComplete="address-level2" placeholder="Your city (for shows near you)" value={f.city} onChange={set("city")} maxLength={100} />}
      {/* never seen by people; bots fill it in */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden value={f.website} onChange={set("website")} className="absolute -left-[9999px] h-px w-px opacity-0" />
      <label className="flex cursor-pointer items-start gap-3 pt-1">
        <input type="checkbox" checked={f.sms} onChange={set("sms")} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--sm-gold)]" data-testid={`signup-${form}-consent`} />
        <span className="font-body text-[0.68rem] font-light leading-relaxed text-white/60">{CONSENT_TEXT}</span>
      </label>
      {error && <p className="font-body text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--sm-gold)] px-6 py-3 font-body text-sm font-medium text-black transition-colors hover:bg-[var(--sm-gold-light)] disabled:opacity-60"
      >
        {status === "sending" && <Loader2 size={15} className="animate-spin" />}
        {buttonText}
      </button>
      <SmsTerms className="pt-1" />
    </form>
  );
}

// The thank-you that replaces a form once they're in.
export const SignupThanks = ({ headline, text, children, small = false }) => (
  <div data-testid="signup-done" className="text-center">
    <img src="/burnell-emblem.png" alt="" aria-hidden className={`mx-auto w-auto opacity-90 ${small ? "h-9" : "h-12"}`} />
    <p className={`font-display mt-4 text-white ${small ? "text-xl" : "text-2xl"}`}>{headline}</p>
    {text && <p className="font-body mt-2 text-sm font-light text-white/65">{text}</p>}
    {children}
  </div>
);

// The close of his story (the home page's last chapter, on phones and
// computers): one short line and the light form.
export function StorySignup({ wide = false }) {
  const [done, setDone] = useState(false);
  const s = SIGNUP.story;
  if (done) return <div className="mt-8"><SignupThanks small headline={s.thanksHeadline} text={s.thanksText} /></div>;
  return (
    <div className={`mt-5 w-full ${wide ? "max-w-md" : "max-w-xs"}`}>
      <p className="font-body text-sm font-light text-white/85 text-legible">{s.line}</p>
      <SignupForm form="story" row={wide} buttonText={s.buttonText} onDone={() => setDone(true)} className="mt-4" />
    </div>
  );
}
