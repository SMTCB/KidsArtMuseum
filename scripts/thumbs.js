#!/usr/bin/env node
/**
 * FMB · ART — thumbnails for the wall and hallway (QUA-12, ADR-0017 layer 4)
 *
 * For every assets/art/<id>/photo.jpeg writes thumb-480.jpeg and thumb-960.jpeg (width in px,
 * never upscaled, MozJPEG q=72) next to it. gallery-core.jsx builds the srcset from them, so the
 * wall loads about 100 KB instead of the 2-5 MB original. The zoom view still uses photo.jpeg.
 *
 * Usage:  npm run thumbs          (only what is missing or older than its photo)
 *         npm run thumbs -- --all (regenerate everything)
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SIZES = [480, 960];
const dir = path.join(__dirname, "..", "assets", "art");
const all = process.argv.includes("--all");

(async () => {
  let made = 0;
  for (const id of fs.readdirSync(dir)) {
    const photo = path.join(dir, id, "photo.jpeg");
    if (!fs.existsSync(photo)) continue;
    for (const w of SIZES) {
      const out = path.join(dir, id, `thumb-${w}.jpeg`);
      if (!all && fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(photo).mtimeMs) continue;
      const info = await sharp(photo).rotate()
        .resize({ width: w, withoutEnlargement: true })
        .jpeg({ quality: 72, mozjpeg: true }).toFile(out);
      console.log(`${id}/thumb-${w}.jpeg  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KB`);
      made++;
    }
  }
  console.log(made ? `\n${made} thumbnails written.` : "Thumbnails already up to date.");
})();
