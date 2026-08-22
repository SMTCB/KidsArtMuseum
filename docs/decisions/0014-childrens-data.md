---
title: "ADR-0014: Children's data, privacy, and what the platform is allowed to store"
status: proposed
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: none
related:
  - docs/decisions/0004-product-ambition.md
  - docs/decisions/0011-platform-rebuild.md
  - docs/decisions/0007-audio-discovery-dots.md
---

# ADR-0014: Children's data, privacy, and what the platform is allowed to store

- **Status:** ⚠️ **PROPOSED — recommended Option B. Blocks the schema (MUS-01).**
- **Date raised:** 2026-08-22
- **Decided:** —

## Context

The prototype holds three children's first names, ages, artwork, and — under ADR-0007 —
recordings of their voices, for an audience of two adults who are their parents. As a product
it would hold the same for strangers' children, at scale, on a US vendor's infrastructure.

This is the highest-consequence unsettled question in the project. It is also the one most
likely to be answered by accident, by writing a schema.

The constraints that apply:

- **GDPR.** The data subject is the child; the parent exercises the rights. Portugal sets the
  digital-consent age at 13 (GDPR Art. 8 national option).
- **Special-category risk.** A child's voice recording is biometric-adjacent. Their artwork,
  in volume and over time, is developmental information.
- **Third-country transfer.** Supabase and every candidate inference provider under ADR-0012
  may process outside the EU. Region selection and a data-processing agreement are not
  optional extras.
- **Commercial reality.** "We don't train on your child's art" is a *sales asset* in this
  category, not a compliance chore — and it is only sayable if the inference contracts
  actually say it.

## Options

### Option A — Children are user accounts

Each child gets a login. Rejected: it creates minor accounts, consent obligations, and
authentication for four-year-olds. No part of the product needs it.

### Option B — Children are attributes of the family account *(recommended)*

The **parent is the only account holder and the only data subject with credentials.** A child
is a row owned by that account: first name (or nickname) and birth year. Nothing else — no
surname, no date of birth, no school, no photograph of the child, no email.

- **Pro:** collapses most of the obligation. The parent's consent is the account. Deletion is
  a cascade from one row.
- **Con:** "Room" and "Gallery" names are parent-authored free text and can leak whatever the
  parent types. Mitigated by copy, not by code.

### Option C — Anonymised children

Children referenced only by an opaque id, names rendered client-side from local storage.
Maximum privacy, and it destroys the product — the child's name on the plaque is the point.

## Decision

*Blank while proposed.* Recommended: **Option B**, with the following as part of the decision
rather than as later hardening:

1. **Private by default.** A new museum is visible only to its account. Publishing is an
   explicit action per gallery, and the public form is an **unguessable link**, never an
   indexed page, unless the parent separately opts in.
2. **Data minimisation on the child row:** display name + birth year. Age is derived, never
   stored. No child photographs — the artwork is the portrait.
3. **No training, no retention, contractually.** Every inference provider must offer
   zero-retention and no-training terms in writing before it can be the launch adapter. This
   is a gate on **AIS-01**, not a preference.
4. **EU data residency** for Postgres and Storage. Inference providers outside the EU require
   an SCC-backed DPA and are named in the privacy notice.
5. **Export and erase are features, not tickets.** A parent can download the whole museum
   (originals + metadata) and delete it irreversibly, both self-serve (**OPS-04**, **OPS-05**).
6. **Audio is the most sensitive object in the system.** It never leaves EU storage, is never
   used as a training input, and is deleted with the artwork.
7. **Minimum age gate on the account holder,** and a plain-Portuguese privacy notice written
   for a parent rather than a lawyer (**OPS-03**).

## Consequences (if Option B is accepted)

- The schema is unblocked: `children` is a thin table owned by `accounts`, with no auth.
- **Public-by-default is foreclosed.** Any growth loop that depends on discoverable galleries
  has to be redesigned around parent-initiated sharing. This is a real cost to virality and
  it is accepted deliberately.
- Provider choice under ADR-0012 narrows — some cheap inference endpoints cannot offer
  zero-retention terms. Cost and compliance are now one decision, not two.
- Storage costs rise: originals are kept, because "download everything" is a promise.
- **This ADR is not legal advice.** Before taking money from families who are not friends, the
  privacy notice and the DPA chain need a professional review (**OPS-06**).

## Revisit when

The first non-friend customer signs up, a provider changes its retention terms, or the Escola
tier is scoped — a school is a different lawful basis entirely and needs its own ADR.
