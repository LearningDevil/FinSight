# FinSight — Database Schema

**Version:** 2.0 (reflects implemented schema + planned additions for statement parsing)
**Database:** PostgreSQL 15

---

## 1. Entity Overview

```
users ──┬──< transactions >──── categories
        ├──< budgets >──── categories
        ├──< policy_analyses
        ├──< ai_insights
        └──< statements  (planned — tracks uploaded PDF statements)
```

---

## 2. Tables (Implemented)

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | `gen_random_uuid()` |
| email | VARCHAR(255), UNIQUE NOT NULL | |
| name | VARCHAR(255) NOT NULL | |
| google_id | VARCHAR(255), UNIQUE NOT NULL | Google OAuth subject |
| gmail_access_token | TEXT | Encrypted (AES-256-CBC) |
| gmail_refresh_token | TEXT | Encrypted (AES-256-CBC) |
| gmail_sync_enabled | BOOLEAN, default true | |
| last_synced_at | TIMESTAMP | |
| created_at / updated_at | TIMESTAMP | |

### `categories`
| Column | Type | Notes |
|---|---|---|
| id | SERIAL, PK | |
| name | VARCHAR(100), UNIQUE NOT NULL | e.g. "Food & Dining" |
| icon | VARCHAR(50) | icon identifier |
| color | VARCHAR(7) | hex color for charts/badges |

Seeded with 12 default categories (Food & Dining, Transportation, Shopping,
Entertainment, Bills & Utilities, Healthcare, Education, Travel,
Insurance & EMI, ATM & Cash, Subscriptions, Other).

### `transactions`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| user_id | UUID, FK → users, ON DELETE CASCADE, INDEXED | |
| amount | DECIMAL(12,2) NOT NULL | |
| type | VARCHAR(10), CHECK IN ('credit','debit') | |
| merchant | VARCHAR(255) | |
| category_id | INTEGER, FK → categories | |
| source | VARCHAR(20), CHECK IN (...) | see source values below |
| transaction_date | DATE NOT NULL, INDEXED | |
| raw_email_id | VARCHAR(255), UNIQUE | dedup for email-sourced rows |
| notes | TEXT | |
| created_at | TIMESTAMP | |

**Source values (updated for v2 architecture):**
`phonepe`, `gpay`, `paytm`, `hdfc`, `sbi`, `icici`, `axis`, `kotak`, `federal`,
`manual`, `csv`, `pdf_statement`

> ⚠️ Migration note: original schema has `pdf` — rename/extend to
> `pdf_statement` to distinguish bulk statement imports from single-document
> uploads, and add `kotak`/`federal` to the bank list.

**Indexes:**
- `idx_txn_user_date` — `(user_id, transaction_date DESC)` — dashboard queries
- `idx_txn_user_category` — `(user_id, category_id)` — category breakdown
- `idx_txn_email_id` — `(raw_email_id)` — email dedup

**Statement-import dedup:** since `raw_email_id` is null for PDF-sourced rows,
dedup on bulk import uses a composite check: same `user_id` + `transaction_date`
+ `amount` + `description` (hashed) — see `implementationPlan.md` Phase 2.

### `budgets`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| user_id | UUID, FK → users | |
| category_id | INTEGER, FK → categories | |
| amount | DECIMAL(12,2) NOT NULL | |
| month | INTEGER, CHECK 1-12 | |
| year | INTEGER | |
| UNIQUE | (user_id, category_id, month, year) | |

### `policy_analyses`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| user_id | UUID, FK → users | |
| filename | VARCHAR(500) | |
| file_hash | VARCHAR(64), INDEXED | SHA-256 — dedup, skip re-analysis |
| summary | TEXT | |
| coverage | JSONB | array of covered items |
| exclusions | JSONB | array of excluded items |
| red_flags | JSONB | array of `{clause, explanation}` |
| created_at | TIMESTAMP | |

### `ai_insights`
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| user_id | UUID, FK → users | |
| insight_type | VARCHAR(50) | e.g. "monthly_summary" |
| month / year | INTEGER | |
| content | TEXT | |
| generated_at / valid_until | TIMESTAMP | cache expiry |
| UNIQUE | (user_id, insight_type, month, year) | |

---

## 3. Planned Addition — `statements`

Tracks each uploaded bank statement PDF, for history and re-processing.

```sql
CREATE TABLE statements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank            VARCHAR(20) NOT NULL,        -- 'kotak' | 'axis' | 'federal' | ...
  filename        VARCHAR(500) NOT NULL,
  file_hash       VARCHAR(64),                 -- dedup re-uploads
  period_start    DATE,
  period_end      DATE,
  transactions_imported INTEGER DEFAULT 0,
  transactions_skipped  INTEGER DEFAULT 0,     -- duplicates
  status          VARCHAR(20) DEFAULT 'processed', -- 'processed'|'failed'
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_statements_user ON statements(user_id);
```

This gives the dashboard a simple "import history" view and lets us show
*"Imported 47 transactions from March statement — 3 duplicates skipped"*
as described in `appFlow.md`.

---

## 4. Migration Plan

| File | Status | Contents |
|---|---|---|
| `001_init.sql` | ✅ Applied | users, categories (+seed), transactions, budgets, policy_analyses, ai_insights |
| `002_statements.sql` | Pending | `statements` table + updated `source` CHECK constraint |
