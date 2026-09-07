/* ═══════════════════════════════════════════════════════════════
   LIB/SUPABASE.JS — Singleton Supabase Client
   Dipakai di semua route agar tidak membuat koneksi baru tiap request
═══════════════════════════════════════════════════════════════ */

const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
  console.error('❌ SUPABASE_URL dan SUPABASE_KEY harus diisi di file .env');
  process.exit(1);
}

const supabase = createClient(url, key);

module.exports = supabase;
