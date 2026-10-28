// Fan text-list sign-ups from every form on the site (the end of the story,
// Community and /connect). Saved in this site's own storage (see _fans.js)
// and listed in /admin → Sign-ups. Signing up again updates the same fan
// (newest consent wins) and adds the new form to where they signed up.
const { ready, getFan, saveFan } = require("./_fans");

const FORMS = ["story", "community", "connect"];

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  if (!ready()) return send(res, 503, { error: "Sign-ups aren't switched on yet. Please try again soon." });
  const b = req.body && typeof req.body === "object" ? req.body : {};
  // a field people never see: only bots fill it in, and they get a quiet "ok"
  if (b.website) return send(res, 200, { ok: true });
  const str = (v, max) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

  let phone = String(b.phone || "").replace(/\D/g, "");
  if (phone.length === 10) phone = `1${phone}`; // a US number without the country code
  if (phone.length < 11 || phone.length > 15) return send(res, 400, { error: "Enter your phone number with area code." });
  if (b.sms !== true) return send(res, 400, { error: "Tick the box to join the text list." });
  const email = str(b.email, 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: "Check your email address, or leave it empty." });
  const form = FORMS.includes(b.form) ? b.form : "connect";

  try {
    const prev = (await getFan(phone)) || {};
    const now = new Date().toISOString();
    await saveFan({
      phone,
      name: str(b.name, 100) || prev.name || null,
      email: email || prev.email || null,
      city: str(b.city, 100) || prev.city || null,
      forms: [...new Set([...(prev.forms || []), form])],
      // their consent record: the exact words they agreed to, when and where
      consent_text: str(b.consent_text, 1000),
      consent_at: now,
      page: str(b.page, 300),
      ip: String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || null,
      user_agent: String(req.headers["user-agent"] || "").slice(0, 300) || null,
      created_at: prev.created_at || now,
      updated_at: now,
    });
    send(res, 200, { ok: true });
  } catch (e) {
    console.error("sign-up failed", e);
    send(res, 502, { error: "Something went wrong. Please try again." });
  }
};
