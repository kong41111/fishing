const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { from, to } = req.query;
  let sql = 'SELECT * FROM expenses';
  const params = [];
  const where = [];
  if (from) { where.push('spent_at >= ?'); params.push(from); }
  if (to)   { where.push('spent_at <= ?'); params.push(to); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY spent_at DESC, id DESC';
  const [rows] = await db.query(sql, params);
  res.json(rows);
});
router.post('/', requireAdmin, async (req, res) => {
  const { category, amount, spent_at, note, bill_img } = req.body;
  if (!category || !amount) return res.status(400).json({ error: 'category & amount required' });
  const [r] = await db.query(
    'INSERT INTO expenses (category, amount, spent_at, note, bill_img, created_by) VALUES (?,?,?,?,?,?)',
    [category, +amount, spent_at || new Date().toISOString().slice(0,10), note||null, bill_img||null, req.user.id]
  );
  res.json({ id: r.insertId });
});
router.delete('/:id', requireAdmin, async (req, res) => {
  await db.query('DELETE FROM expenses WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
