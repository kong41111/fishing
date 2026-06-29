// Sales — POS checkout + reports
const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// GET /api/sales — list with date filter
router.get('/', requireAuth, async (req, res) => {
  const { from, to, customer_id, limit } = req.query;
  let sql = `SELECT s.*, GROUP_CONCAT(JSON_OBJECT('code',si.code,'name',si.name,'qty',si.qty,'price',si.price)) AS items_json
             FROM sales s LEFT JOIN sale_items si ON si.sale_id = s.id`;
  const params = [];
  const where = [];
  if (from) { where.push('s.sold_at >= ?'); params.push(from); }
  if (to)   { where.push('s.sold_at <= ?'); params.push(to + ' 23:59:59'); }
  if (customer_id) { where.push('s.customer_id = ?'); params.push(customer_id); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' GROUP BY s.id ORDER BY s.sold_at DESC';
  if (limit) sql += ' LIMIT ' + (parseInt(limit) || 100);
  const [rows] = await db.query(sql, params);
  // Parse items
  rows.forEach(r => {
    try { r.items = r.items_json ? JSON.parse('[' + r.items_json + ']') : []; } catch(e) { r.items = []; }
    delete r.items_json;
  });
  res.json(rows);
});

// POST /api/sales — checkout (creates sale + items + stock movements + customer update)
router.post('/', requireAuth, async (req, res) => {
  const { bill_no, customer_id, items, total, discount, member_discount, vat, net, pay_method, received } = req.body;
  if (!bill_no || !Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Invalid bill' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Get customer name if linked
    let customerName = null;
    if (customer_id) {
      const [cs] = await conn.query('SELECT name FROM customers WHERE id=?', [customer_id]);
      customerName = cs[0]?.name || null;
    }

    // Create sale
    const change_amt = Math.max(0, +received - +net);
    const [sR] = await conn.query(
      `INSERT INTO sales (bill_no, customer_id, customer_name, total, discount, member_discount, vat, net, pay_method, received, change_amt, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [bill_no, customer_id||null, customerName, +total||0, +discount||0, +member_discount||0, +vat||0, +net||0, pay_method||'cash', +received||0, change_amt, req.user.id]
    );
    const saleId = sR.insertId;

    // Items + deduct stock + record stock movement
    for (const it of items) {
      await conn.query(
        'INSERT INTO sale_items (sale_id, code, name, price, qty) VALUES (?,?,?,?,?)',
        [saleId, it.code, it.name, +it.price||0, +it.qty||1]
      );
      const [prodRows] = await conn.query('SELECT qty FROM products WHERE code=?', [it.code]);
      if (prodRows[0]) {
        const newQty = Math.max(0, prodRows[0].qty - +it.qty);
        await conn.query('UPDATE products SET qty=? WHERE code=?', [newQty, it.code]);
        await conn.query(
          'INSERT INTO stock_movements (product_code, product_name, type, qty, after_qty, note, created_by) VALUES (?,?,?,?,?,?,?)',
          [it.code, it.name, 'sale', -(+it.qty), newQty, `บิล ${bill_no}`, req.user.id]
        );
      }
    }

    // Update customer stats + points (1pt / 20 baht)
    if (customer_id) {
      const points = Math.floor((+net||0) / 20);
      await conn.query(
        'UPDATE customers SET total_spent = total_spent + ?, total_bills = total_bills + 1, points = points + ? WHERE id=?',
        [+net||0, points, customer_id]
      );
    }

    await conn.commit();
    res.json({ ok: true, id: saleId });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

// DELETE /api/sales/:bill_no — void bill (return stock + revert customer)
router.delete('/:bill_no', requireAuth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [sales] = await conn.query('SELECT * FROM sales WHERE bill_no=?', [req.params.bill_no]);
    const sale = sales[0];
    if (!sale) { await conn.rollback(); return res.status(404).json({ error: 'Bill not found' }); }
    const [items] = await conn.query('SELECT * FROM sale_items WHERE sale_id=?', [sale.id]);

    // Return stock
    for (const it of items) {
      const [prodRows] = await conn.query('SELECT qty FROM products WHERE code=?', [it.code]);
      if (prodRows[0]) {
        const newQty = prodRows[0].qty + +it.qty;
        await conn.query('UPDATE products SET qty=? WHERE code=?', [newQty, it.code]);
        await conn.query(
          'INSERT INTO stock_movements (product_code, product_name, type, qty, after_qty, note, created_by) VALUES (?,?,?,?,?,?,?)',
          [it.code, it.name, 'void', +it.qty, newQty, `ยกเลิกบิล ${sale.bill_no}`, req.user.id]
        );
      }
    }

    // Revert customer stats
    if (sale.customer_id) {
      const points = Math.floor((+sale.net||0) / 20);
      await conn.query(
        'UPDATE customers SET total_spent = GREATEST(0, total_spent - ?), total_bills = GREATEST(0, total_bills - 1), points = GREATEST(0, points - ?) WHERE id=?',
        [+sale.net||0, points, sale.customer_id]
      );
    }

    // Delete sale (cascade items)
    await conn.query('DELETE FROM sales WHERE id=?', [sale.id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

// GET /api/sales/summary?from=&to= — KPI summary
router.get('/summary/kpi', requireAuth, async (req, res) => {
  const { from, to } = req.query;
  let where = '';
  const params = [];
  if (from || to) {
    where = ' WHERE ';
    const conds = [];
    if (from) { conds.push('sold_at >= ?'); params.push(from); }
    if (to)   { conds.push('sold_at <= ?'); params.push(to + ' 23:59:59'); }
    where += conds.join(' AND ');
  }
  const [rows] = await db.query(
    `SELECT COUNT(*) AS bills, COALESCE(SUM(net),0) AS revenue, COALESCE(AVG(net),0) AS avg_bill,
     SUM(CASE WHEN pay_method='cash' THEN net ELSE 0 END) AS cash,
     SUM(CASE WHEN pay_method='qr'   THEN net ELSE 0 END) AS qr,
     SUM(CASE WHEN pay_method='card' THEN net ELSE 0 END) AS card
     FROM sales ${where}`, params);
  res.json(rows[0]);
});

module.exports = router;
