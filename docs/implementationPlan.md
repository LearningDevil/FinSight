# FinSight — Implementation Plan

**Version:** 2.0 (reflects architecture pivot to PDF statement parsing)

---

## Current Status ✅

| Area | Status |
|---|---|
| Docker Compose — 7 services, all healthy | ✅ Done |
| Nginx round-robin load balancing (3 Node instances) | ✅ Done, verified |
| PostgreSQL schema (`001_init.sql`) | ✅ Applied |
| Redis connection + cache helpers | ✅ Done |
| Google OAuth 2.0 + Gmail scope | ✅ Done, end-to-end tested |
| JWT auth middleware | ✅ Done |
| Token encryption (AES-256-CBC) | ✅ Done |
| `GET/POST /api/transactions` | ✅ Done, tested |
| `GET /api/transactions/summary` (cached) | ✅ Done, cache hit verified |
| Code on GitHub | ✅ Done |
| Project docs (this set) | ✅ Done |

---

## Phase 2 — Bank Statement Parser (current focus)

**Goal:** Upload a Kotak statement PDF → password → get back structured
transactions → stored in DB.

1. **`002_statements.sql` migration**
   - Add `statements` table (see `schema.md` §3)
   - Update `transactions.source` CHECK to include `kotak`, `federal`,
     `pdf_statement`

2. **Python: PDF unlock**
   - Add `pikepdf` to `requirements.txt`
   - `python-service/utils/pdf_unlock.py` — takes file path + password,
     returns unlocked PDF bytes/path

3. **Python: table extraction**
   - `python-service/utils/statement_extractor.py` — `pdfplumber.extract_tables()`
   - Bank-specific column mapping config (start with Kotak's
     `Date | Description | Chq/Ref No. | Withdrawal (Dr.) | Deposit (Cr.) | Balance`)
   - Normalize each row → `{date, description, amount, type, balance}`

4. **Python: endpoint**
   - `POST /parse/pdf/statement` — accepts file + password + bank → returns
     JSON array of parsed transactions

5. **Node: upload endpoint**
   - `POST /api/transactions/upload/statement` — multipart upload (use `multer`,
     already in `package.json`)
   - Forward to python-service
   - Dedup check (user_id + date + amount + description hash)
   - Bulk insert new rows, `source = 'pdf_statement'`
   - Insert row into `statements` table
   - Invalidate affected month(s) cache

6. **Test** with your real Kotak statement (redact sensitive personal info
   before sharing any samples here)

---

## Phase 3 — Manual Entry + Dashboard (React)

1. React app scaffold (Vite + TailwindCSS) per `design.md` tokens
2. Auth flow: receive JWT from `/auth/success` redirect, store securely
   (move to httpOnly cookie — see Security Note below)
3. Dashboard layout — ledger-spread design from `design.md`
4. Transaction timeline component (source-tagged rows, mono amounts)
5. Category summary chart (Recharts)
6. Quick-add modal (manual transactions)
7. Statement upload flow UI (bank select → file → password → results)

---

## Phase 4 — AI Layer

1. `python-service/ai/insights.py` — Gemini call for monthly summary
   - Input: category summary JSON
   - Output: 2-3 sentence natural-language insight
2. `GET /api/insights/monthly` (Node) — calls Python, caches in `ai_insights`
   table + Redis
3. `python-service/ai/policy_decoder.py` — Gemini call with structured JSON
   output schema (see `techSpec.md`)
4. `POST /api/policies/analyze` (Node) — file upload → Python → store in
   `policy_analyses` with `file_hash` dedup
5. React: Policy Decoder page (four-section layout from `appFlow.md`)

---

## Phase 5 — Production Hardening

1. PostgreSQL read replica + route read-heavy queries to it
2. PgBouncer connection pooling
3. Bull queue — async Gmail sync (secondary path) + async statement processing
   for large files
4. Winston structured logging + `/metrics` endpoint
5. Budgets feature (P2 from PRD)

---

## Phase 6 — Testing & Deployment

1. k6 load test script — 500 virtual users against `/api/transactions/summary`
2. Fix any bottlenecks found
3. Deploy to Render — add production redirect URI to Google Console
4. README with architecture diagram, setup steps, load test results
5. 2-minute demo video: login → upload statement → dashboard → policy decoder

---

## Security Note (carried over from earlier discussion)

JWT is currently returned via URL redirect (`/auth/success?token=...`) — fine
for API testing, **not** production-safe (browser history/logs exposure).
Before Phase 3 ships, switch to:
- Backend sets JWT in an `httpOnly`, `secure`, `sameSite=lax` cookie on
  `/api/auth/google/callback`
- Frontend simply redirects to `/dashboard`, no token in URL at all
