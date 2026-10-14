---
title: "ADR-0017: Stay static for now; improve in layers; defer the rebuild"
status: accepted
owner: SMTCB
review_cycle: none
last_reviewed: 2026-10-14
related:
  - docs/decisions/0011-platform-rebuild.md
  - docs/decisions/0004-product-ambition.md
  - docs/decisions/0001-static-first-architecture.md
  - docs/product/PLAN.md
---

# ADR-0017: Stay static for now; improve in layers; defer the rebuild

- **Status:** Accepted
- **Date raised:** 2026-10-14
- **Decided:** 2026-10-14, SMTCB

## Context

[ADR-0011](0011-platform-rebuild.md) proposed a full rebuild on Next.js + Supabase, and
[`PLAN.md`](../product/PLAN.md) was written assuming it. Its own numbers are heavy: Sprints 1-4
are about 60% invisible work and, at an evenings-and-weekends pace, six to eight months to
get back to what the prototype already does, before tests for accounts and row-level security.

The facts today are different from the ones the plan assumed:

- The site is in **testing with a very small, invited group**. One family's catalogue
  (13 artworks), hand-curated, no accounts.
- It may become something sturdier, or it may stay what it is: a **household museum** for the
  owner's children's drawings. The owner does not know yet, and the answer depends on the
  testers' response, not on engineering.
- Since 2026-08-22 the prototype has gained real capability without a rebuild: artist
  galleries, the redesigned Sala, audio descriptions, comments (ADR-0015), bespoke animations
  and one folder per artwork (ADR-0016).

The question is therefore not "which platform", but "what is worth doing **whichever way the
future goes**".

## Options

### Option A - Proceed with ADR-0011 (rebuild now)
Honest cost: months, a monthly bill before any revenue, and the whole museum frozen while the
new one catches up. Only pays off if multi-family is certain. It is not.

### Option B - Stay static and improve in layers; defer the rebuild with a trigger *(chosen)*
Make a sequence of small steps, each useful if the museum stays domestic and each a step
toward the platform if it grows. Reopen ADR-0011 only when a stated trigger is met.

### Option C - Freeze the project
No cost, no risk, but leaves known weak points (in-browser Babel, 25 MB of images, no way to
add a piece without a terminal and Claude).

## Decision

**Option B.**

1. **ADR-0011 stays `proposed` and is deferred, not rejected.** It is reopened when **either**:
   a second real family (not a friend of the owner) asks for its own museum, **or** the owner
   decides to offer the museum publicly. Until then no Sprint 2-4 work starts.
2. **The prototype is the product for now**, under ADR-0001 (static-first) with the ADR-0015
   exception. Work is organised in layers:

   | Layer | What | Useful if it stays domestic? |
   |---|---|---|
   | 1 | Folder per artwork, docs and lint (ADR-0016) | Yes. Done. |
   | 2 | Light build step with Vite: no in-browser Babel, production React, optimised images. QUA-11. | Yes. Faster, errors caught before deploy. |
   | 3 | Add pieces without a terminal: an intake flow the owner can run alone. UPL-11. | Yes. The daily friction today. |
   | 4 | Thumbnails and `srcset` for the wall (the 25 MB problem). QUA-12. | Yes. |
   | 5 | Only on the trigger above: reopen ADR-0011 (accounts, Supabase). | n/a |

   Layers 2-4 are not wasted if layer 5 happens: Vite moves toward Next.js, and the effects
   already honour the `{ art }` contract, so they port as they are.
3. **No schema change for the platform.** Rooms, galleries and accounts are not modelled now.
   Artist galleries stay a view over the flat `ART` list.
4. **ADR-0006 and ADR-0008 stay open** and are answered by this ADR for the prototype
   only: no database yet (0006); a build step is allowed, and wanted, but light (0008, layer 2).
   ADR-0013 and ADR-0014 do not block anything today; revisit them with ADR-0011.
5. **ADR-0004 (venture-scale destination) is neither revoked nor pursued now.** It is the
   direction if the trigger is met. If the owner decides the museum stays domestic, write an
   ADR that supersedes 0004 explicitly.

## Consequences

- `PLAN.md` Sprints 2-9 stay as a reference for the platform but are **paused**; the schedule
  there is no longer the active plan. The active plan is the layers above, tracked as
  QUA-11, UPL-11, QUA-12.
- No monthly platform bill, no new vendor, and the owner can keep adding art as today.
- Risk of a later double effort is small and bounded: layers 2-4 do not discard anything.
- The testing group continues on the same URL with no migration.
- If the owner's answer is "stays domestic", the project is finished sooner and the platform
  documents become an archive.

## Revisit when

A second real family asks for a museum; the owner chooses to open the museum publicly; or the
comments/testing feedback shows demand the static prototype cannot serve.
