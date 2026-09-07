/* ═══════════════════════════════════════════════════════════════
   ROUTES/DRIVE.JS — Proxy gambar Google Drive
   Menghindari CORS & redirect issues
═══════════════════════════════════════════════════════════════ */

const express = require('express');
const router  = express.Router();

// ── Proxy thumbnail ──────────────────────────────────────────
// GET /api/drive/thumb/:fileId?w=400
router.get('/thumb/:fileId', async (req, res) => {
  const { fileId } = req.params;
  const w = parseInt(req.query.w) || 400;

  // Validasi fileId
  if (!/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) {
    return res.status(400).json({ error: 'Invalid file ID' });
  }

  const url = `https://lh3.googleusercontent.com/d/${fileId}=w${w}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).send('Image not found');
    }

    // Forward content-type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 1 hari
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Stream image ke client
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    console.error('[drive-proxy] Error:', err.message);
    res.status(502).send('Failed to fetch image');
  }
});

module.exports = router;
