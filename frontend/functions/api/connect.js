// Cloudflare Pages version of /api/connect.js: the /connect page's offer
// (GET) and fan sign-ups (POST), passed on to ENTREE's backend. Needs
// ENTREE_API_URL in the Pages project's settings (the backend's base URL,
// no trailing /api).
const ARTIST = "burnell";

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

const backend = (env) => (env.ENTREE_API_URL || "").replace(/\/+$/, "");

export async function onRequestGet({ env }) {
  // No backend (or it's down): the page falls back to its own copy.
  try {
    const base = backend(env);
    const r = base ? await fetch(`${base}/api/fan-offer/${ARTIST}`) : null;
    if (!r || !r.ok) throw new Error();
    // Short shared cache: edits show up within a minute.
    return json(await r.json(), 200, { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}

export async function onRequestPost({ request, env }) {
  const base = backend(env);
  if (!base) return json({ error: "Sign-ups aren't switched on yet. Please try again soon." }, 503);
  const b = await request.json().catch(() => ({}));
  const str = (v, max) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const body = {
    artist: ARTIST,
    phone: str(b.phone, 30) || "",
    name: str(b.name, 100),
    email: str(b.email, 254),
    city: str(b.city, 100),
    sms: b.sms === true,
    consent_text: str(b.consent_text, 1000),
    page: str(b.page, 300),
  };
  try {
    const r = await fetch(`${base}/api/fan-connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Cloudflare's own record of the fan's address
        "X-Forwarded-For": request.headers.get("CF-Connecting-IP") || "",
        "User-Agent": (request.headers.get("User-Agent") || "").slice(0, 300),
      },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      const d = await r.json().catch(() => ({}));
      const pick = (k) => (typeof d[k] === "string" ? d[k] : null);
      return json({
        ok: true,
        thanks_headline: pick("thanks_headline"),
        thanks_text: pick("thanks_text"),
        reward_label: pick("reward_label"),
        reward_url: pick("reward_url"),
      });
    }
    const data = await r.json().catch(() => ({}));
    const detail = typeof data.detail === "string" ? data.detail : "";
    const status = r.status === 400 || r.status === 422 ? 400 : 502;
    return json({ error: detail || (status === 400 ? "Check your number and email, then try again." : "Something went wrong. Please try again.") }, status);
  } catch {
    return json({ error: "Something went wrong. Please try again." }, 502);
  }
}
