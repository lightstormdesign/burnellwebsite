// Fan text-list sign-up from /connect, passed on to ENTREE's backend, which
// keeps the list (and each fan's consent record) for LightStorm's admin.
// Going through this site's own server means no cross-site setup on the
// backend, and the fan's real address reaches it as X-Forwarded-For. Needs
// ENTREE_API_URL set in Vercel (the backend's base URL, no trailing /api).
const ARTIST = "burnell";

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "POST only" }));
    return;
  }
  const base = (process.env.ENTREE_API_URL || "").replace(/\/+$/, "");
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
      res.end(JSON.stringify({ ok: true }));
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
