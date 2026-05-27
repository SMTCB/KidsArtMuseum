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
├── vercel.json             ← clean URLs + cache headers
└── assets/
    └── art/                ← original photos of the artworks
```

---

## 3. Adding new art (with Claude Code)

This is the workflow that keeps the museum consistent every time you add a piece.

### A. Drop the photo

Put the original photo in `assets/art/`. Use a stable, lowercase, hyphenated filename:

```
assets/art/miguel-cubist-cat.jpeg
```

### B. Ask Claude Code

Open the repo in Claude Code and say something like:

> Add a new artwork. Photo: `assets/art/miguel-cubist-cat.jpeg`. Artist: Miguel, age 6, year 2026. Title: "Gato Cubista". Style notes: bold black outlines, mostly blues and oranges. Make me 3–4 discovery dots and pick the animation routine that fits best.

Claude Code should then:

1. Read `ART_GUIDE.md` (the single source of truth for the creative layer).
2. Sample the photo's palette and dimensions.
3. Append a new entry to `window.ART` in `art-data.js`.
4. Add the new `id` to `window.HALLWAY_ORDER` (or insert it at a chosen position).
5. If a brand-new animation routine is needed, add a function in `art-animations.jsx` and register it in the `ANIMATIONS` map.

### C. Verify, commit, push

```bash
# preview locally
python3 -m http.server 8000

# when happy
git add .
git commit -m "Add: Gato Cubista"
git push
```

Vercel rebuilds the live site in ~30 seconds.

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
| Add a theme tab | `index.html` → `THEMES` array + a new theme block in `gallery.css` |
| Tweak an animation | `art-animations.jsx` → the function named in the artwork's `anim` field |

---

## 6. Caveats

- **In-browser Babel.** First load transpiles JSX (~200ms). If the site ever feels slow, add a build step with Vite + React; the components are already plain React.
- **Image weight.** Photos can be 3–5 MB. Run them through [Squoosh](https://squoosh.app) (MozJPEG, q=78) before committing to keep the repo lean and the gallery snappy.
- **Case-sensitive paths.** Vercel is case-sensitive. Keep filenames lowercase to avoid surprises that only show up in production.
