# FinSight — Design System

**Version:** 1.0
**Direction:** "The Digital Ledger"

---

## A note on how this was designed

This isn't built from a generic fintech template (the usual blue gradients,
rounded cards, soft shadows that every finance-app starting point defaults to).
Instead it's grounded in the **actual subject matter**: bank passbooks and
ledger books — the physical artifacts FinSight is digitizing. Red ink for
withdrawals, green/black for deposits, ruled lines, stamped seals — these are
real conventions from real Indian passbooks, repurposed as a modern UI
language. That's the "signature" of this design: it looks like nothing else
because it's drawn from the thing itself, not from "what fintech apps usually
look like."

---

## 1. Color Palette

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#1C2B4A` | Primary text, headers, navigation — "fountain pen" navy |
| `--paper` | `#F7F6F2` | Background — desaturated paper, not the typical warm cream |
| `--rule` | `#D8D4C9` | Hairline dividers, table rules — "ruled ledger lines" |
| `--debit` | `#B7472A` | Expense amounts, debit indicators — passbook withdrawal red |
| `--credit` | `#2F6F4E` | Income amounts, credit indicators — passbook deposit green |
| `--seal` | `#B8860B` | Signature accent — badges, active states, "stamp" elements |

**Why this works:** red-for-debit / green-for-credit isn't a design choice —
it's literally how every Indian passbook has worked for decades. Using it as
the *functional* color system (not just decoration) makes the interface
instantly legible to the target user, while `--seal` gold gives us one warm
accent for moments that deserve attention (active nav item, success states,
category badges).

---

## 2. Typography

| Role | Typeface | Usage |
|---|---|---|
| Display | **Source Serif 4** (or Lora) | Page titles, hero numbers, section headers — gives an "official document" weight |
| Body | **Inter** | UI text, labels, descriptions — neutral, highly legible |
| Data | **IBM Plex Mono** | All monetary figures, dates, transaction tables — `font-variant-numeric: tabular-nums` so decimals align perfectly down a column |

The serif/sans/mono trio is deliberate: serif for "this is a document you can
trust," sans for "this is a tool you can use quickly," mono for "these numbers
are precise." Most fintech apps use a single sans-serif for everything —
this differentiation is part of what makes FinSight feel considered.

---

## 3. Layout Principles

- **Dashboard as an open ledger spread** — two-column layout on desktop
  (summary/charts on the left "page," transaction timeline on the right
  "page"), collapsing to a single column on mobile.
- **Transaction rows = ledger entries** — hairline `--rule` divider between
  rows, amount right-aligned in mono with tabular-nums, debit/credit color
  applied directly to the amount (not a separate badge).
- **Numbered markers used only where order is real** — e.g. step-by-step
  statement import flow. Never used decoratively (per frontend-design
  guidance: numbering should encode something true, not decorate).
- **Generous whitespace, minimal shadows** — flat surfaces with `--rule`
  borders instead of drop shadows; this reads as "paper," not "card UI."

---

## 4. Signature Element — Ledger Stamps

Circular, slightly-rotated badge elements styled like rubber ink stamps,
used for:
- **Source tags** on each transaction: 🏦 Bank Statement / ✋ Manual / 📧 Email
- **Category badges**: each category gets a stamp-style icon in `--seal` or
  category color
- **Status confirmations**: "47 imported" appears as a stamped badge after a
  statement upload completes

This is the *one* place we spend visual "boldness" — everything else stays
quiet and disciplined (per the restraint principle: spend boldness in one
place, keep the rest controlled).

---

## 5. Motion & Interaction

| Interaction | Duration | Easing | Notes |
|---|---|---|---|
| Hover / press states | 100–150ms | `ease-out` | Instant-feeling, no lag |
| Panel/page transitions | 200–300ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Fast start, gentle settle — feels responsive, not sluggish |
| New transaction row appears | 250ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Slide-in + fade — like a new line being written |
| Summary totals on load | 400ms | linear count-up | Numbers count up to final value — fits a finance dashboard naturally |
| Quick-add success | 300ms | spring (the *one* bouncy moment) | Small stamp-impression animation — the single delightful flourish |
| Loading states | — | — | Skeleton rows shaped like ledger entries, not generic grey boxes |

**Rule:** one orchestrated moment (quick-add success stamp) lands harder than
animating everything. Everything else is fast, quiet, and gets out of the way.
`prefers-reduced-motion` disables count-up and slide-ins — values just appear.

---

## 6. Accessibility & Quality Floor

- All color-coded debit/credit amounts also carry a `+`/`-` prefix — never
  rely on color alone.
- Visible keyboard focus rings on all interactive elements (`--seal` outline).
- Contrast: `--ink` on `--paper` exceeds WCAG AA for body text.
- Responsive down to a single-column mobile layout — ledger rows stack
  cleanly, mono amounts remain right-aligned within their row.

---

## 7. What we deliberately avoided

- ❌ Cream background + serif + terracotta accent (the most common AI-generated
  default) — our paper tone is cooler/more desaturated, and terracotta (`--debit`)
  is functional, not the brand accent.
- ❌ Near-black UI with a single neon accent — wrong tone entirely for a
  trust-driven finance product.
- ❌ Generic rounded cards with soft drop shadows — replaced with flat
  ruled surfaces, consistent with the ledger metaphor.
