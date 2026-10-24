---
title: "ADR-0018: Printed album — a manual test before any store"
status: accepted
owner: SMTCB
review_cycle: none
last_reviewed: 2026-10-24
related:
  - docs/decisions/0017-stay-static-for-now.md
  - docs/decisions/0014-childrens-data.md
  - docs/product/PLAN.md
  - docs/design/IDENTITY.md
---

# ADR-0018: Printed album — a manual test before any store

- **Status:** Accepted
- **Date raised:** 2026-10-24
- **Decided:** 2026-10-24, SMTCB

## Context

[`PLAN.md`](../product/PLAN.md) §6 keeps every physical product (`POD`) in the icebox until
STR-05 names the customer. [ADR-0017](0017-stay-static-for-now.md) says to do only work that is
useful whichever way the museum goes.

A printed album of one child's complete work is the one physical product the prototype can
make today without new infrastructure. It needs only the photos, titles, dots and palettes
already in `art-data.js`. The owner sees it as the most likely thing a family would pay for.
Nobody has yet paid for it.

The identity was designed and approved first (`album/identidade.html`, Cubo Branco in print:
catalogue entries, plates with margin callouts, full-bleed details, and QR codes that open the
animated work).

## Options

### Option A - Build a store now
This means checkout, payments, a print-on-demand API and order tracking: the S-39–S-45 screens.
It takes weeks of work, a vendor, and legal and fiscal obligations, all before one sale proves
the demand. It contradicts both the icebox and ADR-0017.

### Option B - A generator in the repo, then sell by hand *(chosen)*
The repo gets a script that turns one artist into a print-ready PDF. Sales happen by hand, outside
the site. Only real sales justify anything more.

### Option C - Do nothing until STR-05
This has no cost, but it leaves the most testable revenue idea untested. STR-05 would be better
informed by a real price that someone did or did not pay.

## Decision

**Option B, in three phases. Each phase starts only if the one before it earns it.**

1. **Phase 1, now: the generator.** `npm run album -- <Artista> [ano] [--tiragem N]`
   (`scripts/album.js`) writes `album/out/<slug>/miolo.pdf` and `capa.pdf`, A4 with 3 mm bleed,
   printed by headless Chrome. It is a scoped exception to the POD icebox (item **POD-01**). It
   adds no schema field and no route, and the site is unchanged.
2. **Phase 2, next: manual pre-orders.** The owner offers the album to the testing families and
   takes payment by MB Way or a Stripe Payment Link. The owner sends the PDF to a printer and
   delivers it by hand. The site gets no checkout and no stored orders.
3. **Phase 3, only if Phase 2 sells: a store.** It is designed then, against STR-05 and with the
   real numbers (price, margin, printer, return rate) from Phase 2. That decision is a new ADR.

## Consequences

- No vendor, no bill and no change to the deployed site. The output folders (`album/out/`,
  `album/originais/`) are gitignored, so PDFs and full-resolution originals never reach the
  repo or Vercel.
- **The book contains children's names and works.** Phase 2 sells only to the child's own
  family, which already holds that data. Selling to anyone else waits on
  [ADR-0014](0014-childrens-data.md).
- **Known gaps** are listed here so they are not forgotten:
  - **No child quote in the entry.** The schema has no field for the child's own words. If the
    album needs one, propose a field first (CLAUDE.md).
  - **Originals.** The site photos are optimised to ≤ 3000 px. The script prefers
    `album/originais/<id>.*` when present, and warns below 150 dpi.
  - **Fonts.** Chrome embeds the variable Google fonts (Cormorant Garamond, JetBrains Mono) as
    Type 3. They render correctly, but a printer's preflight may ask for them to be outlined or
    replaced with static font files.
  - **Finishes.** Foil, cloth and the tipped-in cover plate are the printer's work. The cover PDF
    is flat.
- POD stays in the icebox apart from POD-01. Phase 2 is owner work, not code.

## Revisit when

Phase 2 has offered the album to the testing families. Either it sold, and Phase 3 needs a new
ADR, or it did not, and the generator stays as a gift tool. Revisit sooner if a printer rejects
the PDF.
