// FishStock — Express + MySQL backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' })); // big to fit base64 images + sync payloads
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve frontend (index.html, products.json, etc.) from parent dir
app.use(express.static(path.join(__dirname, '../../')));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Routes
app.use('/api',            require('./routes/auth'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/suppliers',  require('./routes/suppliers'));
app.use('/api/customers',  require('./routes/customers'));
app.use('/api/expenses',   require('./routes/expenses'));
app.use('/api/stock',      require('./routes/stock'));
app.use('/api/sales',      require('./routes/sales'));
app.use('/api/sync',       require('./routes/sync'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// SPA fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '../../index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 FishStock backend on http://localhost:${PORT}`);
  console.log(`🌐 LAN access: http://<your-ip>:${PORT}`);
});
