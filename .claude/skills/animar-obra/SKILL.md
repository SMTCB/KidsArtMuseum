---
name: animar-obra
description: Design and build a distinctive animation for one FMB·ART artwork, one that comes from something in that specific drawing and not from a generic filter. Use whenever the owner asks to animate, give life to, add a "anim" or "animação" to an artwork, to replace a generic routine (sparkles, notes, spotlight, sway), to invent a new routine in art-animations.jsx, or to split a drawing into moving parts. Also use when processing a new intake and no existing routine in ART_GUIDE §5a is a genuine fit. Skip for fixing a bug in an existing routine or for the Sala de Experimentação effects.
---

# Animar uma obra

The museum's animations are what separate it from a phone filter. A filter works on any
picture. Here the animation must be something only *this* drawing could do, and the drawing
must stay intact. The principles live in
[`docs/design/ARTWORK_ANIMATION.md`](../../../docs/design/ARTWORK_ANIMATION.md); read it first.
The routine conventions (registration, palette, loop, reduced motion) live in
[`ART_GUIDE.md`](../../../ART_GUIDE.md) §5b. This file is the working method, not a copy of either.

The benchmarks to match in spirit: `sunflowers` (the comparison *is* the animation), `portrait`
(the eyes and mouth respond to you), `portal` (a crop of the drawing is the door that opens).
Each one picks a thing the child drew and makes that thing do something.

## Method

Work in this order. Steps 1–4 produce no code; the idea is where distinctiveness is won or lost.

1. **Read the piece.** The intake form or `art-data.js` entry (title, dots, `medium`), the
   child's own words, and the photo itself. View the image, do not work from the description.
   The child's words matter: the thing that moves should be something they named or pointed at.
   If `audio-data.js` has an entry for the piece, read its `text` (the transcript of the audio
   description) too: it is the family's own account of the work, and the best source for the
   child test. No entry is normal (few are recorded yet); carry on without it.
2. **List what could move.** Figures, eyes, doors, animals, hair, water, sky, a held object,
   the whole composition. For each, note what the child said about it. Reject anything that
   would equally fit another drawing.
3. **Choose one idea and say it in one sentence.** Make the call; do not hand the owner a menu.
   Give one line of why it is this drawing's, and which of the three tests (below) it passes.
4. **Pick the cheapest technique that carries the idea.** Climb only as far as needed:
   1. an overlay that follows a measured spot (drawn elements in the palette);
   2. a crop of the photo that moves, using `backgroundPosition` or `clip-path`, like `portal`
      (no new file);
   3. masks or several crops moving independently;
   4. separate transparent PNG parts at `assets/art/<id>/parts/<part>.png`, only when a part needs
      its own outline. Cut from the original photo, never repainted or enhanced.
   Whatever does not move stays in the photo. Prefer motions that do not reveal a hole behind
   the part (turning, swinging from an anchor, scaling from the centre). If a hole would show,
   stop and ask the owner before inventing paint.
5. **Show the owner the idea before coding.** The sentence from step 3, the technique, and
   the measured boxes, as percentages of the image. Wait for a yes. This is the moment the
   owner can redirect cheaply.
6. **Write the routine.** `XxxAnimation({ art })` in `art-animations.jsx`, an `aria-hidden`
   layer inside `.anim-layer`, boxes as named constants (like `PORTAL_BOX`), colours only from
   `art.palette`, registered in both maps at the bottom, CSS under
   `/* === <name> animation === */` in `gallery.css`. Loop, slow, pausable if there is sound or
   strong motion, and a `prefers-reduced-motion` branch that keeps a gentle opacity change and
   drops movement. Animate `transform` and `opacity` only; the `animation-performance` skill
   explains why and what to do when a frame drops.
7. **Verify** (below). Show the owner what you saw. Ask for approval before committing.

## The three tests

A routine ships only if it passes all three. State the result of each when you present it.

- **Swapped-drawing test.** Put it on a different artwork in your head. If it still makes
  sense, it is a filter; go back to step 2.
- **Child test.** Point to the child's words (intake form or audio description), a dot, or the
  title that justify what moves.
- **Original test.** With the animation off, the work is the untouched photograph. While it
  moves, nothing hides, tears or smears the drawing.

## Verify

There is no build step. Serve with `python -m http.server 8000` (preview tools, not Bash for
a long-running server) and open the piece through the gallery.

- Watch one full loop on desktop and at 375 px wide; tap every dot; open the zoom view.
- Emulate `prefers-reduced-motion` and confirm the piece is still alive but calm.
- Check the console is clean and the frame rate holds on a phone-size viewport.
- Run the `review-animations` skill's checklist mentally on the CSS and JS: no `transition: all`,
  no layout properties, hover gated by `(hover: hover)`, interruptible where triggered by touch.
  Its UI timing limits (sub-300 ms) are for interface chrome, not for the slow ambient loops
  ART_GUIDE asks for here.

## Done means

The diff is the new routine, its CSS, the assets it needs, and the one `anim` value in
`art-data.js`; no drive-by edits to other pieces. If the routine is new, add its row to
ART_GUIDE §5a in the same commit, tick the item in `docs/product/PLAN.md`, and run
`node scripts/docs-lint.js`. Commit message e.g. `MUS-17: Gato de Barro — <idea in four words>`.

## Do not

- Do not add fields to the artwork schema. Routine-specific data lives in the routine.
- Do not bring in outside libraries or colours; the site has no build step and each piece wears
  its own palette.
- Do not combine several effects to look impressive. One strong idea beats three decorations.
- Do not use emoji in any visible copy; keep UI text in PT-PT.
