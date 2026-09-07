# 📸 Fotografer Studio App

Aplikasi manajemen sesi foto untuk fotografer profesional. Dibangun dengan **React.js** (Vite) + **Express.js**.

## Fitur

### Dashboard Admin (Fotografer)
- 🔐 Login dengan password
- 📝 Form buat sesi klien baru (nama, link Drive, WA, batas foto, deadline)
- 📱 Kirim link galeri otomatis via WhatsApp
- 📊 Statistik sesi (total, selesai, aktif, expired)
- 📋 Tabel semua sesi dengan status real-time
- 👁️ Lihat foto yang dipilih klien (klik baris)
- 🔄 Kirim ulang link WhatsApp kapan saja

### Halaman Klien
- 🖼️ Galeri foto masonry dari Google Drive
- ✅ Pilih foto dengan batas jumlah
- ⏳ Countdown timer batas waktu
- 💾 Auto-save pilihan secara berkala
- ✔️ Konfirmasi pilihan dengan modal
- 📱 Responsive untuk mobile

---

## Cara Menjalankan

### 1. Jalankan Backend (Express.js)

```bash
cd server
npm install
node index.js
# Server berjalan di http://localhost:3001
```

### 2. Jalankan Frontend (React + Vite)

```bash
cd client
npm install
npm run dev
# App berjalan di http://localhost:5173
```

### 3. Buka di Browser

- **Admin Dashboard**: http://localhost:5173/login
  - Password default: `fotografer123`
- **Halaman Klien**: http://localhost:5173/session/:id

---

## Konfigurasi

### Password Admin
Edit file `server/.env`:
```
ADMIN_PASSWORD=password_baru_anda
PORT=3001
```

### Google Drive API Key
Buka `client/src/pages/ClientGallery.jsx` dan ganti:
```js
const apiKey = 'YOUR_GOOGLE_API_KEY_HERE'
```

Cara mendapatkan API Key:
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Aktifkan **Google Drive API**
3. Buat **Credentials → API Key**
4. Batasi key ke Google Drive API

---

## Alur Kerja

```
1. Admin login ke dashboard
2. Isi form: nama klien, link folder Drive, nomor WA, batas foto, deadline
3. Klik "Buat Sesi & Kirim WhatsApp"
4. Link galeri dibuat → WhatsApp terbuka dengan pesan otomatis
5. Klien klik link → buka galeri foto dari Drive
6. Klien pilih foto (maks sesuai batas)
7. Klik "Selesai Memilih" → konfirmasi → tersimpan
8. Admin lihat pilihan klien di dashboard (klik baris tabel)
```

---

## Struktur Proyek

```
fotografer_save/
├── client/               # Frontend React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── ClientGallery.jsx
│   │   ├── components/
│   │   │   └── Toast.jsx
│   │   ├── api/index.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/               # Backend Express.js
│   ├── routes/
│   │   └── sessions.js
│   ├── data/
│   │   └── sessions.json  ← Database (JSON)
│   ├── index.js
│   ├── .env
│   └── package.json
│
└── README.md
```

---

## Tech Stack

| Layer    | Tech               |
|----------|--------------------|
| Frontend | React 18 + Vite    |
| Router   | React Router v6    |
| HTTP     | Axios              |
| Backend  | Express.js 4       |
| Storage  | JSON file          |
| Photos   | Google Drive API   |
| WA       | wa.me deep-link    |
# Pilih_Foto_Khansa_Project
