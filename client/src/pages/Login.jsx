import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Login() {
  const nav = useNavigate()
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { password })
      localStorage.setItem('fg_token', data.token)
      nav('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrap" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>

      {/* Background decoration */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 30% 40%, rgba(232,200,122,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(96,165,250,0.04) 0%, transparent 50%)',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(232,200,122,0.15), rgba(232,200,122,0.05))',
            border: '1px solid rgba(232,200,122,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(232,200,122,0.1)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 6 }}>
            Fotografer <span className="text-gold">Studio</span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>
            Dashboard manajemen sesi foto klien
          </p>
        </div>

        {/* Login Card */}
        <div className="card-glass" style={{ padding: 32 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 24, color: 'var(--text2)' }}>
            Masuk sebagai Admin
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Masukkan password admin"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoFocus
                  required
                  style={{ paddingLeft: '44px' }}
                />
                <svg style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text3)', width: 16, height: 16,
                }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              {error && <span className="form-error">{error}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-gold btn-full btn-lg"
              disabled={loading || !password}
            >
              {loading ? (
                <>
                  <div className="spinner-sm spinner" />
                  Memverifikasi…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.75rem', color: 'var(--text3)' }}>
          Default password: <code>fotografer123</code> — ubah di file <code>server/.env</code>
        </p>
      </div>
    </div>
  )
}
