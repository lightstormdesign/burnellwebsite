// Fan text-list sign-up from /connect, passed on to ENTREE's backend, which
// keeps the list (and each fan's consent record) for LightStorm's admin.
// GET returns the page's current offer (headline, button…), which is
// edited in that admin; POST signs the fan up and returns what they get.
// Going through this site's own server means no cross-site setup on the
// backend, and the fan's real address reaches it as X-Forwarded-For. Needs
// ENTREE_API_URL set in Vercel (the backend's base URL, no trailing /api).
const ARTIST = "burnell";

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST" && req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "GET or POST only" }));
    return;
  }
  const base = (process.env.ENTREE_API_URL || "").replace(/\/+$/, "");
  if (req.method === "GET") {
    // No backend (or it's down): the page falls back to its own copy.
    try {
      const r = base ? await fetch(`${base}/api/fan-offer/${ARTIST}`) : null;
      if (!r || !r.ok) throw new Error();
      // Short shared cache: edits show up within a minute.
      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      res.end(JSON.stringify(await r.json()));
    } catch {
      res.statusCode = 503;
      res.end(JSON.stringify({ error: "unavailable" }));
    }
    return;
  }
  if (!base) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: "Sign-ups aren't switched on yet. Please try again soon." }));
    return;
  }
  const b = req.body && typeof req.body === "object" ? req.body : {};
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
        "X-Forwarded-For": String(req.headers["x-forwarded-for"] || "").split(",")[0].trim(),
        "User-Agent": String(req.headers["user-agent"] || "").slice(0, 300),
      },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      const d = await r.json().catch(() => ({}));
      const pick = (k) => (typeof d[k] === "string" ? d[k] : null);
      res.end(
        JSON.stringify({
          ok: true,
          thanks_headline: pick("thanks_headline"),
          thanks_text: pick("thanks_text"),
          reward_label: pick("reward_label"),
          reward_url: pick("reward_url"),
        })
      );
      return;
    }
    const data = await r.json().catch(() => ({}));
    const detail = typeof data.detail === "string" ? data.detail : "";
    res.statusCode = r.status === 400 || r.status === 422 ? 400 : 502;
    res.end(JSON.stringify({ error: detail || (res.statusCode === 400 ? "Check your number and email, then try again." : "Something went wrong. Please try again.") }));
  } catch {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "Something went wrong. Please try again." }));
  }
};
