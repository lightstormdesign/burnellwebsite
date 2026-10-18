// Cloudflare Pages version of /api/callback.js: GitHub sends the browser
// back here with a one-time code. Trade it for an access token, keep it in
// this site's browser storage (where /admin reads it), and go to /admin.
const TOKEN_KEY = "bw-editor-token";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)cms_oauth_state=([a-f0-9]+)/)?.[1];

  const page = (script) =>
    new Response(
      `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#08090a;color:#f6f2ea;font:16px -apple-system,sans-serif"><script>${script}</script></body></html>`,
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "Set-Cookie": "cms_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        },
      }
    );
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
      headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "site-editor" },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${url.origin}/api/callback`,
      }),
    });
    const data = await r.json();
    if (!data.access_token) return fail(data.error_description || "GitHub didn't sign you in.");
    return page(`try { localStorage.setItem(${JSON.stringify(TOKEN_KEY)}, ${JSON.stringify(data.access_token)}); } catch (e) {}
location.replace("/admin");`);
  } catch (e) {
    return fail("Couldn't reach GitHub.");
  }
}
