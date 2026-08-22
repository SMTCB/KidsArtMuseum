---
title: "ADR-0006: When to introduce a database"
status: proposed
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: none
related:
  - docs/decisions/0003-github-as-source-of-truth.md
  - docs/decisions/0004-product-ambition.md
---

# ADR-0006: When to introduce a database

- **Status:** ⚠️ **PROPOSED — blocked by ADR-0004**
- **Date raised:** 2026-08-22
- **Decided:** —

## Context

ADR-0003 made GitHub the catalogue. Three documents disagree about how long that holds:

- `ROADMAP-static-phase.md`: "Don't add a server or database until there is a concrete reason."
- `product_roadmap-2026-05-29.txt`: Supabase migration in Q3 2026, unconditionally.
- `proj_eval-2026-05-29.txt`: migration within 60 days, as an investment condition.

The honest read is that a database is required for *multi-tenancy*, not for the museum. A
single family's 11–100 artworks fit comfortably in a JS file. What GitHub cannot do is
per-family isolation, auth, permissions, or the RBAC the Escola tier needs.

So the trigger is not artwork count. It is **the second family**.

One caveat that does not depend on ADR-0004: photos in git are a one-way door. At 25 MB
today and roughly 2.5 MB per artwork, the repo grows permanently — history cannot be pruned
without a rewrite. Moving *photos* to object storage is separable from moving *metadata* to
Postgres, and is worth considering on its own timeline.

## Options

### Option A — Stay on GitHub indefinitely

Correct under ADR-0004 Option A. Zero cost, zero ops. Caps the product at one family.

### Option B — Migrate to Supabase now

Correct only under ADR-0004 Option B. ~$25–50/month, 4–8 weeks. Buys multi-tenancy, auth,
and RBAC before there is anyone to authenticate.

### Option C — Split the concerns

Metadata stays in git; photos move to object storage behind a path indirection. Removes the
irreversible-repo-growth problem without taking on a database, auth, or ops. Leaves the door
open for Option B without walking through it.

## Decision

—

## Consequences

To be written when decided.

## Revisit when

A second family asks for their own museum — or repo size passes ~250 MB, whichever comes first.
