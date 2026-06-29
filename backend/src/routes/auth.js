const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { sign, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/login
router.post('/login', async (req, res) => {
  const { username, password, device_id } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username=? LIMIT 1', [username]);
    const user = rows[0];
    const ok = user && await bcrypt.compare(password, user.password_hash);
    // log attempt
    await db.query(
      'INSERT INTO login_log (username, success, device_id, user_agent, ip) VALUES (?,?,?,?,?)',
      [username, ok ? 1 : 0, device_id || null, req.headers['user-agent'] || null, req.ip]
    );
    if (!ok) return res.status(401).json({ error: 'Invalid username or password' });
    const token = sign(user);
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/me
router.get('/me', requireAuth, (req, res) => res.json(req.user));

// POST /api/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'New password too short' });
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id=?', [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(oldPassword, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Wrong current password' });
    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash=? WHERE id=?', [hash, req.user.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
