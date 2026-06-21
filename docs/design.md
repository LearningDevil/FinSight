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



# FinSight — Design System

**Version:** 2.0 — "Pixel Terminal"
**Status:** Approved direction (replaced v1.0 "Digital Ledger")
**Approved:** June 2026

---

## Design Philosophy

FinSight's v2 design language is called **Pixel Terminal** — it sits at the
intersection of three references:

1. **Pixel art / retro computing** — hard edges, offset shadows, grid overlays,
   monospace type, blinking cursors. The aesthetic of something precise and
   deliberate, like code running correctly.
2. **Modern dark UI** — the dark mode that developers actually live in. VS Code,
   GitHub, Linear. Familiar, trustworthy, high contrast.
3. **3D illusion on a 2D surface** — depth without blur. Hard offset box-shadows
   simulate physical buttons and elevated surfaces. Moving shadows on hover/press
   create the sensation of pressing a real key.

**What this replaced:** v1.0 "Digital Ledger" (paper backgrounds, serif type,
ledger ruled lines) was distinctive but passive. v2.0 feels like operating a
system — active, precise, alive.

---

## 1. Color Palette

### Base System
| Token | Hex | Use |
|---|---|---|
| `--bg-base` | `#0D1117` | Primary background — deepest layer |
| `--bg-surface` | `#161B22` | Cards, panels, terminal windows |
| `--bg-hover` | `#21262D` | Hover states, pressed surfaces |
| `--border` | `#30363D` | Default borders |
| `--border-active` | `#484F58` | Active/focused borders |

### Text System
| Token | Hex | Use |
|---|---|---|
| `--text-primary` | `#E6EDF3` | Headlines, primary content |
| `--text-secondary` | `#8B949E` | Subtitles, labels |
| `--text-muted` | `#484F58` | Disabled, placeholder, fine print |

### Semantic Colors
| Token | Hex | Use |
|---|---|---|
| `--gold` | `#B8860B` | Primary accent — CTAs, active states, logo |
| `--gold-shadow` | `#7A5A07` | Hard offset shadow on gold elements |
| `--gold-dim` | `rgba(184,134,11,0.08)` | Hover tints on dark surfaces |
| `--debit` | `#B7472A` | Expense amounts, withdrawal indicators |
| `--debit-dim` | `rgba(183,71,42,0.12)` | Debit row hover tints |
| `--credit` | `#3FB950` | Income amounts, success states |
| `--credit-dim` | `rgba(63,185,80,0.12)` | Credit row hover tints |
| `--info` | `#79C0FF` | Commands, links, terminal values |

### Grid Overlay
Applied via CSS on root container — the visual DNA of every dark surface:
```css
background-image:
  linear-gradient(rgba(184,134,11,0.04) 1px, transparent 1px),
  linear-gradient(90deg, rgba(184,134,11,0.04) 1px, transparent 1px);
background-size: 32px 32px;
```

---

## 2. Typography

Single-font system — `Courier New` monospace everywhere except the hero headline.

| Role | Typeface | Size | Weight | Use |
|---|---|---|---|---|
| Hero Display | Georgia, serif | 38–52px | 700 | Landing headline only |
| UI / Body / Data | Courier New, monospace | 10–32px | 400–700 | Everything else |

**Letter spacing:**
- Labels / eyebrows / status: `letter-spacing: 0.1–0.2em` + uppercase
- Hero headline: `letter-spacing: -1px` to `-2px`
- Stat numbers: `letter-spacing: -1px`
- Body / terminal: `letter-spacing: 0`

**`font-variant-numeric: tabular-nums`** on all monetary figures — always.

---

## 3. The 3D Illusion System

All perceived depth comes from **hard offset box-shadows with zero blur**.

```css
/* CORRECT */
box-shadow: 4px 4px 0 #7A5A07;

/* WRONG — never use blur radius */
box-shadow: 0 4px 12px rgba(0,0,0,0.3);
```

### Shadow Scale
| Element | Default | Hover | Press |
|---|---|---|---|
| Primary button | `4px 4px 0 #7A5A07` | `6px 6px 0 #7A5A07` | `2px 2px 0 #7A5A07` |
| Cards / panels | `4px 4px 0 #21262D` | `6px 6px 0 #21262D` | — |
| Terminal window | `6px 6px 0 #21262D` | — | — |
| Inputs | `2px 2px 0 #21262D` | `2px 2px 0 #484F58` | — |

### Button Press Animation
```css
.btn-pixel {
  box-shadow: 4px 4px 0 var(--gold-shadow);
  transition: transform 0.1s, box-shadow 0.1s;
}
.btn-pixel:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--gold-shadow);
}
.btn-pixel:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--gold-shadow);
}
```

---

## 4. Component Specs

### Navbar
- `--bg-base` + `border-bottom: 1px solid --border`
- Logo: gold `[F]` square with `3px 3px 0 --gold-shadow`, monospace uppercase wordmark
- Status: pulsing `--credit` dot + "SYSTEM ONLINE" label
- Nav links: uppercase, `--text-secondary`, `letter-spacing: 0.1em`

### Terminal Panel
The signature component. Shows real parse output as it streams.
- Background: `--bg-surface`, border `1px solid --border`, shadow `6px 6px 0 #21262D`
- Terminal bar: 3 pixel dots (debit/gold/credit), filename label in `--text-secondary`
- Color coding inside:
  - `$` prompt → `--credit`
  - Commands → `--info`
  - Output text → `--text-secondary`
  - Values / numbers → `--gold`
  - Success `✓` → `--credit`
  - Debit/error amounts → `--debit`
  - Blinking cursor → `--gold`, `1s step-end infinite`

### Transaction Row
```
14 Jun  │  UPI/Swiggy Ltd  │  Food & Dining  │  −₹450.00
```
- Date: `--text-muted`, monospace
- Merchant: `--text-primary`
- Category: `--text-secondary`, small
- Amount: right-aligned, `tabular-nums`, `--debit` with `−` or `--credit` with `+`
- Divider: `1px solid --border`
- Hover: `background: --gold-dim`

### Stat Cards
- Number: 32px monospace bold, `--text-primary`, `letter-spacing: -1px`
- Unit suffix: 12px `--gold`
- Label: 10px `--text-secondary` uppercase
- Arrow `→`: `--gold`, top-right corner
- Hover: `background: --gold-dim`
- Border between cells: `1px solid --border`

### Primary Button
- Background: `--gold`, text: `--bg-base`
- Hard shadow: `4px 4px 0 --gold-shadow`
- Monospace uppercase, `letter-spacing: 0.1em`
- Press animation as specified in §3

### Inputs
- Background: `--bg-surface`
- Border: `1px solid --border`, focus: `--border-active`
- Shadow: `2px 2px 0 #21262D`
- Font: monospace, `--text-primary`
- Placeholder: `--text-muted`
- `border-radius: 0` — sharp edges

---

## 5. Motion

Every animation either simulates physics or shows work being done.

| Interaction | Duration | Easing | Effect |
|---|---|---|---|
| Button hover | 100ms | `ease-out` | Rise up-left, shadow grows |
| Button press | 80ms | `ease-in` | Sink down-right, shadow shrinks |
| Card hover | 150ms | `ease-out` | Background → `--gold-dim` |
| Page transition | 250ms | `cubic-bezier(0.16,1,0.3,1)` | Fade + slight Y translate |
| Transaction row appear | 200ms | `cubic-bezier(0.16,1,0.3,1)` | Slide in from left + fade |
| Terminal line appear | 80ms per line | `linear` | Sequential, like typing |
| Stat count-up | 600ms | `ease-out` | 0 → final value on mount |
| Status dot pulse | 2s infinite | `ease-in-out` | Opacity 1 → 0.3 → 1 |
| Cursor blink | 1s step-end infinite | — | Hard on/off, no fade |

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
  .cursor { opacity: 1; }
}
```

---

## 6. Responsive

| Breakpoint | Change |
|---|---|
| Desktop ≥1024px | Two-column hero, 3-col stats, 2-col dashboard |
| Tablet 768–1023px | Single-column hero (terminal below headline), stats stay 3-col |
| Mobile <768px | Everything single column, terminal hidden on login |

Mobile: reduce all shadows by half (`2px 2px 0` instead of `4px 4px 0`).

---

## 7. Hard Rules (Never Break)

- ❌ No `box-shadow` with blur radius — hard offset only
- ❌ No gradient backgrounds — flat dark only
- ❌ No `border-radius` > 2px on structural elements
- ❌ No white or light backgrounds anywhere
- ❌ No light mode — dark only by design
- ❌ No animations for decoration — physics or progress only
- ❌ No neon/glow effects (`text-shadow`, `filter: blur()`)
- ❌ No emoji in UI — use `→`, `✓`, `▸`, `·` or Tabler icons
- ❌ No blue accent (#2563EB etc.) — gold is the accent

---

## 8. CSS Custom Properties

```css
:root {
  --bg-base:         #0D1117;
  --bg-surface:      #161B22;
  --bg-hover:        #21262D;
  --border:          #30363D;
  --border-active:   #484F58;
  --text-primary:    #E6EDF3;
  --text-secondary:  #8B949E;
  --text-muted:      #484F58;
  --gold:            #B8860B;
  --gold-shadow:     #7A5A07;
  --gold-dim:        rgba(184,134,11,0.08);
  --debit:           #B7472A;
  --debit-dim:       rgba(183,71,42,0.12);
  --credit:          #3FB950;
  --credit-dim:      rgba(63,185,80,0.12);
  --info:            #79C0FF;
  --shadow-card:     4px 4px 0 #21262D;
  --shadow-btn:      4px 4px 0 #7A5A07;
  --shadow-terminal: 6px 6px 0 #21262D;
}
```

---

## 9. Pre-ship Checklist

- [ ] Grid background on all `--bg-base` surfaces
- [ ] All buttons use hard offset shadow — no blur
- [ ] Hover rises, press sinks
- [ ] All amounts: `+`/`−` prefix AND color
- [ ] All amounts: `tabular-nums`
- [ ] No `border-radius` > 2px on structural elements
- [ ] No soft shadows
- [ ] No light backgrounds
- [ ] `prefers-reduced-motion` respected
- [ ] Mobile shadows halved
- [ ] Focus ring: `outline: 2px solid var(--gold); outline-offset: 2px`
