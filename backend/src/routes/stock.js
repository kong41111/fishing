// Stock movements (in/out/sale/void)
const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// GET /api/stock — list with filters
router.get('/', requireAuth, async (req, res) => {
  const { code, type, from, to, limit } = req.query;
  let sql = 'SELECT * FROM stock_movements';
  const params = [];
  const where = [];
  if (code) { where.push('product_code = ?'); params.push(code); }
  if (type) { where.push('type = ?'); params.push(type); }
  if (from) { where.push('occurred_at >= ?'); params.push(from); }
  if (to)   { where.push('occurred_at <= ?'); params.push(to); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY occurred_at DESC, id DESC';
  if (limit) sql += ' LIMIT ' + (parseInt(limit) || 100);
  const [rows] = await db.query(sql, params);
  res.json(rows);
});

// POST /api/stock/in — รับสินค้าเข้า
router.post('/in', requireAdmin, async (req, res) => {
  const { code, qty, cost, supplier_id, note, bill_img, occurred_at } = req.body;
  if (!code || !qty) return res.status(400).json({ error: 'code & qty required' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [prods] = await conn.query('SELECT * FROM products WHERE code=? FOR UPDATE', [code]);
    const p = prods[0];
    if (!p) { await conn.rollback(); return res.status(404).json({ error: 'Product not found' }); }
    const newQty = p.qty + +qty;
    await conn.query('UPDATE products SET qty=?, cost=? WHERE code=?', [newQty, cost || p.cost, code]);
    await conn.query(
      'INSERT INTO stock_movements (product_code, product_name, type, qty, after_qty, supplier_id, cost, note, bill_img, occurred_at, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [code, p.name, 'in', +qty, newQty, supplier_id||null, cost||null, note||null, bill_img||null, occurred_at || new Date(), req.user.id]
    );
    await conn.commit();
    res.json({ ok: true, after_qty: newQty });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

// POST /api/stock/out — จ่ายสินค้าออก
router.post('/out', requireAdmin, async (req, res) => {
  const { code, qty, note, occurred_at } = req.body;
  if (!code || !qty) return res.status(400).json({ error: 'code & qty required' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [prods] = await conn.query('SELECT * FROM products WHERE code=? FOR UPDATE', [code]);
    const p = prods[0];
    if (!p) { await conn.rollback(); return res.status(404).json({ error: 'Product not found' }); }
    if (p.qty < +qty) { await conn.rollback(); return res.status(400).json({ error: 'Insufficient stock' }); }
    const newQty = p.qty - +qty;
    await conn.query('UPDATE products SET qty=? WHERE code=?', [newQty, code]);
    await conn.query(
      'INSERT INTO stock_movements (product_code, product_name, type, qty, after_qty, note, occurred_at, created_by) VALUES (?,?,?,?,?,?,?,?)',
      [code, p.name, 'out', -(+qty), newQty, note||null, occurred_at || new Date(), req.user.id]
    );
    await conn.commit();
    res.json({ ok: true, after_qty: newQty });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

module.exports = router;
