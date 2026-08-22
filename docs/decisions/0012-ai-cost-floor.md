---
title: "ADR-0012: Launch only with AI the business can afford forever"
status: accepted
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: none
supersedes:
  - docs/decisions/0005-vision-model-provider.md
related:
  - docs/decisions/0004-product-ambition.md
  - docs/product/PLATFORM_DEFINITION.md
  - docs/engineering/API_COSTS_AND_DATA_FLOW.md
---

# ADR-0012: Launch only with AI the business can afford forever

- **Status:** ✅ **ACCEPTED**
- **Date raised:** 2026-08-22
- **Decided:** 2026-08-22 by SMTCB

## Context

ADR-0005 framed the question as *"Claude API or self-hosted fine-tuned LLaVA?"* and stalled,
partly because our own documents disagree by 20× on what a single artwork costs to process
(backlog **STR-02**).

On 2026-08-22 the owner reframed it, and the reframing is the decision:

> "If I start with a really nice feature (using Claude API that provides incredible results)
> and then move to a 'cheap' solution, I automatically lose all credibility."

This is not a cost-optimisation question. It is a **product-integrity constraint**. A
subscription product cannot quietly degrade the thing people subscribed for. Quality may go
up after launch; it may never go down.

The relevant economics, for a Família licence at roughly €70/year sold from Portugal:

| Line | Per subscriber, per year |
|---|---|
| Gross | ~€70 |
| Less EU VAT (OSS, PT 23%) | ~€57 |
| Less Stripe (≈1.5% + €0.25, EU cards) | ~€56 |
| **Net revenue** | **~€56** |
| Target COGS ceiling (infra + AI + storage + egress) | **≤ €7 — 12.5%** |

A family uploading 40 artworks a year against a €7 ceiling gives a hard budget of roughly
**€0.17 of AI and infrastructure per artwork, for the life of the subscription** — and that
budget has to cover re-generation, not just the first pass.

The second relevant fact is what the magic is actually made of. The 36 effects in
`window.TEMPLATE_LIBRARY` — the product's differentiator — are **hand-written React and CSS
with a marginal cost of zero.** They are not model output. Nothing about them degrades if the
AI budget is tight.

## Options

Rejected: *"start on Claude API, optimise the margin later."* It is the cheapest path to a
good launch and the most expensive path to a business, because the optimisation is visible to
the customer.

## Decision

**No component of the shipped product may depend on a model we could not afford to keep
running at 10,000 subscribers.** Concretely:

1. **Deterministic first.** Anything achievable with code, CSS, or image processing is done
   that way and never sent to a model. This covers the effect library, palette extraction,
   line-art conversion for the colouring book, image derivatives, and print layout.
2. **All inference goes through one interface.** A single `ArtworkIntelligence` port with
   swappable adapters (`describe`, `classify`, `transcribe`). No provider SDK is imported
   anywhere else in the codebase.
3. **The launch adapter must clear the €0.17/artwork budget** measured end-to-end, including
   retries. Open-weight models on Replicate or Together, and Whisper on Groq, are the
   candidates. **AIS-01** is the bake-off that picks one.
4. **Claude API is permitted for internal tooling only** — building the golden set, grading
   candidate adapters, authoring effect concepts. It never sits in a user request path.
5. **Quality is a floor, not a target.** The golden set (**AIS-02**) is 11 artworks with
   accepted outputs. A candidate adapter that scores below the incumbent does not ship, and no
   adapter swap may lower the score after launch.

## Consequences

- Descriptions at launch will be **good, not extraordinary**. That is deliberate, and it is
  the version customers will keep getting. Set expectations in the marketing copy accordingly.
- **ADR-0005 is superseded.** Self-hosting is not rejected — it is reclassified as one adapter
  behind the port, to be evaluated on cost when volume justifies it, not as a strategy.
  `docs/engineering/FINE_TUNING_STRATEGY.md` stays `reference` on that basis.
- **STR-02's 20× cost gap stops blocking anything.** The gap existed because two documents
  costed two different products. AIS-01 produces one measured number and this ADR is where it
  lands.
- The provider abstraction is real work that buys no visible feature (**AIS-03**). It is the
  price of being able to change providers without changing the product.
- Generated assets must be **cached and owned**, not regenerated per view (**AIS-06**), or the
  per-artwork budget silently becomes a per-view budget.
- If a genuinely differentiating feature turns out to need frontier-model quality, it ships as
  a **separately priced add-on with its own margin**, never folded into the base licence.

## Revisit when

Open-weight model quality at the €0.17 budget matches what a frontier model produces today —
or net revenue per subscriber changes enough to move the COGS ceiling.
