#!/usr/bin/env node
/**
 * FMB · ART — printed album, "Obra completa" (POD-01, ADR-0018)
 *
 * Builds a print-ready A4 art book of one artist's works: the museum catalogue of a child.
 * The identity is album/identidade.html (Direção A, Cubo Branco); this script lays it out
 * on real pages and prints them to PDF with the Chrome already on the machine (headless).
 *
 *   npm run album -- <Artista> [ano] [--tiragem N]     "Obra completa": every work of one child
 *   npm run album -- <presente> [--tiragem N]          a gift album: album/presentes/<presente>.md
 *   npm run album -- --lista                           every work's id, to write a gift file
 *
 * A gift file (copy album/presentes/exemplo.md) picks the works and their order, and sets the
 * title, subtitle, dedication, an opening text and, per work, the title, technique, the child's
 * words and the notes. Those texts are the album's only: art-data.js is never changed.
 *
 * Writes album/out/<artista>-<ano>/ (or album/out/<presente>/):
 *   miolo.pdf    the interior, 216 x 303 mm (A4 + 3 mm bleed), page count a multiple of 4
 *   capa.pdf     the front cover, same size (flat; cloth and foil are the printer's job)
 *   *.html       the pages the PDFs were printed from, to inspect in a browser
 * With --tiragem N, one numbered interior per copy (miolo-1.pdf ... miolo-N.pdf).
 *
 * Photos: album/originais/<id>.jpeg (full-resolution originals, kept out of git) when present,
 * otherwise assets/art/<id>/photo.jpeg. Prints a warning for any image below 150 dpi on paper.
 * Set CHROME_PATH if Chrome or Edge is not found in the usual places.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { pathToFileURL } = require("url");
const sharp = require("sharp");
const qrcode = require("qrcode-generator");

const root = path.join(__dirname, "..");
const ORIGIN = "https://fmbart.vercel.app"; // same as scripts/build.js share pages

// Page geometry, in mm. U is the mockup's unit: 1/100 of the trimmed page width.
const BLEED = 3, TW = 210, TH = 297, PW = TW + 2 * BLEED, PH = TH + 2 * BLEED, U = TW / 100;
const MIN_DPI = 150;

// ---------- arguments ----------
const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i < 0 ? null : args.splice(i, 2)[1]; };
const tiragem = Number(flag("--tiragem")) || 0;
const [artistArg, yearArg] = args;
const fail = (msg) => { console.error(msg); process.exit(1); };
const fold = (t) => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// ---------- data ----------
const sandbox = { window: {} };
require("vm").runInNewContext(fs.readFileSync(path.join(root, "art-data.js"), "utf8"), sandbox);
const { ART, HALLWAY_ORDER } = sandbox.window;

if (args.includes("--lista")) {
  for (const a of HALLWAY_ORDER.map((id) => ART.find((x) => x.id === id)).filter(Boolean))
    console.log(`${a.id.padEnd(16)} ${a.artist.padEnd(8)} ${a.year}  ${a.title}`);
  process.exit(0);
}
if (!artistArg) fail("Uso: npm run album -- <Artista> [ano] [--tiragem N]\n     npm run album -- <presente> [--tiragem N]\n     npm run album -- --lista");

const giftFile = [artistArg, path.join(root, "album", "presentes", `${artistArg}.md`)]
  .find((f) => /\.md$/i.test(f) && fs.existsSync(f));
const gift = giftFile && readGift(giftFile);

let pieces;
if (gift) {
  pieces = gift.obras.map((o) => {
    const a = ART.find((x) => x.id === o.id);
    if (!a) fail(`${path.basename(giftFile)}: não há obra "${o.id}" (npm run album -- --lista mostra os ids).`);
    // the notes rename the museum's dots in order, so a detail spread is captioned with them too
    const dots = a.dots.map((d, i) => (o.notas && o.notas[i] ? { ...d, ...o.notas[i] } : d));
    return { ...a, title: o.titulo || a.title, medium: o.tecnica || a.medium, quote: o.frase, dots, notes: o.notas || dots };
  });
  if (!pieces.length) fail(`${path.basename(giftFile)}: a secção "## Obras" não tem nenhuma obra.`);
} else {
  pieces = HALLWAY_ORDER.map((id) => ART.find((a) => a.id === id))
    .filter((a) => a && a.artist.toLowerCase() === artistArg.toLowerCase())
    .filter((a) => !yearArg || String(a.year) === String(yearArg))
    .map((a) => ({ ...a, notes: a.dots }));
  if (!pieces.length) fail(`Nenhuma obra de "${artistArg}"${yearArg ? ` em ${yearArg}` : ""} em art-data.js (nem album/presentes/${artistArg}.md).`);
}
const artists = [...new Set(pieces.map((a) => a.artist))];
const artist = artists.length > 1 ? `${artists.slice(0, -1).join(", ")} e ${artists[artists.length - 1]}` : artists[0];
const solo = artists.length === 1;
const span = (xs) => { const s = [...new Set(xs)].sort((a, b) => a - b); return s.length > 1 ? `${s[0]}–${s[s.length - 1]}` : String(s[0]); };
const years = yearArg || span(pieces.map((a) => a.year)), ages = span(pieces.map((a) => a.age));
const bookTitle = (gift && gift.titulo) || artist;
const bookSub = gift ? gift.subtitulo || years : `Obra completa · ${years}`;
const slug = gift ? path.basename(giftFile, path.extname(giftFile)) : fold(`${artist}-${years}`).replace(/[^a-z0-9-]+/g, "-");
const outDir = path.join(root, "album", "out", slug);
const coverPiece = gift && gift.capa ? pieces.find((a) => a.id === gift.capa) : pieces[0];
if (!coverPiece) fail(`${path.basename(giftFile)}: a capa "${gift.capa}" tem de ser uma das obras do álbum.`);
const daDo = (name) => (/a$/i.test(name) ? "da" : "do");

// A gift file: front matter (titulo, subtitulo, capa), then "## Dedicatória", "## Abertura" and
// "## Obras" with one "### <id>" per work, holding "titulo:", "tecnica:", "frase:" and "- nota — pormenor" lines.
function readGift(file) {
  const src = fs.readFileSync(file, "utf8").replace(/\r/g, "").replace(/<!--[\s\S]*?-->/g, "");
  const g = {}, fm = src.match(/^---\n([\s\S]*?)\n---\n?/);
  const unquote = (v) => v.trim().replace(/^"(.*)"$/, "$1").trim();
  for (const line of fm ? fm[1].split("\n") : []) {
    const kv = line.replace(/\s+#.*$/, "").match(/^(\w+):\s*(.*)$/);
    if (kv) g[kv[1]] = unquote(kv[2]);
  }
  const sections = {};
  for (const part of src.slice(fm ? fm[0].length : 0).split(/^## /m).slice(1)) {
    const nl = part.indexOf("\n");
    sections[fold(part.slice(0, nl < 0 ? undefined : nl).trim())] = nl < 0 ? "" : part.slice(nl + 1);
  }
  const prose = (t) => (t || "").trim().split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  g.dedicatoria = prose(sections["dedicatoria"]);
  g.abertura = prose(sections["abertura"]);
  g.obras = (sections["obras"] || "").split(/^### /m).slice(1).map((part) => {
    const [head, ...lines] = part.split("\n");
    const o = { id: head.trim() }, notas = [];
    for (const line of lines.map((l) => l.trim()).filter(Boolean)) {
      const note = line.match(/^[-*]\s+(.*)$/);
      if (note) { const [label, detail] = note[1].split(/\s+—\s+/); notas.push({ label: label.trim(), detail: (detail || "").trim() }); continue; }
      const kv = line.match(/^(titulo|tecnica|frase):\s*(.*)$/i);
      if (kv) o[kv[1].toLowerCase()] = unquote(kv[2]).replace(/^«(.*)»$/, "$1");
      else console.warn(`${path.basename(file)}, ${o.id}: linha ignorada: ${line}`);
    }
    if (notas.length) o.notas = notas;
    return o;
  });
  return g;
}

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const lines = (t) => esc(t).split("\n").join("<br>");
const obras = (n) => `${n} ${n === 1 ? "obra" : "obras"}`;
const two = (n) => String(n).padStart(2, "0");
const num = (x) => +x.toFixed(2);

function qr(url, sizeMm) {
  const q = qrcode(0, "M"); q.addData(url); q.make();
  const n = q.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return `<svg viewBox="0 0 ${n} ${n}" width="${sizeMm}mm" height="${sizeMm}mm" shape-rendering="crispEdges"><path d="${d}" fill="#1A1A1A"/></svg>`;
}

// A background crop of an image into a box of bw x bh mm, zoomed z times past "cover",
// centred on a dot when it can be (clamped so the box never shows past the image's edge).
function crop(img, dot, bw, bh, z) {
  const ar = img.pw / img.ph;
  let iw, ih;
  if (ar >= bw / bh) { ih = bh * z; iw = ih * ar; } else { iw = bw * z; ih = iw / ar; }
  const clamp = (v, lo) => Math.min(0, Math.max(lo, v));
  const x = clamp(bw / 2 - (dot.x / 100) * iw, bw - iw), y = clamp(bh / 2 - (dot.y / 100) * ih, bh - ih);
  return {
    css: `background-image:url('${img.url}');background-size:${num(iw)}mm ${num(ih)}mm;background-position:${num(x)}mm ${num(y)}mm`,
    dpi: img.pw / (iw / 25.4),
    // the part of the image the box shows, in % of the image
    view: { l: (-x / iw) * 100, t: (-y / ih) * 100, w: (bw / iw) * 100, h: (bh / ih) * 100 }
  };
}

// ---------- pages ----------
(async () => {
  const warn = [];
  for (const a of pieces) {
    const orig = ["jpeg", "jpg", "png"].map((e) => path.join(root, "album", "originais", `${a.id}.${e}`)).find(fs.existsSync);
    const file = orig || path.join(root, a.src);
    const m = await sharp(file).metadata();
    const turned = (m.orientation || 1) >= 5;
    a.img = { url: pathToFileURL(file).href, pw: turned ? m.height : m.width, ph: turned ? m.width : m.height, orig: !!orig };
  }

  // Which works get a full-page detail spread: those whose photo holds a 2x crop at MIN_DPI,
  // at most three, spread evenly through the book.
  const zFor = (a) => Math.min(3, a.img.pw / (MIN_DPI * PW / 25.4));
  const eligible = pieces.filter((a) => a.dots.length && zFor(a) >= 2);
  const detailed = new Set(Array.from({ length: Math.min(3, eligible.length) },
    (_, i) => eligible[Math.floor((i + 0.5) * eligible.length / Math.min(3, eligible.length))]));
  const detailDot = (a) => a.dots.reduce((best, d) => {
    const room = Math.min(d.x, 100 - d.x, d.y, 100 - d.y);
    return room > best.room ? { d, room } : best;
  }, { d: a.dots[0], room: -1 }).d;

  // Page plan. Page 1 is a recto; a work is always entry (verso) + plate (recto).
  const plan = [{ kind: "exlibris" }, { kind: "endpaper", k: 0 }, { kind: "endpaper", k: 1 },
    { kind: "title" }, { kind: "index" }];
  pieces.forEach((a, i) => {
    a.cat = i + 1;
    a.page = plan.length + 1;
    plan.push({ kind: "entry", a }, { kind: "plate", a });
    if (detailed.has(a)) plan.push({ kind: "detail", a }, { kind: "lens", a });
  });
  // The front matter is five pages, so the finale (verso + recto) ends on an odd page and one
  // blank closes the book; blank pairs before it bring the count to a multiple of 4.
  while ((plan.length + 3) % 4) plan.push({ kind: "blank" }, { kind: "blank" });
  plan.push({ kind: "colours" }, { kind: "colophon" }, { kind: "blank" });

  const tiles = pieces.flatMap((a) => (a.dots.length ? a.dots : [{ x: 50, y: 50 }]).map((d) => [a, d]));
  const TILE_COLS = 5, TILE_ROWS = 7, GAP = 3.4, TILE = (TW - 24 - (TILE_COLS - 1) * GAP) / TILE_COLS;
  const tileTop = BLEED + (TH - TILE_ROWS * TILE - (TILE_ROWS - 1) * GAP) / 2;

  const folio = (n) => `<div class="folio ${n % 2 ? "r" : "l"}">${n}</div>`;
  const trim = (inner, cls = "") => `<div class="trim ${cls}">${inner}</div>`;

  function render(p, n, copy) {
    const a = p.a;
    switch (p.kind) {
      case "exlibris":
        // a gift's dedication takes the place of the blank "belongs to" line
        return trim(`<div class="ex">EX · LIBRIS</div><div class="rule"></div>${gift && gift.dedicatoria.length
          ? `<div class="dedic">${gift.dedicatoria.map((p) => `<p>${lines(p)}</p>`).join("")}</div>`
          : `<div class="line"></div><div class="hand">Este livro pertence a</div>`}
          <div class="ed">${copy ? `Exemplar n.º ${copy} de ${tiragem}` : "Exemplar n.º ______"}<br>Impresso em Portugal</div>`, "exlibris");
      case "endpaper": {
        let html = "";
        for (let i = 0; i < TILE_COLS * TILE_ROWS; i++) {
          const [ta, d] = tiles[(i * 3 + p.k * 7) % tiles.length];
          const c = crop(ta.img, d, TILE, TILE, 4);
          if (c.dpi < MIN_DPI) warn.push(`guardas: ${ta.id} a ${Math.round(c.dpi)} dpi`);
          html += `<div class="tile" style="left:${num(BLEED + 12 + (i % TILE_COLS) * (TILE + GAP))}mm;top:${num(tileTop + Math.floor(i / TILE_COLS) * (TILE + GAP))}mm;width:${num(TILE)}mm;height:${num(TILE)}mm;${c.css}"></div>`;
        }
        return `<div class="endpaper">${html}</div>`;
      }
      case "title":
        return trim(`<div class="kick">FMB · ART</div><h1>${esc(bookTitle)}</h1>
          <div class="sub">${esc(bookSub)}</div>
          <div class="count">${obras(pieces.length)} · ${solo ? `${ages} anos` : esc(artist)}</div>
          ${gift ? gift.abertura.map((p) => `<p class="open">${lines(p)}</p>`).join("") : ""}`, "titlepage");
      case "index":
        return trim(`<h2>Obras</h2><div class="kick">${esc(artist)}${solo ? ` · ${ages} anos` : ""} · ${esc(years)}</div>
          <ol class="${pieces.length > 11 ? "dense" : ""}">${pieces.map((x) =>
            `<li><span class="n">${two(x.cat)}</span><span class="t">${esc(x.title)}</span><span class="p">${x.page}</span></li>`).join("")}</ol>`, "index") + folio(n);
      case "entry":
        return trim(`<div class="cat">Cat. ${two(a.cat)}</div><h2>${esc(a.title)}</h2>
          <dl><dt>Artista</dt><dd>${esc(a.signature || a.artist)}</dd><dt>Idade</dt><dd>${a.age} anos</dd>
            <dt>Ano</dt><dd>${a.year}</dd>${a.medium ? `<dt>Técnica</dt><dd>${esc(a.medium)}</dd>` : ""}</dl>
          ${a.quote ? `<blockquote>«${esc(a.quote)}»<small>${esc(a.artist)}, sobre esta obra</small></blockquote>` : ""}
          <div class="swatches">${a.palette.map((c) => `<i style="background:${c}"></i>`).join("")}</div>
          ${a.notes.length ? `<div class="kick">Repara em</div>` : ""}
          <ul class="notes">${a.notes.map((d) => `<li>${esc(d.label)}${d.detail ? `<em>${esc(d.detail)}</em>` : ""}</li>`).join("")}</ul>
          <div class="qr">${qr(`${ORIGIN}/o/${a.id}`, 14 * U)}
            <div><div class="say">Esta obra mexe.</div><div class="how">Aponta a câmara do telemóvel</div></div></div>`, "entry") + folio(n);
      case "plate": {
        // The work alone, centred and a little above the middle (optical centre)
        const ar = a.img.pw / a.img.ph, w = Math.min(78 * U, 228 * ar), h = w / ar;
        const dpi = a.img.pw / (w / 25.4);
        if (dpi < MIN_DPI) warn.push(`${a.id}: obra a ${Math.round(dpi)} dpi`);
        return trim(`<div class="art" style="width:${num(w)}mm;height:${num(h)}mm;left:${num((TW - w) / 2)}mm;top:${num((TH - h) / 2 - 6)}mm">
          <img src="${a.img.url}" alt=""></div>`, "plate") + folio(n);
      }
      case "detail": {
        const d = detailDot(a), z = zFor(a), c = crop(a.img, d, PW, PH, z);
        return `<div class="detail" style="${c.css}"></div>` +
          trim(`<div class="cap"><div class="mono">Cat. ${two(a.cat)} · Pormenor</div><div class="lbl">${esc(d.label)}</div></div>`);
      }
      case "lens": {
        // the window marks exactly the part of the work the facing page enlarges
        const v = crop(a.img, detailDot(a), PW, PH, zFor(a)).view, ar = a.img.pw / a.img.ph;
        const w = Math.min(50 * U, 150 * ar), h = w / ar;
        return trim(`<div class="lens" style="width:${num(w)}mm;height:${num(h)}mm;top:46mm;left:${num((TW - w) / 2)}mm">
          <img src="${a.img.url}" alt=""><span class="window" style="left:${num(v.l)}%;top:${num(v.t)}%;width:${num(v.w)}%;height:${num(v.h)}%"></span></div>
          <div class="lensnote">${esc(a.title)}<br><span class="mono">${esc(a.signature || a.artist)} · ${a.age} anos · ${a.year}</span></div>`) + folio(n);
      }
      case "colours":
        return trim(`<h2>${solo ? `As cores ${daDo(artist)} ${esc(artist)}` : "As cores deste livro"}</h2><div class="kick">Todas as cores das obras deste livro</div>
          <div class="bars">${pieces.map((x) => `<div class="bar">${x.palette.map((c) => `<i style="background:${c}"></i>`).join("")}<b>${two(x.cat)}</b></div>`).join("")}</div>`, "colours") + folio(n);
      case "colophon":
        // one child: their room; several: the museum's front door
        return trim(`<div class="roomqr">${qr(solo ? `${ORIGIN}/#/${encodeURIComponent(artist)}` : `${ORIGIN}/`, 26 * U)}</div>
          <div class="say">${solo ? `A sala ${daDo(artist)} ${esc(artist)}` : "O museu"}</div><div class="how">Todas as obras, a mexer</div>
          <p>FMB · ART<br>Museu de arte de criança<br>Fotografias sem retoque: a obra é a obra</p>`, "colophon");
      default:
        return "";
    }
  }

  const css = fs.readFileSync(path.join(__dirname, "album.css"), "utf8");
  const doc = (title, body) => `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=EB+Garamond:ital@0;1&family=JetBrains+Mono:wght@400;500&display=block" rel="stylesheet">
<style>:root{--u:${U}mm;--pw:${PW}mm;--ph:${PH}mm;--b:${BLEED}mm}${css}</style></head><body>${body}
<script>/* An entry with a long title and many notes would push the QR onto the folio: shrink it until it fits */
document.fonts.ready.then(() => { for (const e of document.querySelectorAll(".entry")) {
  const over = () => e.querySelector(".qr").getBoundingClientRect().bottom - (e.getBoundingClientRect().bottom - parseFloat(getComputedStyle(e).paddingBottom)) > .5;
  for (let f = 1; over() && f > .7; ) e.style.setProperty("--fit", f -= .04); }
  /* A one-line title that is too wide for its page (a long gift title on the cover) shrinks too */
  for (const e of document.querySelectorAll("[data-fit]")) {
    const size = parseFloat(getComputedStyle(e).fontSize);
    for (let f = 1; e.scrollWidth > e.clientWidth && f > .5; ) e.style.fontSize = size * (f -= .04) + "px"; } });</script></body></html>`;

  const chrome = findChrome();
  const print = (htmlFile, pdfFile) => {
    execFileSync(chrome, ["--headless", "--disable-gpu", "--no-pdf-header-footer", "--allow-file-access-from-files",
      "--virtual-time-budget=30000", `--print-to-pdf=${pdfFile}`, pathToFileURL(htmlFile).href], { stdio: "ignore" });
    console.log(`  ${path.relative(root, pdfFile)}  ${(fs.statSync(pdfFile).size / 1048576).toFixed(1)} MB`);
  };

  fs.mkdirSync(outDir, { recursive: true });
  console.log(`${bookTitle}: ${obras(pieces.length)}, ${plan.length} páginas, ${detailed.size} pormenores.`);

  const copies = tiragem ? Array.from({ length: tiragem }, (_, i) => i + 1) : [0];
  for (const copy of copies) {
    const body = plan.map((p, i) => `<section class="page k-${p.kind} ${(i + 1) % 2 ? "recto" : "verso"}">${render(p, i + 1, copy)}</section>`).join("\n");
    const name = copy ? `miolo-${copy}` : "miolo";
    fs.writeFileSync(path.join(outDir, `${name}.html`), doc(`${bookTitle} · ${bookSub}`, body));
    print(path.join(outDir, `${name}.html`), path.join(outDir, `${name}.pdf`));
  }

  const cr = coverPiece.img.pw / coverPiece.img.ph, cw = Math.min(52 * U, 150 * cr);
  const cover = `<section class="page cover"><div class="trim">
    <div class="recess" style="width:${num(cw + 2 * 1.6 * U)}mm;left:${num((TW - cw) / 2 - 1.6 * U)}mm"><img src="${coverPiece.img.url}" alt="" style="width:${num(cw)}mm;height:${num(cw / cr)}mm"></div>
    <div class="name" data-fit>${esc(bookTitle)}</div><div class="sub">${esc(bookSub)}</div><div class="mark">FMB · ART</div></div></section>`;
  fs.writeFileSync(path.join(outDir, "capa.html"), doc(`${bookTitle} · Capa`, cover));
  print(path.join(outDir, "capa.html"), path.join(outDir, "capa.pdf"));

  const unique = [...new Set(warn)];
  if (unique.length) console.log(`\nResolução abaixo de ${MIN_DPI} dpi (põe o original em album/originais/<id>.jpeg):\n  ` + unique.join("\n  "));
  const missing = pieces.filter((a) => !a.img.orig).map((a) => a.id);
  if (missing.length) console.log(`\nSem original em album/originais/, impresso a partir de assets/: ${missing.join(", ")}`);
})().catch((e) => { console.error(e.message); process.exit(1); });

function findChrome() {
  const c = [process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean);
  const found = c.find((p) => fs.existsSync(p));
  if (!found) throw new Error("Chrome/Edge não encontrado. Define CHROME_PATH.");
  return found;
}
