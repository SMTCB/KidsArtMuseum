# Instructions for Claude Code

This is a static digital museum of kids' art. Deploys to Vercel from `main`.

## Before doing anything

1. **Read [`ART_GUIDE.md`](./ART_GUIDE.md) in full.** It is the visual identity for the museum and the only spec for what an artwork entry looks like. Treat it as binding.
2. **Read [`README.md`](./README.md)** for the file map and the deploy flow.
3. **Check [`docs/README.md`](./docs/README.md)** — the documentation index. For anything beyond adding a single artwork, start there. In particular [`docs/decisions/README.md`](./docs/decisions/README.md) lists what is currently blocked on an undecided question.

---

## Most common task: process a new artwork from the intake tray

The user drops a photo and a filled-in form into `intake/`. They then say something like:

> "Processa a entrada `miguel-gato-cubista`"

### Steps

1. **Read the intake form** (`intake/<name>.md`). Extract: photo filename, artist, age, year, title suggestion, context, kid's description, animation hints.
2. **Confirm the photo** is in `intake/` with the correct naming convention (ART_GUIDE §7). If not, ask.
3. **Optimize the photo** — run this automatically before doing anything else with the image.
   The user never runs this; it is Claude's job:
   ```powershell
   # Install Sharp if node_modules is absent (first time only):
   if (-not (Test-Path node_modules)) { npm install }
   # Optimize:
   node scripts/optimize.js <filename>
   ```
   This auto-rotates (EXIF), resizes to ≤ 3000px, and compresses with MozJPEG q=78.
   The output is `intake/<name>.jpeg` — use that path for all subsequent steps.
4. **Read image dimensions** using PowerShell:
   ```powershell
   Add-Type -AssemblyName System.Drawing
   $img = [System.Drawing.Image]::FromFile("$PWD\intake\<filename>")
   "$($img.Width) x $($img.Height)"
   $img.Dispose()
   ```
5. **Sample dominant colours** — inspect the image visually (use the Read tool to view it) and pick 3–6 hex colours for `palette`. The `bg` must be the single most dominant non-white, non-black colour and must also appear in `palette`.
6. **Draft the new entry** in `window.ART` (`art-data.js`) following the schema in ART_GUIDE §1. Every required field, no inventing new keys.
7. **Pick an `anim` routine** from ART_GUIDE §5a. Invent a new one only if no existing routine fits (follow §5b exactly if you do).
   > `window.ANIMS` also holds the 33 Sala de Experimentação effects. They are **not** eligible
   > as an artwork `anim` (ART_GUIDE §5c, FND-07); only the routines in §5a are.
   > If none of them is a genuine fit, use the `animar-obra` skill to design one for this drawing.
8. **Place 3–4 discovery dots** (ART_GUIDE §6). Coordinates are percentages of the image. Spread them; no two within 15% on either axis.
9. **Explain your choices** to the user: which animation and why, what the palette is, what the dots point at. Ask for approval before committing.
10. **On approval:**
   - File the photo: `intake/<filename>` → `assets/art/<id>/photo.jpeg` (ADR-0016)
   - If the intake has an audio description: `intake/<name>.mp3` → `assets/art/<id>/audio.mp3`, plus one entry in `audio-data.js`
   - Append the new `id` to `window.HALLWAY_ORDER` at the bottom of `art-data.js`
   - Add a slot for it in `WALL_LAYOUT` in `gallery-core.jsx` (otherwise the wall theme hides it)
   - Archive the form: `intake/<name>.md` → `intake/processed/<name>.md`
   - Commit with a short message, e.g. `Add: Gato Cubista (Miguel)`
   - Push to `main` (Vercel auto-deploys)

### Walk ART_GUIDE §9 checklist before committing

---

## Adding art without the intake tray

If the user hands you a photo directly (already in `assets/art/<id>/photo.jpeg`) and gives context inline:

1. Confirm the photo is at `assets/art/<id>/photo.jpeg`.
2. Read dimensions and sample palette.
3. Draft the entry in `art-data.js`.
4. Pick `anim`, place dots.
5. Walk §9 checklist.
6. Commit and push.

---

## Things to never do

- Don't add fields to the artwork schema. If something is missing, propose it to the user first.
- Don't change fonts, themes, frame chrome, or the brand mark (`FMB · ART`) when adding a piece.
- Don't auto-enhance, re-tint, or filter the source photo. The painting is the painting.
- Don't write a long animation that combines three effects. One idea per routine.
- Don't add emoji to UI copy. Imagery does the work.
- Don't switch the UI to English. The museum is in Portuguese (PT-PT).

---

## Verifying changes

There is no build step. Serve locally with `python -m http.server 8000` and open <http://localhost:8000>. Click into the new frame, tap each dot, watch the animation through one full loop. If anything looks wrong, fix it before committing — Vercel auto-deploys from `main`.

---

## Commit messages

Keep them short and human:

```
Add: Gato Cubista (Miguel)
Tweak: warmer bg on Era Uma Vez
Fix: dot coords on Auto-Retrato
```

When the work comes from the backlog, lead with the item ID:

```
QUA-01: thumbnails + srcset for hallway frames
FND-06: fix art-data.js header comment
```

---

## Documentation is part of the work

The rules live in [`docs/DOCUMENTATION_GUIDE.md`](./docs/DOCUMENTATION_GUIDE.md). They exist
because this project once had two contradictory roadmaps, two AI strategies 20× apart on
cost, and 155 KB of untracked strategy work on a single laptop. Do not let that come back.

**Before ending any task that changed behaviour or made a decision:**

1. **Update the doc that owns the topic.** One canonical doc per topic — the table is in
   `DOCUMENTATION_GUIDE.md` §2. Link to it rather than restating its facts elsewhere.
2. **Record decisions as ADRs.** Anything expensive to reverse goes in `docs/decisions/`,
   numbered and dated. To change a decided ADR, write a new one that supersedes it — never
   edit the original.
3. **Tick the item** in `docs/product/PLAN.md` — §6 for the catalogue entry, §7 for the sprint.
4. **Run the linter:**
   ```bash
   node scripts/docs-lint.js
   ```

### Rules that are easy to break by accident

- **Never delete a doc.** Move it to `docs/archive/` with a tombstone naming its successor.
- **Never copy a cost, estimate, or phase plan between docs.** Link. Copied facts are exactly
  how the 20× cost discrepancy happened.
- **Never add a doc without adding it to `docs/README.md`.** Unindexed means invisible.
- **`docs/engineering/ARCHITECTURE.md` describes what runs today**; `TARGET_ARCHITECTURE.md`
  describes a proposal that is not built. Do not blur them.
- **If asked to do work that an open ADR blocks, say so** rather than picking an answer
  silently. `docs/decisions/README.md` lists what is open.
