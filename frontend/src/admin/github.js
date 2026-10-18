// The site editor talks to GitHub straight from the browser, with the
// signed-in person's own GitHub token (from /api/auth → /api/callback).
// Publishing makes one commit with the page's JSON plus any new uploads, so
// Vercel redeploys once per publish.
import { SITE } from "./schema";

export const REPO = SITE.repo;
export const BRANCH = SITE.branch;
export const CONTENT_DIR = "frontend/src/content";
export const UPLOADS_DIR = "frontend/public/uploads";
export const UPLOADS_PUBLIC = "/uploads";
export const TOKEN_KEY = "bw-editor-token";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

async function gh(path, { method = "GET", body } = {}) {
  const r = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/vnd.github+json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = r.status === 204 ? null : await r.json().catch(() => null);
  if (!r.ok) {
    let message = (data && data.message) || `GitHub error ${r.status}`;
    // The organization hasn't approved this sign-in app yet: reading works
    // (the repo is public) but saving is refused.
    if (/OAuth App access restrictions/i.test(message)) {
      message =
        `GitHub is blocking this editor from saving. An owner of the ${REPO.split("/")[0]} organization needs to approve it once: on github.com go to Settings → Applications → Authorized OAuth Apps → this editor → Grant (next to ${REPO.split("/")[0]}). Then sign out here and sign in again.`;
    } else if (r.status === 401) {
      message = "Your sign-in expired. Sign out (top right) and sign in again.";
    }
    const err = new Error(message);
    err.status = r.status;
    throw err;
  }
  return data;
}

const toBase64 = (bytes) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromBase64 = (b64) => Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0));

// Who's signed in, and can they change this site?
export async function whoAmI() {
  const [user, repo] = await Promise.all([gh("/user"), gh(`/repos/${REPO}`)]);
  return { login: user.login, name: user.name || user.login, avatar: user.avatar_url, canEdit: !!repo.permissions?.push };
}

export async function readPage(file) {
  const d = await gh(`/repos/${REPO}/contents/${CONTENT_DIR}/${file}.json?ref=${BRANCH}`);
  return { data: JSON.parse(new TextDecoder().decode(fromBase64(d.content))), sha: d.sha };
}

// `sha` is the version the form was loaded from; if the file changed since
// (someone else published), nothing is overwritten.
export async function publishPage(file, data, sha, uploads, message) {
  const path = `${CONTENT_DIR}/${file}.json`;
  const current = await gh(`/repos/${REPO}/contents/${path}?ref=${BRANCH}`);
  if (current.sha !== sha) {
    const err = new Error("This page was changed somewhere else since you opened it. Reload the page, then make your change again.");
    err.conflict = true;
    throw err;
  }
  const ref = await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`);
  const head = await gh(`/repos/${REPO}/git/commits/${ref.object.sha}`);
  const files = [
    { path, bytes: new TextEncoder().encode(JSON.stringify(data, null, 2) + "\n") },
    ...uploads.map((u) => ({ path: `${UPLOADS_DIR}/${u.name}`, bytes: u.bytes })),
  ];
  const tree = [];
  for (const f of files) {
    const blob = await gh(`/repos/${REPO}/git/blobs`, { method: "POST", body: { content: toBase64(f.bytes), encoding: "base64" } });
    tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
  }
  const newTree = await gh(`/repos/${REPO}/git/trees`, { method: "POST", body: { base_tree: head.tree.sha, tree } });
  const commit = await gh(`/repos/${REPO}/git/commits`, {
    method: "POST",
    body: { message, tree: newTree.sha, parents: [ref.object.sha] },
  });
  await gh(`/repos/${REPO}/git/refs/heads/${BRANCH}`, { method: "PATCH", body: { sha: commit.sha } });
  const saved = await gh(`/repos/${REPO}/contents/${path}?ref=${commit.sha}`);
  return saved.sha;
}

// Photos are resized (longest side 2400px) and saved as WebP before upload,
// so a 12MB phone photo becomes a few hundred KB and the site stays fast.
// Transparency is kept.
const MAX_SIDE = 2400;
export async function prepareImage(file) {
  const stem =
    file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "photo";
  const name = `${Date.now().toString(36)}-${stem}`;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/webp", 0.85));
    if (blob && blob.type === "image/webp") return { name: `${name}.webp`, blob };
  } catch {}
  // Browser couldn't convert it: upload the original.
  const ext = (file.name.match(/\.([a-z0-9]+)$/i) || [, "jpg"])[1].toLowerCase();
  return { name: `${name}.${ext}`, blob: file };
}

export function prepareFile(file) {
  const ext = (file.name.match(/\.([a-z0-9]+)$/i) || [, "bin"])[1].toLowerCase();
  const stem =
    file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "file";
  return { name: `${Date.now().toString(36)}-${stem}.${ext}`, blob: file };
}
