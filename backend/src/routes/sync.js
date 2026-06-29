// SYNC — full state push/pull for hybrid localStorage ↔ MySQL mode
// This is the simplest path: dump all localStorage to MySQL, and load it back.
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// GET /api/sync — pull all data as a single object (like Export JSON)
router.get('/', requireAuth, async (req, res) => {
  try {
    const [products]  = await db.query('SELECT code, barcode, name, category AS cat, qty, cost, price, img, note FROM products');
    const [categories] = await db.query('SELECT name, icon FROM categories ORDER BY id');
    const [suppliers] = await db.query('SELECT * FROM suppliers');
    suppliers.forEach(s => { try { s.cats = typeof s.cats==='string' ? JSON.parse(s.cats) : (s.cats||[]); } catch(e) { s.cats = []; } });
    const [customers] = await db.query('SELECT id, name, phone, email, tier, total_spent AS totalSpent, total_bills AS totalBills, points, note FROM customers');
    const [expenses]  = await db.query('SELECT id, category, amount, spent_at AS date, note, bill_img AS billImg FROM expenses');
    const [salesRows] = await db.query('SELECT id, bill_no AS billNo, customer_id AS customerId, customer_name AS customerName, total, discount, member_discount AS memberDiscount, vat, net, pay_method AS payMethod, received, change_amt AS `change`, sold_at AS date FROM sales');
    const [saleItems] = await db.query('SELECT sale_id, code, name, price, qty FROM sale_items');
    // Attach items to sales
    const itemsBySale = {};
    saleItems.forEach(i => { (itemsBySale[i.sale_id] = itemsBySale[i.sale_id] || []).push({code:i.code,name:i.name,price:i.price,qty:i.qty}); });
    salesRows.forEach(s => { s.items = itemsBySale[s.id] || []; delete s.id; });
    const [stockHistory] = await db.query('SELECT product_code AS code, product_name AS name, type, qty, after_qty AS after, supplier_id AS supplierId, cost, note, bill_img AS billImg, occurred_at AS date FROM stock_movements ORDER BY occurred_at DESC LIMIT 1000');
    const [zReports] = await db.query('SELECT data FROM z_reports ORDER BY report_date DESC');
    const [parkedSales] = await db.query('SELECT id, label, items, discount, total, pay_method AS payMethod, parked_at AS parkedAt FROM parked_sales');
    parkedSales.forEach(p => { try { p.items = typeof p.items==='string' ? JSON.parse(p.items) : (p.items||[]); } catch(e) { p.items = []; } });
    const [settingsRows] = await db.query('SELECT * FROM app_settings');
    const appSettings = {};
    settingsRows.forEach(r => {
      try { appSettings[r.k] = typeof r.v === 'string' ? JSON.parse(r.v) : r.v; } catch(e) { appSettings[r.k] = r.v; }
    });

    res.json({
      v: '1.0',
      pulledAt: new Date().toISOString(),
      products, categories, suppliers, customers, expenses,
      salesHistory: salesRows,
      stockHistory,
      zReports: zReports.map(z => typeof z.data==='string' ? JSON.parse(z.data) : z.data),
      parkedSales,
      appSettings
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/sync — push full state (replaces all data)
// ⚠️ Destructive — used for initial migration or manual override
router.post('/', requireAuth, async (req, res) => {
  const d = req.body || {};
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Replace categories
    if (Array.isArray(d.categories)) {
      await conn.query('DELETE FROM categories');
      for (const c of d.categories) {
        await conn.query('INSERT INTO categories (name, icon) VALUES (?,?)', [c.name, c.icon||'📦']);
      }
    }
    // Replace settings
    if (d.appSettings && typeof d.appSettings === 'object') {
      await conn.query('DELETE FROM app_settings');
      for (const [k, v] of Object.entries(d.appSettings)) {
        await conn.query('INSERT INTO app_settings (k, v) VALUES (?,?)', [k, JSON.stringify(v)]);
      }
    }

    // Note: full destructive sync for products/sales/etc is risky
    // For now, only categories + settings are synced via POST.
    // Use individual endpoints for product/customer/etc CRUD.

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally { conn.release(); }
});

module.exports = router;
