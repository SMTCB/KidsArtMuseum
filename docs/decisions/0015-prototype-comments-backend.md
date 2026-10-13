---
title: "ADR-0015: A minimal comments backend for the prototype"
status: accepted
owner: SMTCB
last_reviewed: 2026-10-13
review_cycle: none
related:
  - docs/decisions/0001-static-first-architecture.md
  - docs/decisions/0011-platform-rebuild.md
  - docs/decisions/0014-childrens-data.md
  - docs/design/AUDIO_AND_COMMENTS.md
---

# ADR-0015: A minimal comments backend for the prototype

- **Status:** Accepted
- **Date raised:** 2026-10-13
- **Decided:** 2026-10-13, SMTCB (Option A; comments publish immediately while the link is shared only with testers)

## Context

Testers should be able to leave a **name and a comment** on an artwork, with no account. A
static site cannot store them. [ADR-0001](0001-static-first-architecture.md) says no backend
until proven necessary; this is the first feature that needs one. [ADR-0011](0011-platform-rebuild.md)
(rebuild on Supabase) is still undecided, so whatever we add must not depend on it nor make it
harder. [ADR-0014](0014-childrens-data.md) is also open: comments are personal data from
adults, displayed next to children's work.

## Options

### Option A — One Vercel Function plus Upstash Redis
`api/comments.js`, storage on the Vercel Marketplace free tier, called by `fetch`. No build
step, no npm dependency, data is a list per artwork and exports to JSON. About 1 day.

### Option B — Supabase table now
Same result and it is the likely platform destination, but it creates the project, schema and
Row Level Security before ADR-0011 is decided and pre-empts it.

### Option C — Third-party widget (Giscus, Disqus, Commento)
Fastest. Giscus needs a GitHub login, which breaks "no registered users". Disqus adds tracking
on a children's site. Neither fits the visual identity.

### Option D — Do not build it; collect feedback by message
No code, no risk, much lower response.

## Decision

**Option A**, scoped to the prototype. Comments are published immediately; the delete command and
the `COMMENTS_ENABLED=false` kill switch are the moderation tools. Switch to hold-until-approved
before the link is public.

## Consequences

**If A:** the prototype has one server-side function and one external data store. Moderation
becomes an owner chore (delete command, kill switch). The static-first claim in ADR-0001 stays
true for everything except `/api/comments`. When ADR-0011 is decided, comments are exported
(`scripts/comments.js export`) and either migrated or dropped; nothing else depends on them.
We store name and text only, no IP and no email; the rate limit uses a salted, expiring hash.

**Downside:** a public write endpoint exists. It carries abuse risk and a small ongoing
responsibility, mitigated by caps, honeypot, rate limit and the kill switch.

## Revisit when

ADR-0011 is decided, or the link stops being limited to testers (then switch to
hold-until-approved), or ADR-0014 is accepted and sets a rule for visitor-provided data.
