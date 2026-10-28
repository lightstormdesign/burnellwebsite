// The sign-up list for /admin → Sign-ups. Only someone signed in to the
// editor who can change this site's repo on GitHub gets it (the same check
// the editor itself makes). GET lists every fan; DELETE ?phone= removes one
// (when a fan asks for their details to be deleted).
const { ready, allFans, removeFan } = require("./_fans");

const REPO = process.env.SITE_REPO || "lightstormdesign/burnellwebsite";

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

async function canEdit(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const r = await fetch(`https://api.github.com/repos/${REPO}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "site-editor" },
  });
  if (!r.ok) return false;
  const repo = await r.json().catch(() => ({}));
  return !!repo.permissions?.push;
}

module.exports = async (req, res) => {
  if (req.method !== "GET" && req.method !== "DELETE") return send(res, 405, { error: "GET or DELETE only" });
  if (!(await canEdit(req).catch(() => false))) return send(res, 401, { error: "Sign in to the editor again to see sign-ups." });
  if (!ready()) return send(res, 503, { error: "Sign-up storage isn't connected yet: add an Upstash Redis database to this project in Vercel (Storage)." });
  try {
    if (req.method === "DELETE") {
      const phone = new URL(req.url, "http://x").searchParams.get("phone");
      if (!phone) return send(res, 400, { error: "Which fan?" });
      await removeFan(phone);
      return send(res, 200, { ok: true });
    }
    send(res, 200, { fans: await allFans() });
  } catch (e) {
    console.error("fans failed", e);
    send(res, 502, { error: "Couldn't reach the sign-up storage. Try again in a moment." });
  }
};
