#!/usr/bin/env node
/**
 * FMB · ART — production build (QUA-11, ADR-0017 layer 2)
 *
 * The source stays exactly as it is: index.html loads React (development) and Babel in the
 * browser, so `python -m http.server` still works with no build. This script turns that page
 * into a faster one in dist/:
 *   - every text/babel script (external .jsx and the inline one) is compiled ahead of time with
 *     esbuild, as a plain script, so the globals and load order do not change;
 *   - React and ReactDOM switch to the production builds; Babel is dropped;
 *   - everything else the page needs (css, data, assets) is copied unchanged.
 *
 * Vercel runs it (`vercel.json` buildCommand) and serves dist/.
 * Locally:  npm run build   then   npx serve dist   (or python -m http.server -d dist)
 */
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

const REACT = {
  "react.development.js": {
    file: "react.production.min.js",
    integrity: "sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z"
  },
  "react-dom.development.js": {
    file: "react-dom.production.min.js",
    integrity: "sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1"
  }
};

const compile = (code, name) =>
  esbuild.transformSync(code, {
    loader: "jsx",
    sourcefile: name,
    // Whitespace and syntax only: top-level names must survive, the files share globals.
    minifyWhitespace: true,
    minifySyntax: true,
    target: "es2019"
  }).code;

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const copy = new Set(["assets"]);
let compiled = 0;

// React: development -> production (the pinned version stays the same)
html = html.replace(
  /<script src="(https:\/\/unpkg\.com\/react(?:-dom)?@[\d.]+\/umd\/)(react(?:-dom)?\.development\.js)"[^>]*><\/script>/g,
  (m, base, file) => {
    const p = REACT[file];
    return `<script src="${base}${p.file}" integrity="${p.integrity}" crossorigin="anonymous"></script>`;
  }
);

// Babel: no longer needed
html = html.replace(/<script src="https:\/\/unpkg\.com\/@babel\/standalone[^"]*"[^>]*><\/script>\s*/g, "");

// External JSX: compile to dist/<name>.js, point the tag at it
html = html.replace(
  /<script type="text\/babel" src="([^"]+\.jsx)"><\/script>/g,
  (m, src) => {
    const out = src.replace(/\.jsx$/, ".js");
    fs.mkdirSync(path.dirname(path.join(dist, out)), { recursive: true });
    fs.writeFileSync(path.join(dist, out), compile(fs.readFileSync(path.join(root, src), "utf8"), src));
    compiled++;
    return `<script src="${out}"></script>`;
  }
);

// Inline JSX
html = html.replace(
  /<script type="text\/babel">([\s\S]*?)<\/script>/g,
  (m, code) => {
    compiled++;
    return `<script>${compile(code, "index.html (inline)")}</script>`;
  }
);

if (/text\/babel|@babel\/standalone/.test(html)) {
  console.error("Build failed: a Babel script is still referenced in the output page.");
  process.exit(1);
}

// Everything else the page references locally (css, plain js) is copied as is
for (const m of html.matchAll(/(?:src|href)="([^"#?:]+\.(?:css|js))"/g)) copy.add(m[1]);

fs.writeFileSync(path.join(dist, "index.html"), html);
for (const rel of copy) {
  const from = path.join(root, rel);
  if (!fs.existsSync(from)) continue; // compiled .js already written above
  fs.cpSync(from, path.join(dist, rel), { recursive: true });
}


// Share pages (layer 2): /o/<id> carries the Open Graph tags that make a pasted link unfurl as
// the framed artwork, then sends the visitor on to the real route. Crawlers do not run scripts.
const ORIGIN = "https://fmbart.vercel.app";
const sandbox = { window: {} };
require("vm").runInNewContext(fs.readFileSync(path.join(root, "art-data.js"), "utf8"), sandbox);
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
fs.mkdirSync(path.join(dist, "o"), { recursive: true });
for (const a of sandbox.window.ART) {
  const title = `${a.title} · ${a.signature || a.artist}`;
  const desc = `${a.signature || a.artist}, ${a.age} anos. Uma obra do museu FMB · ART.`;
  const img = `${ORIGIN}/${a.src.replace(/photo\.jpeg$/, "thumb-960.jpeg")}`;
  const dest = `/#/todos/${a.id}`;
  fs.writeFileSync(path.join(dist, "o", a.id + ".html"), `<!doctype html>
<html lang="pt-PT"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="FMB · ART">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${ORIGIN}/o/${a.id}">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${dest}">
<link rel="canonical" href="${ORIGIN}/o/${a.id}">
</head><body><script>location.replace(${JSON.stringify(dest)});</script>
<p><a href="${dest}">Abrir ${esc(a.title)}</a></p></body></html>
`);
}

const size = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) =>
  n + (e.isDirectory() ? 0 : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`Built dist/: ${compiled} scripts compiled, ${copy.size} entries copied, ` +
  `${Math.round(size(dist) / 1024)} KB at the top level (assets excluded).`);
