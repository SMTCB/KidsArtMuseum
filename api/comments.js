// FMB / ART — comentários (Nome + Comentário), sem contas.
// Vercel Function; guarda numa lista Redis por obra (Upstash, via REST).
// Ver docs/decisions/0015-prototype-comments-backend.md.
//
// Variáveis de ambiente (Vercel):
//   KV_REST_API_URL / KV_REST_API_TOKEN   (ou UPSTASH_REDIS_REST_URL / _TOKEN)
//   COMMENTS_ADMIN_TOKEN                  (apagar e exportar)
//   COMMENTS_SALT                         (opcional, para o hash do limite de envios)
//   COMMENTS_ENABLED=false                (interruptor para desligar)

const crypto = require("crypto");

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const MAX_NAME = 40, MAX_TEXT = 280, MAX_KEPT = 200, RATE_PER_HOUR = 5;

async function redis(...cmd) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(cmd)
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

const clean = (s) => String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
const validArt = (a) => typeof a === "string" && /^[a-z0-9-]{1,60}$/.test(a);
const isAdmin = (req) => !!process.env.COMMENTS_ADMIN_TOKEN && req.headers["x-admin-token"] === process.env.COMMENTS_ADMIN_TOKEN;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const send = (code, body) => res.status(code).json(body);

  if (process.env.COMMENTS_ENABLED === "false") {
    return req.method === "GET" ? send(200, { comments: [], disabled: true }) : send(503, { error: "disabled" });
  }
  if (!URL_ || !TOKEN) return send(503, { error: "not-configured" });

  try {
    if (req.method === "GET") {
      if (req.query.all && isAdmin(req)) {
        const keys = await redis("KEYS", "c:*");
        const out = {};
        for (const k of keys) out[k.slice(2)] = (await redis("LRANGE", k, 0, -1)).map(JSON.parse);
        return send(200, out);
      }
      if (!validArt(req.query.art)) return send(400, { error: "art" });
      const raw = await redis("LRANGE", "c:" + req.query.art, 0, 99);
      return send(200, { comments: raw.map(JSON.parse) });
    }

    if (req.method === "DELETE") {
      if (!isAdmin(req)) return send(401, { error: "unauthorized" });
      const { art, id } = req.query;
      if (!validArt(art) || !id) return send(400, { error: "args" });
      const raw = await redis("LRANGE", "c:" + art, 0, -1);
      const hit = raw.find((s) => JSON.parse(s).id === id);
      if (!hit) return send(404, { error: "not-found" });
      await redis("LREM", "c:" + art, 1, hit);
      return send(200, { ok: true });
    }

    if (req.method === "POST") {
      const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      if (b.website) return send(200, { ok: true });          // honeypot: pretend success
      const name = clean(b.name), text = clean(b.text);
      if (!validArt(b.art)) return send(400, { error: "art" });
      if (!name || name.length > MAX_NAME) return send(400, { error: "name" });
      if (!text || text.length > MAX_TEXT) return send(400, { error: "text" });
      if (/(https?:\/\/|www\.)/i.test(name + " " + text)) return send(400, { error: "links" });

      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "x";
      const who = crypto.createHash("sha256").update((process.env.COMMENTS_SALT || "fmb") + ip).digest("hex").slice(0, 24);
      const n = await redis("INCR", "rl:" + who);
      if (n === 1) await redis("EXPIRE", "rl:" + who, 3600);
      if (n > RATE_PER_HOUR) return send(429, { error: "rate" });

      const comment = { id: crypto.randomBytes(5).toString("hex"), name, text, ts: Date.now() };
      await redis("LPUSH", "c:" + b.art, JSON.stringify(comment));
      await redis("LTRIM", "c:" + b.art, 0, MAX_KEPT - 1);
      return send(201, { comment });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return send(405, { error: "method" });
  } catch (e) {
    return send(500, { error: "server" });
  }
};
