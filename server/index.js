/* ═══════════════════════════════════════════════════════════════
   SERVER — Express.js API untuk Aplikasi Fotografer
   Port: 3001
═══════════════════════════════════════════════════════════════ */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const sessionsRouter = require('./routes/sessions');
const driveRouter    = require('./routes/drive');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/sessions', sessionsRouter);
app.use('/api/drive', driveRouter);

// ── Auth ───────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const correct = process.env.ADMIN_PASSWORD || 'fotografer123';
  if (password === correct) {
    res.json({ success: true, token: Buffer.from(`admin:${Date.now()}`).toString('base64') });
  } else {
    res.status(401).json({ success: false, message: 'Password salah' });
  }
});

app.post('/api/auth/verify', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (token && token.length > 10) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

// ── Health check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📋 API tersedia di http://localhost:${PORT}/api`);
  console.log(`🔑 Password admin: ${process.env.ADMIN_PASSWORD || 'fotografer123'}\n`);
});
