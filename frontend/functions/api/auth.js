// Cloudflare Pages version of /api/auth.js (the Vercel function next to
// the site): GitHub sign-in for the site editor, step 1 of 2. Needs
// GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in the Pages project's
// settings (Variables and Secrets).
export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID) {
    return new Response("The site editor isn't connected yet: GITHUB_CLIENT_ID is not set in Cloudflare.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const origin = new URL(request.url).origin;
  const state = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${origin}/api/callback`,
    scope: "repo,user",
    state,
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://github.com/login/oauth/authorize?${params}`,
      // the state comes back on the callback; checking it there stops
      // anyone else's sign-in from being slipped into this one
      "Set-Cookie": `cms_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
