import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Search, Trash2 } from "lucide-react";
import { SITE } from "./schema";
import { getToken } from "./github";

// /admin/signups: everyone who joined the text list from any form on the
// site, newest first, with a CSV download (opens in Excel, Google Sheets,
// or imports into a texting service). Comes from /api/fans, which checks
// the same GitHub sign-in as the rest of the editor.
const FORM_NAMES = { story: "End of story", community: "Community", connect: "Unreleased song" };

const fmtPhone = (p) => {
  const m = /^1(\d{3})(\d{3})(\d{4})$/.exec(p || "");
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : `+${p}`;
};
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "");

const COLUMNS = [
  ["Phone", (f) => `+${f.phone}`],
  ["Name", (f) => f.name],
  ["Email", (f) => f.email],
  ["City", (f) => f.city],
  ["Signed up from", (f) => (f.forms || []).map((k) => FORM_NAMES[k] || k).join("; ")],
  ["First signed up", (f) => f.created_at],
  ["Last consent", (f) => f.consent_at],
  ["Consent text", (f) => f.consent_text],
  ["Page", (f) => f.page],
  ["IP", (f) => f.ip],
];
const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

async function api(method, query = "") {
  const r = await fetch(`/api/fans${query}`, { method, headers: { Authorization: `Bearer ${getToken()}` }, cache: "no-store" });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Error ${r.status}`);
  return d;
}

export default function Signups() {
  const [fans, setFans] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(() => {
    setError("");
    api("GET").then((d) => setFans(d.fans), (e) => setError(e.message));
  }, []);
  useEffect(() => {
    document.title = `Sign-ups · ${SITE.name}`;
    load();
  }, [load]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!fans || !t) return fans || [];
    return fans.filter((f) => [f.phone, fmtPhone(f.phone), f.name, f.email, f.city].some((v) => String(v || "").toLowerCase().includes(t)));
  }, [fans, q]);

  const weekAgo = Date.now() - 7 * 864e5;
  const thisWeek = (fans || []).filter((f) => Date.parse(f.created_at) > weekAgo).length;

  const exportCsv = () => {
    const lines = [COLUMNS.map(([h]) => cell(h)).join(","), ...fans.map((f) => COLUMNS.map(([, get]) => cell(get(f))).join(","))];
    const blob = new Blob([`﻿${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${SITE.name.toLowerCase().replace(/\s+/g, "-")}-signups-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const remove = async (f) => {
    if (!window.confirm(`Remove ${f.name || fmtPhone(f.phone)} from the list? This can't be undone.`)) return;
    try {
      await api("DELETE", `?phone=${encodeURIComponent(f.phone)}`);
      setFans((all) => all.filter((x) => x.phone !== f.phone));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <Link to="/admin" className="mt-6 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white">
        <ArrowLeft size={16} /> All pages
      </Link>
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Sign-ups</h1>
          <p className="mt-1 text-[0.95rem] text-white/50">Everyone who joined the text list, from every form on the site.</p>
        </div>
        {fans?.length > 0 && (
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--sm-gold)] px-5 py-2.5 text-sm font-medium text-black hover:bg-[var(--sm-gold-light)]"
          >
            <Download size={15} /> Export CSV
          </button>
        )}
      </div>

      {error && <p className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

      {!fans && !error && (
        <div className="mt-16 flex justify-center">
          <Loader2 className="animate-spin text-white/40" />
        </div>
      )}

      {fans && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
              <p className="font-display text-3xl">{fans.length}</p>
              <p className="text-sm text-white/45">on the list</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
              <p className="font-display text-3xl">{thisWeek}</p>
              <p className="text-sm text-white/45">new this week</p>
            </div>
          </div>

          {fans.length > 0 && (
            <label className="mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5">
              <Search size={16} className="text-white/40" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email, city" className="w-full bg-transparent text-base outline-none placeholder:text-white/30 sm:text-sm" />
            </label>
          )}

          <ul className="mt-4 space-y-2">
            {shown.map((f) => (
              <li key={f.phone} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.95rem]">
                    <a href={`tel:+${f.phone}`} className="hover:text-[var(--sm-gold-light)]">{fmtPhone(f.phone)}</a>
                    {f.name && <span className="text-white/60"> · {f.name}</span>}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-white/45">
                    {[f.email, f.city, (f.forms || []).map((k) => FORM_NAMES[k] || k).join(", "), fmtDate(f.created_at)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button type="button" onClick={() => remove(f)} title="Remove from the list" className="rounded-full p-2 text-white/30 hover:bg-white/5 hover:text-red-300">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
          {fans.length === 0 && <p className="mt-10 text-center text-white/45">No sign-ups yet. They'll show up here as fans join.</p>}
        </>
      )}
    </div>
  );
}
