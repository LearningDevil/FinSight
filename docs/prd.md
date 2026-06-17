# FinSight — Product Requirements Document (PRD)

**Version:** 2.0 (revised — statement-PDF architecture)
**Status:** Active development
**Owner:** Vivek Sharma

---

## 1. Vision

FinSight is a unified personal finance platform for Indian users. It pulls bank
transaction history automatically from monthly e-statement PDFs already sitting
in the user's Gmail, lets users quickly log UPI/cash spending that banks never
see, and uses AI to explain both *where the money goes* and *what's actually in
the insurance/policy documents they've signed*.

One line: **"Your bank already emails you everything. FinSight reads it so you
don't have to."**

---

## 2. Problem Statement

- Indian users hold 2–3 bank accounts, each sending a **monthly password-protected
  PDF statement** via email — almost nobody opens these.
- UPI apps (PhonePe/GPay/Paytm) notify via **SMS**, which is invisible to any
  email-based tool and not legally accessible without RBI Account Aggregator
  licensing.
- Cash spending is invisible to every digital tool.
- Insurance and policy documents are written in language designed to be skimmed,
  not understood — leading to claim surprises.

Existing apps solve at most one of these. None combine automatic bank statement
ingestion with manual UPI/cash logging and plain-English policy analysis.

---

## 3. Core Modules

### Module 1 — Transaction Intelligence
- **Primary ingestion:** Gmail → detect monthly bank statement email → extract
  PDF attachment → user-provided password → unlock → extract transaction table
  → bulk-insert as transactions.
- **Secondary ingestion:** rare individual bank alert emails → regex parser.
- **Manual ingestion:** quick-add form for UPI and cash transactions (the data
  banks/Gmail will never have).
- **Output:** unified dashboard, category breakdowns, AI spending insights.

### Module 2 — Policy Decoder
- User uploads any insurance/financial policy PDF.
- AI returns: plain-English summary, what's covered, what's excluded, red flags
  / hidden clauses, questions to ask before signing.
- Strictly informational — never recommends buying/switching products.

---

## 4. Target Users

| Segment | Description |
|---|---|
| Primary | Indian salaried/self-employed adults, 22–35, with 1–3 bank accounts and 2+ UPI apps |
| Secondary | First-time insurance buyers wanting to understand a policy before/after purchase |
| Tertiary | Students/freshers starting to manage their own finances |

---

## 5. User Stories

### Transaction Intelligence
1. As a user, I can connect my Gmail so FinSight can find my monthly bank
   statement emails automatically.
2. As a user, I upload my statement PDF and enter the password once — FinSight
   extracts every transaction from the table.
3. As a user, I can quickly add a UPI or cash transaction in under 10 seconds
   (amount, merchant, category — everything else defaulted).
4. As a user, I see all transactions — bank-sourced and manually-added — in one
   timeline, tagged by source.
5. As a user, I see a monthly category breakdown (pie/bar chart) of my spending.
6. As a user, I get a plain-English monthly summary: *"You spent 18% more on
   food this month, mostly on weekends."*
7. As a user, I can set a monthly budget per category and get warned when I'm
   close to the limit.

### Policy Decoder
8. As a user, I upload a policy PDF and get a summary in under 10 seconds.
9. As a user, I see a clear list of what's NOT covered — the part nobody reads.
10. As a user, I see red flags (waiting periods, sub-limits, network restrictions)
    explained in plain language.
11. As a user, the analysis never tells me to buy/cancel/switch anything —
    only explains what's there.

---

## 6. Feature Priority Matrix

| Feature | Priority | Status |
|---|---|---|
| Google OAuth + JWT auth | P0 | ✅ Done |
| Transactions API (CRUD, filters, summary) | P0 | ✅ Done |
| Redis caching + invalidation | P0 | ✅ Done |
| Bank statement PDF upload + unlock | P0 | 🔜 Next |
| Statement table extraction → transactions | P0 | 🔜 Next |
| Quick-add manual transaction (UPI/cash) UI | P0 | Pending |
| React dashboard (charts, filters, timeline) | P0 | Pending |
| AI monthly spending insights (Gemini) | P1 | Pending |
| Policy Decoder (upload + AI analysis) | P1 | Pending |
| Budget goals + alerts | P2 | Pending |
| Gmail attachment auto-detection (statement email) | P2 | Pending |
| Rare bank-alert email parsers (regex) | P2 | Pending (built, unused) |
| Nginx LB + read replica + PgBouncer | P2 | Partial (LB done) |
| k6 load test → 500 users | P3 | Pending |

---

## 7. Success Metrics (portfolio-grade)

- Statement parser correctly extracts ≥95% of rows from a Kotak/Axis/Federal
  statement table.
- Dashboard loads in <1s on cached summary, <2s on cold query.
- Policy Decoder returns structured analysis in <10s for a 20-page PDF.
- End-to-end demo: connect Gmail → upload one statement → see dashboard
  populated → upload a policy → see red flags — all in under 2 minutes.
