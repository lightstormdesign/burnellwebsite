// GitHub sign-in for the site editor, step 2 of 2: GitHub sends the browser
// back here with a one-time code. Trade it for an access token, keep it in
// this site's own browser storage (where /admin reads it), and go to
// /admin. A plain redirect, no popup, so it works the same in every
// browser, on phones too.
const TOKEN_KEY = "bw-editor-token";

module.exports = async (req, res) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const origin = `${proto}://${host}`;
  const url = new URL(req.url, origin);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = (req.headers.cookie || "").match(/(?:^|;\s*)cms_oauth_state=([a-f0-9]+)/)?.[1];

  const page = (script) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Set-Cookie", "cms_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
    res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#08090a;color:#f6f2ea;font:16px -apple-system,sans-serif"><script>${script}</script></body></html>`);
  };
  const fail = (message) =>
    page(`var p = document.createElement("p");
p.style.cssText = "padding:32px 24px;line-height:1.5";
p.textContent = ${JSON.stringify(message + " ")};
var a = document.createElement("a");
a.href = "/admin";
a.textContent = "Try again";
a.style.color = "#d4b06a";
p.appendChild(a);
document.body.appendChild(p);`);

  if (!code || !state || state !== cookieState) return fail("Sign-in expired or was interrupted.");

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
    if (!data.access_token) return fail(data.error_description || "GitHub didn't sign you in.");
    return page(`try { localStorage.setItem(${JSON.stringify(TOKEN_KEY)}, ${JSON.stringify(data.access_token)}); } catch (e) {}
location.replace("/admin");`);
  } catch (e) {
    return fail("Couldn't reach GitHub.");
  }
};
