import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronRight, ExternalLink, Github, Loader2, LogOut } from "lucide-react";
import { PAGES, SITE } from "./schema";
import { Fields, UploadContext } from "./Fields";
import { UPLOADS_PUBLIC, clearToken, getToken, prepareFile, prepareImage, publishPage, readPage, whoAmI } from "./github";

// The site editor at /admin: sign in with GitHub, pick a page, change it
// in a plain form, Publish. Each publish is one commit to the site's repo;
// Vercel puts it live about a minute later.
export default function AdminApp() {
  const [me, setMe] = useState(undefined); // undefined = checking, null = signed out
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `Site Editor · ${SITE.name}`;
    if (!getToken()) return setMe(null);
    whoAmI().then(setMe, (e) => {
      if (e.status === 401) clearToken();
      else setError("Couldn't reach GitHub. Check your connection and reload.");
      setMe(null);
    });
  }, []);

  const signOut = () => {
    clearToken();
    setMe(null);
  };

  return (
    <div className="min-h-screen bg-[#08090a] font-body text-[var(--sm-text)]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {me === undefined ? (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="animate-spin text-white/40" />
        </div>
      ) : !me ? (
        <SignIn error={error} />
      ) : !me.canEdit ? (
        <Shell me={me} onSignOut={signOut}>
          <p className="mt-10 text-center text-white/60">
            You're signed in as <b>{me.login}</b>, but this GitHub account doesn't have access to edit this site.
          </p>
        </Shell>
      ) : (
        <Routes>
          <Route index element={<Dashboard me={me} onSignOut={signOut} />} />
          <Route path=":file" element={<Editor me={me} onSignOut={signOut} />} />
        </Routes>
      )}
    </div>
  );
}

function SignIn({ error }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <img src={SITE.logo} alt={SITE.name} className="w-64 max-w-full" />
      <p className="mt-6 font-display text-sm uppercase tracking-[0.35em] text-white/50">Site Editor</p>
      <a
        href="/api/auth"
        className="mt-10 inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-[0.95rem] font-medium text-black transition hover:bg-[var(--sm-gold-light)]"
      >
        <Github size={19} /> Sign in with GitHub
      </a>
      {error && <p className="mt-6 max-w-xs text-sm text-red-300">{error}</p>}
      <a href="/" className="mt-10 text-sm text-white/35 hover:text-white/70">
        Back to the website
      </a>
    </div>
  );
}

function Shell({ me, onSignOut, children }) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#08090a]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link to="/admin" className="min-w-0 flex-1">
            <img src={SITE.logo} alt={SITE.name} className="h-7 w-auto" />
          </Link>
          <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-white/60 hover:bg-white/5 hover:text-white">
            View site <ExternalLink size={14} />
          </a>
          <button type="button" onClick={onSignOut} title={`Signed in as ${me.login}. Sign out`} className="rounded-full p-0.5 ring-1 ring-white/10 hover:ring-white/40">
            {me.avatar ? <img src={me.avatar} alt="" className="h-8 w-8 rounded-full" /> : <LogOut size={18} className="m-1.5" />}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-32">{children}</main>
    </>
  );
}

function Dashboard({ me, onSignOut }) {
  return (
    <Shell me={me} onSignOut={onSignOut}>
      <h1 className="mt-8 font-display text-3xl">Edit your website</h1>
      <p className="mt-2 text-[0.95rem] text-white/50">Pick a page, make your changes, then tap Publish. It's live about a minute later.</p>
      <div className="mt-8 space-y-2.5">
        {PAGES.map((p) => (
          <Link
            key={p.file}
            to={`/admin/${p.file}`}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 transition hover:border-[var(--sm-gold)]/40 hover:bg-white/[0.04]"
          >
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg">{p.title}</p>
              <p className="mt-0.5 truncate text-sm text-white/45">{p.blurb}</p>
            </div>
            <ChevronRight size={20} className="shrink-0 text-[var(--sm-gold)]" />
          </Link>
        ))}
      </div>
      <button type="button" onClick={onSignOut} className="mt-10 inline-flex items-center gap-2 text-sm text-white/35 hover:text-white/70">
        <LogOut size={15} /> Sign out ({me.login})
      </button>
    </Shell>
  );
}

function Editor({ me, onSignOut }) {
  const { file } = useParams();
  const navigate = useNavigate();
  const page = PAGES.find((p) => p.file === file);
  const [doc, setDoc] = useState(null); // { data, sha } as last loaded/published
  const [draft, setDraft] = useState(null);
  const [uploads, setUploads] = useState([]); // [{ name, bytes, url, path }]
  const [status, setStatus] = useState("idle"); // idle | publishing | published
  const [error, setError] = useState("");
  const previews = useRef({});

  const load = useCallback(() => {
    if (!page) return;
    setDoc(null);
    setError("");
    readPage(page.file).then(
      (d) => {
        setDoc(d);
        setDraft(d.data);
      },
      (e) => setError(e.message)
    );
  }, [page]);
  useEffect(load, [load]);

  const dirty = useMemo(() => !!doc && (uploads.length > 0 || JSON.stringify(doc.data) !== JSON.stringify(draft)), [doc, draft, uploads]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const upload = useCallback(async (f, kind) => {
    if (f.size > 40 * 1024 * 1024) throw new Error("That file is too big (over 40 MB).");
    const prepared = kind === "image" ? await prepareImage(f) : prepareFile(f);
    const bytes = new Uint8Array(await prepared.blob.arrayBuffer());
    if (bytes.length > 25 * 1024 * 1024) throw new Error("That file is too big even after shrinking it (over 25 MB).");
    const path = `${UPLOADS_PUBLIC}/${prepared.name}`;
    const url = URL.createObjectURL(prepared.blob);
    previews.current[path] = url;
    setUploads((u) => [...u, { name: prepared.name, bytes, path }]);
    return path;
  }, []);
  const uploadCtx = useMemo(() => ({ upload, previewOf: (p) => previews.current[p] || p }), [upload]);

  const publish = async () => {
    setStatus("publishing");
    setError("");
    try {
      // Only send uploads the page still uses (a photo replaced twice
      // shouldn't leave the first one behind).
      const json = JSON.stringify(draft);
      const used = uploads.filter((u) => json.includes(JSON.stringify(u.path)));
      const sha = await publishPage(page.file, draft, doc.sha, used, `Site editor: update ${page.title} (${me.login})`);
      setDoc({ data: draft, sha });
      setUploads([]);
      setStatus("published");
    } catch (e) {
      setError(e.message);
      setStatus("idle");
    }
  };

  const discard = () => {
    if (!window.confirm("Throw away your changes on this page?")) return;
    setDraft(doc.data);
    setUploads([]);
  };

  const back = (e) => {
    if (dirty && !window.confirm("You have unpublished changes. Leave without publishing?")) {
      e.preventDefault();
      return;
    }
    navigate("/admin");
  };

  if (!page) {
    return (
      <Shell me={me} onSignOut={onSignOut}>
        <p className="mt-10 text-white/60">That page doesn't exist.</p>
      </Shell>
    );
  }

  return (
    <Shell me={me} onSignOut={onSignOut}>
      <div className="mt-6 flex items-center gap-2">
        <button type="button" onClick={back} className="-ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm text-white/55 hover:text-white">
          <ArrowLeft size={17} /> All pages
        </button>
      </div>
      <h1 className="mt-3 font-display text-3xl">{page.title}</h1>
      <p className="mt-1 text-sm text-white/45">{page.blurb}</p>

      {error && (
        <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}{" "}
          {!doc && (
            <button type="button" onClick={load} className="underline">
              Try again
            </button>
          )}
        </div>
      )}

      <div className="mt-8">
        {!draft ? (
          !error && <Loader2 className="mx-auto mt-10 animate-spin text-white/40" />
        ) : (
          <UploadContext.Provider value={uploadCtx}>
            <Fields fields={page.fields} value={draft} onChange={(d) => (setDraft(d), setStatus("idle"))} />
          </UploadContext.Provider>
        )}
      </div>

      {/* The publish bar: always reachable at the bottom of the screen. */}
      {draft && (dirty || status !== "idle") && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0d0e0f]/95 backdrop-blur-md" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
            {status === "published" && !dirty ? (
              <p className="flex flex-1 items-center gap-2 text-sm text-emerald-300">
                <Check size={17} /> Published. Live on the site in about a minute.
              </p>
            ) : (
              <>
                <p className="min-w-0 flex-1 text-sm text-white/55">Unpublished changes</p>
                <button type="button" onClick={discard} disabled={status === "publishing"} className="rounded-full px-4 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white">
                  Discard
                </button>
                <button
                  type="button"
                  onClick={publish}
                  disabled={status === "publishing"}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--sm-gold)] px-6 py-2.5 text-sm font-medium text-black transition hover:bg-[var(--sm-gold-light)] disabled:opacity-60"
                >
                  {status === "publishing" && <Loader2 size={15} className="animate-spin" />}
                  Publish
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}
