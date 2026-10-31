#!/usr/bin/env node
/**
 * FMB · ART — folha de contacto para escolher as obras de um álbum (POD-05)
 *
 * Every work in the museum, numbered in the museum's order (the same numbers as
 * `npm run album -- --lista`), on one picture that can be sent to a phone. The owner answers
 * with the numbers in the order of the book; the /FMBART_Museu skill turns them into ids.
 *
 *   npm run folha              every work
 *   npm run folha -- Miguel    one child's works (the numbers stay the museum's)
 *
 * Writes album/out/folha.jpeg. Uses the wall thumbnails (assets/art/<id>/thumb-480.jpeg).
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const COLS = 5, CELL = 300, PIC = 260, LABEL = 70, PAD = 20;
const BG = "#FAF8F2", INK = "#1A1A1A", META = "#77736a"; // the album's fundo and text colours

const sandbox = { window: {} };
require("vm").runInNewContext(fs.readFileSync(path.join(root, "art-data.js"), "utf8"), sandbox);
const { ART, HALLWAY_ORDER } = sandbox.window;
const only = process.argv[2] && process.argv[2].toLowerCase();

const works = HALLWAY_ORDER.map((id) => ART.find((a) => a.id === id)).filter(Boolean)
  .map((a, i) => ({ ...a, n: i + 1 }))
  .filter((a) => !only || a.artist.toLowerCase() === only);
if (!works.length) { console.error(`Nenhuma obra de "${process.argv[2]}".`); process.exit(1); }

const xml = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cut = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);

(async () => {
  const rows = Math.ceil(works.length / COLS);
  const W = COLS * CELL + 2 * PAD, H = rows * (CELL + LABEL) + 2 * PAD;
  const layers = [];
  for (const [i, a] of works.entries()) {
    const x = PAD + (i % COLS) * CELL, y = PAD + Math.floor(i / COLS) * (CELL + LABEL);
    const thumb = path.join(root, "assets", "art", a.id, "thumb-480.jpeg");
    const src = fs.existsSync(thumb) ? thumb : path.join(root, a.src);
    const pic = await sharp(src).rotate().resize(PIC, PIC, { fit: "inside" }).toBuffer({ resolveWithObject: true });
    layers.push({ input: pic.data, left: x + Math.round((CELL - pic.info.width) / 2), top: y + Math.round((CELL - pic.info.height) / 2) });
    const label = `<svg width="${CELL}" height="${LABEL}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="26" cy="24" r="19" fill="${INK}"/>
      <text x="26" y="31" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" fill="${BG}" text-anchor="middle">${a.n}</text>
      <text x="54" y="22" font-family="Georgia, serif" font-style="italic" font-size="19" fill="${INK}">${xml(cut(a.title, 24))}</text>
      <text x="54" y="46" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="${META}">${xml(`${a.artist} · ${a.year}`)}</text>
    </svg>`;
    layers.push({ input: Buffer.from(label), left: x, top: y + CELL });
  }
  const out = path.join(root, "album", "out", "folha.jpeg");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
    .composite(layers).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  console.log(`${path.relative(root, out)}  ${works.length} obras`);
})().catch((e) => { console.error(e.message); process.exit(1); });
