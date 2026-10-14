---
title: "ADR-0016: One folder per artwork for photo, audio and animation parts"
status: accepted
owner: SMTCB
last_reviewed: 2026-10-14
review_cycle: none
related:
  - ART_GUIDE.md
  - docs/decisions/0003-github-as-source-of-truth.md
  - docs/decisions/0011-platform-rebuild.md
  - docs/design/AUDIO_AND_COMMENTS.md
  - docs/design/ARTWORK_ANIMATION.md
---

# ADR-0016: One folder per artwork for photo, audio and animation parts

- **Status:** Accepted
- **Date raised:** 2026-10-14
- **Decided:** 2026-10-14, SMTCB (asked to define the layout; Option B)

## Context

An artwork now owns more than a photo: an audio description (AUD-06), a reference image for some
routines (`sunflowers`), and, with the `animar-obra` skill, cut-out parts for animation.
Until now photos sat in one flat folder named `<artist>-<noun>.jpeg` (the name was not the `id`),
audio was planned in a second folder `assets/audio/<id>.mp3`, and parts at `assets/art/<id>/`
had no agreed place. Three conventions for one thing, keyed by two different names.

## Options

### Option A — Keep flat folders
No file moves. Photo names keep drifting from ids; audio and parts live apart from the work they
belong to; a piece cannot be exported or deleted as a unit.

### Option B — One folder per artwork, keyed by `id`
```
assets/art/<id>/photo.jpeg    audio.mp3    reference.jpg    parts/<part>.png
```
The folder name is the `id`; file names inside are fixed. A piece is one directory: easy to
review in a diff, to export, and to map onto an object-storage prefix if ADR-0011 is accepted.
Cost: a one-off move of 13 photos and updating `src` values (values, not the schema).

### Option C — Folders by artist (`assets/art/miguel/…`)
Matches the gallery-per-artist idea, but an artist is metadata that can change; a path should
not carry it.

## Decision

**Option B.** Existing photos were moved with `git mv` (history follows) and `src` updated; the
`sunflowers` reference became `assets/art/vangogh/reference.jpg`. `vercel.json` already caches
`/assets/art/*`, so audio and parts inherit it. The convention is stated once, in
[`ART_GUIDE.md`](../../ART_GUIDE.md) §7; this ADR records why. `scripts/docs-lint.js` warns when
a `src` does not follow it and errors when a referenced photo or audio file is missing.

## Consequences

- New works: `intake/<name>.jpeg` (and optional `<name>.mp3`) are filed into the work's folder
  when processed; the `id` is chosen then and never changes.
- Any photo URL used outside the site (a bookmark, a message) stops working. There are none
  known, and the previous long immutable cache means browsers may hold old paths until the next
  deploy replaces the pages.
- ADR-0011 (rebuild) can migrate a folder to a storage prefix without renaming anything.

## Revisit when

ADR-0011 is decided, or the catalogue passes a few hundred works (a flat list of ids in one
folder gets unwieldy; shard by the first two characters of the id then).
