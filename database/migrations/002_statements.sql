-- Statements table — tracks uploaded bank statement PDFs
CREATE TABLE IF NOT EXISTS statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank VARCHAR(20) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64),
    period_start DATE,
    period_end DATE,
    transactions_imported INTEGER DEFAULT 0,
    transactions_skipped INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processed',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_statements_user ON statements(user_id);

-- Update transactions.source to support new banks + pdf_statement
ALTER TABLE transactions DROP CONSTRAINT transactions_source_check;

ALTER TABLE transactions ADD CONSTRAINT transactions_source_check
  CHECK (source IN ('phonepe','gpay','paytm','hdfc','sbi','icici','axis','kotak','federal','manual','csv','pdf_statement'));