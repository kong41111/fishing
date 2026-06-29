// FishStock — Express + MySQL backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // big to fit base64 images
app.use(express.urlencoded({ extended: true }));

// Serve frontend (index.html, etc.) from parent dir
app.use(express.static(path.join(__dirname, '../../')));

// API health check
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Routes
app.use('/api', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
// TODO: เพิ่ม /api/sales, /api/customers, /api/suppliers, /api/expenses, /api/stock, /api/categories ...

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 FishStock backend on http://localhost:${PORT}`);
  console.log(`🌐 LAN access: http://<your-ip>:${PORT}`);
});
