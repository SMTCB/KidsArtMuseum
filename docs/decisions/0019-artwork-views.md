---
title: "ADR-0019: Several views of one artwork (`views`) for 3D pieces"
status: accepted
owner: SMTCB
last_reviewed: 2026-11-03
review_cycle: none
related:
  - ART_GUIDE.md
  - docs/decisions/0016-asset-layout.md
  - docs/decisions/0017-stay-static-for-now.md
---

# ADR-0019: Several views of one artwork (`views`) for 3D pieces

- **Status:** Accepted
- **Date raised:** 2026-11-03
- **Decided:** 2026-11-03, SMTCB (asked for a way to show a 3D work; chose "Vistas + animação", Option B)

## Context

Every piece so far is one flat photo: `src`, `w`, `h`, `dots`. Miguel's *Na Floresta do Outono...*
is a 3D work (cardboard base, corks and acorn caps, a dried plant on glue) and one photo hides
most of it. The family took ten photos from different angles. The schema has no place for more
than one (ART_GUIDE §1: no inventing keys without a decision).

## Options

### Option A — One photo per piece, as today
No change. The 3D work is flattened to its best angle; the other nine photos are lost.

### Option B — An optional `views` list of extra angles
`views: [{ label, src?, w?, h?, dots? }, …]`. The first entry is the main photo (it carries only
a `label`; `src`, `w`, `h`, `dots` come from the piece itself, so the wall, thumbnails, postal and
album keep working untouched). Each later entry is another photo with its own dots. The close-up
shows a small row of chips under the frame to switch angle. The `anim` runs on the main view only:
its measured boxes belong to that photo.
Cost: one optional field, a chip row in `ZoomModal`, a lint rule. Photos live in
`assets/art/<id>/views/<n>.jpeg` (a new file kind under ADR-0016).

### Option C — Turntable (24–36 frames) or a 3D model (GLB)
Convincing, but needs a re-shoot or photogrammetry, bigger files, and a viewer library.
Not ruled out; Option B does not block it (a `views` entry could later point at a frame set).

## Decision

Option B: an optional `views` field, first entry = the main photo, extras in
`assets/art/<id>/views/`. Pieces without `views` are unchanged.

## Consequences

- Easier: a 3D piece can show 3–4 angles with their own dots, from photos that already exist.
- Harder: the schema gained a field; `docs-lint` and `check-dots` must know it. The `anim` does
  not follow the child to the other angles (they are plain photos).
- The wall, `/o/<id>` cards, postal and the printed album keep using the main photo only.
- Forecloses nothing: a turntable or GLB can replace this later in a new ADR.

## Revisit when

A second 3D piece arrives, or a re-shoot for a turntable is done.
