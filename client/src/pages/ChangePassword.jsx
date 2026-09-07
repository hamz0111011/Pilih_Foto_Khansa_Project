import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import logo from '../assets/Logo_khansa.png'
import { ToastContainer, useToast } from '../components/Toast'

export default function ChangePassword() {
  const nav = useNavigate()
  const { toasts, addToast } = useToast()

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      addToast('Password baru dan konfirmasi tidak cocok', 'error')
      return
    }
    if (form.newPassword.length < 6) {
      addToast('Password baru minimal 6 karakter', 'error')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      addToast('Password berhasil diubah! Silakan login ulang.', 'success')
      setTimeout(() => {
        localStorage.removeItem('fg_token')
        nav('/login')
      }, 2000)
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengubah password', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Password strength
  function strength(pw) {
    if (!pw) return { level: 0, label: '', color: 'transparent' }
    let score = 0
    if (pw.length >= 8)  score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    const map = [
      { level: 1, label: 'Lemah',   color: 'var(--red)' },
      { level: 2, label: 'Cukup',   color: 'var(--amber)' },
      { level: 3, label: 'Baik',    color: 'var(--blue)' },
      { level: 4, label: 'Kuat',    color: 'var(--green)' },
    ]
    return map[score - 1] || map[0]
  }

  const str = strength(form.newPassword)

  function EyeBtn({ show, onToggle }) {
    return (
      <button
        type="button"
        onClick={onToggle}
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text3)', display: 'flex', alignItems: 'center',
        }}
        tabIndex={-1}
      >
        {show
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        }
      </button>
    )
  }

  return (
    <div className="page-wrap" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <ToastContainer toasts={toasts} />

      {/* Background decoration */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 30% 40%, rgba(232,200,122,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(96,165,250,0.04) 0%, transparent 50%)',
      }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>

        {/* Back button */}
        <button
          onClick={() => nav('/dashboard')}
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Kembali ke Dashboard
        </button>

        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 16,
            background: 'rgba(232,200,122,0.08)',
            border: '1px solid rgba(232,200,122,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(232,200,122,0.12)',
            overflow: 'hidden', padding: 6,
          }}>
            <img src={logo} alt="Khansa Project" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>
            Ganti <span className="text-gold">Password</span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>
            Perbarui password akun admin Anda
          </p>
        </div>

        {/* Form Card */}
        <div className="card-glass" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Current Password */}
            <div className="form-group">
              <label className="form-label">Password Saat Ini</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Masukkan password saat ini"
                  value={form.currentPassword}
                  onChange={e => set('currentPassword', e.target.value)}
                  required
                  autoFocus
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                />
                <svg style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text3)', width: 16, height: 16, pointerEvents: 'none',
                }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <EyeBtn show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
              </div>
            </div>

            {/* Divider */}
            <div className="divider" style={{ margin: '0' }} />

            {/* New Password */}
            <div className="form-group">
              <label className="form-label">Password Baru</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Masukkan password baru"
                  value={form.newPassword}
                  onChange={e => set('newPassword', e.target.value)}
                  required
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                />
                <svg style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text3)', width: 16, height: 16, pointerEvents: 'none',
                }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <EyeBtn show={showNew} onToggle={() => setShowNew(v => !v)} />
              </div>

              {/* Password strength bar */}
              {form.newPassword && (
                <div style={{ marginTop: 8 }}>
                  <div style={{
                    height: 4, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${(str.level / 4) * 100}%`,
                      background: str.color,
                      transition: 'width 0.3s ease, background 0.3s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: str.color, marginTop: 4, display: 'block' }}>
                    Kekuatan: {str.label}
                  </span>
                </div>
              )}
              <span className="form-hint" style={{ marginTop: form.newPassword ? 0 : undefined }}>
                Minimal 6 karakter. Gunakan kombinasi huruf, angka, dan simbol untuk password yang kuat.
              </span>
            </div>

            {/* Confirm New Password */}
            <div className="form-group">
              <label className="form-label">Konfirmasi Password Baru</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Ulangi password baru"
                  value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)}
                  required
                  style={{
                    paddingLeft: '44px', paddingRight: '44px',
                    borderColor: form.confirmPassword
                      ? form.confirmPassword === form.newPassword
                        ? 'var(--green)'
                        : 'var(--red)'
                      : undefined,
                  }}
                />
                <svg style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: form.confirmPassword
                    ? form.confirmPassword === form.newPassword ? 'var(--green)' : 'var(--red)'
                    : 'var(--text3)',
                  width: 16, height: 16, pointerEvents: 'none',
                }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {form.confirmPassword && form.confirmPassword === form.newPassword
                    ? <polyline points="20 6 9 17 4 12"/>
                    : <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>
                  }
                </svg>
                <EyeBtn show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
              </div>
              {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                <span className="form-error">Password tidak cocok</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-gold btn-full btn-lg"
              disabled={loading || !form.currentPassword || !form.newPassword || form.newPassword !== form.confirmPassword}
              style={{ marginTop: 4 }}
            >
              {loading ? (
                <>
                  <div className="spinner-sm spinner" />
                  Menyimpan…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Simpan Password Baru
                </>
              )}
            </button>
          </form>
        </div>

        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)',
          borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text2)',
        }}>
          ⚠️ Setelah password berhasil diubah, Anda akan otomatis keluar dan diminta login ulang.
        </div>
      </div>
    </div>
  )
}
