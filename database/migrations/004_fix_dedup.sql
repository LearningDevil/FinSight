-- Fix duplicate-detection for multi-transaction-per-email imports.
-- Old design: raw_email_id was UNIQUE, assuming one email = one transaction.
-- New reality: one statement email can contain dozens of transactions, all
-- sharing the same source email. We need per-TRANSACTION uniqueness, not
-- per-EMAIL uniqueness.

-- Step 1: drop the old constraint that was silently blocking valid transactions
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_raw_email_id_key;

-- Step 2: add a content-based fingerprint column.
-- This hash uniquely identifies a transaction by WHAT it is (date + amount +
-- description + source email), not just which email it came from.
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS dedup_hash VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_dedup_hash
  ON transactions(user_id, dedup_hash)
  WHERE dedup_hash IS NOT NULL;

-- raw_email_id stays as a regular (non-unique) column — still useful to know
-- WHICH email a transaction came from, just no longer used for uniqueness.
