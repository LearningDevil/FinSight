# FinSight — Technical Specification (TRD / Tech Spec)

**Version:** 2.0
**Status:** Active development

---

## 1. Architecture Overview

```
                         ┌──────────────┐
                         │    Nginx     │  ← only exposed port (80)
                         │ (LB + rate   │
                         │   limiting)  │
                         └──────┬───────┘
                                │ round-robin
            ┌───────────────────┼───────────────────┐
            │                   │                   │
     ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
     │ node-app-1  │     │ node-app-2  │     │ node-app-3  │
     │  (Express)  │     │  (Express)  │     │  (Express)  │
     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
            └───────────────────┼───────────────────┘
                                │
          ┌─────────────┬───────┴───────┬─────────────┐
          │             │               │             │
   ┌──────▼─────┐ ┌─────▼─────┐  ┌──────▼──────┐ ┌────▼────┐
   │ PostgreSQL │ │   Redis    │  │   Python    │ │  Bull   │
   │ (primary)  │ │ (cache +   │  │   Flask     │ │  Queue  │
   │            │ │  queue)    │  │ (parsing+AI)│ │ Worker  │
   └────────────┘ └────────────┘  └─────────────┘ └─────────┘
```

All services run as Docker containers via `docker-compose.yml`. Only Nginx
(port 80) is exposed to the host machine.

---

## 2. Technology Stack

| Layer | Technology | Status |
|---|---|---|
| Frontend | React + TailwindCSS + Recharts | Pending |
| Reverse Proxy | Nginx (round-robin, rate limiting) | ✅ Done |
| Core API | Node.js + Express ×3 | ✅ Done |
| Auth | Google OAuth 2.0 + JWT | ✅ Done |
| Token encryption | AES-256-CBC (Node `crypto`) | ✅ Done |
| Database | PostgreSQL 15 | ✅ Done |
| Cache | Redis 7 | ✅ Done |
| Parsing & AI service | Python 3.11 + Flask | Scaffolded |
| PDF unlock/extraction | `pikepdf` + `pdfplumber` | 🔜 Next |
| AI | Gemini 1.5 Flash | Pending |
| Job queue | Bull (Redis-backed) | Pending |
| Containerization | Docker + Docker Compose | ✅ Done |
| Load testing | k6 | Pending |
| Deployment | Render / Railway | Pending |

---

## 3. Service Responsibilities

### nginx
- Single entry point (port 80).
- Round-robin load balancing across `node-app-1/2/3`.
- Rate limiting: 100 req/min general, 10 req/min on AI-heavy endpoints.

### node-app-1/2/3 (identical, stateless)
- Express REST API.
- Routes: `/api/auth`, `/api/transactions`, `/api/policies`, `/api/insights`,
  `/api/budgets`, `/api/sync`.
- JWT verification middleware (`authMiddleware`) — no DB lookup needed per request.
- Talks to PostgreSQL (pg pool), Redis (cache), and python-service (HTTP) for
  parsing/AI tasks.

### postgres
- Single source of truth. Schema in `database/migrations/`.
- Indexed for the access patterns described in `schema.md`.

### redis
- Two roles: (1) cache for expensive aggregation queries, TTL-based,
  invalidated on write; (2) backing store for Bull queue jobs (statement
  processing, Gmail sync).

### python-service
- Flask app, internal-only (not exposed via Nginx).
- Endpoints:
  - `POST /parse/pdf/statement` — unlock + extract transaction table from a
    bank statement PDF.
  - `POST /parse/pdf/policy` — extract text + AI structured analysis of a
    policy PDF.
  - `POST /parse/email` — regex parsers for rare bank/UPI alert emails
    (secondary path).
  - `POST /insights/monthly` — Gemini-generated spending insights.

---

## 4. API Endpoints (Node.js, via Nginx)

| Method | Endpoint | Auth | Description | Status |
|---|---|---|---|---|
| GET | `/api/auth/google` | Public | Returns Google OAuth URL | ✅ |
| GET | `/api/auth/google/callback` | Public | OAuth callback, issues JWT | ✅ |
| GET | `/api/auth/me` | JWT | Current user profile | ✅ |
| POST | `/api/auth/logout` | JWT | Logout (client-side token discard) | ✅ |
| GET | `/api/transactions` | JWT | List, with filters + pagination | ✅ |
| POST | `/api/transactions` | JWT | Manual transaction entry | ✅ |
| GET | `/api/transactions/summary` | JWT | Category totals for a month (cached) | ✅ |
| POST | `/api/transactions/upload/statement` | JWT | Upload bank statement PDF + password | 🔜 |
| POST | `/api/policies/analyze` | JWT | Upload policy PDF → AI analysis | Pending |
| GET | `/api/policies` | JWT | List past policy analyses | Pending |
| GET | `/api/insights/monthly` | JWT | AI monthly spending insight | Pending |
| GET/POST | `/api/budgets` | JWT | Budget goals per category | Pending |
| GET | `/health` | Public | Service health (DB, Redis status) | ✅ |

---

## 5. Security

- All Gmail OAuth tokens encrypted at rest (AES-256-CBC) — `utils/encryption.js`.
- JWT, 24h expiry, signed with `JWT_SECRET`.
- Statement PDF passwords are **never stored** — used in-memory to unlock,
  then discarded immediately after extraction.
- Uploaded PDFs deleted from disk after processing.
- Nginx rate limiting on all `/api/` routes, stricter on AI/parsing routes.
- `.env` never committed — verified via `.gitignore`.

---

## 6. Performance & Scalability Targets

| Metric | Target |
|---|---|
| Concurrent users | 500 |
| Cached endpoint p95 | <300ms |
| DB-query endpoint p95 | <800ms |
| Statement parse (50-row table) | <5s |
| Policy analysis (20-page PDF) | <10s |
| Uptime | 99% (portfolio-grade) |

---

## 7. Open Technical Decisions

- **PDF password handling:** prompt user once per statement upload; do not
  attempt to guess/derive passwords from PAN/DOB automatically (security +
  scope reasons).
- **Statement table variability:** Kotak's columns are
  `Date | Description | Chq/Ref No. | Withdrawal (Dr.) | Deposit (Cr.) | Balance`.
  Axis/Federal will differ — build a per-bank column-mapping config rather than
  hardcoding once, so adding a bank = adding a mapping, not new parsing logic.
