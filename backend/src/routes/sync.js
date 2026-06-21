const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { pool } = require('../models/db');
const { encrypt, decrypt } = require('../utils/encryption');
const { cacheDel } = require('../utils/redis');
const authMiddleware = require('../middleware/auth');
 
router.use(authMiddleware);
 
// Builds a content-based fingerprint for a transaction so the SAME real-world
// transaction is always detected as a duplicate, even across different sync
// runs -- while DIFFERENT transactions from the same email are never blocked.
function computeDedupHash(txn, bank) {
  const raw = `${bank}|${txn.date}|${txn.amount}|${txn.type}|${(txn.description || '').trim().toLowerCase()}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}
 
// GET /api/sync/password-status?bank=kotak
// Check if a password is already saved for this bank, without revealing it
router.get('/password-status', async (req, res) => {
  const { bank } = req.query;
  const userId = req.user.userId;
 
  try {
    const result = await pool.query(
      'SELECT id FROM bank_passwords WHERE user_id = $1 AND bank = $2',
      [userId, bank]
    );
    res.json({ hasSavedPassword: result.rows.length > 0 });
  } catch (err) {
    console.error('Password status error:', err);
    res.status(500).json({ error: 'Failed to check password status' });
  }
});
 
// POST /api/sync/gmail
// Body: { bank, password, rememberPassword (bool) }
router.post('/gmail', async (req, res) => {
  const { bank, password, rememberPassword } = req.body;
  const userId = req.user.userId;
 
  if (!bank) {
    return res.status(400).json({ error: 'Bank is required' });
  }
 
  // Fetch user's Gmail access token + check for a saved password
  let user, savedPasswordRow;
  try {
    const userResult = await pool.query(
      'SELECT gmail_access_token, gmail_sync_enabled FROM users WHERE id = $1',
      [userId]
    );
    user = userResult.rows[0];
 
    if (!user || !user.gmail_sync_enabled) {
      return res.status(400).json({ error: 'Gmail sync is not enabled for this account' });
    }
 
    const passResult = await pool.query(
      'SELECT encrypted_password FROM bank_passwords WHERE user_id = $1 AND bank = $2',
      [userId, bank]
    );
    savedPasswordRow = passResult.rows[0];
  } catch (err) {
    console.error('User/password lookup error:', err);
    return res.status(500).json({ error: 'Failed to load account details' });
  }
 
  // Determine which password to use: explicit input wins, else fall back to saved
  let effectivePassword = password;
  if (!effectivePassword && savedPasswordRow) {
    effectivePassword = decrypt(savedPasswordRow.encrypted_password);
  }
 
  if (!effectivePassword) {
    return res.status(400).json({
      error: 'Password required',
      needsPassword: true,
    });
  }
 
  // Get already-synced Gmail message IDs for this user+bank, so Python can skip them
  let alreadySyncedIds = [];
  try {
    const logResult = await pool.query(
      'SELECT gmail_message_id FROM gmail_sync_log WHERE user_id = $1 AND bank = $2',
      [userId, bank]
    );
    alreadySyncedIds = logResult.rows.map(r => r.gmail_message_id);
  } catch (err) {
    console.error('Sync log lookup error:', err);
  }
 
  const accessToken = decrypt(user.gmail_access_token);
 
  // Call Python service to do the actual Gmail search + parse work
  let pythonResult;
  try {
    const response = await axios.post(
      `${process.env.PYTHON_SERVICE_URL}/gmail/sync`,
      {
        access_token: accessToken,
        bank,
        password: effectivePassword,
        already_synced_ids: alreadySyncedIds,
      },
      { timeout: 60000 }
    );
    pythonResult = response.data;
  } catch (err) {
    const message = err.response?.data?.error || 'Gmail sync failed';
    return res.status(err.response?.status || 500).json({ error: message });
  }
 
  // Save password if user opted in, and the sync actually succeeded for at least one email
  const anySuccess = pythonResult.results.some(r => r.status === 'success');
 
  if (rememberPassword && anySuccess) {
    const encryptedPassword = encrypt(effectivePassword);
    await pool.query(`
      INSERT INTO bank_passwords (user_id, bank, encrypted_password)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, bank) DO UPDATE SET
        encrypted_password = EXCLUDED.encrypted_password,
        updated_at = NOW()
    `, [userId, bank, encryptedPassword]);
  }
 
  // Insert all successfully parsed transactions, log every processed email
  let totalImported = 0;
  let totalSkipped   = 0;
  const affectedMonths = new Set();
 
  for (const emailResult of pythonResult.results) {
    if (emailResult.status === 'success') {
      let importedThisEmail = 0;
 
      for (const txn of emailResult.transactions) {
        try {
          const dedupHash = computeDedupHash(txn, bank);
 
          const insertResult = await pool.query(`
            INSERT INTO transactions
              (user_id, amount, type, merchant, source, transaction_date, raw_email_id, dedup_hash)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (user_id, dedup_hash) WHERE dedup_hash IS NOT NULL DO NOTHING
            RETURNING id
          `, [userId, txn.amount, txn.type, txn.description, bank, txn.date, emailResult.gmail_message_id, dedupHash]);
 
          if (insertResult.rows.length > 0) {
            importedThisEmail++;
            const d = new Date(txn.date);
            affectedMonths.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
          }
        } catch (err) {
          console.error('Transaction insert error:', err.message);
        }
      }
 
      totalImported += importedThisEmail;
 
      await pool.query(`
        INSERT INTO gmail_sync_log (user_id, bank, gmail_message_id, status, transactions_imported)
        VALUES ($1, $2, $3, 'success', $4)
        ON CONFLICT (user_id, gmail_message_id) DO NOTHING
      `, [userId, bank, emailResult.gmail_message_id, importedThisEmail]);
 
    } else {
      await pool.query(`
        INSERT INTO gmail_sync_log (user_id, bank, gmail_message_id, status, error_message)
        VALUES ($1, $2, $3, 'failed', $4)
        ON CONFLICT (user_id, gmail_message_id) DO NOTHING
      `, [userId, bank, emailResult.gmail_message_id, emailResult.error]);
    }
  }
 
  // Invalidate cache for every month that got new transactions
  for (const ym of affectedMonths) {
    const [year, month] = ym.split('-');
    await cacheDel(`user:${userId}:summary:${year}:${month}`);
  }
 
  // Update last_synced_at
  await pool.query('UPDATE users SET last_synced_at = NOW() WHERE id = $1', [userId]);
 
  res.json({
    success: true,
    bank,
    emailsFound: pythonResult.emails_found,
    emailsSkipped: pythonResult.emails_skipped,
    emailsProcessed: pythonResult.emails_processed,
    transactionsImported: totalImported,
    passwordSaved: rememberPassword && anySuccess,
    details: pythonResult.results,
  });
});
 
module.exports = router;