// GitHub sign-in for the content editor, step 2 of 2: GitHub sends the
// popup back here with a one-time code. Trade it for an access token and
// hand the token to the editor window that opened the popup (only to this
// site's own origin), the way Decap CMS expects.
module.exports = async (req, res) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const origin = `${proto}://${host}`;
  const url = new URL(req.url, origin);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = (req.headers.cookie || "").match(/(?:^|;\s*)cms_oauth_state=([a-f0-9]+)/)?.[1];

  const reply = (status, content) => {
    const message = `authorization:github:${status}:${JSON.stringify(content)}`;
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Set-Cookie", "cms_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
    res.end(`<!doctype html><html><body><script>
(function () {
  var origin = ${JSON.stringify(origin)};
  function receive(e) {
    if (e.origin !== origin) return;
    window.opener.postMessage(${JSON.stringify(message)}, origin);
    window.removeEventListener("message", receive);
  }
  window.addEventListener("message", receive);
  window.opener.postMessage("authorizing:github", origin);
})();
</script></body></html>`);
  };

  if (!code || !state || state !== cookieState) return reply("error", { message: "Sign-in expired or was tampered with. Please try again." });

  try {
    const r = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${origin}/api/callback`,
      }),
    });
    const data = await r.json();
    if (!data.access_token) return reply("error", { message: data.error_description || "GitHub didn't return a token." });
    return reply("success", { token: data.access_token, provider: "github" });
  } catch (e) {
    return reply("error", { message: "Couldn't reach GitHub. Please try again." });
  }
};
