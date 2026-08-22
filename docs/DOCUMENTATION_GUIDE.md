---
title: Documentation Guide
status: canonical
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: 180d
related: [docs/README.md]
---

# Documentation Guide

How documentation works in this repo. This file is the constitution — if a rule here
conflicts with something you read elsewhere, this file wins.

The problem this exists to prevent: in August 2026 this project had **two roadmaps that
contradicted each other**, **two AI strategies with a 20× cost gap**, and **155 KB of
strategy work sitting untracked on one laptop**. None of it was wrong when written. It
rotted because nothing marked which document was still true.

---

## 1. The four rules

### Rule 1 — Every document declares its status

Every `.md` file under `docs/` starts with YAML front-matter. No exceptions.

```yaml
---
title: Human-readable title
status: canonical
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: 90d
supersedes: [docs/archive/old-thing.md]     # optional
superseded_by: docs/product/PLAN.md         # required iff status is superseded
related: [docs/decisions/0004-vision-model-provider.md]   # optional
---
```

`scripts/docs-lint.js` enforces this. A document without front-matter is a lint failure.

### Rule 2 — One topic, one canonical document

Exactly one document owns each topic. Everything else links to it rather than restating it.

| Topic | Canonical owner |
|---|---|
| What we build next, when, and every work item | `docs/product/PLAN.md` |
| What the product *is*, and its commercial shape | `docs/product/PLATFORM_DEFINITION.md` |
| What it looks like | `docs/design/IDENTITY.md` |
| How the system works **today** | `docs/engineering/ARCHITECTURE.md` |
| How the system should work **later** | `docs/engineering/TARGET_ARCHITECTURE.md` |
| Why we chose X over Y | `docs/decisions/NNNN-*.md` |
| What an artwork entry looks like | `ART_GUIDE.md` (repo root — binding) |
| How to operate the repo | `README.md` / `CLAUDE.md` (repo root) |

If you find yourself copying a number, a cost, or a phase plan from one doc into another:
stop, and link instead. Copied facts are how the 20× cost gap happened.

### Rule 3 — Decisions become ADRs, not prose

Any choice that is expensive to reverse gets an Architecture Decision Record in
`docs/decisions/`. Numbered, dated, immutable.

You do not edit a decided ADR to change your mind. You write a **new** ADR that supersedes
it, and set `superseded_by` on the old one. The history of what we believed and when is
the point — that record is what stops a settled question from being silently reopened.

Open questions get an ADR too, with `status: proposed`. An unmade decision is a documented
state, not an absence.

### Rule 4 — Archive with a tombstone; never delete

Superseded documents move to `docs/archive/` and gain a tombstone at the top saying what
replaced them and why. They keep their historical filename plus a date suffix.

Deleting loses the reasoning. Leaving it in place unmarked is worse — someone will read it
as current. The tombstone is the only acceptable middle.

---

## 2. Status vocabulary

| Status | Meaning | Trust it? |
|---|---|---|
| `canonical` | The single source of truth for its topic. | Yes |
| `draft` | Being written. Incomplete by design. | Not yet |
| `proposed` | A decision awaiting a call (ADRs only). | It's a question, not an answer |
| `accepted` | A decision that has been made (ADRs only). | Yes — it's binding |
| `reference` | Background research, analysis, external input. Informs decisions, does not make them. | As input only |
| `superseded` | Replaced. Kept for history. Must name its successor. | No — follow `superseded_by` |
| `archived` | Historical. Not maintained, not replaced by any one doc. | No |

**`reference` is the important one.** Investment memos, cost analyses, and vendor research
are inputs. They are not plans. A `reference` document may say "you must migrate to
Supabase in 60 days" — that is the author's opinion, and it carries exactly as much weight
as we choose to give it in an ADR. Nothing becomes committed work until it lands in
`PLAN.md`.

---

## 3. Layout

```
docs/
├── README.md                  ← index. Start here. Lists every doc + status.
├── DOCUMENTATION_GUIDE.md     ← this file
├── decisions/                 ← ADRs, numbered, immutable
│   └── README.md              ← the decision log: what is open, what is settled
├── product/                   ← what we build, and what the product is
│   ├── PLAN.md                ← the single planning document
│   ├── PLATFORM_DEFINITION.md ← what the platform is, for whom, at what price
│   └── SCREENS.md             ← the screen inventory (S-IDs)
├── engineering/               ← how it works, today and later
├── design/                    ← the visual identity, and creative-system strategy
│   ├── IDENTITY.md            ← the design language (canonical)
│   └── FMB_IDENTITY_REDESIGN_V1.0/  ← raw delivery: comps and CSS, not a system
└── archive/                   ← superseded, with tombstones
```

Root-level `README.md`, `CLAUDE.md`, and `ART_GUIDE.md` stay at the root. They are operating
instructions rather than documentation, they are what a newcomer (human or agent) hits first,
and `CLAUDE.md` must be at the root to load automatically.

---

## 4. Review cadence

`review_cycle` sets how long a doc is trusted before it needs a look. `docs-lint.js --stale`
lists everything past due.

| Cycle | For |
|---|---|
| `30d` | Sprints — they move weekly |
| `90d` | Roadmap, backlog, architecture — drift fast |
| `180d` | Business overview, this guide — stable |
| `none` | ADRs and archives — immutable by design |

Reviewing means one of: bump `last_reviewed`, fix it, or archive it. "It's probably still
fine" is not a review.

---

## 5. Definition of Done includes documentation

A backlog item is not done until:

- [ ] Code works and is verified in the browser
- [ ] Any behaviour change is reflected in the doc that owns that topic
- [ ] Any decision made along the way is captured as an ADR
- [ ] The item is ticked in `PLAN.md` — §6 for the catalogue entry, §7 for the sprint
- [ ] `node scripts/docs-lint.js` passes

This list is repeated in `CLAUDE.md` so it is enforced on every task.

---

## 6. Adding a document

1. Pick the right folder (§3). If none fits, that is a signal — ask before inventing one.
2. Copy the front-matter block from §1. Fill in every field.
3. Add one line to `docs/README.md`. **A document not in the index does not exist.**
4. Run `node scripts/docs-lint.js`.

## 7. Adding a decision

```bash
cp docs/decisions/ADR-TEMPLATE.md docs/decisions/0008-my-decision.md
```

Number sequentially, never reuse. Add it to `docs/decisions/README.md`. Start it as
`proposed`; move to `accepted` when the call is actually made, and record who made it.
