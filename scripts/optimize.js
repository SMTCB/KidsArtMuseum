#!/usr/bin/env node
/**
 * FMB · ART — Photo optimizer
 * Replaces the manual Squoosh step in the intake pipeline.
 *
 * Usage:
 *   node scripts/optimize.js <filename>
 *   node scripts/optimize.js miguel-gato.jpeg
 *   node scripts/optimize.js miguel-gato.HEIC     ← iPhone photos need 'sharp' with heif support
 *
 * What it does:
 *   1. Auto-rotates the image from its EXIF orientation (fixes sideways phone photos)
 *   2. Resizes so the long edge ≤ 3000px — never upscales
 *   3. Compresses with MozJPEG quality 78 (same codec as Squoosh)
 *   4. Saves as intake/<name>.jpeg, prints dimensions + size savings
 *   5. Deletes the original if it had a different extension (e.g. .png, .jpg → .jpeg)
 *
 * Run once to install: npm install
 */

const sharp = require("sharp");
const path  = require("path");
const fs    = require("fs");

// ── Args ──────────────────────────────────────────────────────────────────────
const [,, input] = process.argv;

if (!input) {
  console.error("\nUsage: node scripts/optimize.js <photo-filename-in-intake/>");
  console.error("       node scripts/optimize.js miguel-gato.jpeg\n");
  process.exit(1);
}

const inputPath = path.join("intake", input);

if (!fs.existsSync(inputPath)) {
  console.error(`\nNot found: ${inputPath}`);
  console.error("Make sure the file is in the intake/ folder.\n");
  process.exit(1);
}

// ── Validate naming convention ────────────────────────────────────────────────
const baseName = path.basename(input, path.extname(input));

if (!/^[a-z][a-z0-9-]+$/.test(baseName)) {
  console.warn("\n⚠  Filename should be lowercase with hyphens only.");
  console.warn(`   Got: "${baseName}"`);
  console.warn("   Rename it before committing (e.g. miguel-gato-cubista).\n");
}

const outputPath = path.join("intake", baseName + ".jpeg");
const tempPath   = path.join("intake", baseName + ".__tmp__.jpeg");
const sizeBefore = fs.statSync(inputPath).size;

// ── Process ───────────────────────────────────────────────────────────────────
console.log(`\nA processar ${input}…`);

// Sharp cannot read and write the same file — use a temp path, then rename.
sharp(inputPath)
  .rotate()                          // honour EXIF orientation (phone photos)
  .resize(3000, 3000, {
    fit: "inside",                   // never crop
    withoutEnlargement: true         // never upscale
  })
  .jpeg({ quality: 78, mozjpeg: true })
  .toFile(tempPath)
  .then((info) => {
    // Atomically replace: delete original (if different path), move temp → output
    if (path.resolve(inputPath) !== path.resolve(outputPath) && fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }
    fs.renameSync(tempPath, outputPath);

    const sizeAfter = fs.statSync(outputPath).size;
    const savedPct  = Math.round((1 - sizeAfter / sizeBefore) * 100);
    const savedKB   = Math.round((sizeBefore - sizeAfter) / 1024);

    console.log(`\n✓  ${outputPath}`);
    console.log(`   ${info.width} × ${info.height} px`);
    console.log(
      `   ${Math.round(sizeBefore / 1024)} KB → ${Math.round(sizeAfter / 1024)} KB` +
      `  (poupou ${savedKB} KB · −${savedPct}%)`
    );

    console.log(`\nPróximo passo: preenche intake/${baseName}.md e diz ao Claude Code para processar.\n`);
  })
  .catch((err) => {
    console.error("\nErro ao processar a imagem:", err.message);
    if (err.message.includes("heif") || err.message.includes("HEIC")) {
      console.error("Ficheiros HEIC (iPhone): converte para JPEG primeiro nas Fotos do iPhone");
      console.error("ou usa: https://heictojpg.com\n");
    }
    process.exit(1);
  });
