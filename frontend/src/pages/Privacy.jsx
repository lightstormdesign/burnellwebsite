import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { ARTIST_NAME, SITE_CONTACT } from "@/data/site";

// /privacy: what this site collects, mostly through the text-list sign-up,
// and the SMS terms carriers ask for. Linked from every sign-up form's
// terms and from the footer.
const UPDATED = "October 28, 2026";

const Section = ({ title, children }) => (
  <section className="mt-10">
    <h2 className="font-display text-2xl text-white">{title}</h2>
    <div className="font-body mt-3 space-y-3 text-[0.95rem] font-light leading-relaxed text-white/70">{children}</div>
  </section>
);

export default function Privacy() {
  const email = SITE_CONTACT.email;
  const mail = (
    <a href={`mailto:${email}`} className="text-[var(--sm-gold-light)] underline decoration-white/20 underline-offset-2 hover:text-white">
      {email}
    </a>
  );
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--sm-black)]">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-24" style={{ paddingTop: "calc(6rem + 4vh)" }}>
        <span className="overline">Privacy</span>
        <h1 className="font-display text-4xl font-normal leading-tight text-white sm:text-5xl">Privacy Policy</h1>
        <p className="font-body mt-3 text-sm text-white/45">Last updated {UPDATED}</p>
        <p className="font-body mt-6 text-[0.95rem] font-light leading-relaxed text-white/70">
          This policy explains what {ARTIST_NAME} (“we”, “us”) collects through this website and the text list, how it’s used, and the
          choices you have. In short: we only use your details to send you the messages you asked for, and we never sell or share them
          for anyone else’s marketing.
        </p>

        <Section title="What we collect">
          <p>
            <strong className="font-normal text-white">When you join the text list</strong> (on any sign-up form on this site): your phone
            number, and anything else you choose to give us, such as your first name, email address and city. We also keep a record of
            your consent: the exact words you agreed to, the date and time, the page you signed up on, your IP address and your browser
            type.
          </p>
          <p>
            <strong className="font-normal text-white">When you email us</strong>: your email address and whatever you write.
          </p>
          <p>
            <strong className="font-normal text-white">When you browse</strong>: like most websites, ours may use basic analytics and
            advertising tools (such as Google Analytics and the Meta Pixel) that use cookies to count visits and see which pages are
            useful. Embedded players from Spotify and YouTube may also set their own cookies when you play them. You can block or clear
            cookies in your browser at any time.
          </p>
        </Section>

        <Section title="How we use it">
          <p>
            To send you the text messages you signed up for: high-vibe messages of inspiration and news about {ARTIST_NAME}’s music,
            shows and merch, and anything we promised when you joined (like an unreleased song). To let you know about shows near you
            if you gave us your city. To answer you when you write to us, and to keep the site running and improve it.
          </p>
        </Section>

        <Section title="Text messages (SMS terms)">
          <p>
            By joining the text list you agree to receive recurring text messages from {ARTIST_NAME} at the number you gave: about one
            message a week, up to 8 a month. Message and data rates may apply. Consent is not a condition of any purchase.
          </p>
          <p>
            <strong className="font-normal text-white">To cancel</strong>, reply STOP to any message; you’ll get one message confirming
            it, and no more after that. <strong className="font-normal text-white">For help</strong>, reply HELP or email {mail}.
            Carriers are not liable for delayed or undelivered messages.
          </p>
          <p>
            <strong className="font-normal text-white">
              No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.
            </strong>{" "}
            Text messaging opt-in data and consent are never shared with any third party.
          </p>
        </Section>

        <Section title="Who else sees it">
          <p>
            We never sell, rent or trade your information. We only use trusted services that help us run the site and send messages
            (website hosting, the database that stores the list, and the texting provider), and only so they can do that work for us.
            We may share information if the law requires it.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            For as long as you’re on the list. If you cancel or ask us to delete your details, we remove them, except for the record of
            your opt-out, which we keep so you’re never texted again.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            You can stop texts at any time by replying STOP. You can ask to see, correct or delete the details we hold about you by
            emailing {mail}, and we’ll take care of it promptly. Depending on where you live (for example California or the EU), you may
            have further rights under your local law; we honor those requests too.
          </p>
        </Section>

        <Section title="Children">
          <p>This site and the text list are not meant for children under 13, and we don’t knowingly collect their information.</p>
        </Section>

        <Section title="Keeping it safe">
          <p>
            Your details are stored with access limited to {ARTIST_NAME} and the people who help run this site. No system is perfectly
            secure, but we take reasonable steps to protect what you share with us.
          </p>
        </Section>

        <Section title="Changes and contact">
          <p>
            If this policy changes, we’ll update the date at the top. Questions? Email {mail}
            {SITE_CONTACT.location ? `, ${SITE_CONTACT.location}` : ""}.
          </p>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
