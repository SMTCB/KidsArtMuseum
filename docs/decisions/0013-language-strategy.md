---
title: "ADR-0013: Language strategy for the platform"
status: proposed
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: none
related:
  - docs/decisions/0002-portuguese-only-ui.md
  - docs/decisions/0004-product-ambition.md
---

# ADR-0013: Language strategy for the platform

- **Status:** ⚠️ **PROPOSED — recommended Option B. `docs/product/PLAN.md` assumes it.**
- **Date raised:** 2026-08-22
- **Decided:** —

## Context

ADR-0002 made Portuguese (PT-PT) the product rather than a localisation, and it was right:
the museum was built for one family, and the children speak Portuguese.

ADR-0004 changed the audience. Portugal has roughly 1.2 million households with a child under
twelve. A €70/year licence needs several thousand paying families to be a business, which is
a plausible share of that market and a very small share of the Spanish, French, or UK ones.

This must be settled **before the schema is fixed**, not after. Retrofitting language into a
database is a migration; retrofitting it into 200 hardcoded UI strings is a week of tedium
and a permanent risk of missed strings. Three things carry language:

1. **UI chrome** — buttons, labels, errors, emails, legal copy.
2. **Model output** — the curator's description, the bedtime story. These are *generated per
   artwork* and stored, so their language is a row in the database, not a UI setting.
3. **The child's own voice** — recorded audio and the parent's transcription. Never
   translated, under any option.

One asset already anticipates this: every entry in `window.TEMPLATE_LIBRARY` carries both a
`name` and an `en` field. The effect library is already bilingual.

## Options

### Option A — PT-PT only, indefinitely

Carry ADR-0002 forward unchanged. Cheapest. Caps the addressable market at one country and
makes every later expansion a retrofit.

### Option B — Build multilingual, launch Portuguese *(recommended)*

UI strings live in a catalogue from the first commit. `locale` is a column on the account and
on every generated text row. The rendered product at launch ships **PT-PT only** — one
locale file, no language switcher, no translation cost. Adding English later is a translation
job, not an engineering project.

- **Pro:** the expensive half is done while it is nearly free. The AI port (ADR-0012) already
  takes a target language as a parameter, so generated text is locale-aware for free.
- **Con:** every string goes through a lookup rather than being typed inline — a small,
  permanent tax on writing UI. Roughly a day of setup (**PLT-06**).

### Option C — Bilingual PT/EN at launch

Doubles copywriting, legal, support, and marketing surface before a single paying customer
proves the wedge exists.

## Decision

*Blank while proposed.* Recommended: **Option B.**

## Consequences (if Option B is accepted)

- **ADR-0002 is scoped, not superseded.** "Portuguese is the product, not a localisation"
  remains true for what ships. The *architecture* stops assuming it.
- `artworks.description`, `explore_assets.story`, and every generated text row carry a
  `locale`. Regenerating in another language becomes a row, not a rewrite.
- The child's recorded audio and its transcript are **never translated.** A grandparent in
  another country hears the child, in the child's language, with the chrome in theirs.
- Language is an **account** setting, not a browser guess. A Portuguese family living abroad
  gets Portuguese.
- No language switcher ships at launch. Adding one is **ACC-09**, deliberately not scheduled.

## Revisit when

The strategy (backlog **STR-05**) names a non-Portuguese market as the wedge, or the first
ten paying customers include one outside Portugal.
