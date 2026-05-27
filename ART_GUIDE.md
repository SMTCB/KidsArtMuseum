# Visual Identity & Creative Layer Guide

> **Audience:** humans + Claude Code.
> **Purpose:** every new artwork added to the museum should *feel like it belongs*. This document is the single source of truth for what "belonging" means here.

---

## 1. The shape of an artwork

Every piece is one entry in `window.ART` (inside `art-data.js`). The schema is fixed; if you add a piece, you fill in **every** field — no exceptions, no inventing new top-level keys.

```js
{
  id:        "kebab-case-id",        // unique, used in URLs and HALLWAY_ORDER
  title:     "Título da Obra",        // Portuguese, sentence-case, may include parenthetical
  artist:    "Miguel" | "Manuel" | "Muna",  // child's first name
  age:       6,                       // age at time of making
  year:      2026,                    // year made
  signature: "Miguel Miró",           // shown under title — see §4
  src:       "assets/art/<file>.jpeg",
  w:         3648,                    // original pixel width
  h:         4799,                    // original pixel height
  bg:        "#1a5a9a",               // single dominant colour (see §3)
  palette:   ["#…", "#…", "#…"],      // 3–6 swatches (see §3)
  anim:      "miro",                  // key into window.ANIMS (see §5)
  medium:    "Barro e palitos",       // OPTIONAL — only if non-paint (clay, collage…)
  interactive: "paint-rainbow",       // OPTIONAL — only if anim is interactive
  dots: [                             // 3–4 discovery hotspots (see §6)
    { x: 32, y: 22, label: "Olho amarelo", detail: "Um olho que pisca" }
  ]
}
```

Then append the new `id` to `window.HALLWAY_ORDER` at the bottom of the file.

---

## 2. Tone of voice

The museum is in **Portuguese (PT-PT)**, written for and about children. The voice is:

- **Warm, never precious.** "Olho que pisca" not "Receptáculo ocular dinâmico".
- **Concrete.** Describe what a 6-year-old sees: "um gato cor-de-rosa", not "uma figura felina".
- **Short.** Titles ≤ 6 words. Dot labels ≤ 3 words. Dot details ≤ 6 words.
- **No emoji.** Ever. Imagery does the work.

Title patterns that work well:
- Literal: *"O Maestro de Boné Preto"*
- Playful with a parenthetical: *"Auto-Retrato (com nariz que mexe)"*
- Stylistic reference: *"Os Girassóis do Miguel"* (the child's version of a famous work)

---

## 3. Colour: `bg` and `palette`

The wall theme uses the artwork's own colours — this is what makes each frame feel custom-fitted.

- **`bg`** — *one* dominant colour, used as the background of the close-up view. Pick the strongest non-white field in the painting. Avoid pure white (`#ffffff`) and pure black (`#000000`).
- **`palette`** — 3 to 6 colours **actually present in the painting**, ordered most→least dominant. These render as swatches under the title.

Rules:

1. **Sample, don't invent.** Open the photo, eyedropper real pixels.
2. **No greys, no whites in the swatches unless they're a deliberate element** (e.g. the doily in *LUNA*).
3. **Hex only**, lowercase, 6 digits (`#ec3a8a`, not `#EC3A8AFF`).
4. **`bg` must appear in `palette`** — they share at least one colour, often the first.
5. **Contrast check.** If `bg` is dark, the white title text reads fine. If `bg` is very pale (<L 80), pick a slightly more saturated neighbouring colour from the palette so the title doesn't disappear.

---

## 4. Signature

Goes under the title in italic. Three flavours:

| Pattern | When | Example |
|---|---|---|
| Just the name | Default | `"Miguel"` |
| Name + reference | The piece is "after" a famous artist | `"Miguel Miró"`, `"Miguel · à maneira de Andy Warhol"` |
| Name + family name | A more "serious" or sculpted piece | `"Miguel Bragança"` |

Use a middle dot (`·`, `\u00b7`) not a hyphen for the "à maneira de" pattern.

---

## 5. The animation routine (`anim`)

This is the **creative layer** — the thing that happens when you click into a painting. Every artwork picks ONE routine from `window.ANIMS` (defined at the bottom of `art-animations.jsx`).

### 5a. Existing routines — reuse first, invent last

| `anim` key | What it does | Good fit for |
|---|---|---|
| `miro` | Disco lights + floating music notes over the painting | Bold, dancing, abstract-figurative work |
| `sunflowers` | Side-by-side slider comparing child's version to a reference image | "Cover" of a famous painting (needs `assets/art/<ref>.jpg`) |
| `warhol` | Four-panel grid cycles through pop palettes | 2×2 or 4-up compositions |
| `portrait` | Eyes track cursor; mouth opens when you talk into the mic | Faces / self-portraits |
| `matisse` | Cutout shape sways gently on an invisible string | Cutout / collage / mobile pieces |
| `story` | Guided story mode — narrator highlights dots in sequence | Narrative drawings ("once upon a time…") |
| `sculpture` | Slow spotlight + faint 3D tilt | 3D objects, clay, mixed media |
| `luna` | Layers drift independently like a paper mobile | Vertical collage / mixed-paper works |
| `rainbow` | Scratch-to-reveal canvas overlay | Drawings where colour itself is the subject |
| `mbappe` | Collage pieces drift; gentle sparkles | Magazine cut-outs / collages |
| `maestro` | Figure's arms pulse like conducting | Standing figure portraits |

**Default to reuse.** A new "talking head" should use `portrait`, not a new function. A new collage should try `mbappe` or `luna` first.

### 5b. Inventing a new routine

Only when *no* existing routine fits. Process:

1. Add a new function `XxxAnimation({ art })` in `art-animations.jsx`.
2. It receives `art` (the data object) and renders an `aria-hidden` overlay inside `.anim-layer`.
3. Use the painting's own `palette` for any decorative elements — never bring in new colours from outside.
4. Register it in both maps at the bottom of the file:
   ```js
   window.ANIMS = { …, mynew: MyNewAnimation };
   Object.assign(window, { …, MyNewAnimation });
   ```
5. Add corresponding CSS in `gallery.css` under the section comment `/* === <name> animation === */`.

**Animation rules of thumb:**
- **One idea per routine.** Don't combine three effects.
- **Slow.** Easings ≥ 1.5s. Children watch; they don't scrub.
- **Looped, not finite.** No "the animation ended" state.
- **Pauseable.** If it has sound or strong motion, expose a pause toggle.
- **Respect `prefers-reduced-motion`** — the existing CSS already does, follow the pattern.

---

## 6. Discovery dots

The hotspots that say "tap me to learn what this is". They are how the child narrates their own piece.

- **3 or 4 dots.** Never 1, never 6+.
- **Coordinates are percentages of the image**, not pixels. `x` and `y` ∈ [0, 100].
- **Spread them.** No two dots within 15% of each other on either axis.
- **Each dot points to something a child would actually point at**: a face, a hand, a signature, a weird shape — not an art-historical observation.
- **`label` is the noun** ("Bigodes"). **`detail` is the *gossip*** ("Cosido com fio vermelho"). Both stay short.

---

## 7. The photo itself

Lives in `assets/art/`. Naming:

- All lowercase.
- Hyphens, not spaces or underscores.
- Pattern: `<artist>-<short-noun>.jpeg` (e.g. `manuel-figure.jpeg`, `miguel-warhol.jpeg`).
- For "after" pieces, drop the artist's first name on the right: `miguel-van-gogh.jpeg`.

Pre-flight before committing:

1. **Rotate so up is up.**
2. **Crop the messy edges** — table, fingers, masking tape — unless they're part of the work.
3. **Resize.** Long edge ≤ 3000px. (`w`/`h` in `art-data.js` must match the final file.)
4. **Compress.** MozJPEG q≈78 (Squoosh) — usually drops a 4 MB phone photo to 400–600 KB with no visible loss.
5. **No filter.** No "auto-enhance", no warming, no contrast boost. The painting is the painting.

---

## 8. Hallway order

The order pieces appear on the wall lives in `window.HALLWAY_ORDER` at the bottom of `art-data.js`. Rules:

- **New pieces go at the end** by default. Only re-order on purpose.
- **Alternate visual energy.** Avoid two very-busy or two very-quiet pieces in a row. If your new piece is loud (Warhol-ish), drop it after a calmer one.
- **One artist run.** It's fine to have several Miguels in a row — most of the catalogue is his — but if you have a Manuel or Muna piece, don't bury it between two pieces by another sibling.

---

## 9. Checklist for a new piece

Before you commit, walk this list:

- [ ] Photo lives at `assets/art/<artist>-<noun>.(jpe?g)`, ≤ 600 KB, long edge ≤ 3000px.
- [ ] New `ART` entry with **all** required fields filled.
- [ ] `w` and `h` match the final image.
- [ ] `bg` is dominant, non-white, non-black, and appears in `palette`.
- [ ] `palette` has 3–6 hexes, all sampled from the painting.
- [ ] `signature` follows the patterns in §4.
- [ ] `anim` reuses an existing routine, or — if newly invented — is registered in both maps in `art-animations.jsx`.
- [ ] 3 or 4 dots, spread out, child-pointable, short labels.
- [ ] `id` added to `HALLWAY_ORDER`.
- [ ] Local preview: tap the new frame, click each dot, watch the animation for one full loop.
- [ ] Diff is *only* the new entry + new asset(s). No drive-by edits to other pieces.

---

## 10. What never to change without a conversation

These are global identity choices. Don't tweak them when adding a piece:

- The fonts (`Cormorant Garamond` for titles, `Inter` for body, `JetBrains Mono` for chrome labels, `Caveat` for handwritten bits).
- The two wall themes (`whitecube`, `wall`) and their colour systems.
- The frame proportions and shadow recipe in `gallery.css`.
- The app bar / brand mark (`FMB · ART`).
- Portuguese as the UI language.

Change any of those = a redesign, not an addition.
