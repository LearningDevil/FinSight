const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { cacheGet, cacheSet, cacheDel } = require('../utils/redis');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/transactions
// Returns paginated transactions for the logged-in user
// Supports query params: ?month=6&year=2026&category_id=1&source=gpay
router.get('/', async (req, res) => {
  const { month, year, category_id, source, page = 1, limit = 20 } = req.query;
  const userId = req.user.userId;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT t.*, c.name as category_name, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      Where t.user_id = $1
      AND ($2::INTEGER IS NULL OR EXTRACT(MONTH FROM transaction_date) = $2)
      AND ($3::INTEGER IS NULL OR EXTRACT(YEAR FROM transaction_date) = $3)
      AND ($4::TEXT IS NULL OR t.category_id = $4::INTEGER)
      AND ($5::TEXT IS NULL OR t.source = $5)
      ORDER BY t.transaction_date DESC
      LIMIT $6 OFFSET $7
      `,
      [userId, month||null, year||null, category_id||null, source||null, limit, offset]
    );

    res.json({
      transactions: result.rows,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /api/transactions/summary
// Returns spending totals grouped by category for a given month
// Used to power the dashboard pie chart
router.get('/summary', async (req, res) => {
  const { month, year } = req.query;
  const userId = req.user.userId;

  // Check Redis cache first
  const cacheKey = `user:${userId}:summary:${year}:${month}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json({ ...cached, fromCache: true });

  try {
    const result = await pool.query(
      `
        SELECT c.name, c.color, SUM(t.amount) as total, COUNT(*) as count
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
        AND t.type = 'debit'
        AND ($2::INTEGER IS NULL OR EXTRACT(MONTH FROM t.transaction_date) = $2)
        AND ($3::INTEGER IS NULL OR EXTRACT(YEAR FROM t.transaction_date) = $3)
        GROUP BY c.id, c.name, c.color
        ORDER BY total DESC
      `,
      [userId, month, year]
    );

    const summary = { categories: result.rows, month, year };
    
    // Cache for 30 minutes (1800 seconds)
    await cacheSet(cacheKey, summary, 1800);
    
    res.json(summary);
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// POST /api/transactions
// Create a manual transaction entry
router.post('/', async (req, res) => {
    const {amount, type, merchant, category_id, transaction_date, notes} = req.body
    const userId = req.user.userId

    try{
        const result = await pool.query(`
        INSERT INTO transactions(user_id, amount, type, merchant, category_id, transaction_date, notes, source)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual')
        RETURNING *
        `, [userId, amount, type, merchant, category_id, transaction_date, notes]);

        // Invalidate cache for this month's summary
        const date = new Date(transaction_date);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        await cacheDel(`user:${userId}:summary:${year}:${month}`);

        res.status(201).json({transaction: result.rows[0]});
    }catch(err){
        console.error('Create transaction error:', err);
        res.status(500).json({error: 'Failed to create transaction'});
    }
});

module.exports = router;