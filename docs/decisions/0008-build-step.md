---
title: "ADR-0008: Whether to introduce a build step"
status: proposed
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: none
related:
  - docs/engineering/ARCHITECTURE.md
  - docs/product/PLAN.md
---

# ADR-0008: Whether to introduce a build step

- **Status:** ⚠️ **PROPOSED**
- **Date raised:** 2026-08-22
- **Decided:** —

## Context

`index.html` loads React and ReactDOM from unpkg, then transpiles nine JSX files in the
browser with `@babel/standalone` on every page load.

Two problems, one of them free to fix:

1. **The React builds are `react.development.js` and `react-dom.development.js`.** Production
   is serving development React — larger payload, slower, and dev-mode warnings visible to
   any visitor. Swapping to `.production.min.js` is a two-line change with no downside and
   should happen regardless of how this ADR resolves (**PLAN QUA-02**).
2. **In-browser Babel** costs roughly 200 ms plus a large parser download before anything
   renders. Fixing this properly means a build step — which contradicts the "no build step"
   simplicity that `README.md` and ADR-0001 treat as a feature.

The count matters: nine JSX files, ~120 KB, is more than the two or three the original choice
assumed. The Sala de Experimentação quadrupled the transpile load.

## Options

### Option A — Keep in-browser Babel

Zero tooling. Edit a file, refresh, see it. This is genuinely valuable for the creative work,
which is iterative and visual. Costs every visitor ~200 ms and a large download.

### Option B — Vite build

Standard, fast, tree-shaken output. Costs a `npm run build` before every deploy, a `dist/`
output directory, and a change to how Vercel serves the site. The components are already
plain React, so the migration is mechanical.

### Option C — Precompile JSX as a commit step, keep everything else

A script transpiles `*.jsx` to `*.js` and commits the output. No bundler, no dist directory,
Vercel keeps serving the repo root. Keeps the deploy model intact and removes Babel from the
client. Cost: generated files in the repo, and a step that can be forgotten.

## Decision

—

## Consequences

To be written when decided.

## Revisit when

Decide in Sprint 1, alongside the image-weight work — both are page-load performance and
should be measured together.
