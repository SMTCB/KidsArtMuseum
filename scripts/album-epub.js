/* livro.epub (POD-06): the album as a fixed-layout EPUB 3, to open in Livros (Apple Books) on an
   iPhone or iPad. Not a command: scripts/album.js calls it with the same pages livro.html turns.

   Each page is one XHTML document the size of the trimmed A4 (794 x 1123 CSS px); the printed page
   inside it is shifted by the bleed, as in livro.html. Livros shows two pages side by side when the
   device is held sideways and one when upright, and turns them as paper. The QR codes are links.
   The files are also left unpacked in <album>/epub/ to inspect, and the EPUB is zipped by hand
   (no dependency): an EPUB is a zip whose first entry is "mimetype", stored uncompressed. */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const { pathToFileURL } = require("url");
const sharp = require("sharp");

const VW = 794, VH = 1123; // 210 x 297 mm in CSS px

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
// The pages are written as HTML for the print; XHTML wants void elements closed, values on every
// attribute, and the SVG namespace on the QR codes
const xhtml = (html) => html.replace(/<br>/g, "<br/>").replace(/<img([^>]*?)\s*\/?>/g, "<img$1/>")
  .replace(/<svg /g, '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/ data-fit>/g, ' data-fit="">');

const SHEET_CSS = `html, body { margin: 0; width: ${VW}px; height: ${VH}px; overflow: hidden; }
.sheet { position: relative; width: ${VW}px; height: ${VH}px; overflow: hidden; color: var(--tinta); }
.sheet > .page { position: absolute; left: calc(var(--b) * -1); top: calc(var(--b) * -1); }
.sheet a { color: inherit; }\n`;

/**
 * dir     the album's folder (album/out/<slug>)
 * book    { title, sub, creator, slug }
 * css     the pages' stylesheet, fonts included as url(fonts/<file>)
 * fonts   the font files that stylesheet names
 * images  { <id>: jpeg Buffer }, named in the pages as ../images/<id>.jpeg
 * sheets  the pages in reading order: cover, inside of the cover, printed pages, inside of the back, back
 * toc     [{ label, i }]: i is an index into sheets
 * fit     the print's fitting script (fitPages)
 * coverId the work on the cover, used as the library thumbnail when there is no Chrome to draw the cover
 * chrome  Chrome or Edge, to draw the cover for the library thumbnail (optional)
 */
async function writeEpub({ dir, book, css, fonts, images, sheets, toc, fit, coverId, chrome }) {
  const stage = path.join(dir, "epub");
  fs.rmSync(stage, { recursive: true, force: true });
  const files = []; // [name inside the zip, Buffer]
  const add = (name, data) => {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf8");
    files.push([name, buf]);
    fs.mkdirSync(path.dirname(path.join(stage, name)), { recursive: true });
    fs.writeFileSync(path.join(stage, name), buf);
  };
  const file = (i) => `p/${String(i + 1).padStart(4, "0")}.xhtml`;

  add("mimetype", "application/epub+zip");
  add("META-INF/container.xml", `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`);
  // Older Livros reads these instead of the rendition metadata; "interactive" lets fit.js run
  add("META-INF/com.apple.ibooks.display-options.xml", `<?xml version="1.0" encoding="UTF-8"?>
<display_options><platform name="*"><option name="fixed-layout">true</option><option name="specified-fonts">true</option><option name="interactive">true</option></platform></display_options>`);

  add("OEBPS/style.css", css + SHEET_CSS);
  add("OEBPS/fit.js", `${fit}addEventListener("load", () => (document.fonts ? document.fonts.ready : Promise.resolve()).then(fitPages));\n`);
  for (const f of fonts) add(`OEBPS/fonts/${path.basename(f)}`, fs.readFileSync(f));
  for (const [id, buf] of Object.entries(images)) add(`OEBPS/images/${id}.jpeg`, buf);

  const title = `${esc(book.title)} · ${esc(book.sub)}`;
  sheets.forEach((body, i) => add(`OEBPS/${file(i)}`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="pt-PT" xml:lang="pt-PT">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=${VW}, height=${VH}"/><title>${title}</title>
<link rel="stylesheet" href="../style.css"/><script src="../fit.js"></script></head>
<body><div class="sheet">${xhtml(body)}</div></body></html>`));

  add("OEBPS/nav.xhtml", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="pt-PT" xml:lang="pt-PT">
<head><meta charset="UTF-8"/><title>${title}</title></head>
<body><nav epub:type="toc" id="toc"><h1>Índice</h1><ol>
${toc.map((t) => `<li><a href="${file(t.i)}">${esc(t.label)}</a></li>`).join("\n")}
</ol></nav>
<nav epub:type="landmarks" hidden=""><ol><li><a epub:type="cover" href="${file(0)}">Capa</a></li>
<li><a epub:type="bodymatter" href="${file(toc[1] ? toc[1].i : 0)}">${esc(book.title)}</a></li></ol></nav></body></html>`);

  // The library thumbnail: the cover page itself, drawn by Chrome; without Chrome, the cover's work
  let cover;
  if (chrome) {
    const png = path.join(dir, "capa-livros.png");
    try {
      execFileSync(chrome, ["--headless", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
        `--window-size=${VW},${VH}`, "--force-device-scale-factor=2", "--virtual-time-budget=10000",
        `--screenshot=${png}`, pathToFileURL(path.join(stage, "OEBPS", file(0))).href], { stdio: "ignore" });
      cover = await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    } catch { /* falls back below */ }
    fs.rmSync(png, { force: true });
  }
  if (!cover) cover = await sharp(images[coverId]).resize(1600, 1600, { fit: "inside" }).jpeg({ quality: 82 }).toBuffer();
  add("OEBPS/cover.jpeg", cover);

  // Spreads as in the printed book: covers alone, the inside of the cover on the left, page 1 on the right
  const last = sheets.length - 1;
  const side = (i) => (i === 0 || i === last ? "center" : i % 2 ? "left" : "right");
  const hash = crypto.createHash("md5").update(`fmbart:${book.slug}`).digest("hex");
  const uid = `urn:uuid:${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
  const manifest = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="css" href="style.css" media-type="text/css"/>`,
    `<item id="fit" href="fit.js" media-type="application/javascript"/>`,
    `<item id="cover-image" href="cover.jpeg" media-type="image/jpeg" properties="cover-image"/>`,
    ...fonts.map((f, i) => `<item id="font${i}" href="fonts/${path.basename(f)}" media-type="font/woff2"/>`),
    ...Object.keys(images).map((id) => `<item id="img-${id}" href="images/${id}.jpeg" media-type="image/jpeg"/>`),
    ...sheets.map((s, i) => `<item id="p${i + 1}" href="${file(i)}" media-type="application/xhtml+xml" properties="scripted${s.includes("<svg") ? " svg" : ""}"/>`)
  ];
  add("OEBPS/content.opf", `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="pt-PT"
  prefix="rendition: http://www.idpf.org/vocab/rendition/# ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:identifier id="uid">${uid}</dc:identifier>
  <dc:title>${esc(book.title)}</dc:title>
  <dc:creator>${esc(book.creator)}</dc:creator>
  <dc:publisher>FMB · ART</dc:publisher>
  <dc:language>pt-PT</dc:language>
  <dc:description>${esc(book.sub)}</dc:description>
  <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
  <meta property="rendition:layout">pre-paginated</meta>
  <meta property="rendition:orientation">auto</meta>
  <meta property="rendition:spread">landscape</meta>
  <meta property="ibooks:specified-fonts">true</meta>
  <meta name="cover" content="cover-image"/>
</metadata>
<manifest>
  ${manifest.join("\n  ")}
</manifest>
<spine>
  ${sheets.map((_, i) => `<itemref idref="p${i + 1}" properties="rendition:page-spread-${side(i)}"/>`).join("\n  ")}
</spine>
</package>`);

  const out = path.join(dir, "livro.epub");
  fs.writeFileSync(out, zip(files));
  return out;
}

// A plain zip: "mimetype" stored, everything else deflated (JPEG and WOFF2 stored: they do not shrink)
function zip(files) {
  const DATE = ((2026 - 1980) << 9) | (1 << 5) | 1; // fixed, so the same album gives the same bytes
  const local = [], central = [];
  let offset = 0;
  for (const [name, data] of files) {
    const store = name === "mimetype" || /\.(jpe?g|woff2)$/.test(name);
    const body = store ? data : zlib.deflateRawSync(data, { level: 9 });
    const crc = zlib.crc32(data), n = Buffer.from(name, "utf8");
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0, 6); h.writeUInt16LE(store ? 0 : 8, 8);
    h.writeUInt16LE(0, 10); h.writeUInt16LE(DATE, 12); h.writeUInt32LE(crc, 14);
    h.writeUInt32LE(body.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(n.length, 26); h.writeUInt16LE(0, 28);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0, 8);
    c.writeUInt16LE(store ? 0 : 8, 10); c.writeUInt16LE(0, 12); c.writeUInt16LE(DATE, 14); c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(body.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(n.length, 28);
    c.writeUInt32LE(offset, 42); // extra, comment, disk, attributes: 0
    local.push(h, n, body);
    central.push(c, n);
    offset += 30 + n.length + body.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, cd, end]);
}

module.exports = { writeEpub };
