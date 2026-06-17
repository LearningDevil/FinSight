const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const { pool } = require('../models/db');
const { cacheDel } = require('../utils/redis');
const authMiddleware = require('../middleware/auth');
const crypto = require('crypto');

// store uploaded file in memory (not disk) — we forward to Python then discard
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.use(authMiddleware);

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { password, bank = 'kotak' } = req.body;
  if (!password) return res.status(400).json({ error: 'PDF password required' });

  const userId   = req.user.userId;
  const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

  // check if this exact statement was already imported
  const existing = await pool.query(
    'SELECT id, transactions_imported FROM statements WHERE user_id = $1 AND file_hash = $2',
    [userId, fileHash]
  );
  if (existing.rows[0]) {
    return res.status(409).json({
      error: 'This statement has already been imported',
      transactions_imported: existing.rows[0].transactions_imported,
    });
  }

  // forward file + password to Python service
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: 'application/pdf' });
  form.append('password', password);
  form.append('bank', bank);

  let parsed;
  try {
    const response = await axios.post(
      `${process.env.PYTHON_SERVICE_URL}/parse/pdf/statement`,
      form,
      { headers: form.getHeaders(), timeout: 30000 }
    );
    parsed = response.data;
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error || 'PDF parsing failed';
    return res.status(status).json({ error: message });
  }

  if (!parsed.transactions?.length) {
    return res.status(422).json({ error: 'No transactions found in this statement' });
  }

  // bulk insert with dedup
  let imported = 0;
  let skipped  = 0;
  const affectedMonths = new Set();

  for (const txn of parsed.transactions) {
    try {
      await pool.query(`
        INSERT INTO transactions
          (user_id, amount, type, merchant, source, transaction_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [userId, txn.amount, txn.type, txn.description, `pdf_statement`, txn.date]);

      imported++;
      const d = new Date(txn.date);
      affectedMonths.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
    } catch {
      skipped++;
    }
  }

  // record statement in statements table
  await pool.query(`
    INSERT INTO statements (user_id, bank, filename, file_hash, transactions_imported, transactions_skipped)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [userId, bank, req.file.originalname, fileHash, imported, skipped]);

  // invalidate Redis cache for all affected months
  for (const ym of affectedMonths) {
    const [year, month] = ym.split('-');
    await cacheDel(`user:${userId}:summary:${year}:${month}`);
  }

  res.json({
    success: true,
    imported,
    skipped,
    total: parsed.transactions.length,
    message: `Imported ${imported} transactions — ${skipped} duplicates skipped`,
  });
});

module.exports = router;