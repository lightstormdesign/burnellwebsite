import { useEffect, useRef, useState } from "react";
import { Apple, PlayCircle, Youtube, ArrowUpRight, Music2 } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Reveal } from "@/components/site/Reveal";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  SOCIALS,
  SPOTIFY_ARTIST_URL,
  MUSIC_PLATFORM_LINKS,
  MUSIC_SUBTITLE,
  MUSIC_VIDEOS,
  FEATURED_VIDEO,
  LEADMAGNET_DESCRIPTION,
  LAYLO_URL,
  ARTIST_NAME,
} from "@/data/site";

// Spotify's official embed (iframe) pulls discography directly from her
// artist profile at full quality and stays current automatically as she
// releases new music — no separate cover-art sourcing needed for this page.
const spotifyEmbedSrc = (artistUrl) => {
  const match = artistUrl?.match(/artist\/([a-zA-Z0-9]+)/);
  return match ? `https://open.spotify.com/embed/artist/${match[1]}?theme=0` : null;
};

const PLATFORM_ICONS = {
  Spotify: Music2,
  "Apple Music": Apple,
  "YouTube Music": PlayCircle,
  YouTube: Youtube,
};

export default function Music() {
  const embedSrc = spotifyEmbedSrc(SPOTIFY_ARTIST_URL);
  const isMobile = useIsMobile();

  // Spotify embed sizing: top edge lines up with the "Music Videos" title
  // on the right, bottom edge lines up with the bottom of the Live Sessions
  // video — measured directly rather than guessed, since both depend on
  // rendered widths/heights that shift across breakpoints. Desktop only:
  // this alignment only makes sense in the two-column (lg:grid-cols-2)
  // layout. On mobile's single-column stack, "Music Videos" and "Live
  // Sessions" are stacked BELOW the embed instead of beside it, so measuring
  // their position produced a huge, unstable gap — mobile just uses fixed
  // sane spacing instead (see the iframe/placeholder below).
  const topTracksLabelRef = useRef(null);
  const musicVideosTitleRef = useRef(null);
  const liveSessionWrapperRef = useRef(null);
  const [embedBox, setEmbedBox] = useState(null);

  useEffect(() => {
    if (isMobile) return;
    const measure = () => {
      if (!topTracksLabelRef.current || !musicVideosTitleRef.current || !liveSessionWrapperRef.current) return;
      // marginTop is relative to where the embed naturally sits in flow —
      // right after the "Top Tracks" label, not the column's outer top —
      // so it's measured from that label's own bottom edge.
      const labelBottom = topTracksLabelRef.current.getBoundingClientRect().bottom;
      const titleTop = musicVideosTitleRef.current.getBoundingClientRect().top;
      const liveBottom = liveSessionWrapperRef.current.getBoundingClientRect().bottom;
      setEmbedBox({ marginTop: titleTop - labelBottom, height: liveBottom - titleTop });
    };
    measure();
    const timers = [setTimeout(measure, 500), setTimeout(measure, 1500)];
    window.addEventListener("resize", measure);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", measure);
    };
  }, [isMobile]);

  return (
    <div className="starfield relative min-h-screen">
      {/* Ambient tint cycles slowly through the site's muted palette
          (blue -> turquoise -> gold -> deep gold -> blue); this page starts
          near the blue end of the loop. */}
      <div className="ambient-tint-cycle fixed inset-0 z-0" style={{ animationDelay: "-4s" }} />
      <Navbar />
      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-32 pt-40 text-center">
        <Reveal>
          <span className="overline">Music</span>
          <h1 className="font-display mt-5 text-5xl font-normal text-[var(--sm-text)] sm:text-6xl">Music</h1>
          <p className="font-body mx-auto mt-5 max-w-2xl text-sm font-light leading-relaxed text-white/60">
            {MUSIC_SUBTITLE}
          </p>
        </Reveal>

        {/* General artist-level platform links — different context from the
            Album page's album-specific "Stream Everywhere" links. */}
        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {MUSIC_PLATFORM_LINKS.map((l) => {
              const Icon = PLATFORM_ICONS[l.label] || Music2;
              return (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`music-platform-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 font-accent text-xs uppercase tracking-[0.15em] text-white/80 transition-all duration-300 hover:border-[var(--sm-gold)]/60 hover:text-[var(--sm-gold-light)]"
                >
                  <Icon size={14} /> {l.label}
                </a>
              );
            })}
          </div>
        </Reveal>

        {/* Two-column layout: Spotify embed + lead-magnet card (left)
            alongside the video sections (right), with a vertical divider
            between — all live on this one page, no separate tabs/stacked
            scroll required. */}
        <Reveal delay={0.2}>
          <div className="mt-16 grid grid-cols-1 gap-12 text-left lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-white/10">
            <div className="flex h-full flex-col lg:pr-10">
              <span ref={topTracksLabelRef} className="overline">
                Top Tracks
              </span>
              {embedSrc ? (
                <iframe
                  data-testid="spotify-embed"
                  title={`${ARTIST_NAME} on Spotify`}
                  src={embedSrc}
                  width="100%"
                  height={isMobile ? 380 : 452}
                  style={{ borderRadius: "12px", marginTop: isMobile ? "1.5rem" : embedBox ? embedBox.marginTop : "4.5rem" }}
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              ) : (
                <div
                  data-testid="spotify-embed-placeholder"
                  className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--sm-gold)]/30 px-6 py-16"
                  style={{
                    height: isMobile ? 380 : embedBox ? embedBox.height : 330,
                    marginTop: isMobile ? "1.5rem" : embedBox ? embedBox.marginTop : "4.5rem",
                  }}
                >
                  <span className="font-body text-sm text-white/40">
                    Spotify artist profile pending — connect it here once confirmed.
                  </span>
                </div>
              )}

              {/* Lead-magnet card — form: fans receive "new unreleased song
                  & bts content" for joining the text list. */}
              <div className="animate-glow-pulse mt-8 flex flex-1 flex-col items-center justify-center rounded-xl border border-[var(--sm-gold)]/25 px-6 py-10 text-center">
                <img src="/burnell-emblem.png" alt="" aria-hidden className="h-12 w-auto opacity-90" />
                <p className="font-display mt-5 text-xl text-white">Hear it before anyone else</p>
                <p className="font-body mt-2 max-w-sm text-sm font-light text-white/65">{LEADMAGNET_DESCRIPTION}</p>
                <a
                  href={LAYLO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="music-leadmagnet-laylo-link"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--sm-gold)] px-6 py-2.5 font-body text-sm font-medium text-black transition-colors hover:bg-[var(--sm-gold-light)]"
                >
                  Send it to me <ArrowUpRight size={15} />
                </a>
              </div>
            </div>

            <div className="lg:pl-10">
              <span className="overline" style={{ color: "var(--sm-turquoise)" }}>
                Music Videos
              </span>

              {/* Featured release — form: "Beautiful" for now, the new album
                  when it's ready. */}
              <div className="mt-5">
                <h3 ref={musicVideosTitleRef} className="font-display text-lg text-white">
                  {FEATURED_VIDEO.title}
                </h3>
                <p className="font-body mt-1 text-xs font-light italic text-white/45">Official Video</p>
                <div ref={liveSessionWrapperRef} className="mt-3 overflow-hidden rounded-xl border border-white/10">
                  <iframe
                    data-testid="music-featured-video"
                    className="aspect-video w-full"
                    src={`https://www.youtube.com/embed/${FEATURED_VIDEO.id}`}
                    title={`${ARTIST_NAME} — ${FEATURED_VIDEO.title}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>

              {/* The rest of the released videos — thumbnail grid linking out
                  to YouTube, so the page doesn't load nine iframes. */}
              <div className="mt-12">
                <h3 className="font-display text-lg text-white">More Videos</h3>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                  {MUSIC_VIDEOS.filter((v) => v.id !== FEATURED_VIDEO.id).map((v) => (
                    <a
                      key={v.id}
                      href={`https://www.youtube.com/watch?v=${v.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <div className="relative overflow-hidden rounded-lg border border-white/10">
                        <img
                          src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
                          alt={v.title}
                          className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-80 transition-opacity group-hover:opacity-100">
                          <PlayCircle size={28} className="text-white/85" />
                        </div>
                      </div>
                      <p className="font-body mt-2 text-xs text-white/65 transition-colors group-hover:text-[var(--sm-gold-light)]">{v.title}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mt-20 flex items-center justify-center gap-7">
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
