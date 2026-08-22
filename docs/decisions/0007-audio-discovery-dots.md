---
title: "ADR-0007: Audio discovery dots — record the child's actual voice"
status: proposed
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: none
related:
  - docs/engineering/UPLOAD_FLOW_AND_STORAGE.md
  - docs/product/PLAN.md
---

# ADR-0007: Audio discovery dots — record the child's actual voice

- **Status:** ⚠️ **PROPOSED**
- **Date raised:** 2026-08-22
- **Decided:** —

## Context

Discovery dots today show *typed text* of what the child said. Two independent documents
argue the recorded voice is the product's strongest asset:

- `proj_eval-2026-05-29.txt`: capturing the child's actual voice is called the killer
  feature, on the grounds that voice memory creates a subscription nobody cancels.
- `product_roadmap-2026-05-29.txt` places audio dots in Phase 1, before monetization.

`UPLOAD_FLOW_AND_STORAGE.md` §1 already specifies the implementation in detail.

The observation stands on its own regardless of ADR-0004. A recording of a six-year-old
explaining their drawing is irreplaceable in a way the drawing itself is not — the drawing
survives in a drawer; the voice at that age does not survive at all. Under ADR-0004 Option A
this is the single highest-value feature on the list, and its value *decays with delay* in a
way nothing else in the backlog does. The children are 4, 7, and 7 now.

## Options

### Option A — Audio dots on the static architecture

Store audio files in `assets/audio/` alongside photos, referenced from `art-data.js`.
Recording happens outside the app (phone voice memo), the file is dropped into `intake/`.
Ugly, cheap, and shippable in days. Adds ~200 KB–1 MB per dot to the repo.

### Option B — Audio dots as part of the Phase 2 upload UI

Browser `MediaRecorder`, 10–15 s cap, waveform preview, uploaded through `/api/add-artwork`.
The proper version. Requires the upload flow to exist first.

### Option C — Defer until after ADR-0004

Consistent, but pays a real cost: the recordings that do not get made this year cannot be
made later.

## Decision

—

## Consequences

To be written when decided. Note the privacy dimension: recordings of children are more
sensitive than photographs of drawings. If museums are ever shared by link, audio should be
considered separately from images in that permission model.

## Revisit when

Decide before the end of Sprint 2. This one has a clock on it that the others do not.
