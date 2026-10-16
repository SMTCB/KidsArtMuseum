#!/usr/bin/env node
// AIS-05: deterministic palette extraction. Code, not a model: same photo in, same colours out.
//
//   node scripts/palette.js <photo>            propose bg + palette for a photo
//   node scripts/palette.js <photo> --json     machine-readable
//   node scripts/palette.js --snap [--write]   move each hand-picked swatch that is not in the photo to the
//                                              nearest colour that really is (same slot, so animations that read
//                                              palette[n] keep their role); --write edits art-data.js
//   node scripts/palette.js --audit            compare every artwork in art-data.js with what the
//                                              photo says (how far each hand-picked swatch is from a real colour)
//
// Method: shrink the photo, work in CIE Lab, drop paper-white / near-black / grey pixels, cluster
// with k-means (farthest-point start, no randomness), merge clusters that look alike, then snap each
// cluster to the most common REAL pixel colour in it (ART_GUIDE §3: sample, don't invent).
// It proposes; the owner approves, as with every other choice at intake.

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SIZE = 200;          // longest side after shrinking
const K = 16;              // clusters before merging
const MERGE_DE = 14;       // clusters closer than this (CIE76) are the same colour to a child
const MIN_SHARE = 0.008;   // a child's accent can be small and still be the point: 0.8% of usable pixels
const MAX_SWATCHES = 6;
const GROUND_DE = 16;      // a field this large is the paper the drawing sits on, not painting
const GROUND_SHARE = 0.4;  // ...if one colour covers at least this much of the usable pixels

// ---- colour maths -------------------------------------------------------------------------
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
function rgb2lab(r, g, b) {
  const R = lin(r), G = lin(g), B = lin(b);
  const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047;
  const Y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X), fy = f(Y), fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
const chroma = (lab) => Math.hypot(lab[1], lab[2]);
const dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const hex = (r, g, b) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex2lab = (h) => rgb2lab(...hex2rgb(h));

// ---- extraction ---------------------------------------------------------------------------
async function pixels(file) {
  const { data, info } = await sharp(file).rotate()
    .resize(SIZE, SIZE, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = [];
  for (let i = 0; i < data.length; i += 3) out.push([data[i], data[i + 1], data[i + 2]]);
  return out;
}

// Unusable as a swatch: paper, shadow, and neutral greys. (Deliberate greys, like the doily in
// LUNA, are the owner's call at intake: the audit shows when a grey was kept on purpose.)
function usable(lab) { return lab[0] > 12 && lab[0] < 93 && chroma(lab) > 6; }

function extract(px) {
  const pts = [];
  for (const p of px) {
    const lab = rgb2lab(...p);
    if (usable(lab)) pts.push({ rgb: p, lab });
  }
  if (pts.length < 50) return { swatches: [], usable: pts.length, total: px.length };

  // farthest-point initialisation from the pixel nearest the mean: deterministic
  const mean = [0, 1, 2].map((i) => pts.reduce((s, p) => s + p.lab[i], 0) / pts.length);
  let cents = [pts.reduce((b, p) => (dE(p.lab, mean) < dE(b.lab, mean) ? p : b)).lab.slice()];
  while (cents.length < K) {
    let far = null, fd = -1;
    for (const p of pts) {
      const d = Math.min(...cents.map((c) => dE(p.lab, c)));
      if (d > fd) { fd = d; far = p; }
    }
    if (fd < 6) break;
    cents.push(far.lab.slice());
  }
  let assign = new Array(pts.length).fill(0);
  for (let it = 0; it < 20; it++) {
    let moved = false;
    pts.forEach((p, i) => {
      let bi = 0, bd = Infinity;
      cents.forEach((c, j) => { const d = dE(p.lab, c); if (d < bd) { bd = d; bi = j; } });
      if (assign[i] !== bi) { assign[i] = bi; moved = true; }
    });
    cents = cents.map((c, j) => {
      const m = pts.filter((_, i) => assign[i] === j);
      return m.length ? [0, 1, 2].map((k) => m.reduce((s, p) => s + p.lab[k], 0) / m.length) : c;
    });
    if (!moved) break;
  }

  // clusters -> {lab, members}; merge look-alikes, biggest first
  let cl = cents.map((c, j) => ({ lab: c, members: pts.filter((_, i) => assign[i] === j) }))
    .filter((c) => c.members.length).sort((a, b) => b.members.length - a.members.length);
  const merged = [];
  for (const c of cl) {
    const into = merged.find((m) => dE(m.lab, c.lab) < MERGE_DE);
    if (into) { into.members = into.members.concat(c.members); }
    else merged.push({ lab: c.lab, members: c.members.slice() });
  }
  // Rank by presence AND punch: a vivid accent outranks an equally large muddy shadow.
  const score = (c) => (c.members.length / pts.length) * (1 + chroma(c.lab) / 30);
  const bySize = merged.slice().sort((a, b) => b.members.length - a.members.length);
  const ground = bySize[0].members.length / pts.length >= GROUND_SHARE ? bySize[0].lab : null;
  merged.sort((a, b) => score(b) - score(a));

  const swatches = merged
    .filter((c) => !ground || dE(c.lab, ground) > GROUND_DE)
    .filter((c) => c.members.length / pts.length >= MIN_SHARE)
    .slice(0, MAX_SWATCHES)
    .map((c) => {
      // snap to the most frequent real colour among the members nearest the centre
      const near = c.members.filter((p) => dE(p.lab, c.lab) < 8);
      const pool = near.length ? near : c.members;
      const count = new Map();
      for (const p of pool) { const k = hex(...p.rgb); count.set(k, (count.get(k) || 0) + 1); }
      const top = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0];
      return { hex: top, lab: hex2lab(top), share: c.members.length / pts.length };
    });
  return { swatches, usable: pts.length, total: px.length };
}

// bg: the strongest field. ART_GUIDE §3 rule 5: if it is very pale (L >= 80), take the most
// saturated neighbouring swatch so the white title does not vanish.
function pickBg(swatches) {
  if (!swatches.length) return null;
  let bg = swatches[0];
  if (bg.lab[0] >= 80) {
    const alt = swatches.filter((s) => s.lab[0] < 80).sort((a, b) => chroma(b.lab) - chroma(a.lab))[0];
    if (alt) bg = alt;
  }
  return bg;
}

async function propose(file) {
  const r = extract(await pixels(file));
  const bg = pickBg(r.swatches);
  const ordered = bg ? [bg, ...r.swatches.filter((s) => s !== bg)] : r.swatches;
  return {
    bg: bg && bg.hex,
    palette: ordered.map((s) => s.hex),
    shares: ordered.map((s) => Math.round(s.share * 100)),
    usableShare: Math.round((100 * r.usable) / r.total)
  };
}

// ---- audit: hand-picked vs. extracted -----------------------------------------------------
async function audit() {
  global.window = {};
  require(path.join(__dirname, "..", "art-data.js"));
  const root = path.join(__dirname, "..");
  let worst = [];
  console.log("obra".padEnd(16) + "bg  ΔE   swatches: ΔE to nearest colour that is really in the photo");
  for (const a of window.ART) {
    const file = path.join(root, a.src.replace(/photo\.jpeg$/, "thumb-960.jpeg"));
    const f = fs.existsSync(file) ? file : path.join(root, a.src);
    const r = extract(await pixels(f));
    const ext = r.swatches.map((s) => s.lab);
    const near = (h) => (ext.length ? Math.min(...ext.map((e) => dE(hex2lab(h), e))) : NaN);
    const ds = a.palette.map(near);
    const bgd = near(a.bg);
    console.log(a.id.padEnd(16) + bgd.toFixed(0).padStart(3) + "     " + ds.map((d) => d.toFixed(0).padStart(3)).join(" "));
    ds.forEach((d, i) => { if (d > 25) worst.push(`${a.id} ${a.palette[i]} (ΔE ${d.toFixed(0)})`); });
  }
  console.log(worst.length
    ? "\nHand-picked swatches far from anything the extractor found (ΔE > 25), worth a look:\n  " + worst.join("\n  ")
    : "\nEvery hand-picked swatch is within ΔE 25 of a colour the photo really contains.");
}

const SNAP_FROM = 25;   // only touch a swatch this far (ΔE) from any real colour
const SNAP_STEP = 30;   // a snap that moves the colour farther than this changes its meaning (a pen black into brown, a ball white into mud): leave it
const SNAP_MAX = 45;    // if even the nearest real colour is farther than this, the colour is not in the painting: leave it

async function snap(write) {
  global.window = {};
  const artFile = path.join(__dirname, "..", "art-data.js");
  require(artFile);
  let src = fs.readFileSync(artFile, "utf8");
  const root = path.join(__dirname, "..");
  for (const a of window.ART) {
    const f0 = path.join(root, a.src.replace(/photo\.jpeg$/, "thumb-960.jpeg"));
    const px = await pixels(fs.existsSync(f0) ? f0 : path.join(root, a.src));
    const labs = px.map((p) => ({ p, lab: rgb2lab(...p) }));
    const real = extract(px).swatches.map((s) => s.lab);
    const next = a.palette.slice();
    const notes = [];
    a.palette.forEach((h, i) => {
      const L = hex2lab(h);
      if (real.length && Math.min(...real.map((e) => dE(L, e))) <= SNAP_FROM) return;
      // the 0.4% of pixels nearest the intended colour; the most common real colour among them
      const ranked = labs.map((q) => [dE(L, q.lab), q.p]).sort((x, y) => x[0] - y[0]);
      const near = ranked.slice(0, Math.max(30, Math.floor(ranked.length * 0.004)));
      if (near[0][0] > SNAP_MAX) { notes.push(`${h} kept (nothing like it in the photo)`); return; }
      const count = new Map();
      for (const [, q] of near) { const k = hex(...q); count.set(k, (count.get(k) || 0) + 1); }
      const to = [...count.entries()].sort((x, y) => y[1] - x[1])[0][0];
      if (dE(L, hex2lab(to)) > SNAP_STEP || Math.abs(L[0] - hex2lab(to)[0]) > 15 || L[0] < 25 || L[0] > 85) { notes.push(`${h} kept (nearest real colour ${to} is a different colour)`); return; }
      if (!next.includes(to)) { next[i] = to; notes.push(`${h} -> ${to}`); }
    });
    const bg = a.bg === a.palette[0] || a.palette.includes(a.bg) ? next[a.palette.indexOf(a.bg)] : a.bg;
    if (notes.length || bg !== a.bg) console.log(a.id.padEnd(14) + notes.join("   ") + (bg !== a.bg ? `   bg ${a.bg} -> ${bg}` : ""));
    if (write && (notes.length || bg !== a.bg)) {
      const i0 = src.indexOf(`id: "${a.id}"`);
      const i1 = src.indexOf("dots:", i0);
      let seg = src.slice(i0, i1);
      seg = seg.replace(/palette:\s*\[[^\]]*\]/, "palette: " + JSON.stringify(next).replace(/","/g, '", "'));
      if (bg !== a.bg) seg = seg.replace(`bg: "${a.bg}"`, `bg: "${bg}"`);
      src = src.slice(0, i0) + seg + src.slice(i1);
    }
  }
  if (write) fs.writeFileSync(artFile, src);
}

(async () => {
  const args = process.argv.slice(2);
  if (args.includes("--audit")) return audit();
  if (args.includes("--snap")) return snap(args.includes("--write"));
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) { console.error("uso: node scripts/palette.js <foto> [--json] | --audit"); process.exit(2); }
  const r = await propose(file);
  if (args.includes("--json")) return console.log(JSON.stringify(r));
  console.log(`bg:      ${JSON.stringify(r.bg)},`);
  console.log(`palette: ${JSON.stringify(r.palette)},   // shares %: ${r.shares.join(", ")} (${r.usableShare}% of pixels usable)`);
})();
