#!/usr/bin/env node
/**
 * FMB · ART — printed album, "Obra completa" (POD-01, ADR-0018)
 *
 * Builds a print-ready A4 art book of one artist's works: the museum catalogue of a child.
 * The identity is album/identidade.html (Direção A, Cubo Branco); this script lays it out
 * on real pages and prints them to PDF with the Chrome already on the machine (headless).
 *
 *   npm run album -- <Artista> [ano] [--tiragem N]
 *
 * Writes album/out/<artista>-<ano>/:
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
if (!artistArg) {
  console.error("Uso: npm run album -- <Artista> [ano] [--tiragem N]");
  process.exit(1);
}

// ---------- data ----------
const sandbox = { window: {} };
require("vm").runInNewContext(fs.readFileSync(path.join(root, "art-data.js"), "utf8"), sandbox);
const { ART, HALLWAY_ORDER } = sandbox.window;
const pieces = HALLWAY_ORDER.map((id) => ART.find((a) => a.id === id))
  .filter((a) => a && a.artist.toLowerCase() === artistArg.toLowerCase())
  .filter((a) => !yearArg || String(a.year) === String(yearArg));
if (!pieces.length) {
  console.error(`Nenhuma obra de "${artistArg}"${yearArg ? ` em ${yearArg}` : ""} em art-data.js.`);
  process.exit(1);
}
const artist = pieces[0].artist;
const span = (xs) => { const s = [...new Set(xs)].sort((a, b) => a - b); return s.length > 1 ? `${s[0]}–${s[s.length - 1]}` : String(s[0]); };
const years = span(pieces.map((a) => a.year)), ages = span(pieces.map((a) => a.age));
const slug = `${artist}-${yearArg || years}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]+/g, "-");
const outDir = path.join(root, "album", "out", slug);

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
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
        return trim(`<div class="ex">EX · LIBRIS</div><div class="rule"></div><div class="line"></div>
          <div class="hand">Este livro pertence a</div>
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
        return trim(`<div class="kick">FMB · ART</div><h1>${esc(artist)}</h1>
          <div class="sub">Obra completa · ${esc(yearArg || years)}</div>
          <div class="count">${pieces.length} obras · ${ages} anos</div>`, "titlepage");
      case "index":
        return trim(`<h2>Obras</h2><div class="kick">${esc(artist)} · ${ages} anos · ${esc(yearArg || years)}</div>
          <ol class="${pieces.length > 11 ? "dense" : ""}">${pieces.map((x) =>
            `<li><span class="n">${two(x.cat)}</span><span class="t">${esc(x.title)}</span><span class="p">${x.page}</span></li>`).join("")}</ol>`, "index") + folio(n);
      case "entry":
        return trim(`<div class="cat">Cat. ${two(a.cat)}</div><h2>${esc(a.title)}</h2>
          <dl><dt>Artista</dt><dd>${esc(a.signature || a.artist)}</dd><dt>Idade</dt><dd>${a.age} anos</dd>
            <dt>Ano</dt><dd>${a.year}</dd>${a.medium ? `<dt>Técnica</dt><dd>${esc(a.medium)}</dd>` : ""}</dl>
          <div class="swatches">${a.palette.map((c) => `<i style="background:${c}"></i>`).join("")}</div>
          <ol class="notes">${a.dots.map((d, i) => `<li><span>${i + 1}</span><div>${esc(d.label)}${d.detail ? `<em>${esc(d.detail)}</em>` : ""}</div></li>`).join("")}</ol>
          <div class="qr">${qr(`${ORIGIN}/o/${a.id}`, 17 * U)}
            <div><div class="say">Esta obra mexe.</div><div class="how">Aponta a câmara do telemóvel</div></div></div>`, "entry") + folio(n);
      case "plate": {
        const ar = a.img.pw / a.img.ph, w = Math.min(68 * U, 225 * ar), h = w / ar;
        const dpi = a.img.pw / (w / 25.4);
        if (dpi < MIN_DPI) warn.push(`${a.id}: obra a ${Math.round(dpi)} dpi`);
        const order = a.dots.map((d, i) => ({ d, i })).sort((p1, p2) => p1.d.y - p2.d.y);
        let last = -1e9;
        order.forEach((o) => { o.ly = Math.max((o.d.y / 100) * h, last + 7); last = o.ly; });
        const lines = order.map((o) => {
          const x = (o.d.x / 100) * w, y = (o.d.y / 100) * h;
          return `<polyline points="${num(x)},${num(y)} ${num(w + 6)},${num(o.ly)} ${num(w + 13)},${num(o.ly)}"/>` +
            `<circle cx="${num(x)}" cy="${num(y)}" r="2.3" class="halo"/><circle cx="${num(x)}" cy="${num(y)}" r="2.3"/>`;
        }).join("");
        const nums = order.map((o) => `<span class="num" style="left:${num(w + 15)}mm;top:${num(o.ly)}mm">${o.i + 1}</span>`).join("");
        return trim(`<div class="art" style="width:${num(w)}mm;height:${num(h)}mm;top:${num((TH - h) / 2)}mm">
          <img src="${a.img.url}" alt=""><svg viewBox="0 0 ${num(w)} ${num(h)}" width="${num(w)}mm" height="${num(h)}mm">${lines}</svg>${nums}</div>`, "plate") + folio(n);
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
        return trim(`<h2>As cores ${/a$/i.test(artist) ? "da" : "do"} ${esc(artist)}</h2><div class="kick">Todas as cores das obras deste livro</div>
          <div class="bars">${pieces.map((x) => `<div class="bar">${x.palette.map((c) => `<i style="background:${c}"></i>`).join("")}<b>${two(x.cat)}</b></div>`).join("")}</div>`, "colours") + folio(n);
      case "colophon":
        return trim(`<div class="roomqr">${qr(`${ORIGIN}/#/${encodeURIComponent(artist)}`, 26 * U)}</div>
          <div class="say">A sala ${/a$/i.test(artist) ? "da" : "do"} ${esc(artist)}</div><div class="how">Todas as obras, a mexer</div>
          <p>FMB · ART<br>Museu de arte de criança<br>Fotografias sem retoque: a obra é a obra</p>`, "colophon");
      default:
        return "";
    }
  }

  const css = fs.readFileSync(path.join(__dirname, "album.css"), "utf8");
  const doc = (title, body) => `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=EB+Garamond:ital@0;1&family=JetBrains+Mono:wght@400;500&display=block" rel="stylesheet">
<style>:root{--u:${U}mm;--pw:${PW}mm;--ph:${PH}mm;--b:${BLEED}mm}${css}</style></head><body>${body}</body></html>`;

  const chrome = findChrome();
  const print = (htmlFile, pdfFile) => {
    execFileSync(chrome, ["--headless", "--disable-gpu", "--no-pdf-header-footer", "--allow-file-access-from-files",
      "--virtual-time-budget=30000", `--print-to-pdf=${pdfFile}`, pathToFileURL(htmlFile).href], { stdio: "ignore" });
    console.log(`  ${path.relative(root, pdfFile)}  ${(fs.statSync(pdfFile).size / 1048576).toFixed(1)} MB`);
  };

  fs.mkdirSync(outDir, { recursive: true });
  console.log(`${artist}: ${pieces.length} obras, ${plan.length} páginas, ${detailed.size} pormenores.`);

  const copies = tiragem ? Array.from({ length: tiragem }, (_, i) => i + 1) : [0];
  for (const copy of copies) {
    const body = plan.map((p, i) => `<section class="page k-${p.kind} ${(i + 1) % 2 ? "recto" : "verso"}">${render(p, i + 1, copy)}</section>`).join("\n");
    const name = copy ? `miolo-${copy}` : "miolo";
    fs.writeFileSync(path.join(outDir, `${name}.html`), doc(`${artist} · Obra completa`, body));
    print(path.join(outDir, `${name}.html`), path.join(outDir, `${name}.pdf`));
  }

  const coverPiece = pieces[0];
  const cr = coverPiece.img.pw / coverPiece.img.ph, cw = Math.min(52 * U, 150 * cr);
  const cover = `<section class="page cover"><div class="trim">
    <div class="recess" style="width:${num(cw + 2 * 1.6 * U)}mm;left:${num((TW - cw) / 2 - 1.6 * U)}mm"><img src="${coverPiece.img.url}" alt="" style="width:${num(cw)}mm;height:${num(cw / cr)}mm"></div>
    <div class="name">${esc(artist)}</div><div class="sub">Obra completa · ${esc(yearArg || years)}</div><div class="mark">FMB · ART</div></div></section>`;
  fs.writeFileSync(path.join(outDir, "capa.html"), doc(`${artist} · Capa`, cover));
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
