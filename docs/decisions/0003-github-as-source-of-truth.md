---
title: "ADR-0003: GitHub is the source of truth for artwork data"
status: accepted
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: none
related: [docs/decisions/0006-when-to-introduce-a-database.md]
---

# ADR-0003: GitHub is the source of truth for artwork data

- **Status:** Accepted (recorded retroactively 2026-08-22)
- **Decided:** May 2026, SMTCB

## Context

Artwork metadata has to live somewhere. The options were a database, a headless CMS, or
the repository itself.

## Decision

`art-data.js` in the repo is the catalogue. Photos live in `assets/art/`. Every change is
a commit; every deploy is a push. Even the planned Phase 2 upload API commits to GitHub
rather than writing to a database.

## Consequences

**Gained:** Full version history of the catalogue for free. The data is human-readable and
reviewable in a diff — which is what makes the Claude Code intake workflow safe, because a
human approves a diff before it ships. Backup is `git clone`.

**Paid:** Writes require a commit and a ~30 s redeploy. Concurrent writes conflict. Binary
photos inflate the repo permanently — history cannot be pruned without a rewrite. There is
no query layer, so anything resembling search or filtering must happen client-side over the
whole catalogue.

## Revisit when

The catalogue exceeds a few hundred artworks, or writes come from more than one family.
