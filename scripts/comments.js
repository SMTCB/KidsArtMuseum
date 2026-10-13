// FMB / ART — gestão de comentários (para o dono).
//   node scripts/comments.js list
//   node scripts/comments.js export > comentarios.json
//   node scripts/comments.js delete <obra> <id>
// Precisa de: FMB_SITE (ex. https://fmb.art) e COMMENTS_ADMIN_TOKEN no ambiente.
const site = (process.env.FMB_SITE || "").replace(/\/$/, "");
const token = process.env.COMMENTS_ADMIN_TOKEN;
if (!site || !token) { console.error("Define FMB_SITE e COMMENTS_ADMIN_TOKEN."); process.exit(1); }
const h = { "x-admin-token": token };
const [cmd, art, id] = process.argv.slice(2);

(async () => {
  if (cmd === "list" || cmd === "export") {
    const r = await fetch(site + "/api/comments?all=1", { headers: h });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const all = await r.json();
    if (cmd === "export") return console.log(JSON.stringify(all, null, 2));
    for (const [a, list] of Object.entries(all))
      for (const c of list) console.log(`${a}  ${c.id}  ${new Date(c.ts).toISOString().slice(0, 16)}  ${c.name}: ${c.text}`);
  } else if (cmd === "delete" && art && id) {
    const r = await fetch(`${site}/api/comments?art=${encodeURIComponent(art)}&id=${encodeURIComponent(id)}`, { method: "DELETE", headers: h });
    console.log(r.ok ? "Apagado." : "Falhou: HTTP " + r.status);
  } else {
    console.error("Uso: list | export | delete <obra> <id>");
    process.exit(1);
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
