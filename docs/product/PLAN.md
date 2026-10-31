---
title: Plan
status: canonical
owner: SMTCB
last_reviewed: 2026-10-14
review_cycle: 30d
supersedes:
  - docs/archive/ROADMAP-2026-08-22.md
  - docs/archive/BACKLOG-2026-08-22.md
  - docs/archive/SPRINTS-2026-08-22.md
related:
  - docs/product/PLATFORM_DEFINITION.md
  - docs/decisions/README.md
  - docs/design/IDENTITY.md
---

# Plan

**The single planning document.** Horizons, every work item, and the sprint schedule live
here and nowhere else. It replaces `ROADMAP.md`, `BACKLOG.md`, and `SPRINTS.md`, which were
three documents describing one thing and drifted apart within a fortnight of being written.
All three are archived with tombstones.

If you are looking for *what the product is*, that is
[`PLATFORM_DEFINITION.md`](PLATFORM_DEFINITION.md). This document is *what we build and when*.

---

## 1. Where we actually are — 2026-08-22

Verified against the running site, not against documents.

| | |
|---|---|
| **Live** | `fmb.art` — static React, no build step, deployed from `main` |
| **Artworks** | 11, by 3 children |
| **Effects** | 36 in `window.TEMPLATE_LIBRARY`, plus 13 bespoke routines — 46 keys in `window.ANIMS` |
| **Accounts** | None. One family, hand-edited catalogue in `art-data.js` |
| **Health** | No console errors. Every `anim` resolves, every asset present |
| **Cost** | ~€0/month on Vercel |
| **Known weak point** | 25 MB of images on the hallway |

The prototype did its job. Per [ADR-0004](../decisions/0004-product-ambition.md) it was a
deliberate experiment with an audience of two, built to learn what the product should feel
like. **It is a validated prototype, not a v1.** The thing it validated — 36 hand-written
effects that make a child's drawing feel like it belongs in a museum — is the asset the
platform is built around.

---

## 2. The product model

The platform replicates museum logic, not a photo library. This is deliberate and it shapes
the schema:

```
Account  ─ a family. The parent is the only account holder.
  └── Museum ─ one per account. Named by the family.
        └── Room ─ typically one per child, but the family decides.
              └── Gallery ─ a curated set: by age, by year, by style.
                    └── Artwork ─ the photo, the plaque, the dots, the effects.
```

A family may put everything in one room, give each child a room, or run several galleries for
the same child. **Rooms and galleries are user-created and user-named.** Children are
attributes of the account, never users — see
[ADR-0014](../decisions/0014-childrens-data.md).

---

## 3. What this plan assumes

> **Re-routed 2026-10-14 by [ADR-0017](../decisions/0017-stay-static-for-now.md).** The rebuild
> (ADR-0011) is deferred until a second real family asks or the museum goes public. Sprints 2-9
> below are **paused**, kept as the platform reference. The active work is three layers on the
> static prototype: **QUA-11** (light Vite build), **UPL-11** (add pieces without a terminal),
> **QUA-12** (thumbnails and `srcset`). Everything below that assumes ADR-0011 applies only if it
> is reopened.

Five decisions shape everything below. Two are made; three are recommended and unconfirmed.
**If one of the three lands differently, the sprints marked against it change.**

| ADR | Status | What the plan assumes | If it flips |
|---|---|---|---|
| [0010](../decisions/0010-visual-identity-direction.md) Visual identity | ✅ accepted | Direção A for museum surfaces, Direção C for product chrome | — |
| [0012](../decisions/0012-ai-cost-floor.md) AI cost floor | ✅ accepted | No shipped feature depends on a model we could not afford at 10,000 subscribers | — |
| [0011](../decisions/0011-platform-rebuild.md) Platform rebuild | ⚠️ proposed | Rebuild on Next.js + Supabase; port the effect library | Sprints 1–4 are replaced wholesale |
| [0013](../decisions/0013-language-strategy.md) Language | ⚠️ proposed | Build multilingual, launch PT-PT only | PLT-06 drops; retrofit cost lands later |
| [0014](../decisions/0014-childrens-data.md) Children's data | ⚠️ proposed | Parent is the account holder; private by default; EU residency | MUS-01 schema changes; SHR-02 growth loop changes |

Three further working assumptions, **not** ADR-level but worth stating because they were
chosen rather than found:

1. **Monetization is real at launch, not stubbed.** A €70/year licence is the thesis; a free
   product with no payment path teaches nothing about whether the thesis holds. Sprint 8.
2. **The undesigned screens are specified here in writing, then designed.** Roughly a third of
   what the platform needs — signup, account, pricing, billing, room and gallery management,
   the museum-level view — has no drawing in either direction. DES-08 writes the acceptance
   criteria; STR-07 commissions the visuals against Direção C.
3. **The prototype keeps running until MUS-11 is verified.** It is the only place the family's
   eleven artworks live.

**The single largest gap in this plan is not a decision.** Target market, wedge, pricing
rationale, and go-to-market are not written down anywhere in this repo. That is **STR-05**,
and it is scheduled in Sprint 1 because everything commercial downstream of it is currently a
guess. `PLATFORM_DEFINITION.md` exists to make the competitive half of that work possible in
a fresh session.

---

## 4. Horizons

### Horizon 1 — Ground control · Sprint 0 · Aug–Sep 2026
Stop the bleeding on the prototype and the repo. Nothing here is wasted under any decision.

### Horizon 2 — The platform exists · Sprints 1–4 · Sep–Nov 2026
A family that is not this family can sign up, create a museum, hang a piece, and see it framed
with the effects. **Roughly 60% of this horizon produces nothing a visitor can see.** That is
the honest cost of ADR-0011.

### Horizon 3 — The platform is worth paying for · Sprints 5–7 · Nov–Dec 2026
The curator's voice, the child's voice, Explore, and sharing. This is where the product stops
being a gallery CMS and becomes the thing the prototype proved.

### Horizon 4 — The platform is a business · Sprints 8–9 · Dec 2026–Jan 2027
Pricing, Stripe, entitlements, privacy, backups, and a closed beta with real families who are
not friends.

### Horizon 5 — Not scheduled
Physical products, the Escola tier, collaborative museums, the Year-in-Review video. Every one
of them depends on which customer turns out to be real, which is STR-05's output.

---

## 5. Feature IDs

**IDs are permanent.** Reference them in commits (`MUS-06: gallery wall view`) and never
reuse a retired one.

| Prefix | Domain |
|---|---|
| `FND` | Foundation and repo hygiene |
| `STR` | Strategy and documentation |
| `DES` | Design system implementation |
| `PLT` | Platform and infrastructure |
| `ACC` | Accounts, auth, onboarding |
| `MUS` | Museum structure — museum, rooms, galleries, artworks |
| `UPL` | Upload and intake pipeline |
| `AIS` | AI services |
| `EXP` | The Explore surface |
| `AUD` | Audio — the child's voice |
| `SHR` | Sharing and the public museum |
| `BIL` | Billing and entitlements |
| `OPS` | Privacy, legal, observability, operations |
| `QUA` | Quality — performance, tests, accessibility |
| `POD` | Physical products |

**Size:** S = under an hour · M = a few hours · L = a day or more · XL = multi-day, break it down.

| Status | Meaning |
|---|---|
| `todo` | Not started |
| `now` | In the active sprint |
| `done` | Shipped and verified |
| `blocked` | Waiting on an ADR or another item |
| `icebox` | Real, but not before the strategy says so |
| `retired` | Superseded by another item or closed by a decision. Never reused. |

---

## 6. The catalogue

### FND — Foundation and repo hygiene

| ID | Item | Size | Status | Notes |
|---|---|---|---|---|
| FND-01 | Track `docs/` in git | S | `now` | 155 KB of strategy work was untracked — one `git clean` from gone. |
| FND-02 | **Rotate the GitHub PAT out of `.git/config`** | S | `todo` | A personal access token sits in plaintext in the remote URL. Prints on `git remote -v`, leaks in screen shares, travels with a folder copy. **Do this first.** |
| FND-03 | Delete the stale `effects/` bundle | S | `done` | Gone already (verified 2026-10-16). Original note: A handoff package already applied in `7480864`. Two files are older than the repo copies — re-applying it would silently revert `fbc62aa`. |
| FND-04 | Fix `README.md` drift | S | `done` | Status line and docs line fixed 2026-10-16; §3 and §6 were already corrected. Original note: §3 documents an obsolete workflow contradicting `CLAUDE.md`; §6 says run Squoosh by hand. |
| FND-05 | Fix `CLAUDE.md` step numbering | S | `done` | Already 1-10 (verified 2026-10-16). Original note: Two consecutive steps numbered 4. It is the operational spec. |
| FND-06 | Fix the `art-data.js` header comment | S | `done` | Header already accurate (verified 2026-10-16). Original note: Documents an `aspect` field that does not exist; points `anim` at the wrong file. |
| FND-07 | Reconcile `ART_GUIDE` §5a with `window.ANIMS` | M | `done` | Decided 2026-10-14: the 33 Sala effects are **not** eligible as an artwork `anim` (ART_GUIDE §5c). `docs-lint` now fails on an `anim` outside §5a. EXP-05 still decides what the Sala becomes. |
| FND-08 | Exercise the intake pipeline end-to-end | M | `done` | Rehearsed 2026-10-16 with a throwaway entry: form server saved photo and ficha, the archive move to `intake/processed/` was honoured (a duplicate name was then refused), test files removed. `processed/` is still empty because the real pieces came in through the inline route, which has no form to archive. Original note: the archival step had never run. |
| FND-09 | Freeze and tag the prototype | S | `done` | Tag `prototype-v1` (2026-10-16). Not frozen: ADR-0017 keeps improving the prototype, so the README calls it the prototype rather than read-only. |

### STR — Strategy and documentation

| ID | Item | Size | Status | Notes |
|---|---|---|---|---|
| STR-01 | Decide ADR-0004 (product ambition) | — | `done` | Decided 2026-08-22: venture-scale SaaS. |
| STR-02 | Reconcile the per-artwork cost model | M | `retired` | Closed by [ADR-0012](../decisions/0012-ai-cost-floor.md). The 20× gap existed because two documents costed two different products. **AIS-01** now produces one measured number. |
| STR-03 | Merge the roadmaps into one canonical file | M | `done` | This document. |
| STR-04 | Doc lint in CI | S | `done` | `.githooks/pre-commit` (enable once per clone with `npm run hooks`) and `.github/workflows/checks.yml` run `docs-lint` and `check-dots`. The Action has not run on GitHub yet; first push shows it. Folded into PLT-04 for the platform repo. |
| STR-05 | **Write down the strategy** | L | `todo` | Target market, wedge, pricing rationale, GTM. Nothing is captured in this repo. Horizon 5 cannot be sequenced without it. |
| STR-06 | Commission the museum visual identity | M | `done` | Delivered 2026-08-22 as `docs/design/FMB_IDENTITY_REDESIGN_V1.0/`. Direction chosen in ADR-0010. |
| STR-07 | Commission Direção C visuals for the undesigned screens | M | `blocked` | On DES-08. ~14 screens have no drawing in either direction. |
| STR-08 | Competitive and pricing assessment | M | `todo` | Run in a fresh session against `PLATFORM_DEFINITION.md`. Feeds STR-05. |

### DES — Design system implementation

| ID | Item | Size | Status | Notes |
|---|---|---|---|---|
| DES-01 | **Tokenise Direção A and C into one token set** | XL | `todo` | The delivered CSS is 251 hardcoded hex values under `.dir-a`/`.dir-c`/`.dir-b` with exactly one CSS variable. It is a comp, not a system. Two named themes over one token vocabulary. |
| DES-02 | Strip the dead direction-B CSS | S | `todo` | 46 selectors from a dropped third direction. Must not enter the rebuild. |
| DES-03 | Back-office component primitives | L | `blocked` | On DES-01. Buttons, fields, selects, dialogs, tables — Direção C register. |
| DES-04 | Frame component | M | `blocked` | On DES-01. The Direção A physical frame — oak, black, brass, deep box — responsive without losing the depth. |
| DES-05 | Plaque / title card component | M | `blocked` | On DES-01. Cormorant italic title, mono metadata. |
| DES-06 | Wall and hallway layout | L | `blocked` | On DES-04. Masonry that behaves at 2 artworks and at 200. |
| DES-07 | Rewrite `ART_GUIDE.md` against the tokens | M | `blocked` | On DES-01. The guide describes the *current* chrome and becomes wrong the moment tokens land. Rewrite, do not patch. |
| DES-08 | **Spec the undesigned screens** | L | `todo` | Written acceptance criteria for museum view, room and gallery management, signup, account, pricing, checkout, billing, export, delete. Unblocks STR-07. |
| DES-09 | Brand mark and icon set | M | `todo` | `FMB · ART` mark works today; needs favicon, app icon, OG image, email header. |
| DES-10 | Motion primitives | M | `blocked` | On DES-01. Frame open, modal, page transition. One idea per motion — the effects carry the delight. |
| DES-11 | Empty, loading, and error state kit | M | `blocked` | On DES-03. S-54, S-55 plus the states with no design. |

### PLT — Platform and infrastructure

| ID | Item | Size | Status | Notes |
|---|---|---|---|---|
| PLT-01 | Next.js App Router + TypeScript skeleton | L | `blocked` | On [ADR-0011](../decisions/0011-platform-rebuild.md). Closes QUA-03 by construction. |
| PLT-02 | Supabase project — EU region, local dev via CLI | M | `blocked` | On ADR-0011 and [ADR-0014](../decisions/0014-childrens-data.md) (residency). |
| PLT-03 | Tailwind wired to the DES-01 tokens | M | `blocked` | On DES-01, PLT-01. |
| PLT-04 | CI — typecheck, lint, unit, docs-lint | M | `blocked` | On PLT-01. Absorbs STR-04 and QUA-04. |
| PLT-05 | Environments, secrets, preview deploys | M | `blocked` | On PLT-01. |
| PLT-06 | i18n string catalogue | M | `blocked` | On [ADR-0013](../decisions/0013-language-strategy.md). One locale file at launch; the lookup is the point. |
| PLT-07 | **Port the 36-effect library** | L | `blocked` | On PLT-01. Every effect already takes `{ art }` and reads only `art.src`/`art.palette`/`art.bg`. This is the differentiator and it should port almost unchanged — prove that early. |
| PLT-08 | Error boundaries and structured logging | M | `blocked` | On PLT-01. |
| PLT-09 | Rate limiting and abuse protection on write routes | M | `blocked` | On ACC-01. Upload endpoints cost money per call. |
| PLT-10 | Image pipeline — derivatives, `srcset`, CDN caching | L | `blocked` | On PLT-02. Supersedes QUA-01 for the platform. |

### ACC — Accounts, auth, onboarding

| ID | Item | Size | Status | Notes |
|---|---|---|---|---|
| ACC-01 | Supabase Auth — email + magic link | M | `blocked` | On PLT-02. |
| ACC-02 | Sign up → create museum | L | `blocked` | On ACC-01, DES-08. S-27. No design exists. |
| ACC-03 | Log in, log out, session handling | M | `blocked` | On ACC-01. S-28. |
| ACC-04 | Password reset and transactional email templates | M | `blocked` | On ACC-07. PT-PT copy. |
| ACC-05 | Account settings | M | `blocked` | On DES-08. Museum name, language, privacy defaults. S-26. |
| ACC-06 | Onboarding — first child, first gallery, first upload | L | `blocked` | On MUS-04, UPL-02. The moment the product either lands or does not. |
| ACC-07 | Transactional email sender + domain authentication | M | `blocked` | On PLT-05. SPF/DKIM on `fmb.art`. |
| ACC-08 | Delete account with cascade | M | `blocked` | On MUS-01. Pairs with OPS-05. |
| ACC-09 | Language switcher | M | `icebox` | Deliberately not scheduled — see ADR-0013. |

### MUS — Museum structure

| ID | Item | Size | Status | Notes |
|---|---|---|---|---|
| MUS-01 | **Schema — accounts, museums, children, galleries, artworks** | L | `blocked` | On [ADR-0014](../decisions/0014-childrens-data.md). Do not write this before that decision; a schema *is* a privacy decision. |
| MUS-02 | Row-level security policies + a test suite for them | L | `blocked` | On MUS-01. Multi-tenancy is only as real as its RLS tests. |
| MUS-03 | Museum view — the rooms overview | L | `blocked` | On DES-08. No design exists in either direction. |
| MUS-04 | Room CRUD | M | `blocked` | On MUS-02, DES-08. |
| MUS-05 | Gallery CRUD within a room | M | `blocked` | On MUS-04. |
| MUS-06 | Gallery wall view | L | `blocked` | On DES-06, MUS-05. S-01. The Direção A surface. |
| MUS-07 | Exhibition view — single artwork | L | `blocked` | On DES-04, DES-05. S-03. |
| MUS-08 | Discovery dots — placement and display | M | `blocked` | On MUS-07. S-04. |
| MUS-09 | Reorder artworks within a gallery | M | `blocked` | On MUS-06. Replaces `HALLWAY_ORDER`. |
| MUS-10 | Move an artwork between galleries or rooms | M | `blocked` | On MUS-05. |
| MUS-11 | **Migrate the 11 prototype artworks** | M | `blocked` | On MUS-01. The prototype is not retired until this is verified, dots and all. |
| MUS-12 | Wall themes | M | `blocked` | On DES-06. S-02. |
| MUS-13 | Empty states across museum, room, gallery | M | `blocked` | On DES-11. S-54. |
| MUS-14 | Artwork edit | L | `blocked` | On MUS-07. S-24. Required under every ADR-0009 option. |
| MUS-15 | Delete artwork, gallery, or room with confirmation | M | `blocked` | On MUS-05. |
| MUS-16 | Skill `animar-obra`: distinctive, per-drawing animation | M | `done` | Principles and the parts contract in [ARTWORK_ANIMATION](../design/ARTWORK_ANIMATION.md). Written with `skill-creator`; verified with the Emil Kowalski review skills. Bespoke craft, not the volume path in TEMPLATE_COMPOSITION_STRATEGY. Closes with the ART_GUIDE §5/§9 update and FND-07. |
| MUS-17 | Pilot the skill on Gato de Barro | S | `done` | Palitos (stick arms sway) approved idea; committed. Since then `jogador` (Maestro), 4 Miguel routines and `check-dots` landed outside a catalogue ID. |

### UPL — Upload and intake

| ID | Item | Size | Status | Notes |
|---|---|---|---|---|
| UPL-01 | Upload entry point — "Pendurar Nova Peça" | S | `blocked` | On MUS-06. S-14. |
| UPL-02 | Photo picker and drag-drop with client validation | M | `blocked` | On UPL-05. S-15. |
| UPL-03 | Client-side compression and HEIC conversion | M | `blocked` | On PLT-01. S-56. Absorbs the prototype's P1-01. iPhone photos are the default input. |
| UPL-04 | Crop, rotate, deskew editor | L | `blocked` | On UPL-02. S-16. Applies to the *photograph*, never to the drawing. |
| UPL-05 | Direct-to-Storage signed upload | M | `blocked` | On PLT-02. Originals never pass through the app server. |
| UPL-06 | Context form — artist, age, title hint, the child's words | M | `blocked` | On UPL-02. S-17. Replaces the markdown intake form. |
| UPL-07 | Processing state | M | `blocked` | On AIS-04. S-20. |
| UPL-08 | Review before publish | M | `blocked` | On [ADR-0009](../decisions/0009-approval-step-in-automated-upload.md). S-21. |
| UPL-09 | Success — "está na parede" | S | `blocked` | On UPL-08. S-22. |
| UPL-10 | Failure and retry states | M | `blocked` | On AIS-04. S-55. A failed upload must never lose the photo. |
| UPL-11 | Batch upload | L | `icebox` | The obvious second-session need — a parent with a folder of 60 drawings. Not before launch. |

### AIS — AI services

| ID | Item | Size | Status | Notes |
|---|---|---|---|---|
| AIS-01 | **Provider bake-off against the €0.17/artwork budget** | L | `todo` | Gated by [ADR-0014](../decisions/0014-childrens-data.md): a provider without written zero-retention and no-training terms cannot be the launch adapter. Produces the number that closes STR-02. |
| AIS-02 | Golden set — the 11 artworks with accepted outputs, plus a grader | M | `todo` | Quality is a floor, not a target. Nothing swaps in below the incumbent score. |
| AIS-03 | `ArtworkIntelligence` port and adapters | L | `blocked` | On AIS-01. No provider SDK imported anywhere else in the codebase. |
| AIS-04 | Curator description generation | M | `blocked` | On AIS-03. |
| AIS-05 | Palette extraction — deterministic | M | `done` | `scripts/palette.js` (sharp, Lab k-means, no model, no randomness) proposes `bg` and `palette`; `--audit` compares every artwork with the photo. It proposes, the owner approves at intake. `--snap --write` moved 8 hand-picked swatches in 7 artworks to the nearest real colour of the same slot and role (2026-10-16); swatches whose real counterpart is a different colour (warhol, manuelfigure, mbappe) were left. Known limit: pale or muted work on paper where the ground is not one dominant colour. Not yet fed to the 36 effects. **The highest-leverage unlock in this plan.** Palettes are currently picked by eye, by hand. Code, not a model — zero marginal cost, and it feeds all 36 effects. |
| AIS-06 | Generated-asset cache and invalidation | M | `blocked` | On MUS-01. Without it the per-artwork budget silently becomes a per-view budget. |
| AIS-07 | Effect suggestion from classification | M | `blocked` | On AIS-03, PLT-07. Suggest, never auto-assign. |
| AIS-08 | Discovery-dot suggestion | M | `blocked` | On AIS-03. |
| AIS-09 | Per-artwork cost telemetry and a budget alarm | M | `blocked` | On AIS-03. The ADR-0012 ceiling is only real if it is measured. |
| AIS-10 | Content safety check on upload | M | `blocked` | On UPL-05. A public-facing upload endpoint will eventually receive something that is not a child's drawing. |

### EXP — The Explore surface

| ID | Item | Size | Status | Notes |
|---|---|---|---|---|
| EXP-01 | Explore modal shell | M | `blocked` | On MUS-07. S-05. |
| EXP-02 | Effect picker over the ported library | L | `blocked` | On PLT-07, EXP-01. 36 effects need browsing, not a dropdown. |
| EXP-03 | Story mode — the bedtime story | L | `blocked` | On AIS-03. S-07. Text generation, so it lands inside the ADR-0012 budget. |
| EXP-04 | Colouring book — line art and print | L | `blocked` | On EXP-01. S-08. **Deterministic image processing, not a model.** Edge detection plus threshold on the original. |
| EXP-05 | Sala de Experimentação as a product surface | M | `blocked` | On EXP-02. S-06. Decide whether it is a showcase or a playground — see FND-07. |
| EXP-06 | Remix persona selector | M | `icebox` | S-18. Cheap once AIS-03 exists; unproven that anyone wants it. |
| EXP-07 | Capture an effect as a shareable image or clip | L | `blocked` | On SHR-07. The effects are the marketing. |

### AUD — Audio, the child's voice

| ID | Item | Size | Status | Notes |
|---|---|---|---|---|
| AUD-01 | Audio dot playback | M | `blocked` | On MUS-08, [ADR-0007](../decisions/0007-audio-discovery-dots.md). The cheap half — can ship before recording exists. |
| AUD-02 | Audio upload and storage | M | `blocked` | On UPL-05, ADR-0014. |
| AUD-03 | In-browser recording UI | L | `blocked` | On AUD-02. S-19. 15-second cap, waveform, re-record. |
| AUD-04 | Transcription through the port | M | `blocked` | On AIS-03. Whisper-class, inside the budget. Transcript is an accessibility feature, not a replacement for the voice. |
| AUD-06 | Artwork description audio on the prototype | S | `done` | No upload; owner drops files at `assets/art/<id>/audio.mp3` and lists them in `audio-data.js`. Design in [AUDIO_AND_COMMENTS](../design/AUDIO_AND_COMMENTS.md). Consistent with ADR-0007 Option A; does not close it. |
| AUD-05 | Audio retention and deletion policy in code | M | `blocked` | On ADR-0014. The most sensitive object in the system. |

> **AUD has a clock.** The children are 4, 7, and 7. This is the only item in the plan whose
> value decays with delay, and it decays whether or not the platform ships. If the rebuild
> slips, record the audio against the *prototype* anyway.

### SHR — Sharing and the public museum

| ID | Item | Size | Status | Notes |
|---|---|---|---|---|
| SHR-01 | Stable artwork URLs | M | `blocked` | On MUS-07. Prototype stopgap shipped 2026-10-16: `/o/<id>` pages (see SHR-05). Absorbs the prototype's P1-02. |
| SHR-02 | Unguessable public gallery link, with revoke | M | `blocked` | On MUS-02, ADR-0014. Private by default; publishing is an explicit per-gallery action. |
| SHR-03 | Visitor view — read-only | L | `blocked` | On SHR-02. S-31. |
| SHR-04 | Share sheet | M | `blocked` | On SHR-02. Prototype version shipped 2026-10-16: "Partilhar" in the close-up (Web Share API, link-copy fallback, canvas postal); share text is a draft. S-30. |
| SHR-05 | Link previews and OG cards | M | `blocked` | On SHR-03. Prototype version shipped 2026-10-16: `scripts/build.js` writes `dist/o/<id>.html` with Open Graph tags; unfurl only verifiable after deploy. A shared museum link that unfurls as a framed artwork is the cheapest growth mechanism available. |
| SHR-06 | Print view — A4/A3, artwork plus title card | M | `blocked` | On DES-05. S-10. Absorbs P1-03. |
| SHR-07 | Watermarked export and upsell | M | `blocked` | On BIL-02. S-38 — the only monetization surface the redesign actually drew. |
| SHR-09 | Visitor comments (name + text) on the prototype | M | `done` | Built and live 2026-10-14, accepted [ADR-0015](../decisions/0015-prototype-comments-backend.md); Set-up in the design doc. Design in [AUDIO_AND_COMMENTS](../design/AUDIO_AND_COMMENTS.md). Prototype only; the platform version is SHR-03. |
| SHR-08 | "Start your own museum" CTA on the visitor view | S | `blocked` | On SHR-03. |

### BIL — Billing and entitlements

| ID | Item | Size | Status | Notes |
|---|---|---|---|---|
| BIL-01 | Pricing page | M | `blocked` | On STR-05, DES-08. S-33. Cannot be written before the positioning is. |
| BIL-02 | Plans and the entitlement model | L | `blocked` | On MUS-01. What free actually includes decides the shape of everything else. |
| BIL-03 | Stripe checkout | M | `blocked` | On BIL-02. S-34. |
| BIL-04 | Stripe customer portal | S | `blocked` | On BIL-03. S-35. |
| BIL-05 | Webhooks → subscription state | M | `blocked` | On BIL-03. |
| BIL-06 | Free-tier limit enforcement | M | `blocked` | On BIL-02. |
| BIL-07 | EU VAT / OSS handling | M | `blocked` | On BIL-03. Stripe Tax. Selling to consumers across the EU from Portugal. |
| BIL-08 | Gift codes — buy and redeem | L | `icebox` | S-36, S-37. A grandparent buying a year is a plausible wedge; unproven. |
| BIL-09 | Trial and grace-period behaviour | M | `blocked` | On BIL-05. **A museum must never become unreadable because a card expired.** |
| BIL-10 | Dunning and failed-payment email | M | `blocked` | On ACC-07, BIL-05. |

### OPS — Privacy, legal, operations

| ID | Item | Size | Status | Notes |
|---|---|---|---|---|
| OPS-01 | Observability — errors, uptime, funnel events | M | `blocked` | On PLT-08. |
| OPS-02 | Backups and a restore drill | M | `blocked` | On PLT-02. A backup nobody has restored is not a backup. |
| OPS-03 | Privacy notice and terms in plain PT-PT | L | `blocked` | On ADR-0014. Written for a parent, not a lawyer. |
| OPS-04 | Museum export — download everything | L | `blocked` | On MUS-01. Originals plus metadata. It is also the trust argument. |
| OPS-05 | Irreversible self-serve delete | M | `blocked` | On ACC-08. |
| OPS-06 | **Legal review before the first paying non-friend customer** | M | `blocked` | On OPS-03. Privacy notice and the DPA chain. Not optional, and not something this plan can do for you. |
| OPS-07 | Subprocessor list and DPA chain | M | `blocked` | On AIS-01. |
| OPS-08 | Consent and analytics posture | M | `blocked` | On OPS-03. Minimal, first-party, no third-party trackers by default. |
| OPS-09 | Runbook — incidents, restores, provider outage | M | `blocked` | On OPS-02. |
| OPS-10 | Support inbox and response expectations | S | `blocked` | On ACC-07. |

### QUA — Quality

| ID | Item | Size | Status | Notes |
|---|---|---|---|---|
| QUA-01 | Thumbnails and `srcset` on the prototype | L | `retired` | Superseded by PLT-10. The prototype stays slow and that is accepted — it has an audience of two and a retirement date. |
| QUA-02 | Ship production React builds on the prototype | S | `todo` | Two-line fix, still worth doing while the prototype is live. |
| QUA-03 | Remove in-browser Babel | L | `retired` | Closed by PLT-01 — a property of the new app, not a task. |
| QUA-04 | Smoke test and CI | M | `retired` | Absorbed into PLT-04. |
| QUA-05 | Verify prototype mobile layout | S | `done` | Gallery wall, artist galleries and Sala checked at 375px on 2026-10-13 (Sala redesigned: bottom effect strip, caption below the stage). |
| QUA-06 | End-to-end test of the critical path | L | `blocked` | On BIL-03. Sign up → create room → upload → publish → share → subscribe. |
| QUA-07 | Accessibility pass, WCAG AA, both registers | L | `blocked` | On DES-03. Direção A's `#8A8578` metadata on `#FAF8F2` needs checking — it may fail contrast. |
| QUA-08 | Font subsetting and loading budget | M | `blocked` | On DES-01. Four families across two registers. Not optional. |
| QUA-09 | Cross-device QA matrix | M | `blocked` | On MUS-06. |
| QUA-10 | Performance budget on the wall view | M | `blocked` | On PLT-10. Set the LCP target before optimising, so the result is a number. |
| QUA-11 | Light build step on the prototype: no in-browser Babel, production React | M | `done` | [ADR-0017](../decisions/0017-stay-static-for-now.md) layer 2, 2026-10-14. Built with esbuild in `scripts/build.js` (what Vite uses underneath), not Vite itself: the files share globals and load order, which a bundler would have changed. Source page unchanged for local work; Vercel serves `dist/`. Supersedes the retirement of QUA-03 for the prototype. |
| QUA-12 | Thumbnails and `srcset` for the wall | M | `done` | ADR-0017 layer 4, 2026-10-14. `scripts/thumbs.js` (`npm run thumbs`) writes `thumb-480.jpeg` / `thumb-960.jpeg` beside each `photo.jpeg`; `thumbProps()` in `gallery-core.jsx` builds the `srcset` with fallback to the full photo; no schema change. Parede de Galeria went from ~25 MB to ~0.5 MB. Revives QUA-01 for the prototype. Not automated into intake yet: Claude runs `npm run thumbs` when filing a piece (CLAUDE.md). |
| UPL-11 | Add a piece without a terminal (owner-run intake) | L | `done` | ADR-0017 layer 3, 2026-10-14. `Nova obra.cmd` / `npm run intake` opens a local form (`scripts/intake-server.js`, 127.0.0.1 only) that optimizes the photo and writes `intake/<name>.jpeg/.md/.mp3`. Claude still does palette, dots, `anim` and the commit (`animar-obra` stays the quality path). |

### POD — Physical products

All `icebox` until STR-05 says who the customer is. Print store and catalogue, museum book,
masterpiece print, NFC smart frame, configurator, checkout and shipping, order tracking
(S-39–S-45). Highest-margin line in `PLATFORM_DEFINITION.md` and the one most likely to be a
distraction before there are subscribers.

**One scoped exception, [ADR-0018](../decisions/0018-printed-album-manual-test.md):** a printed
album tested by hand before any store.

| ID | Item | Size | Status | Notes |
|---|---|---|---|---|
| POD-01 | Printed album: PDF generator | M | `done` | 2026-10-24. `npm run album -- <Artista> [ano] [--tiragem N]` (`scripts/album.js`, `scripts/album.css`). It writes `album/out/<slug>/miolo.pdf` + `capa.pdf` (A4 + 3 mm bleed, headless Chrome). Contents: entries, plates (the work alone, no callouts since 2026-10-24), details, colour finale, and QR codes to `/o/<id>`. Identity: `album/identidade.html`. Phase 2 (manual pre-orders) is owner work. |
| POD-02 | Gift albums: chosen works, own texts | S | `done` | 2026-10-31. `npm run album -- <presente>` reads `album/presentes/<presente>.md` (copy `exemplo.md`). It sets title, subtitle, cover work, dedication (ex-libris page), opening text, and the works and their order, which may mix children. Per work it sets title, technique, the child's words (a quote on the entry) and the "Repara em" notes. These texts live only in the gift file, so `art-data.js` is unchanged. Gift files are gitignored (public repo, family dedications); only `exemplo.md` is tracked. `--lista` prints every id. |
| POD-03 | Album to leaf through on screen | S | `done` | 2026-10-31. Every `npm run album` run also writes `album/out/<slug>/livro.html`. It holds the same pages as live HTML, with hard covers and pages that turn by drag, click or the arrow keys. It shows one page at a time on a phone. The QR codes become links to `/o/<id>`. It is one self-contained file: the photos are shrunk to 2000 px and embedded, and StPageFlip 2.0.7 (`page-flip`, MIT) is inlined. Sizes: Miguel 4.9 MB, the example 1.4 MB. Files: `scripts/album-livro.css` and `scripts/album-livro.js`. It is local output for sending to a family, not a page on the site. ADR-0018 still applies. |

### Retired legacy IDs

Retained so old commit messages remain readable. **Never reused.**

| Old | Now |
|---|---|
| P1-01 HEIC conversion | UPL-03 |
| P1-02 Stable artwork URLs | SHR-01 |
| P1-03 Print view | SHR-06 |
| P1-04 Third wall theme | MUS-12 |
| P1-05 Animated intro | DES-10 |
| P1-06 Theme naming | DES-07 |
| P2-01 `/api/add-artwork` | UPL-05 + AIS-04 |
| P2-02 Upload UI | UPL-02, UPL-06 |
| P2-03 Client-side compression | UPL-03 |
| P2-04 PIN gate | ACC-01 — accounts replace the PIN |
| P2-05 Approval screen | UPL-08 |
| P2-06 Artwork edit | MUS-14 |
| P2-07 Error states | UPL-10 |

---

## 7. Sprints

Two-week sprints, sized for evenings and weekends rather than full-time work. **One goal
each** — if only one thing ships, it should be that.

> **On the schedule below.** Ten sprints is roughly five calendar months. At an
> evenings-and-weekends pace this plan is more honestly **six to eight months**, and Sprints
> 2–4 are the ones most likely to overrun because they produce infrastructure rather than
> features. Treat the dates as sequence, not as commitments. Re-plan at each boundary.

### Sprint 0 — Ground control · 2026-08-22 → 09-05
> **Goal: nothing important is lost, and the repo tells the truth about itself.**

FND-01 · FND-02 · FND-03 · FND-04 · FND-05 · FND-06 · FND-09 · STR-03 · QUA-02

**Done when:** `node scripts/docs-lint.js` passes, the PAT is rotated, `git status` is clean,
and the prototype is tagged.

### Sprint 1 — Decide, then draw the system · 2026-09-05 → 09-19
> **Goal: the three open ADRs are closed and the design tokens exist.**

**Decide [ADR-0011](../decisions/0011-platform-rebuild.md), [ADR-0013](../decisions/0013-language-strategy.md), [ADR-0014](../decisions/0014-childrens-data.md)** · DES-01 · DES-02 · DES-08 · STR-05 · STR-08 · AIS-05

**Done when:** three ADRs are `accepted`, one token set renders both registers, the
undesigned screens have written acceptance criteria, and palettes come out of code instead of
out of my eye.

**The one that matters:** ADR-0014. Everything in Sprint 2 is a schema, and a schema is a
privacy decision whether or not you make it deliberately.

### Sprint 2 — The skeleton · 2026-09-19 → 10-03
> **Goal: a Next.js app on Supabase that a stranger can log into.**

PLT-01 · PLT-02 · PLT-03 · PLT-04 · PLT-05 · PLT-06 · MUS-01 · MUS-02 · ACC-01 · ACC-03

**Done when:** two different accounts exist, each sees only its own rows, and the RLS test
suite proves it. Nothing is visible to a visitor. That is expected.

### Sprint 3 — The museum has rooms · 2026-10-03 → 10-17
> **Goal: a family can build the structure of their museum, empty.**

MUS-03 · MUS-04 · MUS-05 · MUS-15 · DES-03 · DES-11 · MUS-13 · ACC-05

**Done when:** a parent can create a museum, add two children as rooms, and create galleries
inside them — all in the Direção C register, all still empty.

### Sprint 4 — Something hangs on the wall · 2026-10-17 → 10-31
> **Goal: a photo taken on a phone ends up framed on a wall.**

PLT-07 · PLT-10 · UPL-01 · UPL-02 · UPL-03 · UPL-05 · UPL-06 · UPL-09 · UPL-10 · DES-04 · DES-06 · MUS-06 · MUS-07

**Done when:** an iPhone HEIC photo becomes a framed artwork on a gallery wall without a
terminal — and **the ported effects run on it**. This is feature parity with the prototype,
reached from the other side.

**Realistically two sprints.** Split it at the boundary rather than pretending.

### Sprint 5 — The curator speaks · 2026-10-31 → 11-14
> **Goal: the museum writes its own plaques, inside the budget.**

AIS-01 · AIS-02 · AIS-03 · AIS-04 · AIS-06 · AIS-09 · UPL-07 · UPL-08 · MUS-08 · MUS-14 · DES-05

**Done when:** a new artwork arrives with a title, a description, and dots — and AIS-09 shows
the measured per-artwork cost against the ADR-0012 ceiling.

### Sprint 6 — The child speaks, and the art moves · 2026-11-14 → 11-28
> **Goal: Explore works, and the dots carry the children's voices.**

EXP-01 · EXP-02 · EXP-04 · AUD-01 · AUD-02 · AUD-03 · AUD-04 · AUD-05 · AIS-07 · MUS-12

**Done when:** tapping a dot plays a child explaining their own drawing, and Explore offers
the full effect library plus a printable colouring page.

**Do the audio even if the sprint slips.** See the clock note under AUD.

### Sprint 7 — Send it to a grandparent · 2026-11-28 → 12-12
> **Goal: one link, opened on someone else's phone, works and looks right.**

SHR-01 · SHR-02 · SHR-03 · SHR-04 · SHR-05 · SHR-06 · SHR-08 · MUS-09 · MUS-10 · MUS-11 · QUA-09

**Done when:** a gallery link unfurls as a framed artwork in a messaging app, opens read-only,
loads fast on a mid-range Android — and the family's original eleven artworks are living in
the platform.

### Sprint 8 — Money · 2026-12-12 → 12-26
> **Goal: someone who is not a friend can pay for this.**

BIL-01 · BIL-02 · BIL-03 · BIL-04 · BIL-05 · BIL-06 · BIL-07 · BIL-09 · SHR-07 · EXP-03

**Done when:** a real card completes a real subscription with correct VAT, entitlements
change what the account can do, and an expired card never makes a museum unreadable.

### Sprint 9 — Fit to be trusted · 2027-01-02 → 01-16
> **Goal: a stranger's children's data is safe here, and we can prove it.**

OPS-01 · OPS-02 · OPS-03 · OPS-04 · OPS-05 · OPS-06 · OPS-07 · OPS-08 · OPS-09 · OPS-10 · ACC-08 · QUA-06 · QUA-07 · QUA-08 · QUA-10 · BIL-10 · ACC-06

**Done when:** export and delete both work self-serve, the privacy notice has had a
professional read, backups have been restored once for real, and the end-to-end test covers
sign-up through subscription.

### Then — closed beta

Ten families who are not friends. No new features until their feedback has been read. STR-05
gets rewritten against what they actually say, and Horizon 5 gets sequenced from that.

---

## 8. Working agreements

- **One goal per sprint.** If it does not serve the goal, it waits.
- **Decisions are sprint work.** An ADR on the board is a deliverable like any other.
- **Definition of Done includes documentation** — see [`DOCUMENTATION_GUIDE.md`](../DOCUMENTATION_GUIDE.md) §5.
- **Re-plan at the sprint boundary, not mid-sprint.** Update this file and bump `last_reviewed`.
- **Measure before optimising**, so an improvement is a number rather than a feeling.
- **The painting is the painting.** No auto-enhance, no filter, no model touching the artwork.
- **One animation idea per piece.** Complexity is the enemy of delight.
- **The child is the artist.** The UI celebrates the child's voice, not the technology.

## 9. Sprint log

| Sprint | Goal | Outcome |
|---|---|---|
| 0 | Ground control | *in progress* |
| ADR-0017 detour (2026-10-14) | Improve the static prototype in layers instead of the rebuild | QUA-11 build (esbuild, `dist/`), UPL-11 owner-run intake form, QUA-12 thumbnails and `srcset`, all done. Sprints 2-9 stay paused; ADR-0011 reopens on a second real family or a public launch. |
| ADR-0018 (2026-10-24) | Test a printed album by hand before any store | POD-01 generator done (Miguel: 13 works, 40 pages). Next: manual pre-orders to the testing families. |
