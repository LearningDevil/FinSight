# FinSight — Application Flow

**Version:** 2.0
**Purpose:** Describes every major user journey end-to-end, frontend ↔ backend.

---

## 1. First-Time Login

```
User lands on FinSight (frontend)
  → clicks "Continue with Google"
  → frontend: GET /api/auth/google → receives Google OAuth URL
  → browser redirects to Google consent screen
  → user approves (profile + email + gmail.readonly)
  → Google redirects to /api/auth/google/callback?code=...
  → backend exchanges code → tokens → encrypts → upserts user in DB
  → backend issues JWT → redirects to frontend with token
  → frontend stores JWT (httpOnly cookie, planned) → redirects to Dashboard
```

**Edge cases:**
- User denies Gmail permission → still create account, `gmail_sync_enabled=false`,
  statement upload still works (manual flow).
- Returning user → same flow, `ON CONFLICT (google_id) DO UPDATE` refreshes
  tokens, JWT reissued.

---

## 2. Bank Statement Import (primary data flow)

```
User → Dashboard → "Add Statement"
  → selects bank (Kotak / Axis / Federal / Other)
  → uploads monthly statement PDF
  → enters PDF password (entered once per upload, never stored)
  → frontend: POST /api/transactions/upload/statement (multipart: file + password + bank)
  → Node forwards file + password to python-service: POST /parse/pdf/statement
  → Python:
      1. unlock PDF with pikepdf using provided password
      2. extract tables with pdfplumber
      3. map columns using bank-specific config (see techSpec.md §7)
      4. normalize each row → { date, description, amount, type, balance }
      5. return list of parsed transactions as JSON
  → Node:
      1. for each row, check for duplicates (same user, date, amount, description hash)
      2. bulk INSERT new transactions, source = 'pdf_statement'
      3. invalidate Redis summary cache for affected months
  → frontend shows: "Imported 47 transactions from March statement —
     3 duplicates skipped"
  → redirect to Dashboard, now populated
```

**Edge cases:**
- Wrong password → Python returns 422, frontend shows "Incorrect password, try again"
  without retrying server-side (security — no brute force loop).
- Unrecognized table format → fall back to raw text extraction, show user a
  preview to manually confirm column mapping (stretch goal).

---

## 3. Manual Transaction Entry (UPI / Cash)

```
User → Dashboard → "+" Quick Add
  → modal: Amount, Merchant, Category (dropdown), Type (debit/credit), Date (defaults today)
  → frontend: POST /api/transactions { ...fields, source: implicit 'manual' }
  → Node: INSERT, invalidate cache for that month
  → modal closes, dashboard summary updates immediately (optimistic UI)
```

This flow must be **fast** — under 10 seconds from tap to saved. It's the
flow used most often (every UPI/cash spend), so friction here kills retention.

---

## 4. Dashboard

```
User lands on Dashboard
  → frontend: GET /api/transactions/summary?month=X&year=Y  (Redis cached)
  → renders: category pie chart, monthly total, top merchants
  → frontend: GET /api/transactions?month=X&year=Y&page=1  (paginated list)
  → renders: transaction timeline, each row tagged with source icon
     (🏦 bank statement / ✋ manual / 📧 email)
  → frontend: GET /api/insights/monthly?month=X&year=Y
  → renders: AI-generated summary card, e.g. "You spent ₹4,200 more than
     last month, mainly on dining (+38%)."
```

Filters (category, source, date range) re-trigger `/api/transactions` with
query params — same endpoint, no new routes needed.

---

## 5. Policy Decoder

```
User → "Decode a Policy"
  → uploads policy/insurance PDF (no password expected)
  → frontend: POST /api/policies/analyze (multipart: file)
  → Node forwards to python-service: POST /parse/pdf/policy
  → Python:
      1. extract text with pdfplumber
      2. send to Gemini with structured-output system prompt (see techSpec.md)
      3. receive JSON: { summary, covered[], not_covered[], red_flags[], questions_to_ask[] }
  → Node: store result in policy_analyses (with file_hash for dedup), return to frontend
  → frontend renders four sections:
      ✅ What's covered
      ❌ What's NOT covered
      🚩 Red flags (with explanations)
      ❓ Questions to ask before signing
```

**Dedup:** if `file_hash` matches a previous analysis for this user, return the
cached result instantly — no re-call to Gemini.

---

## 6. Budgets (P2)

```
User → Settings → Budgets
  → sets monthly amount per category (e.g. Food & Dining: ₹6,000)
  → frontend: POST /api/budgets { category_id, amount, month, year }
  → Dashboard summary cards show progress bar per category:
     spent / budget, color-coded (green <80%, amber 80-100%, red >100%)
```

---

## 7. Settings

- Toggle Gmail sync on/off (`gmail_sync_enabled`).
- Re-authenticate Gmail (re-run OAuth if refresh token expires/revoked).
- View connected accounts, last sync time.
- Delete account (cascades transactions, policy analyses — `ON DELETE CASCADE`
  already in schema).
