import { createContext, useContext, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ImagePlus, Loader2, Music2, Plus, Trash2, X } from "lucide-react";

// Plain, phone-first form controls for the site editor. Every control is
// full width, text is 16px (so iPhones don't zoom in), and lists are simple
// rows with an "Add" button.

// Uploads are held until Publish; this lets fields hand a new file to the
// editor and show its preview before it's on the site.
export const UploadContext = createContext({ upload: async () => "", previewOf: (p) => p });

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-body text-base text-[var(--sm-text)] placeholder-white/25 outline-none transition focus:border-[var(--sm-gold)]/70 focus:bg-white/[0.06]";

const iconBtn =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-25";

function Label({ field, htmlFor }) {
  if (!field.label) return null;
  return (
    <div className="mb-2">
      <label htmlFor={htmlFor} className="block font-body text-sm font-medium text-white/85">
        {field.label}
      </label>
      {field.hint && <p className="mt-0.5 font-body text-[0.8rem] leading-snug text-white/40">{field.hint}</p>}
    </div>
  );
}

function AutoTextarea({ value, onChange, placeholder, id, rows = 3 }) {
  return (
    <textarea
      id={id}
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={Math.max(rows, Math.min(14, Math.ceil(String(value || "").length / 42) + 1))}
      className={`${inputClass} resize-none leading-relaxed`}
    />
  );
}

let uid = 0;
const useId = () => useRef(`f${++uid}`).current;

export function Fields({ fields, value, onChange }) {
  const v = value || {};
  return (
    <div className="space-y-7">
      {fields
        .filter((f) => !f.showIf || f.showIf(v))
        .map((f, i) => (
          <Field key={`${f.key}-${i}`} field={f} value={v[f.key]} onChange={(x) => onChange({ ...v, [f.key]: x })} />
        ))}
    </div>
  );
}

function Field({ field, value, onChange }) {
  const id = useId();
  switch (field.type) {
    case "note":
      return <p className="rounded-xl bg-white/[0.04] px-4 py-3 font-body text-sm text-white/55">{field.text}</p>;
    case "textarea":
      return (
        <div>
          <Label field={field} htmlFor={id} />
          <AutoTextarea id={id} value={value} onChange={onChange} placeholder={field.placeholder} />
        </div>
      );
    case "select":
      return (
        <div>
          <Label field={field} htmlFor={id} />
          <div className="relative">
            <select id={id} value={value || ""} onChange={(e) => onChange(e.target.value)} className={`${inputClass} appearance-none pr-10`}>
              {field.options.map((o) => (
                <option key={o.value} value={o.value} className="bg-[#111]">
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40" />
          </div>
        </div>
      );
    case "list":
      return <ListField field={field} value={Array.isArray(value) ? value : []} onChange={onChange} />;
    case "items":
      return <ItemsField field={field} value={Array.isArray(value) ? value : []} onChange={onChange} />;
    case "group":
      return (
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <h3 className="font-display text-lg text-[var(--sm-text)]">{field.label}</h3>
          {field.hint && <p className="mt-0.5 font-body text-[0.8rem] text-white/40">{field.hint}</p>}
          <div className="mt-5">
            <Fields fields={field.fields} value={value} onChange={onChange} />
          </div>
        </section>
      );
    case "image":
      return <MediaField field={field} value={value || ""} onChange={onChange} kind="image" />;
    case "audio":
      return <MediaField field={field} value={value || ""} onChange={onChange} kind="audio" />;
    case "youtube":
      return <YouTubeField field={field} value={value || ""} onChange={onChange} id={id} />;
    default:
      return (
        <div>
          <Label field={field} htmlFor={id} />
          <input
            id={id}
            type={field.type === "url" ? "url" : field.type === "email" ? "email" : "text"}
            inputMode={field.type === "url" ? "url" : field.type === "email" ? "email" : undefined}
            autoCapitalize={field.type === "url" || field.type === "email" ? "none" : undefined}
            value={value ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        </div>
      );
  }
}

// A list of plain values: genre words, festival names, paragraphs.
function ListField({ field, value, onChange }) {
  const set = (i, x) => onChange(value.map((y, j) => (j === i ? x : y)));
  const remove = (i) => onChange(value.filter((_, j) => j !== i));
  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  const full = field.max && value.length >= field.max;
  return (
    <div>
      <Label field={field} />
      <div className="space-y-2.5">
        {value.map((item, i) =>
          field.multiline ? (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02]">
              <textarea
                value={item || ""}
                onChange={(e) => set(i, e.target.value)}
                rows={Math.max(3, Math.min(14, Math.ceil(String(item || "").length / 42) + 1))}
                className="w-full resize-none rounded-t-xl bg-transparent px-4 py-3 font-body text-base leading-relaxed text-[var(--sm-text)] outline-none"
              />
              <div className="flex items-center justify-end gap-1 border-t border-white/5 px-2 py-1">
                <button type="button" className={iconBtn} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                  <ArrowUp size={16} />
                </button>
                <button type="button" className={iconBtn} disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                  <ArrowDown size={16} />
                </button>
                <button type="button" className={`${iconBtn} hover:text-red-300`} onClick={() => remove(i)} aria-label="Remove">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-center gap-1.5">
              <input value={item || ""} onChange={(e) => set(i, e.target.value)} className={inputClass} />
              <button type="button" className={`${iconBtn} hover:text-red-300`} onClick={() => remove(i)} aria-label="Remove">
                <X size={18} />
              </button>
            </div>
          )
        )}
      </div>
      {!full && <AddButton label={field.addLabel || "Add"} onClick={() => onChange([...value, ""])} />}
    </div>
  );
}

function AddButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--sm-gold)]/35 px-4 py-2 font-body text-sm text-[var(--sm-gold-light)] transition hover:border-[var(--sm-gold)] hover:bg-[var(--sm-gold)]/10"
    >
      <Plus size={16} /> {label}
    </button>
  );
}

const blankItem = (fields) => Object.fromEntries(fields.filter((f) => f.type !== "note").map((f) => [f.key, f.type === "list" || f.type === "items" ? [] : f.type === "select" ? f.options[0].value : ""]));

// A list of small cards (shows, links, chapters). Tap a card to edit it.
function ItemsField({ field, value, onChange }) {
  const [open, setOpen] = useState(null);
  const set = (i, x) => onChange(value.map((y, j) => (j === i ? x : y)));
  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
    setOpen(i + d);
  };
  const remove = (i) => {
    if (!window.confirm("Remove this?")) return;
    onChange(value.filter((_, j) => j !== i));
    setOpen(null);
  };
  const add = () => {
    onChange([...value, field.newItem ? field.newItem() : blankItem(field.fields)]);
    setOpen(value.length);
  };
  return (
    <div>
      <Label field={field} />
      <div className="space-y-2.5">
        {value.map((item, i) => {
          const isOpen = open === i;
          const badge = field.badge && field.badge(item);
          return (
            <div key={i} className={`rounded-2xl border transition ${isOpen ? "border-[var(--sm-gold)]/40 bg-white/[0.03]" : "border-white/10 bg-white/[0.02]"}`}>
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                <span className="min-w-0 flex-1 truncate font-body text-[0.95rem] text-[var(--sm-text)]">{field.summary(item)}</span>
                {badge && (
                  <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-0.5 font-body text-[0.7rem] uppercase tracking-wider text-white/45">{badge}</span>
                )}
                <ChevronDown size={18} className={`shrink-0 text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="border-t border-white/5 px-4 pb-4 pt-5">
                  <Fields fields={field.fields} value={item} onChange={(x) => set(i, x)} />
                  <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="flex gap-1">
                      <button type="button" className={iconBtn} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                        <ArrowUp size={17} />
                      </button>
                      <button type="button" className={iconBtn} disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                        <ArrowDown size={17} />
                      </button>
                    </div>
                    <button type="button" onClick={() => remove(i)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-sm text-red-300/80 transition hover:bg-red-400/10 hover:text-red-300">
                      <Trash2 size={15} /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <AddButton label={field.addLabel || "Add"} onClick={add} />
    </div>
  );
}

function MediaField({ field, value, onChange, kind }) {
  const { upload, previewOf } = useContext(UploadContext);
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const src = value ? previewOf(value) : "";

  const pick = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await upload(file, kind));
    } catch (err) {
      setError(err.message || "Couldn't use that file.");
    }
    setBusy(false);
  };

  return (
    <div>
      <Label field={field} />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {kind === "image" ? (
          <button type="button" onClick={() => input.current.click()} className="relative block w-full bg-black/30" style={{ aspectRatio: "16 / 10" }}>
            {src ? (
              <img src={src} alt="" className="absolute inset-0 h-full w-full object-contain" />
            ) : (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 font-body text-sm text-white/40">
                <ImagePlus size={26} /> Tap to add a photo
              </span>
            )}
            {busy && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 size={24} className="animate-spin text-white" />
              </span>
            )}
          </button>
        ) : value ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <Music2 size={18} className="shrink-0 text-[var(--sm-gold)]" />
            <audio src={src} controls className="h-9 min-w-0 flex-1" />
          </div>
        ) : (
          <button type="button" onClick={() => input.current.click()} className="flex w-full items-center justify-center gap-2 px-4 py-6 font-body text-sm text-white/40">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Music2 size={18} />} Tap to add audio
          </button>
        )}
        {value && (
          <div className="flex items-center justify-between gap-2 border-t border-white/5 px-2 py-1.5">
            <button type="button" onClick={() => input.current.click()} className="rounded-full px-3 py-1.5 font-body text-sm text-[var(--sm-gold-light)] hover:bg-white/5">
              {kind === "image" ? "Replace photo" : "Replace audio"}
            </button>
            <button type="button" onClick={() => onChange("")} className="rounded-full px-3 py-1.5 font-body text-sm text-white/45 hover:bg-white/5 hover:text-red-300">
              Remove
            </button>
          </div>
        )}
      </div>
      <input ref={input} type="file" accept={kind === "image" ? "image/*" : "audio/*"} onChange={pick} className="hidden" />
      {error && <p className="mt-2 font-body text-sm text-red-300">{error}</p>}
    </div>
  );
}

// Takes a full YouTube link (or just the ID) and keeps only the video ID.
const youtubeId = (s) => {
  const t = String(s || "").trim();
  const m = t.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : t;
};

function YouTubeField({ field, value, onChange, id }) {
  const valid = /^[A-Za-z0-9_-]{11}$/.test(value);
  return (
    <div>
      <Label field={{ ...field, hint: field.hint || "Paste the YouTube link." }} htmlFor={id} />
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(youtubeId(e.target.value))}
        placeholder="https://youtube.com/watch?v=…"
        autoCapitalize="none"
        inputMode="url"
        className={inputClass}
      />
      {valid && (
        <img src={`https://i.ytimg.com/vi/${value}/mqdefault.jpg`} alt="" className="mt-3 w-full max-w-xs rounded-xl border border-white/10" />
      )}
    </div>
  );
}
