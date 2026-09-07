import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
function extractFolderId(link) {
  if (!link) return null
  const m1 = link.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  if (m1) return m1[1]
  const m2 = link.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (m2) return m2[1]
  if (/^[a-zA-Z0-9_-]{20,}$/.test(link)) return link
  return null
}
// Pakai proxy Express agar tidak ada CORS/redirect issue
function thumbUrl(id, w = 400) { return `/api/drive/thumb/${id}?w=${w}` }
function bigUrl(id)             { return `/api/drive/thumb/${id}?w=1600` }

/* ══════════════════════════════════════════════════════════════
   COUNTDOWN
══════════════════════════════════════════════════════════════ */
function Countdown({ deadline }) {
  const [left, setLeft] = useState(0)
  useEffect(() => {
    const calc = () => setLeft(Math.max(0, new Date(deadline) - new Date()))
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [deadline])

  if (left <= 0) return (
    <div style={{ textAlign: 'center', color: 'var(--red)', fontWeight: 600 }}>
      ⚠️ Batas waktu sudah habis
    </div>
  )

  const s    = Math.floor(left / 1000)
  const days = Math.floor(s / 86400)
  const hrs  = Math.floor((s % 86400) / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60
  const pad  = n => String(n).padStart(2, '0')
  const urgent = left < 3600000

  return (
    <div className="countdown">
      {days > 0 && <><div className="cd-block"><div className="cd-num" style={urgent?{color:'var(--red)'}:{}}>{pad(days)}</div><div className="cd-label">Hari</div></div><div className="cd-sep">:</div></>}
      <div className="cd-block"><div className="cd-num" style={urgent?{color:'var(--red)'}:{}}>{pad(hrs)}</div><div className="cd-label">Jam</div></div>
      <div className="cd-sep">:</div>
      <div className="cd-block"><div className="cd-num" style={urgent?{color:'var(--red)'}:{}}>{pad(mins)}</div><div className="cd-label">Menit</div></div>
      <div className="cd-sep">:</div>
      <div className="cd-block"><div className="cd-num" style={urgent?{color:'var(--red)'}:{}}>{pad(secs)}</div><div className="cd-label">Detik</div></div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   LIGHTBOX (ZOOM FULLSCREEN)
══════════════════════════════════════════════════════════════ */
function Lightbox({ photos, startIdx, selected, onToggle, onClose, disabled }) {
  const [idx,     setIdx]     = useState(startIdx)
  const [imgKey,  setImgKey]  = useState(0)
  const [loading, setLoading] = useState(true)
  const [scale,   setScale]   = useState(1)
  const [calm,    setCalm]    = useState(false)
  const calmTimer = useRef()
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const photo = photos[idx]
  const isSelected = selected.some(s => s.id === photo?.id)

  function resetCalm() {
    setCalm(false)
    clearTimeout(calmTimer.current)
    calmTimer.current = setTimeout(() => setCalm(true), 3000)
  }

  useEffect(() => { resetCalm(); return () => clearTimeout(calmTimer.current) }, [])

  useEffect(() => {
    setLoading(true)
    setScale(1)
    setImgKey(k => k + 1)
    resetCalm()
  }, [idx])

  // Keyboard nav
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft')  go(-1)
      if (e.key === 'Escape')     onClose()
      resetCalm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function go(delta) {
    const next = idx + delta
    if (next >= 0 && next < photos.length) setIdx(next)
  }

  // Touch swipe
  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
    if (dy > 80) onClose()
    resetCalm()
  }

  if (!photo) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.97)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseMove={resetCalm}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
        zIndex: 10,
        transition: 'opacity 0.4s',
        opacity: calm ? 0 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
            {idx + 1} / {photos.length}
          </span>
          {photo.starred && (
            <span style={{
              background: 'var(--gold-bg)', color: 'var(--gold)',
              fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99,
              border: '1px solid rgba(232,200,122,0.3)',
            }}>⭐ Highlight</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Zoom toggle */}
          <button
            onClick={() => setScale(s => s === 1 ? 2 : 1)}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, width: 36, height: 36, display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white',
            }}
            title={scale === 1 ? 'Zoom In' : 'Zoom Out'}
          >
            {scale === 1
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            }
          </button>
          {/* Select toggle */}
          {!disabled && (
            <button
              onClick={() => onToggle(photo)}
              style={{
                background: isSelected ? 'rgba(232,200,122,0.2)' : 'rgba(255,255,255,0.1)',
                border: `1px solid ${isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: 8, padding: '0 14px', height: 36, cursor: 'pointer',
                color: isSelected ? 'var(--gold)' : 'white',
                fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {isSelected
                ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Terpilih</>
                : <>+ Pilih Foto</>
              }
            </button>
          )}
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, width: 36, height: 36, display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Image */}
      <div
        style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh', cursor: scale === 1 ? 'zoom-in' : 'zoom-out' }}
        onClick={() => setScale(s => s === 1 ? 2 : 1)}
      >
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div className="spinner" />
          </div>
        )}
        <img
          key={imgKey}
          src={bigUrl(photo.id)}
          alt={photo.name}
          onLoad={() => setLoading(false)}
          style={{
            maxWidth: '90vw', maxHeight: '85vh',
            objectFit: 'contain',
            transform: `scale(${scale})`,
            transition: 'transform 0.3s ease, opacity 0.3s',
            opacity: loading ? 0 : 1,
            display: 'block',
            borderRadius: 8,
            userSelect: 'none',
          }}
        />
        {/* Selected badge */}
        {isSelected && (
          <div style={{
            position: 'absolute', bottom: 12, right: 12,
            background: 'var(--gold)', color: '#0a0a0f',
            borderRadius: 99, padding: '4px 12px',
            fontSize: '0.75rem', fontWeight: 700,
          }}>✓ Dipilih</div>
        )}
      </div>

      {/* Prev / Next */}
      {idx > 0 && (
        <button
          onClick={e => { e.stopPropagation(); go(-1) }}
          style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12, width: 48, height: 48,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'white', zIndex: 10,
            transition: 'opacity 0.4s', opacity: calm ? 0 : 1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      )}
      {idx < photos.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); go(1) }}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12, width: 48, height: 48,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'white', zIndex: 10,
            transition: 'opacity 0.4s', opacity: calm ? 0 : 1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}

      {/* Bottom filmstrip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '12px 16px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
        display: 'flex', gap: 6, justifyContent: 'center', overflowX: 'auto',
        transition: 'opacity 0.4s', opacity: calm ? 0 : 1,
      }}>
        {photos.slice(Math.max(0, idx - 5), idx + 6).map((p, i) => {
          const realIdx = Math.max(0, idx - 5) + i
          const isSel   = selected.some(s => s.id === p.id)
          return (
            <div
              key={p.id}
              onClick={e => { e.stopPropagation(); setIdx(realIdx) }}
              style={{
                width: 52, height: 52, flexShrink: 0, borderRadius: 6,
                overflow: 'hidden', cursor: 'pointer',
                outline: realIdx === idx ? '2px solid var(--gold)' : isSel ? '2px solid rgba(232,200,122,0.5)' : 'none',
                outlineOffset: realIdx === idx ? 2 : 0,
                opacity: realIdx === idx ? 1 : 0.55,
                transition: 'all 0.2s',
              }}
            >
              <img
                src={thumbUrl(p.id, 100)}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )
        })}
      </div>

      {/* Swipe hint */}
      <div style={{
        position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
        fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)',
        transition: 'opacity 0.4s', opacity: calm ? 0 : 1,
        pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        Geser kiri/kanan untuk pindah • Tap foto untuk zoom
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PHOTO CARD
══════════════════════════════════════════════════════════════ */
function PhotoCard({ photo, isSelected, selectionOrder, onToggle, onZoom, disabled }) {
  const [status, setStatus] = useState('idle')
  const imgRef = useRef()

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && imgRef.current) {
        setStatus('loading')
        imgRef.current.src = thumbUrl(photo.id, 600)
        obs.disconnect()
      }
    }, { rootMargin: '300px' })
    if (imgRef.current) obs.observe(imgRef.current)
    return () => obs.disconnect()
  }, [photo.id])

  return (
    <div
      className={`photo-card${isSelected ? ' selected' : ''}`}
      style={{ cursor: 'pointer' }}
    >
      {/* Skeleton */}
      {status !== 'loaded' && status !== 'error' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #1a1a24, #12121a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: status === 'loading' ? 'pulse 1.5s ease infinite' : 'none',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div style={{
          position: 'absolute', inset: 0, background: '#12121a',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(248,113,113,0.4)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <circle cx="12" cy="16" r="0.5" fill="rgba(248,113,113,0.4)"/>
          </svg>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>Gagal dimuat</span>
        </div>
      )}

      <img
        ref={imgRef}
        alt={photo.name}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        style={{ opacity: status === 'loaded' ? 1 : 0, transition: 'opacity 0.4s' }}
      />

      {/* Highlight badge */}
      {photo.starred && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          borderRadius: 99, padding: '2px 7px',
          fontSize: '0.65rem', color: 'var(--gold)',
        }}>⭐</div>
      )}

      {/* Hover overlay: zoom + select */}
      <div className="photo-overlay" style={{ opacity: undefined }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Zoom */}
          <button
            onClick={e => { e.stopPropagation(); onZoom() }}
            style={{
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white',
            }}
            title="Lihat besar"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
          </button>
          {/* Select */}
          {!disabled && (
            <button
              onClick={e => { e.stopPropagation(); onToggle(photo) }}
              style={{
                background: isSelected ? 'rgba(232,200,122,0.8)' : 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                border: `1px solid ${isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 8, width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                color: isSelected ? '#0a0a0f' : 'white',
              }}
              title={isSelected ? 'Batalkan pilihan' : 'Pilih foto'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Selection number badge */}
      {isSelected && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--gold)', color: '#0a0a0f',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700,
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>
          {selectionOrder}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   TAB BAR
══════════════════════════════════════════════════════════════ */
function TabBar({ active, onChange, total, highlights, selected }) {
  const tabs = [
    { id: 'all',       label: 'Semua',     count: total },
    { id: 'highlight', label: '⭐ Highlight', count: highlights },
    { id: 'selected',  label: 'Terpilih',  count: selected },
  ]
  return (
    <div style={{
      display: 'flex', gap: 4,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: 4,
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1, padding: '8px 12px',
            borderRadius: 6, border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            fontSize: '0.8rem', fontWeight: 500,
            transition: 'all 0.2s',
            background: active === t.id
              ? t.id === 'highlight' ? 'linear-gradient(135deg,rgba(232,200,122,0.2),rgba(232,200,122,0.1))'
                : 'var(--surface2)'
              : 'transparent',
            color: active === t.id
              ? t.id === 'highlight' ? 'var(--gold)' : 'var(--text)'
              : 'var(--text3)',
            borderBottom: active === t.id
              ? `2px solid ${t.id === 'highlight' ? 'var(--gold)' : 'var(--text2)'}` : '2px solid transparent',
          }}
        >
          {t.label}
          <span style={{
            marginLeft: 5, fontSize: '0.7rem',
            color: active === t.id ? 'inherit' : 'var(--text3)',
          }}>
            {t.count}
          </span>
        </button>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   CONFIRM MODAL
══════════════════════════════════════════════════════════════ */
function ConfirmModal({ count, max, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--gold-bg)', border: '1px solid rgba(232,200,122,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 className="modal-title">Konfirmasi Pilihan</h2>
          <p className="modal-sub">
            Anda memilih <strong style={{ color: 'var(--gold)' }}>{count}</strong> dari
            maksimal <strong>{max}</strong> foto.
            Setelah dikonfirmasi, pilihan tidak dapat diubah.
          </p>
        </div>
        <div style={{
          background: 'var(--gold-bg)', border: '1px solid rgba(232,200,122,0.2)',
          borderRadius: 'var(--radius-sm)', padding: '12px 16px',
          fontSize: '0.875rem', color: 'var(--text2)', marginBottom: 20,
        }}>
          ⚠️ Pastikan foto yang dipilih sudah benar karena tidak bisa diulang.
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>Periksa Lagi</button>
          <button className="btn btn-gold" onClick={onConfirm} disabled={loading}>
            {loading ? <><div className="spinner spinner-sm" /> Menyimpan…</> : <>✓ Konfirmasi Pilihan</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   FETCH GOOGLE DRIVE
══════════════════════════════════════════════════════════════ */
async function fetchDrivePhotos(folderId, apiKey, pageToken) {
  // Sertakan field 'starred' untuk fitur Highlight
  const q      = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`)
  const fields = encodeURIComponent('nextPageToken,files(id,name,mimeType,starred,imageMediaMetadata)')
  let url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=200&orderBy=name&key=${apiKey}`
  if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Drive API error: ${res.status}`)
  return res.json()
}

async function loadAllDrivePhotos(folderId, apiKey) {
  let all = [], token = null
  do {
    const data = await fetchDrivePhotos(folderId, apiKey, token)
    if (data.files) all = all.concat(data.files)
    token = data.nextPageToken || null
  } while (token)
  return all
}

/* ══════════════════════════════════════════════════════════════
   CLIENT GALLERY PAGE
══════════════════════════════════════════════════════════════ */
export default function ClientGallery() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session,      setSession]      = useState(null)
  const [photos,       setPhotos]       = useState([])
  const [selected,     setSelected]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [photosLoading, setPhotosLoading] = useState(false)
  const [error,        setError]        = useState(null)
  const [driveError,   setDriveError]   = useState(null)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [submitted,    setSubmitted]    = useState(false)
  const [waUrl,        setWaUrl]        = useState(null)  // WhatsApp URL setelah submit
  const [toast,        setToast]        = useState(null)
  const [activeTab,    setActiveTab]    = useState('all')
  const [lbIdx,        setLbIdx]        = useState(null) // null = closed

  // ── localStorage key untuk backup pilihan foto
  const LS_KEY = `fg_sel_${id}`

  function showToast(msg, type = 'info') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Load photos dari Google Drive
  const loadPhotos = useCallback(async (driveLink) => {
    setPhotosLoading(true)
    setDriveError(null)
    try {
      const folderId = extractFolderId(driveLink)
      if (!folderId) throw new Error('Format link Google Drive tidak dikenali')
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
      if (!apiKey) throw new Error('API Key belum dikonfigurasi. Hubungi fotografer.')
      const files = await loadAllDrivePhotos(folderId, apiKey)
      if (!files.length) {
        setDriveError('Tidak ada foto dalam folder ini. Pastikan folder Drive berisi foto dan diset publik.')
      } else {
        setPhotos(files)
      }
    } catch (err) {
      console.error('[Drive]', err)
      const msg = err.message.includes('403')
        ? 'Akses ditolak. Pastikan folder Google Drive diset "Anyone with the link" → Viewer.'
        : err.message.includes('400')
        ? 'API Key tidak valid. Periksa konfigurasi fotografer.'
        : 'Gagal memuat foto: ' + err.message
      setDriveError(msg)
    } finally {
      setPhotosLoading(false)
    }
  }, [])

  // ── Load session
  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/sessions/${id}`)
        setSession(data)
        setSubmitted(data.submitted)

        if (data.submitted) {
          // Sudah submit — tampilkan dari DB
          if (data.selections?.length) setSelected(data.selections)
        } else {
          // Belum submit — restore dari localStorage jika ada
          const lsSaved = localStorage.getItem(`fg_sel_${id}`)
          if (lsSaved) {
            try { setSelected(JSON.parse(lsSaved)) } catch { /* korup, abaikan */ }
          } else if (data.selections?.length) {
            setSelected(data.selections)
          }
        }

        if (data.driveLink) loadPhotos(data.driveLink)
      } catch (err) {
        setError(err.response?.status === 404
          ? 'Sesi tidak ditemukan. Link mungkin sudah tidak valid.'
          : 'Gagal memuat data. Periksa koneksi internet Anda.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, loadPhotos])

  // ── Simpan pilihan ke localStorage (menggantikan auto-save ke server)
  useEffect(() => {
    if (submitted) return
    if (selected.length > 0) {
      localStorage.setItem(LS_KEY, JSON.stringify(selected))
    } else {
      localStorage.removeItem(LS_KEY)
    }
  }, [selected, submitted, LS_KEY])

  function togglePhoto(photo) {
    const isExpired = session && new Date() > new Date(session.deadline)
    if (submitted || isExpired) return
    const idx = selected.findIndex(s => s.id === photo.id)
    if (idx >= 0) {
      setSelected(p => p.filter(s => s.id !== photo.id))
    } else {
      if (selected.length >= session.maxPhotos) {
        showToast(`Maksimal ${session.maxPhotos} foto yang bisa dipilih`, 'error')
        return
      }
      setSelected(p => [...p, { id: photo.id, name: photo.name }])
    }
  }

  async function handleSubmit() {
    if (!selected.length) { showToast('Pilih minimal 1 foto dulu', 'error'); return }
    setSubmitting(true)
    try {
      const { data } = await api.post(`/sessions/${id}/submit`, { selections: selected })
      setSubmitted(true)
      setShowConfirm(false)

      // Hapus backup localStorage setelah berhasil submit
      localStorage.removeItem(LS_KEY)

      // Simpan waUrl untuk tombol di halaman sukses
      if (data.waUrl) {
        setWaUrl(data.waUrl)
        // Buka WhatsApp admin otomatis
        window.open(data.waUrl, '_blank')
      }

      showToast('Pilihan berhasil dikonfirmasi! Terima kasih 🎉', 'success')
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menyimpan', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Tab filtering
  const highlightPhotos = photos.filter(p => p.starred)
  const displayPhotos = activeTab === 'all'       ? photos
                      : activeTab === 'highlight'  ? highlightPhotos
                      : /* selected tab */           photos.filter(p => selected.some(s => s.id === p.id))

  // Index dalam displayPhotos untuk lightbox
  function openLightbox(photo) {
    const idx = displayPhotos.findIndex(p => p.id === photo.id)
    setLbIdx(idx >= 0 ? idx : 0)
  }

  const isDeadlinePassed = session && new Date() > new Date(session.deadline)
  const disabled         = submitted || isDeadlinePassed
  const progress         = session ? (selected.length / session.maxPhotos) * 100 : 0

  /* ── Render states ── */
  if (loading) return (
    <div className="loading-center" style={{ minHeight: '100vh' }}>
      <div className="spinner" /><span>Memuat galeri…</span>
    </div>
  )
  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: 400 }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.5" style={{ marginBottom: 16 }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <circle cx="12" cy="16" r="0.5" fill="var(--red)"/>
        </svg>
        <h2 style={{ marginBottom: 8 }}>Oops!</h2>
        <p style={{ color: 'var(--text2)' }}>{error}</p>
      </div>
    </div>
  )
  if (submitted) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--green-bg)', border: '2px solid var(--green)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: 8 }}>Terima Kasih!</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 20 }}>
          Pilihan {session?.clientName} sudah kami terima. Kami akan segera memproses foto-foto pilihan Anda.
        </p>
        <div style={{
          background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 24,
        }}>
          <p className="text-sm text-dim">Total foto dipilih:</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{selected.length} foto</p>
        </div>

        {/* Tombol WhatsApp admin — muncul jika waUrl tersedia */}
        {waUrl && (
          <div style={{ marginBottom: 20 }}>
            <p className="text-sm text-dim" style={{ marginBottom: 10 }}>
              Notifikasi dikirim otomatis ke fotografer via WhatsApp.
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold"
              style={{ textDecoration: 'none', display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'center', width: '100%' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Kirim Ulang ke WhatsApp Fotografer
            </a>
          </div>
        )}

        <p className="text-sm text-dim" style={{ marginBottom: 24 }}>Hubungi fotografer jika ada pertanyaan.</p>

        {/* Tombol lihat album */}
        <button
          className="btn btn-gold"
          onClick={() => navigate(`/session/${id}/album`)}
          style={{ width: '100%', justifyContent: 'center', marginBottom: 12, fontSize: '1rem', padding: '14px 20px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          ✨ Lihat Album Foto Anda
        </button>
      </div>
    </div>
  )
  if (isDeadlinePassed && !submitted) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--red-bg)', border: '2px solid rgba(248,113,113,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h2 style={{ marginBottom: 8 }}>Waktu Habis</h2>
        <p style={{ color: 'var(--text2)' }}>Batas waktu pemilihan foto sudah berakhir. Hubungi fotografer.</p>
      </div>
    </div>
  )

  return (
    <div className="page-wrap" style={{ paddingBottom: 100 }}>

      {/* Lightbox */}
      {lbIdx !== null && displayPhotos.length > 0 && (
        <Lightbox
          photos={displayPhotos}
          startIdx={lbIdx}
          selected={selected}
          onToggle={togglePhoto}
          onClose={() => setLbIdx(null)}
          disabled={disabled}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <ConfirmModal
          count={selected.length} max={session.maxPhotos}
          onConfirm={handleSubmit} onCancel={() => setShowConfirm(false)}
          loading={submitting}
        />
      )}

      {/* Header */}
      <header style={{
        background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100, padding: '14px 20px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>
              Album Foto
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.2rem,3vw,1.8rem)', fontWeight: 300 }}>
              {session?.clientName}
            </h1>
          </div>

          {/* Countdown */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '10px', marginBottom: 10,
          }}>
            <div className="text-xs text-dim" style={{ textAlign: 'center', marginBottom: 6 }}>⏳ Batas waktu memilih</div>
            <Countdown deadline={session?.deadline} />
          </div>

          {/* Tabs */}
          <TabBar
            active={activeTab}
            onChange={setActiveTab}
            total={photos.length}
            highlights={highlightPhotos.length}
            selected={selected.length}
          />
        </div>
      </header>

      {/* Gallery */}
      {photosLoading ? (
        <div className="loading-center" style={{ minHeight: '60vh' }}>
          <div className="spinner" /><span>Memuat foto dari Google Drive…</span>
        </div>
      ) : driveError ? (
        <div className="loading-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: 16, padding: '0 24px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <circle cx="12" cy="16" r="0.5" fill="var(--red)"/>
            </svg>
          </div>
          <div>
            <p style={{ color: 'var(--red)', fontWeight: 600, marginBottom: 6 }}>Gagal Memuat Foto</p>
            <p style={{ color: 'var(--text2)', fontSize: '0.875rem', maxWidth: 400 }}>{driveError}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => session?.driveLink && loadPhotos(session.driveLink)}>
            Coba Lagi
          </button>
        </div>
      ) : displayPhotos.length === 0 ? (
        <div className="loading-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <p style={{ color: 'var(--text3)' }}>
            {activeTab === 'highlight' ? 'Belum ada foto highlight. Tandai foto dengan ⭐ di Google Drive.' :
             activeTab === 'selected'  ? 'Belum ada foto yang dipilih.' :
             'Tidak ada foto.'}
          </p>
          {activeTab !== 'all' && (
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('all')}>
              Lihat Semua Foto
            </button>
          )}
        </div>
      ) : (
        <div className="masonry" style={{ padding: '16px' }}>
          {displayPhotos.map(photo => {
            const isSelected = selected.some(s => s.id === photo.id)
            const order = selected.findIndex(s => s.id === photo.id) + 1
            return (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isSelected={isSelected}
                selectionOrder={order > 0 ? order : ''}
                onToggle={togglePhoto}
                onZoom={() => openLightbox(photo)}
                disabled={disabled}
              />
            )
          })}
        </div>
      )}

      {/* Selection bar */}
      <div className="selection-bar">
        <div className="sel-count">
          <div className="sel-count-num">
            {selected.length}
            <span style={{ fontSize: '1rem', color: 'var(--text3)', fontWeight: 400 }}>/{session?.maxPhotos}</span>
          </div>
          <div className="sel-count-label">foto dipilih</div>
        </div>
        <div className="sel-progress">
          <div className="sel-progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
        <button
          className="btn btn-gold"
          onClick={() => {
            if (!selected.length) { showToast('Pilih minimal 1 foto dulu', 'error'); return }
            setShowConfirm(true)
          }}
          disabled={disabled || !selected.length}
          style={{ flexShrink: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Selesai Memilih
        </button>
      </div>
    </div>
  )
}
