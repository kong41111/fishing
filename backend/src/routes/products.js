const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// GET /api/products  — list all
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products ORDER BY id');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/products/:code
router.get('/:code', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE code=? LIMIT 1', [req.params.code]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/products  — add
router.post('/', requireAdmin, async (req, res) => {
  const { code, barcode, name, category, qty, cost, price, img, note } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'code and name required' });
  try {
    const [r] = await db.query(
      'INSERT INTO products (code, barcode, name, category, qty, cost, price, img, note) VALUES (?,?,?,?,?,?,?,?,?)',
      [code, barcode||null, name, category||null, +qty||0, +cost||0, +price||0, img||null, note||null]
    );
    res.json({ id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Code already exists' });
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/products/:code  — update
router.put('/:code', requireAdmin, async (req, res) => {
  const { barcode, name, category, qty, cost, price, img, note } = req.body;
  try {
    await db.query(
      'UPDATE products SET barcode=?, name=?, category=?, qty=?, cost=?, price=?, img=?, note=? WHERE code=?',
      [barcode||null, name, category||null, +qty||0, +cost||0, +price||0, img||null, note||null, req.params.code]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/products/:code
router.delete('/:code', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE code=?', [req.params.code]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/products  — clear all
router.delete('/', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM products');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
