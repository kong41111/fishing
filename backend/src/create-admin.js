// Create default admin if not exists
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

(async () => {
  const username = process.env.DEFAULT_ADMIN_USER || 'admin';
  const password = process.env.DEFAULT_ADMIN_PASS || 'Fish@Stock2026';
  const [rows] = await db.query('SELECT id FROM users WHERE username=?', [username]);
  if (rows.length) {
    console.log(`ℹ️  User "${username}" already exists. Skip.`);
    process.exit(0);
  }
  const hash = await bcrypt.hash(password, 10);
  await db.query('INSERT INTO users (username, name, role, password_hash) VALUES (?,?,?,?)', [username, 'Admin', 'admin', hash]);
  console.log(`✅ Created admin: ${username} / ${password}`);
  console.log('   ⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
