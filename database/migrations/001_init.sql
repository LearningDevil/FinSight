-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    gmail_access_token TEXT,
    gmail_refresh_token TEXT,
    gmail_sync_enabled BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7)
);

INSERT INTO categories (name, icon, color) VALUES
  ('Food & Dining',    'utensils',     '#FF6B6B'),
  ('Transportation',   'car',          '#4ECDC4'),
  ('Shopping',         'shopping-bag', '#45B7D1'),
  ('Entertainment',    'film',         '#96CEB4'),
  ('Bills & Utilities','zap',          '#FFEAA7'),
  ('Healthcare',       'heart',        '#DDA0DD'),
  ('Education',        'book',         '#98D8C8'),
  ('Travel',           'plane',        '#F7DC6F'),
  ('Insurance & EMI',  'shield',       '#BB8FCE'),
  ('ATM & Cash',       'banknote',     '#85C1E9'),
  ('Subscriptions',    'repeat',       '#F0B27A'),
  ('Other',            'circle',       '#AEB6BF')
ON CONFLICT (name) DO NOTHING;

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
    merchant VARCHAR(255),
    category_id INTEGER REFERENCES categories(id),
    source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('phonepe', 'gpay', 'paytm', 'hdfc', 'sbi', 'icici', 'axis', 'manual', 'csv', 'pdf')),
    transaction_date DATE NOT NULL,
    raw_email_id VARCHAR(255) UNIQUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_txn_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_txn_user_category ON transactions(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_txn_email_id ON transactions(raw_email_id);

-- BUDGETS
CREATE TABLE IF NOT EXISTS budgets(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    amount DECIMAL(12,2) NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category_id, month, year)
);

-- POLICY ANALYSIS

CREATE TABLE IF NOT EXISTS policy_analyses(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    summary TEXT NOT NULL,
    coverage JSONB DEFAULT '[]',
    exclusions JSONB DEFAULT '[]',
    red_flags JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_user ON policy_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_hash ON policy_analyses(file_hash);

-- AI INSIGHTS
CREATE TABLE IF NOT EXISTS ai_insights(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    month INTEGER,
    year INTEGER,
    content TEXT NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP NOT NULL,
    UNIQUE(user_id, insight_type, month, year)
);