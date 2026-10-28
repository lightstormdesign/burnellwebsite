// Where fan sign-ups are kept: a small Redis database (Upstash), added to
// this project in Vercel under Storage, which sets the two variables below.
// Every sign-up form on the site saves here, and /admin → Sign-ups lists
// them. (Files starting with _ aren't routes of their own.)
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "fans"; // one hash: phone number → the fan's record (JSON)

exports.ready = () => !!(URL_ && TOKEN);

async function redis(...command) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error || `Storage error ${r.status}`);
  return d.result;
}

exports.getFan = async (phone) => JSON.parse((await redis("HGET", KEY, phone)) || "null");
exports.saveFan = (fan) => redis("HSET", KEY, fan.phone, JSON.stringify(fan));
exports.removeFan = (phone) => redis("HDEL", KEY, phone);
exports.allFans = async () => {
  const flat = (await redis("HGETALL", KEY)) || [];
  const fans = [];
  for (let i = 1; i < flat.length; i += 2) {
    try {
      fans.push(JSON.parse(flat[i]));
    } catch {}
  }
  return fans.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
};
