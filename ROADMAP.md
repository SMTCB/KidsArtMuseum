# FMB · ART — Product Roadmap

> Last updated: May 2026  
> This document captures the product evolution discussed during the initial build session.
> It is intentionally opinionated — written from the perspective of a single-family museum
> that could grow into a multi-family platform.

---

## Phase 0 — Live today ✓

**The museum works.** A static site deployed on Vercel via GitHub.

| What's there | Notes |
|---|---|
| 11 artworks across 3 artists (Miguel, Manuel, Muna) | Miguel, age 6–7; Manuel, age 7; Muna, age 4 |
| 2 wall themes: Classic Hallway + Gallery Wall (Parede de Galeria) | Switchable via top bar |
| Per-artwork animation routines (11 types) | miro, warhol, portrait, matisse, story, sculpture, luna, rainbow, mbappe, maestro, sunflowers |
| Tap-to-discover hotspots | 3–4 per piece, child-narrated |
| Intake pipeline via Claude Code | Drop photo + fill form → prompt Claude → auto-commit + deploy |
| Photo optimizer (`scripts/optimize.js`) | MozJPEG q=78, auto-rotate, resize ≤ 3000px — runs automatically during intake |
| Mobile-responsive layout | Wall theme switches to scrollable 2-column grid on mobile |
| Portuguese (PT-PT) throughout | Language is a core identity choice, not a localisation option |

**Current add-artwork flow (3 user steps):**
1. Drop photo in `intake/` with a lowercase-hyphenated filename
2. Fill `intake/<name>.md` (artist, age, title hint, context, kid's words)
3. Tell Claude Code: *"Processa a entrada `<name>`"* — everything else is automated

---

## Phase 1 — Polish (near-term, ~1–2 months)

Small improvements that make the current flow tighter. No architecture changes.

- [ ] **HEIC auto-conversion** in the optimizer script — iPhone photos currently require manual export to JPEG. A server-side `heic-convert` step in the optimizer would remove this friction entirely.
- [ ] **Animated intro** on first load — a brief "curtain opens" transition before the hallway or gallery wall appears.
- [ ] **3rd wall theme** — a "children's bedroom" aesthetic (cork board, string lights, crayon texture). Low effort, high character.
- [ ] **Sharing per artwork** — each piece gets a stable URL (`/obra/miro`) so a grandparent can be sent a direct link to one painting.
- [ ] **Print view** — a clean full-bleed layout of a single artwork + title card, optimised for A4/A3 printing. Parents want to frame things.
- [ ] **Revisit the "Cubo Branco" naming** — currently two themes are named "Cubo Branco" and "Parede de Galeria" in the UI. Consider aligning with the child-facing voice (e.g. "Galeria Moderna" / "Salão da Família").

---

## Phase 2 — "Pendurar Nova Peça" web UI (medium-term, ~3–4 months)

**The big UX leap:** remove the dependency on Claude Code entirely for adding artworks.
A button in the museum itself opens an upload flow — no terminal, no files, no prompts.

### User flow
```
Click "Pendurar Nova Peça"
  → Drag-drop or tap-to-select a photo (JPEG, PNG, HEIC)
  → Form: artist name, age, title hint, context, kid's words, animation hints
  → "Processar" →
      [Serverless function]
        1. Compress photo client-side (Canvas API)
        2. Upload photo to GitHub (assets/art/) via GitHub API
        3. Call Claude API (vision) with photo + form → structured JSON response
           (palette, bg, anim key, dot positions, title, signature)
        4. Commit updated art-data.js to GitHub
        5. Vercel detects push → auto-deploys (~30 seconds)
  → UI: "A obra está a caminho… estará na parede em breve."
  → On next page load: new piece appears in the hallway
```

### Technical approach
- **No database needed.** GitHub remains the source of truth — the serverless function commits directly via GitHub API, just as Claude Code does today.
- **Serverless function on Vercel.** One endpoint: `/api/add-artwork`. Handles upload, LLM call, and GitHub commit.
- **Claude API with vision.** The prompt replicates everything Claude Code does interactively — palette sampling, animation selection, dot placement — but returns a structured JSON object instead of editing files.
- **Auth: PIN-protected.** A simple 4-digit family PIN on the upload form is enough. No accounts, no OAuth.

### Estimated effort
| Piece | Effort |
|---|---|
| Upload UI + form (drag-drop, mobile-first) | ~1 day |
| Serverless function + GitHub API integration | ~1 day |
| Claude API call (vision → structured JSON output) | ~½ day |
| Client-side photo compression (Canvas API) | ~½ day |
| Testing, HEIC handling, error states | ~1 day |
| **Total** | **~4 days** |

### Cost at this phase
- Vercel: free tier (or Pro at $20/month if traffic grows)
- GitHub API: free
- Anthropic API: ~$0.01–0.03 per artwork with Claude Sonnet (vision). At 2 artworks/week ≈ $1–3/year. Negligible.

### Open decisions before building
- **Approval step?** The current Claude Code flow shows a diff for review before committing. The automated version goes straight to the wall. Consider a "pending" state where artworks appear only after a quick approval tap.
- **HEIC on mobile:** Canvas can't decode HEIC. Options: reject with a clear message, convert server-side, or rely on the OS sharing as JPEG when the user picks from Photos.

---

## Phase 3 — Multi-family platform (long-term, if the product goes beyond one family)

This phase only makes sense if there is genuine demand from other families. It requires a real architecture change.

### What changes
- **Data layer:** `art-data.js` (static file) → Supabase (Postgres + Storage). Each family gets their own museum, their own artists, their own artworks.
- **Auth:** proper accounts (email/password or magic link via Supabase Auth)
- **Custom domains / subdomains:** `braganca.fmb.art`, `silva.fmb.art`
- **Curator dashboard:** manage artworks, reorder the hallway, toggle themes
- **Shared discovery:** optional public gallery — families can opt in to show their museum to the world

### Revenue model candidates
| Model | Notes |
|---|---|
| **Freemium** | Free: 1 museum, up to 10 artworks. Paid: unlimited artworks, custom domain, print exports |
| **Annual subscription** | $49–79/year per family museum. "Museum membership" framing fits the product. |
| **School/institution tier** | A classroom museum. Higher price, bulk upload, teacher admin. |
| **Gift product** | "Give a museum" — one-time purchase, activated by a code. Gift-friendly. |

### Estimated effort
A full multi-family SaaS build is a 4–8 week project (solo developer) or 2–4 weeks with a team. The Phase 2 web UI is a prerequisite.

---

## Principles that should not change regardless of phase

These were set at the start and are worth defending as the product grows:

1. **The painting is the painting.** No auto-enhance, no filter, no AI image manipulation of the artwork itself.
2. **One animation idea per piece.** Complexity is the enemy of delight.
3. **Portuguese first.** If the product internationalises, Portuguese (PT-PT) remains the default.
4. **The child is the artist.** The UI celebrates the child's voice, not the technology.
5. **Static by default.** Don't add a server or database until there is a concrete reason. Complexity has a cost.
