// GitHub sign-in for the content editor (/admin, Decap CMS), step 1 of 2:
// send the editor's popup to GitHub to approve access. Needs a GitHub OAuth
// App whose callback URL is https://<this site>/api/callback, with its
// client ID and secret set in Vercel as GITHUB_CLIENT_ID and
// GITHUB_CLIENT_SECRET.
const crypto = require("crypto");

module.exports = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("The content editor isn't connected yet: GITHUB_CLIENT_ID is not set in Vercel.");
    return;
  }
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${proto}://${host}/api/callback`,
    scope: "repo,user",
    state,
  });
  res.statusCode = 302;
  // the state comes back on the callback; checking it there stops anyone
  // else's sign-in from being slipped into this one
  res.setHeader("Set-Cookie", `cms_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  res.setHeader("Location", `https://github.com/login/oauth/authorize?${params}`);
  res.end();
};
