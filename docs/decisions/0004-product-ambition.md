---
title: "ADR-0004: Product ambition — family artifact or venture-scale SaaS"
status: accepted
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: none
related:
  - docs/decisions/0005-vision-model-provider.md
  - docs/decisions/0006-when-to-introduce-a-database.md
  - docs/archive/proj_eval-2026-05-29.txt
---

# ADR-0004: Product ambition — family artifact or venture-scale SaaS

- **Status:** ✅ **ACCEPTED — Option B, venture-scale SaaS**
- **Date raised:** 2026-08-22
- **Decided:** 2026-08-22 by SMTCB

## Context

This is the decision every other open decision hangs off, and it has never been made
explicitly. The repo currently contains documents that assume incompatible answers:

| Document | Assumes | Implies |
|---|---|---|
| `docs/archive/ROADMAP-static-phase.md` (May 28) | A family museum that *might* grow | Static until a concrete reason; Phase 3 "only if there is genuine demand" |
| `docs/archive/product_roadmap-2026-05-29.txt` (May 29) | A funded startup | Supabase + Next.js migration in Q3 2026, Stripe in Q4, POD in Q1 2027 |
| `docs/archive/proj_eval-2026-05-29.txt` (May 29) | A pre-seed investment | Migration "within 60 days" as a condition of funding |

Those 60 days elapsed in July. Neither the migration nor the funding happened, and the
work since May has gone into the Sala de Experimentação — 33 visual effects, which is a
craft investment, not a scaling one. **Revealed preference so far points at the family
artifact.** That is worth naming rather than drifting into.

The two paths are not a little different. They differ in monthly cost by roughly 100×, in
scope by dozens of screens (`docs/product/SCREENS.md` lists 56, of which 8 exist), and in
the kind of work that counts as progress.

## Options

### Option A — Family artifact, crafted deeply

The museum stays a private, beautiful thing for this family, possibly shared with a handful
of others by link. Investment goes into the creative layer: more animation routines, better
image quality, print output, audio in the child's voice.

- **Cost:** ~$0/month. Anthropic API ~$1–3/year at 50 artworks/year.
- **Effort:** Continuous, low-intensity, entirely within one person's evenings.
- **Risk:** None financially. The risk is only regret about an unexplored commercial idea.
- **Implies:** ADR-0005 → Claude API. ADR-0006 → no database. Most of `SCREENS.md` never gets built.

### Option B — Venture-scale SaaS

Pursue the business described in `docs/archive/BUSINESS_OVERVIEW-2026-08-22.md`: freemium, $49/yr Família tier,
$149/yr Escola tier, physical products, ~2M paying families to reach $100M ARR.

- **Cost:** $450–700/month infrastructure before the first paying customer, plus Stripe,
  POD, analytics, and support burden.
- **Effort:** 4–8 weeks full-time for the Phase 3 rebuild alone, then continuous.
- **Risk:** The `proj_eval` memo names it exactly — B2C distribution. A $49/yr product
  cannot absorb paid acquisition, so it lives or dies on a viral loop that is currently a
  hypothesis with a sample size of zero.
- **Implies:** ADR-0005 → self-hosted becomes defensible *eventually*. ADR-0006 → database now.

### Option C — Family artifact now, with commercial optionality preserved

Build Option A, but avoid choices that would foreclose Option B. Concretely: keep the
artwork schema clean and portable, put photos behind a path indirection so storage can move,
build the self-serve upload flow (which Option A wants anyway, to remove the Claude Code
dependency), and defer only auth, billing, and multi-tenancy.

- **Cost:** ~$0/month, same as A.
- **Effort:** Marginally more than A — perhaps 10% overhead on design choices.
- **Risk:** Mild over-engineering; the classic failure is preserving optionality that is
  never exercised while paying for it every sprint.

## Decision

**Option B — venture-scale SaaS.** Decided by SMTCB on 2026-08-22.

The framing in the Context section above was wrong on one point, and the correction matters
enough to record. This ADR read the last three months of work as *revealed preference* for
Option A. It was not. The site at fmb.art was built as a deliberate experiment with an
audience of two — the owner and his wife — to find out what the product should feel like
before committing to build it. Craft investment in the Sala de Experimentação was the
experiment running, not a decision to stay small.

So the May documents that assumed a startup were not aspirational drift. They were closer to
intent than the roadmap that assumed a family artifact. What lapsed in July was a *deadline*,
not the ambition.

Option C is rejected as a distinct path, not because preserving optionality is wrong but
because there is no longer an option to preserve — the commercial fork is the chosen one, so
"optionality" collapses into simply building B in a sensible order.

## Consequences

**The current site is reclassified.** fmb.art is a validated prototype, not a v1. It is the
reference for what the experience should feel like and the source of the creative layer
(44 animation routines, the frame chrome, the discovery-dot interaction). It is not the
codebase the SaaS grows out of — see ADR-0001, which remains *accepted* for the prototype
and is now on a path to being superseded rather than extended.

**Decisions this unblocks, and how it points them:**

| ADR | Now points toward | Still needs its own call |
|---|---|---|
| [0005](0005-vision-model-provider.md) vision provider | Claude API first — self-hosting is a margin optimisation, and optimising margin before there is revenue is the classic pre-PMF mistake | Yes. Option B does not mean "self-host now"; it means self-hosting becomes defensible *later*, at volume |
| [0006](0006-when-to-introduce-a-database.md) database timing | A database is now a *when*, not an *if*. The trigger stays "the second family," not artwork count | Yes — the sequencing question is live, the outcome is not |
| [0008](0008-build-step.md) build step | A build step is implied by the target stack. The question narrows to whether the prototype gets one, or whether it is inherited by the rebuild | Yes |
| [0009](0009-approval-step-in-automated-upload.md) upload approval | Becomes a product-design question about other people's children's art, not a convenience question about our own | Yes, and it gets harder under B |

**Decisions this does *not* touch.** ADR-0002 (Portuguese-only UI) is now genuinely open to
challenge — a SaaS aiming beyond Portugal cannot be PT-PT only forever — but that challenge
belongs in a new ADR that supersedes it, not in an edit here. ADR-0007 (audio discovery dots)
is unaffected: its clock is the children's ages, and it runs regardless of ambition.

**What this decision does not settle.** Choosing the destination is not choosing the route.
Target market, wedge, pricing, and go-to-market remain unwritten — the strategy work exists
in the owner's head and in conversations held outside this repo, and none of it is captured
here. `docs/archive/BUSINESS_OVERVIEW-2026-08-22.md` is a `reference` document describing one possible shape of the
business, not an agreed plan. **Until that strategy is written down, Horizon 3 of the roadmap
cannot be planned honestly**, and this ADR should not be read as approving the specific
numbers in `docs/archive/BUSINESS_OVERVIEW-2026-08-22.md` (2M families, $100M ARR). It approves the direction only.

The `proj_eval` risk stands and is not resolved by deciding: a $49/yr B2C product cannot
absorb paid acquisition, so distribution remains the central unproven assumption.

## Revisit when

Revisit if a serious attempt at distribution fails to produce a working acquisition loop, or
if the strategy work now pending materially changes the shape of the business. Reversal means
a new ADR superseding this one — not an edit.
