# FMB · ART — Museu

A tiny digital museum for kids' art. Each piece sits on a hallway wall; tapping it opens a close-up view with a bespoke "creative layer" — a custom animation, a palette pulled from the painting, and tap-to-discover hotspots.

> **Status:** static site. No build step. Deploys to Vercel as-is.

---

## 1. Local preview

Any static server works. Two easy options:

```bash
# Python (no install needed on macOS/Linux)
python3 -m http.server 8000

# or with npx
npx serve .
```

Then open <http://localhost:8000>.

> JSX is transpiled in the browser via `@babel/standalone`, so there is nothing to compile locally. Just edit the file and refresh.

---

## 2. Git + Vercel deploy

### One-time setup

```bash
# from the project folder
git init
git add .
git commit -m "Initial museum"
git branch -M main
git remote add origin git@github.com:<you>/<repo>.git
git push -u origin main
```

Then on Vercel:

1. **Add New… → Project** → import the GitHub repo.
2. Framework preset: **Other** (it's a static site).
3. Build command: *(leave empty)*.
4. Output directory: *(leave empty — Vercel serves the repo root)*.
5. Deploy.

Every `git push` to `main` triggers a new deploy. PRs get a preview URL automatically.

### File map

```
.
├── index.html              ← entry point (loads everything below)
├── gallery.css             ← all styling (themes, frames, layouts)
├── gallery-core.jsx        ← React components: Hallway, Frame, Modal
├── art-animations.jsx      ← per-artwork animations + interactive overlays
├── art-data.js             ← THE catalogue. Add new pieces here.
├── art-templates*.jsx      ← Sala de Experimentação effects (register into window.ANIMS)
├── art-painters*.jsx       ← "À Maneira dos Mestres" effects (same)
├── experimentation-room.jsx← the effects room UI
├── vercel.json             ← clean URLs + cache headers
├── intake/                 ← the tray: drop a photo + form here (see intake/README.md)
├── scripts/                ← optimize.js (photos) · docs-lint.js (documentation)
├── docs/                   ← roadmap, backlog, sprints, decisions — start at docs/README.md
└── assets/
    └── art/                ← original photos of the artworks
```

> **Script load order in `index.html` matters.** Each JSX file appends to shared globals
> (`window.ANIMS`, `window.TEMPLATE_LIBRARY`) and `gallery-core.jsx` must load last.
> There is no build step, so a bad order fails silently at runtime. See
> [`docs/engineering/ARCHITECTURE.md`](./docs/engineering/ARCHITECTURE.md) §2.

---

## 3. Adding new art (with Claude Code)

Photos go in **`intake/`**, not `assets/art/` — Claude Code moves them once processed.
The full procedure is in [`CLAUDE.md`](./CLAUDE.md); the parent-facing version (PT-PT) is in
[`intake/README.md`](./intake/README.md).

### A. Drop the photo in `intake/`

Lowercase, hyphenated, `<artist>-<short-noun>`:

```
intake/miguel-gato-cubista.jpeg
```

No need to resize or compress it — `scripts/optimize.js` runs automatically during intake.

### B. Fill the form

Copy `intake/TEMPLATE.md` to `intake/miguel-gato-cubista.md` (same base name as the photo)
and fill it in: artist, age, title hint, context, the child's own words.

### C. Ask Claude Code

> Processa a entrada `miguel-gato-cubista`

It optimizes the photo, reads its dimensions, samples the palette, drafts the entry in
`art-data.js`, picks an animation, places the discovery dots, and **shows you the diff for
approval** before committing.

### D. Verify

```bash
python -m http.server 8000
```

Open <http://localhost:8000>, click into the new frame, tap each dot, and watch the animation
through one full loop before approving.

---

## 4. The creative layer

Every artwork carries a small "creative layer" that makes it feel alive — the close-up animation, the palette swatches, the discovery dots, the signature line. The rules for this layer live in **[`ART_GUIDE.md`](./ART_GUIDE.md)**. Read it before adding new art.

The short version: each entry in `art-data.js` is a complete artwork "card" — photo + metadata + creative layer. Same schema, every time. That's how the museum stays visually coherent as new pieces land.

---

## 5. Common edits

| Want to… | Edit |
|---|---|
| Change wall colour / lighting | `gallery.css` → `:root` and `[data-theme="…"]` blocks |
| Reorder the hallway | `art-data.js` → `window.HALLWAY_ORDER` |
| Add an audio description | Drop the mp3 in `assets/audio/` and add one entry to `audio-data.js` (see its header) |
| Add an artist gallery | Nothing — a new `artist` value in `art-data.js` gets its own chip and `#/<artist>` route (`index.html`) |
| Add a theme tab | `index.html` → `THEMES` array + a new theme block in `gallery.css` |
| Tweak an animation | `art-animations.jsx` → the function named in the artwork's `anim` field |

---

## 6. Caveats

- **In-browser Babel.** First load transpiles JSX (~200ms). If the site ever feels slow, add a build step with Vite + React; the components are already plain React.
- **Image weight.** `scripts/optimize.js` (MozJPEG q=78, auto-rotate, resize ≤3000 px) runs automatically during intake — you do not run Squoosh by hand. Note that this still yields ~2.5 MB files, and the hallway currently ships **25 MB** of images; the platform's image pipeline is **PLT-10** (the prototype-only version, QUA-01, is retired — see `docs/product/PLAN.md` §6).
- **Case-sensitive paths.** Vercel is case-sensitive. Keep filenames lowercase to avoid surprises that only show up in production.

---

## 7. Planning & documentation

The plan, the product definition, and the decision log live in
**[`docs/`](./docs/README.md)**.

| Question | Doc |
|---|---|
| Where are we, what's next, and what's the full backlog? | [`docs/product/PLAN.md`](./docs/product/PLAN.md) |
| What is the product, and for whom? | [`docs/product/PLATFORM_DEFINITION.md`](./docs/product/PLATFORM_DEFINITION.md) |
| What does it look like? | [`docs/design/IDENTITY.md`](./docs/design/IDENTITY.md) |
| What's blocked on a decision? | [`docs/decisions/README.md`](./docs/decisions/README.md) |
| How does it actually work today? | [`docs/engineering/ARCHITECTURE.md`](./docs/engineering/ARCHITECTURE.md) |
| How do I keep docs from rotting? | [`docs/DOCUMENTATION_GUIDE.md`](./docs/DOCUMENTATION_GUIDE.md) |

```bash
node scripts/docs-lint.js
```

Checks front-matter, statuses, cross-references, index coverage, and review dates. Run it
before committing documentation changes.
