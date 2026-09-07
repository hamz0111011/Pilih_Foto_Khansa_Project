/* ═══════════════════════════════════════════════════════════
   APP.JS — Album Foto dari Google Drive
   Fitur: Masonry gallery, lightbox, dark/light mode, QR,
          swipe gesture, pinch-zoom, lazy load
═══════════════════════════════════════════════════════════ */

'use strict';

// ── State ──────────────────────────────────────────────────
let PHOTOS      = [];      // semua foto [{id, name, folderKey, folderLabel, ...}]
let FOLDERS_CFG = [];      // daftar folder yang dipakai [{id, label, asCover}]
let DISPLAY     = [];      // foto yang sedang tampil (tab aktif)
let TAB         = 'all';   // tab aktif: 'all' | folderKey (= folder index string)
let LB_IDX      = 0;       // index lightbox
let LB_OPEN     = false;
let PAGE        = 0;       // halaman load-more
const PAGE_SIZE = 30;      // foto per page
let ACTIVE_FOLDER_ID = ''; // folder ID yang aktif (untuk tombol download)

// ── Helpers ─────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const esc = s  => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function showToast(msg, ms) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), ms || 2600);
}

function showErr(title, sub) {
  $('boot').classList.add('off');
  $('errScreen').classList.add('on');
  $('errTitle').textContent  = title || 'Gagal Memuat';
  $('errSub').textContent    = sub   || '';
}

function formatTanggal(d) {
  try {
    return new Date(d).toLocaleDateString('id-ID', {
      day:'numeric', month:'long', year:'numeric'
    });
  } catch(e) { return String(d); }
}

// ── Google Drive API URL helpers ────────────────────────────
// Thumbnail langsung dari Drive (tidak perlu download file)
function thumbUrl(fileId, size) {
  size = size || 400;
  return `https://lh3.googleusercontent.com/d/${fileId}=w${size}`;
}
// URL tampil besar di lightbox
function bigUrl(fileId) {
  return `https://lh3.googleusercontent.com/d/${fileId}=w1600`;
}
// URL download
function dlUrl(fileId, name) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
// URL buka Drive folder
function folderUrl(folderId) {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

// ── Fetch dari Google Drive API ─────────────────────────────
async function fetchDrivePhotos(folderId, apiKey, pageToken) {
  const q     = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`);
  const fields = encodeURIComponent('nextPageToken,files(id,name,mimeType,imageMediaMetadata,size)');
  let url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=200&orderBy=name&key=${apiKey}`;
  if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  return await res.json();
}

async function loadAllPhotos(folderId, apiKey) {
  let all = [], token = null;
  do {
    const data = await fetchDrivePhotos(folderId, apiKey, token);
    if (data.files) all = all.concat(data.files);
    token = data.nextPageToken || null;
  } while (token);
  return all;
}

// ── Normalisasi config folder ─────────────────────────────
// Mendukung dua format:
//   1. CONFIG.FOLDERS = [{id, label, asCover}, ...]  ← multi folder (baru)
//   2. CONFIG.FOLDER_ID = '...'                       ← single folder (lama)
function normalizeFolders() {
  if (Array.isArray(CONFIG.FOLDERS) && CONFIG.FOLDERS.length) {
    return CONFIG.FOLDERS.map((f, i) => ({
      id:      f.id     || '',
      label:   f.label  || `Folder ${i + 1}`,
      asCover: !!f.asCover,
      key:     String(i),   // dipakai sebagai tab id
    }));
  }
  // Fallback ke single folder lama
  const legacyId = CONFIG.FOLDER_ID || '';
  return [{ id: legacyId, label: 'Semua Foto', asCover: true, key: '0' }];
}

// ── Inisialisasi ─────────────────────────────────────────────
async function init() {
  // Terapkan tema default
  document.documentElement.dataset.theme = CONFIG.DEFAULT_THEME || 'dark';
  updateThemeBtn();

  // Set judul halaman
  document.title = (CONFIG.ALBUM_TITLE || 'Album Foto') + ' — Galeri';
  $('bootBrand').textContent = CONFIG.ALBUM_TITLE || 'Album Foto';

  const apiKey = CONFIG.GOOGLE_API_KEY;

  // Cek demo mode
  const isDemo = !apiKey || apiKey.startsWith('ISI_');
  if (isDemo) {
    loadDemoMode();
    return;
  }

  FOLDERS_CFG = normalizeFolders();

  // Cek apakah semua folder masih placeholder
  const allPlaceholder = FOLDERS_CFG.every(f => !f.id || f.id.startsWith('ISI_') || f.id.startsWith('FOLDER_ID'));
  if (allPlaceholder) {
    loadDemoMode();
    return;
  }

  // Fetch semua folder secara paralel
  const validFolders = FOLDERS_CFG.filter(f => f.id && !f.id.startsWith('ISI_') && !f.id.startsWith('FOLDER_ID'));
  $('bootSub').textContent = `Mengambil foto dari ${validFolders.length} folder…`;

  try {
    const results = await Promise.allSettled(
      validFolders.map(folder => loadAllPhotos(folder.id, apiKey))
    );

    PHOTOS = [];
    results.forEach((result, i) => {
      const folder = validFolders[i];
      if (result.status === 'fulfilled') {
        const files = result.value;
        files.forEach(f => {
          PHOTOS.push({
            id:          f.id,
            name:        f.name,
            mime:        f.mimeType,
            ratio:       null,
            w:           f.imageMediaMetadata?.width  || 0,
            h:           f.imageMediaMetadata?.height || 0,
            folderKey:   folder.key,
            folderLabel: folder.label,
            folderId:    folder.id,
          });
        });
      } else {
        console.warn(`[galeri] Folder "${folder.label}" gagal:`, result.reason?.message);
      }
    });

    // Hitung rasio dari metadata jika tersedia
    PHOTOS.forEach(p => {
      if (p.w && p.h) p.ratio = p.w / p.h;
    });

    if (!PHOTOS.length) {
      showErr(
        'Semua Folder Kosong',
        'Tidak ada foto yang berhasil dimuat. Pastikan setiap folder Google Drive sudah diset ke "Anyone with the link" dan berisi foto.'
      );
      return;
    }

    // Set default active folder untuk download
    ACTIVE_FOLDER_ID = validFolders.find(f => f.asCover)?.id || validFolders[0]?.id || '';

    render();

  } catch(e) {
    console.error('[galeri] Error:', e);
    showErr(
      'Gagal Mengambil Foto',
      e.message.includes('API key') || e.message.includes('403')
        ? 'API Key tidak valid atau Google Drive API belum diaktifkan. Periksa file config.js.'
        : 'Periksa koneksi internet dan konfigurasi di config.js. Error: ' + e.message
    );
  }
}

// ── Demo Mode ─────────────────────────────────────────────────
function loadDemoMode() {
  // Buat foto palsu untuk demo tampilan
  const demoAspects = [
    0.75, 1.33, 0.8, 1.0, 0.67, 1.5, 0.9, 1.25,
    0.75, 1.0,  0.8, 1.6, 0.7,  1.2, 1.0, 0.75,
    1.4,  0.8,  1.0, 0.9, 1.3,  0.7, 1.1, 0.75,
  ];
  PHOTOS = demoAspects.map((r, i) => ({
    id:    `demo_${i}`,
    name:  `Foto ${i+1}`,
    mime:  'image/jpeg',
    ratio: r,
    demo:  true,
    color: demoColors[i % demoColors.length],
  }));

  render();
}

const demoColors = [
  '#3d2b1f','#1f2d3d','#2b1f3d','#1f3d2b',
  '#3d1f2b','#2b3d1f','#3d3d1f','#1f3d3d',
  '#302010','#102030','#201030','#103020',
];

// ── Render halaman utama ──────────────────────────────────────
function render() {
  // Isi cover & title
  const title     = CONFIG.ALBUM_TITLE    || 'Album Foto';
  const subtitle  = CONFIG.ALBUM_SUBTITLE || '';
  const dateStr   = CONFIG.ALBUM_DATE     ? formatTanggal(CONFIG.ALBUM_DATE) : '';
  const metaParts = [subtitle, dateStr].filter(Boolean).join('  ·  ');
  const photo     = CONFIG.PHOTOGRAPHER   || '';

  // Title
  $('pageTitle').textContent  = title + ' — Galeri';
  $('pageMeta').setAttribute('content', 'Album foto ' + title);

  // Cover — pakai foto pertama dari folder ber-asCover, atau foto pertama global
  if (PHOTOS.length && !PHOTOS[0].demo) {
    const coverFolder = FOLDERS_CFG.find(f => f.asCover);
    const coverPhoto  = coverFolder
      ? PHOTOS.find(p => p.folderKey === coverFolder.key) || PHOTOS[0]
      : PHOTOS[0];
    const covImg = $('coverImg');
    covImg.src = bigUrl(coverPhoto.id);
    covImg.alt = title;
    covImg.onerror = () => {
      $('cover').style.background = 'var(--surface2)';
    };
  } else if (PHOTOS[0]?.demo) {
    $('coverImg').style.display = 'none';
    $('coverBg').style.background = 'linear-gradient(135deg, #1a1208, #0d1a1f, #1a0d1a)';
  }

  // Cover text
  if (subtitle || photo) $('coverEyebrow').textContent = subtitle || photo;
  $('coverName').textContent = title;
  if (metaParts)            $('coverMeta').textContent = metaParts;

  // Title page
  if (photo) $('tpEyebrow').textContent = photo;
  $('tpName').textContent = title;
  if (metaParts) $('tpMeta').textContent = metaParts;
  if (CONFIG.ALBUM_STORY) $('tpStory').textContent = CONFIG.ALBUM_STORY;

  // Nav brand
  $('navBrand').textContent = title;

  // Footer
  $('footBrand').textContent = photo || title;

  // Tabs
  buildTabs();

  // Gallery stats
  updateStats();

  // Galeri
  TAB = 'all';
  DISPLAY = [...PHOTOS];
  PAGE = 0;
  renderGallery(true);

  // Selesai loading
  $('boot').classList.add('off');
  $('app').style.display = '';

  // Demo notice
  if (PHOTOS[0]?.demo) {
    renderDemoNotice();
  }

  // Event listeners
  setupEvents();
}

function buildTabs() {
  const nav   = $('navTabs');
  // Folder unik yang punya foto
  const usedKeys = [...new Set(PHOTOS.map(p => p.folderKey).filter(Boolean))];
  const folderTabs = FOLDERS_CFG
    .filter(f => usedKeys.includes(f.key))
    .map(f => ({
      id:    f.key,
      label: f.label,
      n:     PHOTOS.filter(p => p.folderKey === f.key).length,
    }));

  // Tampilkan tab "Semua Foto" hanya kalau ada lebih dari 1 folder aktif
  const tabs = [];
  if (folderTabs.length > 1) {
    tabs.push({ id: 'all', label: 'Semua Foto', n: PHOTOS.length });
  }
  tabs.push(...folderTabs);

  // Default tab — kalau hanya 1 folder, langsung ke folder itu
  TAB = tabs[0]?.id || 'all';

  nav.innerHTML = tabs.map(t =>
    `<button class="nav-tab${t.id === TAB ? ' on' : ''}" data-tab="${esc(t.id)}">
       ${esc(t.label)}<span class="badge">${t.n}</span>
     </button>`
  ).join('');
  nav.querySelectorAll('.nav-tab').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });
}

function switchTab(tabId) {
  TAB = tabId;
  document.querySelectorAll('.nav-tab').forEach(b => {
    b.classList.toggle('on', b.dataset.tab === tabId);
  });
  if (tabId === 'all') {
    DISPLAY = [...PHOTOS];
    // Download: pakai folder asCover atau folder pertama
    ACTIVE_FOLDER_ID = FOLDERS_CFG.find(f => f.asCover)?.id || FOLDERS_CFG[0]?.id || '';
  } else {
    DISPLAY = PHOTOS.filter(p => p.folderKey === tabId);
    // Download: pakai folder yang sedang aktif di tab
    const fCfg = FOLDERS_CFG.find(f => f.key === tabId);
    ACTIVE_FOLDER_ID = fCfg?.id || '';
  }
  PAGE = 0;
  renderGallery(true);
  updateStats();
}

function updateStats() {
  const s = $('galleryStats');
  if (!s) return;
  const n = DISPLAY.length || PHOTOS.length;
  s.innerHTML = `<span class="gs-count"><strong>${n}</strong> foto</span>`;
}

// ── Masonry Render ────────────────────────────────────────────
function colCount() {
  const w = window.innerWidth;
  if (w >= 1200) return CONFIG.COLS_DESKTOP || 3;
  if (w >=  768) return Math.max(2, (CONFIG.COLS_DESKTOP||3) - 1);
  return CONFIG.COLS_MOBILE || 2;
}

function renderGallery(reset) {
  const masonry = $('masonry');
  if (reset) { masonry.innerHTML = ''; }

  const cols    = colCount();
  const heights = new Array(cols).fill(0);
  let colEls    = [];

  // Cek apakah kolom sudah ada (tidak reset)
  if (!reset && masonry.children.length === cols) {
    colEls   = Array.from(masonry.children);
    // heights perlu kita estimasi — skip untuk kesederhanaan, rebuild saja
    masonry.innerHTML = '';
  }

  // Buat kolom baru
  for (let i = 0; i < cols; i++) {
    const col = document.createElement('div');
    col.className = 'mcol';
    masonry.appendChild(col);
    colEls.push(col);
  }
  heights.fill(0);

  // Semua foto sampai halaman sekarang
  const end    = Math.min((PAGE + 1) * PAGE_SIZE, DISPLAY.length);
  const toShow = DISPLAY.slice(0, end);

  toShow.forEach((photo, globalIdx) => {
    // Pilih kolom terpendek
    const minH   = Math.min(...heights);
    const colIdx = heights.indexOf(minH);

    const card = makeCard(photo, globalIdx);
    colEls[colIdx].appendChild(card);

    // Estimasi tinggi untuk balance kolom
    const ratio = photo.ratio || 1;
    heights[colIdx] += 1 / ratio;  // proporsi: potret = 1.33, landscape = 0.75

    // Trigger entrance animation
    requestAnimationFrame(() => {
      setTimeout(() => card.classList.add('in'), globalIdx * 35);
    });
  });

  // Load-more button
  const wrap = $('loadMoreWrap');
  if (DISPLAY.length > end) {
    wrap.style.display = '';
  } else {
    wrap.style.display = 'none';
  }
}

function loadMore() {
  PAGE++;
  renderGallery(false);
}

function makeCard(photo, idx) {
  const wrapper = document.createElement('div');
  wrapper.className = 'shot';
  wrapper.dataset.idx = idx;
  wrapper.setAttribute('role', 'button');
  wrapper.setAttribute('aria-label', `Buka foto ${photo.name || (idx+1)}`);
  wrapper.tabIndex = 0;

  // Tentukan rasio aspek
  const ratio  = photo.ratio || 1;
  const padPct = Math.round((1 / ratio) * 100);

  // Inner container untuk aspect ratio trick
  const inner = document.createElement('div');
  inner.className = 'shot-inner';
  inner.style.paddingBottom = padPct + '%';

  // Gambar
  if (photo.demo) {
    // Demo placeholder
    const div = document.createElement('div');
    div.style.cssText = `
      position:absolute;inset:0;
      background:${photo.color};
      display:flex;align-items:center;justify-content:center;
    `;
    div.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>`;
    inner.appendChild(div);
  } else {
    const img = document.createElement('img');
    img.className = 'placeholder';
    img.alt  = photo.name || `Foto ${idx+1}`;
    img.loading = 'lazy';
    img.decoding = 'async';

    // Pakai IntersectionObserver untuk lazy load
    img.dataset.src = thumbUrl(photo.id, colCount() > 2 ? 600 : 400);

    img.onload  = () => {
      img.classList.remove('placeholder');
      // Perbarui rasio dari dimensi natural
      if (img.naturalWidth && img.naturalHeight) {
        photo.ratio = img.naturalWidth / img.naturalHeight;
      }
    };
    img.onerror = () => {
      img.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23211f1c'/><text x='50%' y='50%' text-anchor='middle' dy='.3em' fill='%23555' font-size='12' font-family='sans-serif'>Gambar tidak tersedia</text></svg>`;
    };

    inner.appendChild(img);
    lazyObserver.observe(img);
  }

  // Overlay hover
  const overlay = document.createElement('div');
  overlay.className = 'shot-overlay';
  overlay.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
  </svg>`;
  inner.appendChild(overlay);

  wrapper.appendChild(inner);

  // Click handler
  wrapper.onclick = () => openLightbox(idx);
  wrapper.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') openLightbox(idx); };

  return wrapper;
}

// ── Lazy load observer ────────────────────────────────────────
const lazyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
        lazyObserver.unobserve(img);
      }
    }
  });
}, { rootMargin: '200px' });

// ── Lightbox ───────────────────────────────────────────────────
function openLightbox(idx) {
  if (!CONFIG.ENABLE_FULLSCREEN) return;
  LB_IDX  = idx;
  LB_OPEN = true;
  const lb = $('lb');
  lb.classList.add('on');
  document.body.style.overflow = 'hidden';
  loadLbPhoto(idx);
  buildFilmstrip();
  setupLbEvents();
}

function lbClose() {
  LB_OPEN = false;
  $('lb').classList.remove('on', 'calm');
  document.body.style.overflow = '';
  removeLbEvents();
}

function loadLbPhoto(idx) {
  const photo = DISPLAY[idx];
  if (!photo) return;

  const img = $('lbImg');
  img.classList.add('loading');

  if (photo.demo) {
    img.src = '';
    img.style.background = photo.color;
    img.style.width  = '60vw';
    img.style.height = '60vh';
    img.classList.remove('loading');
  } else {
    img.style.background = '';
    img.style.width  = '';
    img.style.height = '';
    const url = bigUrl(photo.id);
    img.onload  = () => img.classList.remove('loading');
    img.onerror = () => img.classList.remove('loading');
    img.src = url;
  }

  // Update counter
  $('lbCount').textContent = `${idx + 1} / ${DISPLAY.length}`;
  $('lbCaption').textContent = photo.name || '';

  // Prev / next buttons
  $('lbPrev').disabled = idx === 0;
  $('lbNext').disabled = idx === DISPLAY.length - 1;

  // Update filmstrip
  updateFilmstrip(idx);

  // Download btn
  $('lbDl').onclick = () => {
    if (photo.demo) { showToast('Demo mode — tidak ada foto asli'); return; }
    const a = document.createElement('a');
    a.href     = dlUrl(photo.id, photo.name);
    a.download = photo.name || 'foto.jpg';
    a.target   = '_blank';
    a.click();
  };
}

function lbGo(delta) {
  const next = LB_IDX + delta;
  if (next < 0 || next >= DISPLAY.length) return;
  LB_IDX = next;
  loadLbPhoto(LB_IDX);
}

// Filmstrip
function buildFilmstrip() {
  const film = $('lbFilm');
  film.innerHTML = '';
  const max = Math.min(DISPLAY.length, 20);  // maks 20 thumb di filmstrip
  for (let i = 0; i < max; i++) {
    const p = DISPLAY[i];
    const div = document.createElement('div');
    div.className = 'lb-thumb';
    div.dataset.i = i;
    if (p.demo) {
      div.style.background = p.color;
    } else {
      const img = document.createElement('img');
      img.src = thumbUrl(p.id, 80);
      img.alt = '';
      div.appendChild(img);
    }
    div.onclick = () => { LB_IDX = i; loadLbPhoto(i); };
    film.appendChild(div);
  }
  updateFilmstrip(LB_IDX);
}

function updateFilmstrip(idx) {
  document.querySelectorAll('.lb-thumb').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.i) === idx);
  });
}

// ── Lightbox events (keyboard, swipe, pinch) ─────────────────
let lbTouchStartX = 0, lbTouchStartY = 0;
let lbPinchDist   = 0;
let lbCalm        = null;

function lbResetCalm() {
  const lb = $('lb');
  lb.classList.remove('calm');
  clearTimeout(lbCalm);
  lbCalm = setTimeout(() => lb.classList.add('calm'), 3000);
}

function setupLbEvents() {
  document.addEventListener('keydown', lbKeyHandler);
  const stage = $('lbStage');
  stage.addEventListener('touchstart', lbTouchStart, {passive:true});
  stage.addEventListener('touchend',   lbTouchEnd,   {passive:true});
  stage.addEventListener('click',      lbClickHandler);
  $('lb').addEventListener('mousemove', lbResetCalm);
  lbResetCalm();
}
function removeLbEvents() {
  document.removeEventListener('keydown', lbKeyHandler);
  clearTimeout(lbCalm);
}

function lbKeyHandler(e) {
  if (!LB_OPEN) return;
  if (e.key === 'ArrowLeft')  lbGo(-1);
  if (e.key === 'ArrowRight') lbGo(+1);
  if (e.key === 'Escape')     lbClose();
  lbResetCalm();
}

function lbClickHandler(e) {
  // Klik di tengah = toggle calm
  lbResetCalm();
}

function lbTouchStart(e) {
  if (e.touches.length === 1) {
    lbTouchStartX = e.touches[0].clientX;
    lbTouchStartY = e.touches[0].clientY;
  }
}
function lbTouchEnd(e) {
  if (e.changedTouches.length === 1) {
    const dx = e.changedTouches[0].clientX - lbTouchStartX;
    const dy = e.changedTouches[0].clientY - lbTouchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      lbGo(dx < 0 ? 1 : -1);
    } else if (dy > 80) {
      lbClose();
    }
    lbResetCalm();
  }
}

function lbShareFn() {
  if (!LB_OPEN) return;
  const photo = DISPLAY[LB_IDX];
  if (!photo || photo.demo) { showToast('Demo mode — tidak ada URL foto'); return; }
  const url = `https://drive.google.com/file/d/${photo.id}/view`;
  if (navigator.share) {
    navigator.share({ title: photo.name, url }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url).then(() => showToast('Link foto disalin!'));
  }
}

// ── Theme Toggle ──────────────────────────────────────────────
function toggleTheme() {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  updateThemeBtn();
}

function updateThemeBtn() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  $('themeBtn').title = isDark ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode';
}

// ── Share ─────────────────────────────────────────────────────
function shareAlbum() {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({
      title: CONFIG.ALBUM_TITLE || 'Album Foto',
      text:  'Lihat album foto ini!',
      url,
    }).catch(() => {});
  } else {
    copyLink();
  }
}

function copyLink() {
  const url = window.location.href;
  navigator.clipboard?.writeText(url)
    .then(() => showToast('🔗 Link disalin ke clipboard!'))
    .catch(() => showToast('Salin manual: ' + url));
  closeMenu();
}

// ── Download Album ─────────────────────────────────────────────
function downloadAlbum() {
  if (PHOTOS[0]?.demo) {
    showToast('Demo mode — isi config.js dengan Folder ID Google Drive Anda');
    closeMenu();
    return;
  }
  // Buka folder aktif di tab sekarang
  const targetId = ACTIVE_FOLDER_ID || FOLDERS_CFG[0]?.id || '';
  if (!targetId) { showToast('Folder ID tidak ditemukan'); closeMenu(); return; }
  window.open(folderUrl(targetId), '_blank');
  closeMenu();
}

// ── Dropdown menu ─────────────────────────────────────────────
function toggleMenu(e) {
  e.stopPropagation();
  $('dropMenu').classList.toggle('open');
}
function closeMenu() {
  $('dropMenu').classList.remove('open');
}
document.addEventListener('click', (e) => {
  if (!$('moreBtn').contains(e.target)) closeMenu();
});

// ── QR Code ───────────────────────────────────────────────────
function showQR() {
  closeMenu();
  openModal('qrModal');
  const canvas = $('qrCanvas');
  canvas.width  = 220;
  canvas.height = 220;

  try {
    const qr = new QRCode(canvas, {
      text:         window.location.href,
      width:        220,
      height:       220,
      colorDark:    '#000000',
      colorLight:   '#ffffff',
      correctLevel: QRCode.CorrectLevel?.H || 2,
    });
  } catch(e) {
    // Fallback manual
    canvas.getContext('2d').fillStyle = '#fff';
    canvas.getContext('2d').fillRect(0,0,220,220);
    console.warn('QR fallback:', e);
  }
}

function downloadQR() {
  const canvas = $('qrCanvas');
  const link   = document.createElement('a');
  link.download = 'qr-album.png';
  link.href     = canvas.toDataURL('image/png');
  link.click();
  showToast('QR Code diunduh!');
}

// ── Modal ─────────────────────────────────────────────────────
function openModal(id)  { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

// ── Scroll effects ────────────────────────────────────────────
function setupScrollEffects() {
  const nav  = $('nav');
  const bar  = $('scrollBar');
  const cue  = $('coverCue');

  window.addEventListener('scroll', () => {
    const y    = window.scrollY;
    const maxY = document.body.scrollHeight - window.innerHeight;

    // Nav shadow
    nav.classList.toggle('scrolled', y > 60);

    // Cover scroll progress bar
    const coverH = $('cover').offsetHeight;
    if (y <= coverH) {
      bar.style.width = ((y / coverH) * 100) + '%';
      cue.style.opacity = Math.max(0, 1 - y / 200);
    }
  }, { passive: true });

  // Cover cue click — scroll ke galeri
  $('coverCue').onclick = () => {
    $('nav').scrollIntoView({ behavior: 'smooth' });
  };
}

// ── Demo notice ───────────────────────────────────────────────
function renderDemoNotice() {
  const notice = document.createElement('div');
  notice.className = 'config-notice';
  notice.innerHTML = `
    <h3>📷 Mode Demo — Isi konfigurasi untuk memuat foto asli</h3>
    <p>Buka file <code>config.js</code> dan isi:</p>
    <p>
      • <code>GOOGLE_API_KEY</code> — API Key dari <a href="https://console.cloud.google.com/" target="_blank" style="color:#f0c060">Google Cloud Console</a><br>
      • <code>FOLDER_ID</code> — ID Folder Google Drive yang berisi foto<br>
      • <code>ALBUM_TITLE</code>, <code>ALBUM_SUBTITLE</code>, dll — info album
    </p>
    <p>Pastikan folder Google Drive dibagikan ke <strong>"Anyone with the link"</strong> sebagai Viewer, dan <strong>Google Drive API</strong> sudah diaktifkan di project Google Cloud Anda.</p>
  `;
  // Sisipkan sebelum gallery
  $('gallery').insertAdjacentElement('beforebegin', notice);
}

// ── Setup semua event listener ────────────────────────────────
function setupEvents() {
  $('themeBtn').onclick = toggleTheme;
  $('shareBtn').onclick = shareAlbum;
  $('lbPrev').onclick   = () => lbGo(-1);
  $('lbNext').onclick   = () => lbGo(+1);
  setupScrollEffects();

  // Resize: rebuild masonry
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      PAGE = 0;
      renderGallery(true);
    }, 300);
  });
}

// ── Start ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
