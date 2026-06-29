// FishStock — Migration script: Import JSON backup → MySQL
// Usage: node src/migrate.js <path-to-fishstock-backup.json>
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node src/migrate.js <backup.json>');
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    process.exit(1);
  }

  const raw = fs.readFileSync(file, 'utf8');
  const d = JSON.parse(raw);
  console.log('Importing from:', file);
  console.log('Found:',
    (d.products||[]).length, 'products,',
    (d.salesHistory||[]).length, 'sales,',
    (d.customers||[]).length, 'customers,',
    (d.suppliers||[]).length, 'suppliers,',
    (d.expenses||[]).length, 'expenses'
  );

  // 1. Categories
  if (Array.isArray(d.categories)) {
    for (const c of d.categories) {
      await db.query('INSERT IGNORE INTO categories (name, icon) VALUES (?,?)', [c.name, c.icon||'📦']);
    }
    console.log('✅ Categories:', d.categories.length);
  }

  // 2. Users
  if (Array.isArray(d.users)) {
    for (const u of d.users) {
      // Note: localStorage uses btoa hash, not bcrypt. We re-hash with default password.
      const hash = await bcrypt.hash('ChangeMe2026', 10);
      await db.query(
        'INSERT IGNORE INTO users (username, name, role, password_hash) VALUES (?,?,?,?)',
        [u.username, u.name, u.role, hash]
      );
    }
    console.log('✅ Users:', d.users.length, '— ALL PASSWORDS RESET TO "ChangeMe2026" (re-hashed with bcrypt)');
  }

  // 3. Suppliers
  if (Array.isArray(d.suppliers)) {
    for (const s of d.suppliers) {
      await db.query(
        'INSERT INTO suppliers (name, phone, email, cats, note) VALUES (?,?,?,?,?)',
        [s.name, s.phone||null, s.email||null, JSON.stringify(s.cats||[]), s.note||null]
      );
    }
    console.log('✅ Suppliers:', d.suppliers.length);
  }

  // 4. Customers
  if (Array.isArray(d.customers)) {
    for (const c of d.customers) {
      await db.query(
        'INSERT INTO customers (name, phone, email, tier, total_spent, total_bills, points, note) VALUES (?,?,?,?,?,?,?,?)',
        [c.name, c.phone||null, c.email||null, c.tier||'ทั่วไป', +c.totalSpent||0, +c.totalBills||0, +c.points||0, c.note||null]
      );
    }
    console.log('✅ Customers:', d.customers.length);
  }

  // 5. Products
  if (Array.isArray(d.products)) {
    for (const p of d.products) {
      await db.query(
        'INSERT INTO products (code, barcode, name, category, qty, cost, price, img, note) VALUES (?,?,?,?,?,?,?,?,?)',
        [p.code, p.barcode||null, p.name, p.cat||null, +p.qty||0, +p.cost||0, +p.price||0, p.img||null, p.note||null]
      );
    }
    console.log('✅ Products:', d.products.length);
  }

  // 6. Sales + items
  if (Array.isArray(d.salesHistory)) {
    for (const s of d.salesHistory) {
      const [r] = await db.query(
        `INSERT INTO sales (bill_no, customer_id, customer_name, total, discount, member_discount, vat, net, pay_method, received, change_amt, sold_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [s.billNo, s.customerId||null, s.customerName||null,
         +s.total||0, +s.discount||0, +s.memberDiscount||0, +s.vat||0, +s.net||0,
         s.payMethod||'cash', +s.received||0, +s.change||0, s.date]
      );
      const saleId = r.insertId;
      for (const it of (s.items||[])) {
        await db.query(
          'INSERT INTO sale_items (sale_id, code, name, price, qty) VALUES (?,?,?,?,?)',
          [saleId, it.code, it.name, +it.price||0, +it.qty||1]
        );
      }
    }
    console.log('✅ Sales:', d.salesHistory.length);
  }

  // 7. Stock movements
  if (Array.isArray(d.stockHistory)) {
    for (const h of d.stockHistory) {
      await db.query(
        'INSERT INTO stock_movements (product_code, product_name, type, qty, after_qty, supplier_id, cost, note, bill_img, occurred_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [h.code, h.name, h.type, +h.qty||0, +h.after||0, h.supplierId||null, +h.cost||0, h.note||null, h.billImg||null, h.date]
      );
    }
    console.log('✅ Stock movements:', d.stockHistory.length);
  }

  // 8. Expenses
  if (Array.isArray(d.expenses)) {
    for (const e of d.expenses) {
      await db.query(
        'INSERT INTO expenses (category, amount, spent_at, note, bill_img) VALUES (?,?,?,?,?)',
        [e.category, +e.amount||0, e.date, e.note||null, e.billImg||null]
      );
    }
    console.log('✅ Expenses:', d.expenses.length);
  }

  // 9. Z-Reports
  if (Array.isArray(d.zReports)) {
    for (const z of d.zReports) {
      await db.query(
        'INSERT IGNORE INTO z_reports (report_date, data, opening_cash, counted_cash, expected, variance) VALUES (?,?,?,?,?,?)',
        [z.date, JSON.stringify(z), +z.opening||0, +z.counted||0, +z.expected||0, +z.variance||0]
      );
    }
    console.log('✅ Z-Reports:', d.zReports.length);
  }

  console.log('\n🎉 Migration complete!');
  process.exit(0);
}

main().catch(e => { console.error('❌ Migration failed:', e); process.exit(1); });
