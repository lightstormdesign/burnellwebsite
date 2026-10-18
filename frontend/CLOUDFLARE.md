# Moving this site to Cloudflare Pages

The site runs on Vercel or Cloudflare Pages with no code changes. Server
code exists for both: `api/` (Vercel) and `functions/api/` (Cloudflare).

## Pages project settings

- Workers & Pages → Create → Pages → Connect to Git → this repo
- Production branch: `main`
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `build`
- Environment variable (build): `NODE_VERSION` = `20`

## Variables and Secrets (Settings → Variables and Secrets, Production)

| Name | Type | What |
| --- | --- | --- |
| `GITHUB_CLIENT_ID` | Text | Site editor sign-in (GitHub OAuth App) |
| `GITHUB_CLIENT_SECRET` | Secret | Same app |
| `ENTREE_API_URL` | Text | ENTREE backend base URL, no `/api` (for /connect) |

In the GitHub OAuth App, add a Redirect URI for every address the editor
is used on: `https://<project>.pages.dev/api/callback` and
`https://<domain>/api/callback`.

## Cutover, in order

1. Create the Pages project and add the variables. Let it deploy.
2. Test on `https://<project>.pages.dev`: home, a deep link (`/tour`),
   `/connect` (offer shows; a test sign-up appears in LightStorm admin),
   `/admin` (sign in, publish a tiny change, see it go live on pages.dev).
3. Only then move the domain to the Pages project (Custom domains). Keep
   the Vercel project until the domain works on Cloudflare, then delete it.
