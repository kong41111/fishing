const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM suppliers ORDER BY id');
  // Parse JSON cats field
  rows.forEach(r => { try { r.cats = typeof r.cats === 'string' ? JSON.parse(r.cats) : r.cats || []; } catch(e) { r.cats = []; } });
  res.json(rows);
});
router.post('/', requireAdmin, async (req, res) => {
  const { name, phone, email, cats, note } = req.body;
  const [r] = await db.query(
    'INSERT INTO suppliers (name, phone, email, cats, note) VALUES (?,?,?,?,?)',
    [name, phone||null, email||null, JSON.stringify(cats||[]), note||null]
  );
  res.json({ id: r.insertId });
});
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, phone, email, cats, note } = req.body;
  await db.query(
    'UPDATE suppliers SET name=?, phone=?, email=?, cats=?, note=? WHERE id=?',
    [name, phone||null, email||null, JSON.stringify(cats||[]), note||null, req.params.id]
  );
  res.json({ ok: true });
});
router.delete('/:id', requireAdmin, async (req, res) => {
  await db.query('DELETE FROM suppliers WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
