---
title: "ADR-0009: Approval step in the automated upload flow"
status: proposed
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: none
related:
  - docs/product/SCREENS.md
  - docs/decisions/0003-github-as-source-of-truth.md
---

# ADR-0009: Approval step in the automated upload flow

- **Status:** ⚠️ **PROPOSED**
- **Date raised:** 2026-08-22 (raised originally in `ROADMAP-static-phase.md`, Phase 2)
- **Decided:** —

## Context

Today Claude Code drafts an artwork entry and **a human approves the diff before it ships**.
That review is doing real work: it catches a wrong palette, a dot placed on empty canvas, a
title that misreads the drawing, or a tone that does not sound like the child.

The Phase 2 upload flow as specified goes straight to the wall with no review. `SCREENS.md`
lists S-21 "Pending Approval Review" as near-term but optional.

The stake is specific to this product. A generic CMS publishing a bad auto-generated caption
is an annoyance. Here the artefact is a child's artwork presented to them as museum-worthy —
a wrong or hollow title lands on a six-year-old.

## Options

### Option A — No approval; publish immediately

Fastest, and it matches the promised "a obra está a caminho…" moment. Relies entirely on
model quality. Errors are visible to the child before a parent can catch them.

### Option B — Mandatory approval before the piece hangs

Preserves today's safety. Costs a second interaction, and art sits in limbo if the parent is
distracted — which, given the parent is the busy person this product exists for, is likely.

### Option C — Publish immediately, with easy correction

The piece hangs at once; the parent gets a notification and a one-tap edit for title and dots.
Optimistic, matched to a low-stakes-but-emotional domain, and it keeps the delight of instant
appearance.

## Decision

—

## Consequences

To be written when decided. Whichever wins, **S-24 Artwork Edit** stops being optional —
every option above needs a way to fix a bad entry after the fact.

## Revisit when

Decide before building the Phase 2 upload flow (Sprint 4).
