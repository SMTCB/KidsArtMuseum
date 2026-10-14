---
title: Distinctive artwork animation
status: draft
owner: SMTCB
last_reviewed: 2026-10-14
review_cycle: 30d
related:
  - ART_GUIDE.md
  - docs/design/TEMPLATE_COMPOSITION_STRATEGY.md
  - docs/product/PLAN.md
---

# Distinctive artwork animation

**Principles and the technical contract** for animations that belong to one drawing and could
not be moved to another. Planned as MUS-16 (the skill) and MUS-17 (the pilot) in
[`PLAN.md`](../product/PLAN.md). It feeds FND-07 (what `anim` may point at).

The goal, in the owner's words: not a filter. Any phone or free app applies a filter. The
museum's animation should come from something in *this* drawing, and leave the drawing intact.

---

## 1. What "alive" already looks like here

These pieces are the benchmark. They are not exceptions to fix; they are the pattern to extend.

| Routine | What it reads in the drawing | Why it works |
|---|---|---|
| `sunflowers` | The whole piece is a child's version of a famous painting | The slider turns the comparison into the animation. |
| `portrait` | The eyes and the mouth | Eyes follow you; the mouth opens when you speak. The drawing responds to the visitor. |
| `portal` | The drawn door | A crop of the drawing is the moving part, so the door that opens *is* the drawing. |
| `teia` | The webs as places where small creatures live | Fits the subject of the piece. |

Generic routines (`miro`, `maestro`, `mbappe`, `sculpture`: notes, sparkles, a spotlight) are
fine, but a note or a sparkle could sit on any picture. That is the line this document draws.

What the good ones share: **they pick one thing the child drew (or said), and make that thing
do something.**

## 2. The three tests

A new routine must pass all three before it ships.

1. **Swapped-drawing test.** Move the animation onto a different artwork. If it still makes
   sense, it is a filter. Rewrite it around something that only exists in this drawing.
2. **Child test.** The thing that moves is something the child drew, named in the dots, or
   said in the description (or audio). If we cannot point to the child's words, we are inventing.
3. **Original test.** With the animation off, or paused, the work is the photograph, untouched
   (ART_GUIDE §7: no filter, no re-tint). While moving, nothing tears, smears or hides the
   drawing. Pieces move, they are not redrawn.

## 3. Freedom and limits

Full freedom of idea and technique, within these limits:

- **One idea per routine** (ART_GUIDE §5b). A strong idea can have several parts, but they
  serve the same idea.
- **The drawing's own colours.** Anything added uses the artwork's `palette`. No outside colours.
- **Loop, slow, pausable, reduced-motion safe.** Same rules as §5b, plus: movement is replaced
  by a gentle opacity change under `prefers-reduced-motion`, never removed outright.
- **Phone first.** 60 fps on a mid-range phone, composite properties only
  (`transform`, `opacity`). Check with the `animation-performance` skill.
- **Not a flip book of effects.** The 33 Sala de Experimentação effects stay a playground; they
  are filters by nature (see FND-07).

## 4. Splitting the drawing into parts

A routine may cut the drawing into pieces when that serves the idea.

**Contract (no change to the artwork schema, ART_GUIDE §1):**

- The photograph stays the source of truth. Parts are **cut from it, not repainted**: crops,
  masks, or transparent PNGs derived from the original file. No filter, no enhancement.
- Parts are assets *of the routine*, like the reference image of `sunflowers` or `PORTAL_BOX`
  for `portal`. They are not fields of `ART`.
- Cheapest first: **a crop by `backgroundPosition` or `clip-path`** (what `portal` does, no
  extra file). Only when a part needs its own outline, add a transparent PNG at
  `assets/art/<id>/<part>.png`, optimized like the photo (long edge as small as the part
  allows; aim for under 150 KB each).
- Positions are percentages of the image, like dots, so they survive any screen size.
- Cut a part only if it moves. Whatever does not move stays in the photo.
- Parts hidden behind a moving part need a believable background. Prefer motions that do not
  reveal a hole (turning, scaling from the centre, swinging from an anchor), or fill from
  neighbouring pixels of the same photograph. Ask before inventing paint.

## 5. The method (what the skill follows)

1. **Read.** The intake form, the dots, the child's description, the photo itself (view it).
2. **List the candidates.** Every thing in the drawing that could move: figures, eyes, doors,
   animals, water, hair, sky. Note what the child said about each.
3. **Choose one idea.** Make the call. Do not offer the owner a menu of five; state the idea
   in one sentence and why it is this drawing's.
4. **Decide the technique.** Overlay only, crop, masks, or separate parts (section 4). Cheapest
   that carries the idea.
5. **Write the routine** following ART_GUIDE §5b; add measured boxes as named constants.
6. **Verify.** One full loop on desktop and 375 px; every dot; reduced motion on; the three
   tests; the performance check. Show the owner a short screen recording or screenshots.
7. **Ask for approval** before committing (ART_GUIDE and CLAUDE.md already require it).

## 6. Scale (an honest limit)

A bespoke routine is hand craft: roughly an hour per artwork with this method. That is right
for the prototype and for a curated tier, and it is the opposite of what
[`TEMPLATE_COMPOSITION_STRATEGY.md`](TEMPLATE_COMPOSITION_STRATEGY.md) proposes for
hundreds of artworks per year. This document does not settle that; the platform still needs
that composition path for volume. The skill here produces the reference quality, and the
routines it writes can become templates later.

## 7. Plan

1. This document (principles and contract). **Done 2026-10-14.**
2. **Done 2026-10-14.** Skill `animar-obra` in `.claude/skills/`, written with the `skill-creator`, following section 5
   and using the Emil Kowalski review skills for verification. MUS-16.
3. Pilot on **Gato de Barro** (`clay`, currently `sculpture`: a spotlight and tilt that could
   be any object). MUS-17. The skill proposes the idea first; code only after the owner agrees.
4. Update ART_GUIDE §5 and §9 with the three tests and the parts contract, and close FND-07.
