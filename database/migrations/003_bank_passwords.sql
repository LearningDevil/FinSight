-- Encrypted bank statement passwords, opt-in per user per bank
CREATE TABLE IF NOT EXISTS bank_passwords (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank            VARCHAR(20) NOT NULL,
    encrypted_password TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, bank)
);

CREATE INDEX IF NOT EXISTS idx_bank_passwords_user ON bank_passwords(user_id);

-- Track Gmail sync state so we only search for NEW statement emails each time
CREATE TABLE IF NOT EXISTS gmail_sync_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank            VARCHAR(20) NOT NULL,
    gmail_message_id VARCHAR(255) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'success',
    transactions_imported INTEGER DEFAULT 0,
    error_message   TEXT,
    synced_at       TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, gmail_message_id)
);

CREATE INDEX IF NOT EXISTS idx_gmail_sync_user ON gmail_sync_log(user_id);
