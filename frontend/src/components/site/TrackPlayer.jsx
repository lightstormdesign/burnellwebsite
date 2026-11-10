import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

// A slim player for a few of his songs, at the top of the EPK: the cover,
// the song's title and "1 / 3", a thin line to tap and jump, and back / play
// / forward. The next song starts when one ends; back restarts a song that's
// more than 3s in. Each song only downloads its length until it's played,
// and its stored duration shows before that. (These are his own files, not
// Spotify's embeds, which play 30-second previews to anyone not logged in.)
const clock = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

export const TrackPlayer = ({ tracks, cover, className = "" }) => {
  const audioRef = useRef(null);
  const keepPlaying = useRef(false); // the next song should start on its own
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(tracks[0]?.duration || 0);
  const track = tracks[i];

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setT(a.currentTime);
    const onMeta = () => Number.isFinite(a.duration) && setDur(a.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      if (i < tracks.length - 1) {
        keepPlaying.current = true;
        setI(i + 1);
      } else setPlaying(false);
    };
    const events = { timeupdate: onTime, loadedmetadata: onMeta, durationchange: onMeta, play: onPlay, pause: onPause, ended: onEnded };
    Object.entries(events).forEach(([e, f]) => a.addEventListener(e, f));
    return () => Object.entries(events).forEach(([e, f]) => a.removeEventListener(e, f));
  }, [i, tracks.length]);

  // a different song: load it, and carry on playing if one was
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    setT(0);
    setDur(track.duration || 0);
    a.load();
    if (keepPlaying.current) a.play().catch(() => {});
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    const a = audioRef.current;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };
  const skip = (d) => {
    const a = audioRef.current;
    if (d < 0 && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    keepPlaying.current = !a.paused;
    setI((i + d + tracks.length) % tracks.length);
  };
  const seek = (e) => {
    const a = audioRef.current;
    const d = Number.isFinite(a.duration) ? a.duration : dur;
    if (!d) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = Math.min(d, Math.max(0, ((e.clientX - r.left) / r.width) * d));
  };
  const onKey = (e) => {
    const a = audioRef.current;
    if (e.key === "ArrowRight") a.currentTime = Math.min(a.currentTime + 5, a.duration || dur);
    if (e.key === "ArrowLeft") a.currentTime = Math.max(a.currentTime - 5, 0);
  };
  const p = dur ? Math.min(1, t / dur) : 0;
  const side = "flex h-9 w-8 shrink-0 items-center justify-center rounded-full text-white/65 transition-colors hover:text-[var(--sm-gold-light)]";

  return (
    <div
      data-testid="track-player"
      className={`flex w-full items-center gap-3 rounded-2xl border border-[var(--sm-gold)]/25 bg-black/45 p-2.5 pr-2 text-left ${className}`}
    >
      <img src={cover} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span data-testid="track-title" className="font-display block truncate text-[1.02rem] leading-tight text-white">
            {track.title}
          </span>
          <span className="font-body shrink-0 text-[0.62rem] tabular-nums text-white/40">
            {i + 1} / {tracks.length}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div
            role="slider"
            aria-label={`Seek in ${track.title}`}
            aria-valuemin={0}
            aria-valuemax={Math.round(dur)}
            aria-valuenow={Math.round(t)}
            tabIndex={0}
            onClick={seek}
            onKeyDown={onKey}
            className="relative h-4 flex-1 cursor-pointer"
          >
            <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/15" />
            <div className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[var(--sm-gold)]" style={{ width: `${(p * 100).toFixed(2)}%` }} />
          </div>
          <span className="font-body shrink-0 text-[0.62rem] tabular-nums text-white/40">{clock(playing || t ? t : dur)}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center">
        <button type="button" onClick={() => skip(-1)} aria-label="Previous song" className={side}>
          <SkipBack size={15} fill="currentColor" />
        </button>
        <button
          type="button"
          onClick={toggle}
          data-testid="track-play"
          aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--sm-gold)] text-black shadow-[0_0_18px_rgba(214,179,101,0.35)] transition-colors hover:bg-[var(--sm-gold-light)]"
        >
          {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
        </button>
        <button type="button" onClick={() => skip(1)} aria-label="Next song" className={side}>
          <SkipForward size={15} fill="currentColor" />
        </button>
      </div>
      <audio ref={audioRef} src={track.src} preload="metadata" />
    </div>
  );
};

export default TrackPlayer;
