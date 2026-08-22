#!/usr/bin/env node
/**
 * docs-lint.js — enforces the rules in docs/DOCUMENTATION_GUIDE.md.
 *
 *   node scripts/docs-lint.js            check everything
 *   node scripts/docs-lint.js --stale    only list documents past their review date
 *   node scripts/docs-lint.js --quiet    errors only, no summary
 *
 * Exits non-zero on error so it can gate a commit or a CI job.
 * No dependencies — deliberately. The doc system must not rot because npm did.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DOCS = path.join(ROOT, "docs");
const INDEX = path.join(DOCS, "README.md");

const VALID_STATUS = [
  "canonical", "draft", "proposed", "accepted",
  "reference", "superseded", "archived"
];
const REQUIRED = ["title", "status", "owner", "last_reviewed"];

const args = process.argv.slice(2);
const staleOnly = args.includes("--stale");
const quiet = args.includes("--quiet");

const errors = [];
const warnings = [];
const docs = [];

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

/** Minimal YAML front-matter reader: scalars, and `- ` / `[a, b]` lists. */
function parseFrontMatter(raw) {
  // Normalise line endings first. A CRLF file would otherwise parse as having no
  // keys at all: in a JS regex, a carriage return counts as a line terminator, so
  // `.` will not match it and `$` (without /m) will not match before it — which
  // makes every `key: value` line silently fail to match.
  const text = raw.replace(new RegExp(String.fromCharCode(13), "g"), "");
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return null;

  const body = text.slice(4, end);
  const data = {};
  let currentKey = null;

  for (const line of body.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && currentKey) {
      (data[currentKey] = data[currentKey] || []).push(strip(listItem[1]));
      continue;
    }

    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) continue;

    const [, key, rawValue] = kv;
    const value = rawValue.trim();
    currentKey = key;

    if (value === "") {
      data[key] = [];
    } else if (value.startsWith("[")) {
      data[key] = value.replace(/^\[|\]$/g, "").split(",")
        .map(strip).filter(Boolean);
      currentKey = null;
    } else {
      data[key] = strip(value);
      currentKey = null;
    }
  }
  return data;
}

const strip = (s) => s.trim().replace(/^["']|["']$/g, "");

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".md")) docs.push(full);
  }
}

function daysSince(dateStr) {
  const then = Date.parse(dateStr);
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
}

function cycleDays(cycle) {
  if (!cycle || cycle === "none") return null;
  const m = String(cycle).match(/^(\d+)d$/);
  return m ? parseInt(m[1], 10) : null;
}

// ---------------------------------------------------------------- checks

if (!fs.existsSync(DOCS)) {
  console.error("No docs/ directory found.");
  process.exit(1);
}

walk(DOCS);

const indexText = fs.existsSync(INDEX) ? fs.readFileSync(INDEX, "utf8") : "";
let staleCount = 0;

for (const file of docs) {
  const name = rel(file);
  const text = fs.readFileSync(file, "utf8");
  const isTemplate = path.basename(file) === "ADR-TEMPLATE.md";

  const fm = parseFrontMatter(text);
  if (!fm) {
    errors.push(`${name}: missing YAML front-matter (see DOCUMENTATION_GUIDE.md §1)`);
    continue;
  }

  for (const key of REQUIRED) {
    if (!fm[key]) errors.push(`${name}: front-matter missing required key '${key}'`);
  }

  if (fm.status && !VALID_STATUS.includes(fm.status)) {
    errors.push(
      `${name}: status '${fm.status}' is not one of ${VALID_STATUS.join(", ")}`
    );
  }

  // Rule 4: a superseded doc must name its successor, and that file must exist.
  if (fm.status === "superseded") {
    if (!fm.superseded_by) {
      errors.push(`${name}: status is 'superseded' but no 'superseded_by' is set`);
    } else if (!fs.existsSync(path.join(ROOT, fm.superseded_by))) {
      errors.push(`${name}: superseded_by points at a missing file '${fm.superseded_by}'`);
    }
  }

  // Referenced paths in supersedes/related must resolve.
  for (const key of ["supersedes", "related"]) {
    const list = Array.isArray(fm[key]) ? fm[key] : (fm[key] ? [fm[key]] : []);
    for (const target of list) {
      if (!fs.existsSync(path.join(ROOT, target))) {
        warnings.push(`${name}: ${key} references a missing file '${target}'`);
      }
    }
  }

  // Rule: every doc appears in an index — either docs/README.md or the
  // README.md of its own folder (e.g. decisions/README.md lists the ADRs).
  const base = path.basename(file);
  const localIndex = path.join(path.dirname(file), "README.md");
  const localText = (base !== "README.md" && fs.existsSync(localIndex))
    ? fs.readFileSync(localIndex, "utf8")
    : "";

  if (file !== INDEX && !isTemplate &&
      !indexText.includes(base) && !localText.includes(base)) {
    warnings.push(
      `${name}: not listed in docs/README.md or ${rel(localIndex)} — an unindexed doc does not exist`
    );
  }

  // Review freshness.
  const age = fm.last_reviewed ? daysSince(fm.last_reviewed) : null;
  if (fm.last_reviewed && age === null) {
    errors.push(`${name}: last_reviewed '${fm.last_reviewed}' is not a valid date (use YYYY-MM-DD)`);
  }
  const limit = cycleDays(fm.review_cycle);
  if (age !== null && limit !== null && age > limit) {
    staleCount++;
    warnings.push(
      `${name}: last reviewed ${age}d ago, cycle is ${fm.review_cycle} — needs a review`
    );
  }
}

// ---------------------------------------------------------------- report

if (staleOnly) {
  const stale = warnings.filter((w) => w.includes("needs a review"));
  if (!stale.length) console.log("All documents are within their review cycle.");
  else stale.forEach((w) => console.log("  " + w));
  process.exit(0);
}

if (errors.length) {
  console.error(`\n${errors.length} error${errors.length > 1 ? "s" : ""}:`);
  errors.forEach((e) => console.error("  ✗ " + e));
}

if (warnings.length && !quiet) {
  console.warn(`\n${warnings.length} warning${warnings.length > 1 ? "s" : ""}:`);
  warnings.forEach((w) => console.warn("  ! " + w));
}

if (!quiet) {
  console.log(
    `\n${docs.length} documents checked · ${errors.length} errors · ` +
    `${warnings.length} warnings · ${staleCount} past review`
  );
}

if (!errors.length && !warnings.length) console.log("Documentation is in good shape.");

process.exit(errors.length ? 1 : 0);
