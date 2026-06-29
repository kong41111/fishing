const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM categories ORDER BY id');
  res.json(rows);
});
router.post('/', requireAdmin, async (req, res) => {
  const { name, icon } = req.body;
  try {
    const [r] = await db.query('INSERT INTO categories (name, icon) VALUES (?,?)', [name, icon||'📦']);
    res.json({ id: r.insertId });
  } catch (e) {
    if (e.code==='ER_DUP_ENTRY') return res.status(409).json({ error: 'Duplicate name' });
    res.status(500).json({ error: e.message });
  }
});
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, icon, oldName } = req.body;
  await db.query('UPDATE categories SET name=?, icon=? WHERE id=?', [name, icon||'📦', req.params.id]);
  // cascade rename
  if (oldName && oldName !== name) {
    await db.query('UPDATE products SET category=? WHERE category=?', [name, oldName]);
  }
  res.json({ ok: true });
});
router.delete('/:id', requireAdmin, async (req, res) => {
  const { fallback } = req.body || {};
  const [rows] = await db.query('SELECT name FROM categories WHERE id=?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  if (fallback) {
    await db.query('UPDATE products SET category=? WHERE category=?', [fallback, rows[0].name]);
  }
  await db.query('DELETE FROM categories WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
