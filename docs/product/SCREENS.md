---
title: Screen Inventory
status: reference
owner: SMTCB
last_reviewed: 2026-08-22
review_cycle: 90d
related: [docs/product/PLAN.md, docs/product/PLATFORM_DEFINITION.md]
---

> **Status: reference.** An inventory of every screen the product has (8) or might have (48).
> Written in July 2026, before [ADR-0004](../decisions/0004-product-ambition.md) was decided
> and before the museum product model (Account → Museum → Room → Gallery → Artwork) existed,
> so it has no S-IDs for the museum-level view or for room and gallery management. Most
> entries are design *direction*, not committed work — see [`PLAN.md`](PLAN.md) for what is
> actually planned and **DES-08** for the screens still to be specified.
>
> S-IDs referenced from `PLAN.md` are stable. Do not renumber them.

# FMB · ART — Screen Inventory

> Prepared: 2026-07-11
> Purpose: Handover reference for design direction work (Claude Design). Lists every screen the platform has today and every screen implied by the product roadmap (since merged into `PLAN.md`), the business overview, and the technical architecture docs.
> Each screen has an ID, a name, its status, and a short description of purpose and key elements.

**Status legend**
- 🟢 **Live** — exists today in the static MVP
- 🟡 **Near-term** — Phase 1–2 of the roadmap (self-serve upload, monetization)
- 🔵 **Future** — Phase 3+ (multi-family SaaS, B2B, physical products)

---

## 1. Museum & Gallery (core viewing experience)

| ID | Screen | Status | Description |
|---|---|---|---|
| **S-01** | Hallway / Wall View (Main Gallery) | 🟢 Live | The primary feed. Artworks hung on a wall in a themed layout (Classic Hallway or Gallery Wall). Grid/masonry of framed pieces, subtle categorization (by artist, year, collection). Entry point to everything else. |
| **S-02** | Wall Theme Switcher | 🟢 Live | Top-bar control to switch between wall themes (currently "Cubo Branco" / "Parede de Galeria"; a 3rd "children's bedroom" theme is planned). Affects the whole gallery's chrome, not individual artworks. |
| **S-03** | Exhibition View (Single Artwork Focus) | 🟢 Live | Clicking a frame opens a focused view of one artwork: image with digital frame, title card/curator's plaque (title, artist, age, year, AI-style description), tap-to-discover hotspots. |
| **S-04** | Discovery Dot Tooltip / Audio Playback | 🟢 Live | Small overlay triggered by tapping a hotspot on the artwork — shows the child's narrated text/audio about that detail of the piece. |
| **S-05** | Explore / "Bring to Life" Modal | 🟢 Live | Full-screen overlay activated from the Exhibition View. Plays the artwork's animation routine (one of the 11+ routines: miro, warhol, portrait, matisse, story, etc.). |
| **S-06** | Sala de Experimentação (Experimentation Room) | 🟢 Live | A gallery of 33 standalone visual effects, separate from the main hallway — a sandbox/showcase of animation ideas not yet attached to specific artworks. |
| **S-07** | Story Mode | 🔵 Future | Sub-view within the Explore Modal: AI-generated "bedtime story" based on the artwork, formatted as readable narrative text. |
| **S-08** | Coloring Book Mode | 🔵 Future | Sub-view within the Explore Modal: the artwork converted to black-and-white line art with a "Print" action. |
| **S-09** | Mobile Gallery (responsive) | 🟢 Live | Mobile-specific layout of S-01 — wall themes collapse to a scrollable 2-column grid. Not a separate route, but a distinct responsive state worth designing explicitly. |
| **S-10** | Print View (single artwork) | 🟡 Near-term | Clean, full-bleed layout of one artwork + title card, optimized for A4/A3 home printing. |
| **S-11** | Comment Section | 🔵 Future | Social layer on the Exhibition View — family members leave comments on a piece. |
| **S-12** | Export to Instagram / Social Share Card | 🔵 Future | Generates a shareable image/video (watermarked on free tier) of the artwork for social posting. |

---

## 2. Upload & Intake

| ID | Screen | Status | Description |
|---|---|---|---|
| **S-13** | Intake Tray (file-drop workflow) | 🟢 Live | Not a UI screen today — a folder-based workflow (`intake/`) where a parent drops a photo + fills a markdown form, then invokes Claude Code. Included here as the *current* equivalent of an upload screen, since it's what Phase 2 replaces. |
| **S-14** | "Pendurar Nova Peça" (Add New Piece) Entry Point | 🟡 Near-term | Button inside the museum that opens the self-serve upload flow — replaces the Claude Code/GitHub workflow entirely. |
| **S-15** | Upload Screen (drag-drop / photo picker) | 🟡 Near-term | Drag-drop or tap-to-select target for a photo (JPEG, PNG, HEIC). Client-side validation (file size/type), upload progress. |
| **S-16** | In-Browser Photo Editor | 🟡 Near-term | Crop, rotate, auto-enhance-lighting tool applied to the uploaded photo before it's committed (note: per current principles, no auto-enhance of the *artwork* itself — this applies to the photograph, not the drawing's content). |
| **S-17** | Artwork Context Form | 🟡 Near-term | Form fields: artist name, age, title hint, context, kid's words, animation hints. Replaces the markdown intake form. |
| **S-18** | "Remix Persona" Selector | 🔵 Future | Optional dropdown to pick the AI curator's voice/tone (e.g., "Fairy Tale," "Pretentious Critic") before generating the description. |
| **S-19** | Audio Recording Interface (Discovery Dots) | 🟡 Near-term | Parent/child places a hotspot on the image and records a 10–15s clip explaining that detail. Shows recording state, timer (auto-stop at 15s), waveform/playback preview. |
| **S-20** | AI Analysis / Processing State | 🟡 Near-term | Loading/progress screen shown while the vision model analyzes the artwork and generates title, palette, animation, and discovery points ("A obra está a caminho…"). |
| **S-21** | Pending Approval Review | 🟡 Near-term | Optional review step showing the AI-drafted entry (title, palette, dots, animation) before it goes live on the wall — mirrors the current Claude Code approval step. |
| **S-22** | Upload Success / "It's on the wall" Confirmation | 🟡 Near-term | Confirmation screen after a new piece is published, with a link/preview to the live artwork. |

---

## 3. Curator / Family Admin

| ID | Screen | Status | Description |
|---|---|---|---|
| **S-23** | Curator Dashboard | 🔵 Future | Management view for a family: list of artworks, reorder the hallway, toggle wall themes, see stats (views, shares). |
| **S-24** | Artwork Edit Screen | 🔵 Future | Edit an existing artwork's metadata (title, description, palette, animation, dots) after initial AI generation. |
| **S-25** | Artist/Child Profile Management | 🔵 Future | Add/edit the children ("artists") associated with a family museum — name, age, avatar/photo, collections. |
| **S-26** | Family Account Settings | 🔵 Future | Museum name, custom subdomain, privacy (public/private/link-only), language, notification preferences. |

---

## 4. Onboarding, Auth & Sharing

| ID | Screen | Status | Description |
|---|---|---|---|
| **S-27** | Sign Up / Create Museum | 🔵 Future | Entry point for a new family — email/password or magic link (Supabase Auth), museum name, first artist setup. |
| **S-28** | Log In | 🔵 Future | Standard auth screen for returning users. |
| **S-29** | PIN-Protected Upload Gate | 🟡 Near-term | Lightweight 4-digit family PIN screen gating the upload flow in the pre-accounts phase (before full auth exists). |
| **S-30** | "Share to Grandparents" / Share Sheet | 🟡 Near-term | Share flow surfaced from the gallery — generates the museum link, shows sharing options (copy link, message, email). |
| **S-31** | Visitor View (Read-Only Shared Museum) | 🟢 Live (implicit) | The view a grandparent/relative sees when opening a shared museum link — same as S-01/S-03 but without edit/upload controls, plus a prominent "Start your own child's museum" CTA once viral loop features ship. |
| **S-32** | Landing Page (Marketing Site) | 🔵 Future | Public-facing marketing homepage for cold traffic. Hero: split-screen "messy drawing vs. animated museum piece," interactive discovery-dot demo, pricing teaser, CTA to sign up. |
| **S-33** | Pricing Page | 🔵 Future | Tier comparison: Free / Família ($49/yr) / Escola ($149/yr per classroom) — feature matrix, annual billing framing, gift option callout. |

---

## 5. Monetization & Billing

| ID | Screen | Status | Description |
|---|---|---|---|
| **S-34** | Subscription Checkout | 🔵 Future | Stripe-powered checkout for Família/Escola tiers. |
| **S-35** | Billing / Customer Portal | 🔵 Future | Manage subscription, payment method, invoices (Stripe customer portal, possibly embedded). |
| **S-36** | "Museum Pass" Gift Card Purchase | 🔵 Future | Purchase flow for a gift code (grandparent buys a 1-year Família subscription as a gift). |
| **S-37** | Gift Code Redemption | 🔵 Future | Screen where a recipient enters/redeems a gift code to activate their museum subscription. |
| **S-38** | Watermarked Export Preview | 🟡 Near-term | Preview of an exported image/video showing the free-tier FMB · ART watermark, with an upsell prompt to remove it via subscription. |

---

## 6. E-Commerce / Physical Products (Print Store)

| ID | Screen | Status | Description |
|---|---|---|---|
| **S-39** | Print Store / Catalog | 🔵 Future | Storefront showing premium physical products: hardcover "Museum Book," individual "Masterpiece Prints," NFC Smart Frame. Mockup-style presentation, "Print this Gallery" CTA. |
| **S-40** | Product Detail — Museum Book | 🔵 Future | Detail page for the annual hardcover photobook: preview of layout (art + AI title/description per page), price ($80–120), page count, order CTA. |
| **S-41** | Product Detail — Masterpiece Print | 🔵 Future | Detail page for an individual giclée print of one artwork, with NFC-enabled title card explained (tap phone → opens digital animation). |
| **S-42** | Product Detail — NFC Smart Frame | 🔵 Future | Detail page for the physical frame with embedded NFC chip prototype. |
| **S-43** | Print Configurator | 🔵 Future | Select size, artwork(s) to include, cover options before ordering (for both single prints and the annual book). |
| **S-44** | Checkout & Shipping | 🔵 Future | Address entry, shipping method, order summary, payment — for physical product orders (POD via Printful/Gelato). |
| **S-45** | Order Confirmation & Tracking | 🔵 Future | Post-purchase confirmation with estimated delivery; order status/tracking view. |
| **S-46** | "Year in Review" Video Export | 🔵 Future | Preview/share screen for the automated video summarizing a child's artistic progress over the year (Remotion-generated). |

---

## 7. Escola (School / Classroom Tier)

| ID | Screen | Status | Description |
|---|---|---|---|
| **S-47** | Teacher Dashboard | 🔵 Future | Classroom admin view: roster of students, bulk upload entry point, class-wide settings. |
| **S-48** | Bulk Upload Flow | 🔵 Future | Multi-file upload with per-student tagging, streamlined for a teacher digitizing a whole class's work at once. |
| **S-49** | Student Tagging Interface | 🔵 Future | Assign uploaded artworks to specific students within a class roster. |
| **S-50** | Public Classroom Gallery | 🔵 Future | A shareable, public-facing wall showing the whole class's work — used for school "digital art shows." |
| **S-51** | Role-Based Access Screens (Teacher/Parent/Student views) | 🔵 Future | Distinct permission-scoped views reflecting the Teacher > Class > Student > Parent hierarchy (RBAC). |

---

## 8. Collaborative / Multi-Family (Phase 3)

| ID | Screen | Status | Description |
|---|---|---|---|
| **S-52** | Collaborative "Grandparents Museum" | 🔵 Future | Shared wall where multiple related families (e.g., cousins) contribute artworks to one combined museum. |
| **S-53** | Family Invite / Collaborator Management | 🔵 Future | Invite other family members as contributors or viewers to a shared museum. |

---

## 9. System / Utility States

| ID | Screen | Status | Description |
|---|---|---|---|
| **S-54** | Empty State (No Artworks Yet) | 🟡 Near-term | First-run state of the hallway before any art has been added — onboarding nudge toward S-14. |
| **S-55** | Error / Analysis-Failed State | 🟡 Near-term | Shown when AI analysis fails (timeout, invalid response) — user-friendly retry prompt (per `docs/API_COSTS_AND_DATA_FLOW.md` error handling). |
| **S-56** | HEIC Conversion Notice | 🟡 Near-term | Interstitial explaining/handling iPhone HEIC photo uploads during conversion. |

---

## Notes for design direction

- **Tone constraint (binding, see `ART_GUIDE.md`/`CLAUDE.md`):** the shell (navigation, forms, dashboards, storefront) must stay gallery-clean and restrained — white walls, soft shadows, elegant type — so the children's art remains the visual focal point. The "magic" (animations, story mode) is where delight is allowed to be loud.
- **Language:** all UI copy is Portuguese (PT-PT) — do not draft English copy for these screens.
- **Phase 0/current (🟢)** screens are the only ones that exist in code today (static React, no backend). Everything 🟡/🔵 is speculative/roadmap and should be designed as *direction*, not a committed spec.
- Screens S-13 and S-31 are marked live "implicitly" — they describe the current non-UI workflow and read-only viewing experience respectively, included for completeness since Phase 2 replaces/formalizes them.
