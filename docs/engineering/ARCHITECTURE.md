---
title: Architecture (current state)
status: canonical
owner: SMTCB
last_reviewed: 2026-10-14
review_cycle: 90d
related:
  - docs/engineering/TARGET_ARCHITECTURE.md
  - docs/decisions/0001-static-first-architecture.md
  - docs/decisions/0003-github-as-source-of-truth.md
---

# Architecture — current state

**How the system works today, 2026-08-22.** Verified against the running site, not inferred
from plans.

For where it might go, see `TARGET_ARCHITECTURE.md` — that document describes a *proposed*
future that depends on undecided ADRs. Do not confuse the two. This file is the one that is
true.

---

## 1. The whole system

```
GitHub (SMTCB/KidsArtMuseum, branch: main)
  │  source of truth for code, artwork metadata, and photos   [ADR-0003]
  ▼
Vercel  ── runs `npm run build` (scripts/build.js, esbuild), serves dist/, auto-deploys on push
          (one exception: `api/comments.js`, a Function backed by Upstash Redis — ADR-0015)
  ▼
Browser ── React 18 production build via unpkg CDN
           9 JSX files compiled ahead of time, no Babel in production      [QUA-11, ADR-0017]
           no database, no auth                                            [ADR-0001]
```

Locally the source page still works with no build (`python -m http.server`): it loads React
development and Babel in the browser. `scripts/build.js` rewrites that page for production and
changes nothing else: same globals, same load order. Running cost ≈ $0/month.

## 2. Load order — and why it is fragile

`index.html` loads scripts in an order that **matters**, because each JSX file mutates
shared globals:

| # | File | Effect |
|---|---|---|
| 1 | `art-data.js` | Defines `window.ART` (11 artworks) and `window.HALLWAY_ORDER` |
| 2 | `art-animations.jsx` | Creates `window.ANIMS` with **11** bespoke routines |
| 3–7 | `art-templates{,-3,-4}.jsx`, `art-painters{,-2}.jsx` | `Object.assign` **33** more effects onto `window.ANIMS`, and build `window.TEMPLATE_LIBRARY` |
| 8 | `experimentation-room.jsx` | Reads `TEMPLATE_LIBRARY` + `ANIMS` |
| 9 | `gallery-core.jsx` | The shell — **must be last** |

Two consequences worth knowing before editing:

- **`window.ANIMS` holds more keys than an artwork may use.** `gallery-core.jsx` resolves an
  artwork's animation with `window.ANIMS[art.anim]`, so the 33 experimentation effects are
  technically valid values. They are **not** eligible (`ART_GUIDE.md` §5c, FND-07), and
  `scripts/docs-lint.js` fails if an `anim` is outside the §5a table.
- **Reordering the script tags breaks the site**, with no error at build time because the
  build only compiles each file on its own. The failure is a blank frame at runtime.

## 3. Data model

`art-data.js` — a plain `window.ART` array. Schema is fixed and binding: `ART_GUIDE.md` §1.

```js
{ id, title, artist, age, year, signature, src, w, h, bg, palette, anim,
  medium?, interactive?, dots: [{ x, y, label, detail }] }
```

`window.HALLWAY_ORDER` is an array of ids controlling wall sequence.

> The header comment in `art-data.js` is wrong on two counts — it documents an `aspect`
> field that does not exist, and points `anim` at the wrong file. PLAN **FND-06**.

## 4. Assets

`assets/art/<id>/` — 13 photos, one folder per artwork (ADR-0016), **25 MB total**, committed to git.

Photos are served at full resolution regardless of display size; there is no `srcset` and no
thumbnail derivative. Files range from 0.3 MB to 4.5 MB, and 8 of 12 exceed 1.3 MB. The
hallway therefore downloads roughly 25 MB to render eleven thumbnails. PLAN **PLT-10** (its prototype-only predecessor QUA-01 is retired).

Because photos live in git, repo size only ever grows — history cannot be pruned without a
rewrite. Relevant to ADR-0006.

## 5. Intake pipeline

```
intake/<name>.jpeg + intake/<name>.md
  → scripts/optimize.js   (sharp: EXIF auto-rotate, resize ≤3000px, MozJPEG q=78)
  → Claude Code reads the form + photo, samples palette, picks anim, places dots
  → appends to art-data.js, appends id to HALLWAY_ORDER
  → human approves the diff                                   [relevant to ADR-0009]
  → photo is filed at assets/art/<id>/photo.jpeg, form archives to intake/processed/
  → commit + push → Vercel deploys (~30 s)
```

Two caveats: `intake/processed/` is empty despite 11 artworks, so the archival step has never
run (PLAN **FND-08**); and q=78 at ≤3000 px still yields ~2.5 MB files, which is what
QUA-01 addresses.

Full operating procedure: `CLAUDE.md`.

## 6. Deployment

`vercel.json` handles clean URLs and cache headers. `.vercelignore` keeps `intake/` off the
public site. Push to `main` deploys; PRs get preview URLs.

## 7. Known weaknesses

Each is tracked as a backlog item — this list exists so they are visible in one place rather
than only as tickets.

| Weakness | Impact | Item |
|---|---|---|
| 25 MB of full-resolution images | Slow first load, worsens per artwork | QUA-01 |
| Development React builds in production | Larger payload, dev warnings to visitors | QUA-02 |
| Runtime JSX transpile, 9 files | ~200 ms + parser download before first paint | QUA-03 / ADR-0008 |
| No tests, no CI | Every change verified by eye | QUA-04 |
| Load-order coupling via globals | Silent runtime breakage on reorder | §2 above |
| Sala effects share the `ANIMS` lookup with artwork routines | A wrong `anim` renders a filter | Guarded by docs-lint (FND-07) |
| Photos in git are permanent | Repo grows monotonically | ADR-0006 |
| PAT in `.git/config` | Credential exposure on any copy or screen share | FND-02 |
