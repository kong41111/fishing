const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM customers ORDER BY id');
  res.json(rows);
});
router.post('/', requireAuth, async (req, res) => {
  const { name, phone, email, tier, note } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const [r] = await db.query(
    'INSERT INTO customers (name, phone, email, tier, note) VALUES (?,?,?,?,?)',
    [name, phone||null, email||null, tier||'ทั่วไป', note||null]
  );
  res.json({ id: r.insertId });
});
router.put('/:id', requireAuth, async (req, res) => {
  const { name, phone, email, tier, note } = req.body;
  await db.query(
    'UPDATE customers SET name=?, phone=?, email=?, tier=?, note=? WHERE id=?',
    [name, phone||null, email||null, tier||'ทั่วไป', note||null, req.params.id]
  );
  res.json({ ok: true });
});
router.delete('/:id', requireAdmin, async (req, res) => {
  await db.query('DELETE FROM customers WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
