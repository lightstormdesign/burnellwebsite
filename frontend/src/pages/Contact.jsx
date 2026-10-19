import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/site/Reveal";
import { SITE_CONTACT, SOCIALS } from "@/data/site";

// Burnell smiling, behind the contact details (darkened so they read).
export default function Contact() {
  return (
    <div className="relative min-h-screen bg-[var(--sm-black)]">
      <div
        className="fixed inset-0 z-0 overflow-hidden"
      >
        <img src="/burnell-community.webp" alt="" aria-hidden className="animate-kenburns h-full w-full object-cover" />
        <div aria-hidden className="haze-drift" />
        <div className="absolute inset-0 bg-black/65" />
      </div>
      <Navbar />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <Reveal>
          <span className="overline">Contact</span>
          <h1 className="font-display mt-5 text-4xl font-normal text-[var(--sm-text)] sm:text-5xl">Get in Touch</h1>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-col items-center gap-3">
            <a
              href={`mailto:${SITE_CONTACT.email}`}
              className="font-accent text-lg text-[var(--sm-gold-light)] transition-colors hover:text-white"
            >
              {SITE_CONTACT.email}
            </a>
            {SITE_CONTACT.phone && (
              <a
                href={`tel:${SITE_CONTACT.phone.replace(/[^\d+]/g, "")}`}
                className="font-body text-base text-white/70 transition-colors hover:text-white"
              >
                {SITE_CONTACT.phone}
              </a>
            )}
            {SITE_CONTACT.location && <p className="font-body text-sm font-light text-white/50">{SITE_CONTACT.location}</p>}
          </div>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-10 flex items-center justify-center gap-7">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-accent text-xs uppercase tracking-[0.2em] text-white/55 transition-colors hover:text-[var(--sm-gold-light)]"
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
