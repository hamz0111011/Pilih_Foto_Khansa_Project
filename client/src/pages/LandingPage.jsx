import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/Logo_khansa.png'

/* ── Animated number counter ── */
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let start = 0
      const step = target / 60
      const timer = setInterval(() => {
        start += step
        if (start >= target) { setCount(target); clearInterval(timer) }
        else setCount(Math.floor(start))
      }, 16)
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{count}{suffix}</span>
}

/* ── FAQ Item ── */
function FaqItem({ q, a, index }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        background: open ? 'rgba(232,200,122,0.05)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${open ? 'rgba(232,200,122,0.3)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12, overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', color: 'var(--lp-text)',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.5 }}>
          <span style={{ color: 'var(--lp-gold)', marginRight: 10, fontFamily: 'Georgia, serif', fontSize: '0.85rem' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          {q}
        </span>
        <span style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: open ? 'rgba(232,200,122,0.2)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${open ? 'rgba(232,200,122,0.4)' : 'rgba(255,255,255,0.12)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: open ? '#e8c87a' : 'rgba(255,255,255,0.4)',
          transition: 'all 0.3s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          fontSize: '1.1rem', lineHeight: 1,
        }}>+</span>
      </button>
      <div style={{
        maxHeight: open ? '300px' : '0',
        overflow: 'hidden', transition: 'max-height 0.4s ease',
      }}>
        <p style={{
          padding: '0 24px 20px 24px', paddingLeft: '56px',
          color: 'rgba(240,237,232,0.6)', fontSize: '0.9rem', lineHeight: 1.8,
        }}>{a}</p>
      </div>
    </div>
  )
}

/* ── Fade-in section wrapper ── */
function FadeIn({ children, delay = 0, style = {} }) {
  const ref = useRef()
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect() }
    }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(32px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  )
}

const FAQS = [
  {
    q: 'Bagaimana cara saya melihat dan memilih foto hasil pemotretan?',
    a: 'Fotografer akan mengirimkan link galeri pribadi kepada Anda melalui WhatsApp setelah sesi pemotretan selesai diproses. Anda cukup klik link tersebut, kemudian pilih foto favorit Anda sesuai dengan paket yang dipilih.',
  },
  {
    q: 'Berapa lama waktu yang diberikan untuk memilih foto?',
    a: 'Biasanya Anda diberikan waktu 3–7 hari untuk memilih foto. Batas waktu tepat akan tertera di halaman galeri Anda. Jika membutuhkan perpanjangan waktu, silakan hubungi fotografer.',
  },
  {
    q: 'Berapa banyak foto yang bisa saya pilih?',
    a: 'Jumlah foto yang dapat dipilih tergantung pada paket yang Anda ambil. Batas maksimal akan tertera jelas di halaman galeri Anda. Jika ingin menambah kuota foto, bisa dikomunikasikan langsung dengan fotografer.',
  },
  {
    q: 'Apakah saya bisa mengubah pilihan foto setelah dikonfirmasi?',
    a: 'Setelah Anda menekan tombol "Konfirmasi Pilihan", pilihan foto sudah bersifat final dan tidak dapat diubah. Pastikan Anda sudah benar-benar yakin sebelum mengkonfirmasi.',
  },
  {
    q: 'Kapan foto yang sudah diedit akan siap diterima?',
    a: 'Proses editing biasanya memerlukan waktu 7–14 hari kerja setelah pilihan foto dikonfirmasi. Untuk paket tertentu (express), bisa lebih cepat. Fotografer akan mengabari Anda melalui WhatsApp ketika foto siap.',
  },
  {
    q: 'Format file apa yang akan saya terima?',
    a: 'Foto yang sudah diedit akan dikirimkan dalam format JPEG resolusi tinggi melalui Google Drive. Anda bisa langsung mengunduh, mencetak, atau membagikannya sesuai kebutuhan.',
  },
  {
    q: 'Apakah ada biaya tambahan untuk proses pemilihan foto ini?',
    a: 'Tidak ada biaya tambahan. Fasilitas galeri online ini sudah termasuk dalam paket pemotretan yang Anda pilih.',
  },
]

const PHOTOGRAPHERS = [
  {
    name: 'Azmi Ardiansyah',
    role: 'Lead Photographer & Creative Director',
    specialty: 'Wedding • Prewedding • Portrait',
    bio: 'Dengan pengalaman lebih dari 7 tahun di industri fotografi, Khansa mengkhususkan diri dalam mengabadikan momen pernikahan dan keluarga dengan sentuhan sinematik yang hangat dan penuh emosi.',
    icon: '📷',
    stats: { sessions: 300, years: 7, events: 150 },
  },
  {
    name: 'Tim Khansa Project',
    role: 'Professional Photography Team',
    specialty: 'Maternity • Newborn • Family',
    bio: 'Tim kami terdiri dari fotografer-fotografer berpengalaman yang berdedikasi penuh untuk memastikan setiap momen berharga Anda diabadikan dengan sempurna dan penuh cinta.',
    icon: '🎞️',
    stats: { sessions: 500, years: 5, events: 200 },
  },
]

export default function LandingPage() {
  const nav = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [contactForm, setContactForm] = useState({ name: '', phone: '', message: '' })
  const [contactSent, setContactSent] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(id) {
    setMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleContact(e) {
    e.preventDefault()
    const msg = encodeURIComponent(
      `Halo Khansa Project! 👋\n\nNama: ${contactForm.name}\nNo. HP: ${contactForm.phone}\n\nPesan:\n${contactForm.message}`
    )
    window.open(`https://wa.me/6281534137376?text=${msg}`, '_blank')
    setContactSent(true)
    setTimeout(() => setContactSent(false), 4000)
    setContactForm({ name: '', phone: '', message: '' })
  }

  const navLinks = [
    { id: 'fotografer', label: 'Fotografer' },
    { id: 'kontak', label: 'Kontak' },
    { id: 'faq', label: 'FAQ' },
  ]

  return (
    <div style={{ background: '#07070e', color: '#f0ede8', fontFamily: "'Inter', -apple-system, sans-serif", overflowX: 'hidden' }}>
      <style>{`
        :root {
          --lp-gold: #e8c87a;
          --lp-gold2: #c9a84c;
          --lp-text: #f0ede8;
          --lp-text2: rgba(240,237,232,0.6);
          --lp-border: rgba(255,255,255,0.08);
          --lp-surface: rgba(255,255,255,0.04);
        }
        .lp-nav-link {
          background: none; border: none; cursor: pointer;
          color: rgba(240,237,232,0.6); font-size: 0.875rem;
          font-weight: 500; padding: 8px 16px; border-radius: 99px;
          transition: all 0.2s ease; letter-spacing: 0.02em;
          font-family: 'Inter', sans-serif;
        }
        .lp-nav-link:hover { color: #e8c87a; background: rgba(232,200,122,0.08); }
        .lp-btn-gold {
          background: linear-gradient(135deg, #e8c87a, #c9a84c);
          color: #07070e; font-weight: 700; border: none; cursor: pointer;
          border-radius: 99px; padding: 14px 32px; font-size: 0.9rem;
          letter-spacing: 0.04em; transition: all 0.3s ease;
          font-family: 'Inter', sans-serif; display: inline-flex;
          align-items: center; gap: 8px; text-decoration: none;
        }
        .lp-btn-gold:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(232,200,122,0.35); }
        .lp-btn-ghost {
          background: rgba(255,255,255,0.06); color: rgba(240,237,232,0.8);
          border: 1px solid rgba(255,255,255,0.12); cursor: pointer;
          border-radius: 99px; padding: 14px 32px; font-size: 0.9rem;
          transition: all 0.3s ease; font-family: 'Inter', sans-serif;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .lp-btn-ghost:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); transform: translateY(-2px); }
        .lp-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 32px;
          transition: all 0.3s ease; backdrop-filter: blur(12px);
        }
        .lp-card:hover { border-color: rgba(232,200,122,0.25); background: rgba(232,200,122,0.03); transform: translateY(-4px); box-shadow: 0 24px 60px rgba(0,0,0,0.4); }
        .lp-input {
          width: 100%; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
          padding: 12px 16px; color: #f0ede8; font-size: 0.9rem;
          font-family: 'Inter', sans-serif; outline: none;
          transition: all 0.2s ease;
        }
        .lp-input:focus { border-color: rgba(232,200,122,0.5); background: rgba(232,200,122,0.04); box-shadow: 0 0 0 3px rgba(232,200,122,0.1); }
        .lp-input::placeholder { color: rgba(240,237,232,0.3); }
        .lp-section-tag {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(232,200,122,0.08); border: 1px solid rgba(232,200,122,0.2);
          color: #e8c87a; font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase;
          padding: 6px 16px; border-radius: 99px; margin-bottom: 20px;
        }
        .lp-grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }
        @media (max-width: 768px) {
          .lp-hero-title { font-size: clamp(2.6rem, 12vw, 5rem) !important; }
          .lp-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-photo-grid { grid-template-columns: 1fr !important; }
          .lp-contact-grid { grid-template-columns: 1fr !important; }
          .lp-nav-desktop { display: none !important; }
          .lp-hamburger { display: flex !important; }
        }
        @media (min-width: 769px) { .lp-hamburger { display: none !important; } }
      `}</style>

      {/* Grain overlay */}
      <div className="lp-grain" />

      {/* ═══════════ NAVBAR ═══════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(7,7,14,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.4s ease',
      }}>
        <div style={{ maxWidth: 1780, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <button onClick={() => scrollTo('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(232,200,122,0.1)', border: '1px solid rgba(232,200,122,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 4 }}>
              <img src={logo} alt="Khansa Project" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#f0ede8', fontWeight: 400, letterSpacing: '0.02em' }}>
              Khansa <span style={{ color: '#e8c87a' }}>Project</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="lp-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {navLinks.map(l => (
              <button key={l.id} className="lp-nav-link" onClick={() => scrollTo(l.id)}>{l.label}</button>
            ))}
          </nav>

          {/* CTA Button + Hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="lp-btn-gold" style={{ padding: '10px 22px', fontSize: '0.82rem', borderRadius: 99 }}
              onClick={() => nav('/login')}>
              Admin Login
            </button>
            {/* Hamburger */}
            <button
              className="lp-hamburger"
              onClick={() => setMenuOpen(v => !v)}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 38, height: 38, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer' }}
            >
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 18, height: 1.5, background: '#e8c87a', borderRadius: 2, display: 'block', transition: 'all 0.3s',
                  transform: menuOpen && i === 0 ? 'rotate(45deg) translate(5px, 5px)' : menuOpen && i === 2 ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
                  opacity: menuOpen && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div style={{
          maxHeight: menuOpen ? '300px' : '0', overflow: 'hidden',
          transition: 'max-height 0.4s ease',
          background: 'rgba(7,7,14,0.97)', backdropFilter: 'blur(20px)',
          borderBottom: menuOpen ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}>
          <div style={{ padding: '12px 24px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navLinks.map(l => (
              <button key={l.id} className="lp-nav-link" style={{ textAlign: 'left', padding: '12px 16px' }}
                onClick={() => scrollTo(l.id)}>{l.label}</button>
            ))}
          </div>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section id="home" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 80px', overflow: 'hidden' }}>

        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,200,122,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Tag */}
          <div style={{ opacity: 0, animation: 'fadeInUp 0.8s ease 0.1s forwards' }}>
            <span className="lp-section-tag">✦ Khansa Project Photography</span>
          </div>

          {/* Headline */}
          <style>{`
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
          <h1 className="lp-hero-title" style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(3.5rem, 10vw, 7rem)', fontWeight: 300,
            lineHeight: 1.05, letterSpacing: '-0.02em',
            color: '#fff', marginBottom: 24,
            opacity: 0, animation: 'fadeInUp 1s ease 0.25s forwards',
          }}>
            Mengabadikan<br />
            <span style={{ color: '#e8c87a', fontStyle: 'italic' }}>Setiap Momen</span><br />
            Berharga Anda
          </h1>

          <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', color: 'rgba(240,237,232,0.65)', lineHeight: 1.8, maxWidth: 760, margin: '0 auto 40px', opacity: 0, animation: 'fadeInUp 1s ease 0.4s forwards' }}>
            Studio fotografi profesional yang melayani sesi pernikahan, prewedding, keluarga, dan potret — dengan sistem galeri online khusus untuk klien kami.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', opacity: 0, animation: 'fadeInUp 1s ease 0.55s forwards' }}>
            <button className="lp-btn-gold" onClick={() => scrollTo('kontak')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" /></svg>
              Hubungi Kami
            </button>
            <button className="lp-btn-ghost" onClick={() => scrollTo('fotografer')}>
              Lihat Fotografer
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          {/* Stats Bar */}
          <FadeIn delay={200} style={{ marginTop: 72 }}>
            <div className="lp-stats-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1, borderRadius: 16, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              {[
                { val: 500, suf: '+', label: 'Sesi Terlayani' },
                { val: 7, suf: '+ Tahun', label: 'Pengalaman' },
                { val: 98, suf: '%', label: 'Klien Puas' },
                { val: 150, suf: '+', label: 'Momen Pernikahan' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '24px 16px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 400, color: '#e8c87a', lineHeight: 1, marginBottom: 6 }}>
                    <Counter target={s.val} suffix={s.suf} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>

        {/* Scroll cue */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: 'bounce 2s ease-in-out infinite', opacity: 0.4 }}>
          <style>{`@keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(8px)} }`}</style>
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Scroll</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </section>

      {/* ═══════════ FOTOGRAFER ═══════════ */}
      <section id="fotografer" style={{ padding: '100px 24px', maxWidth: 1440, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="lp-section-tag">📷 Tim Kami</span>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 300, letterSpacing: '-0.02em', marginBottom: 16 }}>
              Kenali <span style={{ color: '#e8c87a', fontStyle: 'italic' }}>Fotografer</span> Kami
            </h2>
            <p style={{ color: 'rgba(240,237,232,0.55)', maxWidth: 520, margin: '0 auto', lineHeight: 1.8 }}>
              Didedikasikan untuk menghasilkan karya terbaik — setiap jepretan adalah cerita yang menunggu untuk diabadikan.
            </p>
          </div>
        </FadeIn>

        <div className="lp-photo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 64 }}>
          {PHOTOGRAPHERS.map((p, i) => (
            <FadeIn key={i} delay={i * 150}>
              <div className="lp-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(232,200,122,0.1)', border: '1px solid rgba(232,200,122,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                    {p.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#e8c87a', fontWeight: 500 }}>{p.role}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(232,200,122,0.06)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: '0.78rem', color: '#e8c87a', fontWeight: 500 }}>
                  {p.specialty}
                </div>
                <p style={{ color: 'rgba(240,237,232,0.6)', fontSize: '0.875rem', lineHeight: 1.8, marginBottom: 20 }}>{p.bio}</p>
                <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    { val: p.stats.sessions, label: 'Sesi' },
                    { val: p.stats.years, label: 'Tahun' },
                    { val: p.stats.events, label: 'Acara' },
                  ].map((st, j) => (
                    <div key={j} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: '#e8c87a', lineHeight: 1 }}>{st.val}+</div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.35)', letterSpacing: '0.06em', marginTop: 4 }}>{st.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Services */}
        <FadeIn delay={100}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.6rem', fontWeight: 300, marginBottom: 8 }}>Layanan <span style={{ color: '#e8c87a' }}>Kami</span></h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { icon: '💍', title: 'Wedding', desc: 'Mengabadikan hari istimewa pernikahan Anda' },
              { icon: '🌹', title: 'Prewedding', desc: 'Sesi foto romantis sebelum hari pernikahan' },
              { icon: '👨‍👩‍👧', title: 'Family', desc: 'Kenangan indah bersama keluarga tercinta' },
              { icon: '🤱', title: 'Maternity', desc: 'Mengabadikan keindahan masa kehamilan' },
              { icon: '👶', title: 'Newborn', desc: 'Momen berharga si kecil yang baru lahir' },
              { icon: '🎓', title: 'Wisuda', desc: 'Rayakan pencapaian luar biasa Anda' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 16px', textAlign: 'center', transition: 'all 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(232,200,122,0.2)'; e.currentTarget.style.background = 'rgba(232,200,122,0.03)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(240,237,232,0.45)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span className="lp-section-tag">✦ Cara Kerja</span>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 300 }}>
                Proses <span style={{ color: '#e8c87a', fontStyle: 'italic' }}>Sederhana</span>, Hasil Maksimal
              </h2>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { step: '01', icon: '📞', title: 'Hubungi Kami', desc: 'Konsultasikan kebutuhan dan jadwal sesi foto Anda melalui WhatsApp.' },
              { step: '02', icon: '📸', title: 'Sesi Pemotretan', desc: 'Fotografer kami datang ke lokasi dan mengabadikan momen Anda.' },
              { step: '03', icon: '🖥️', title: 'Pilih Foto Online', desc: 'Anda menerima link galeri online pribadi untuk memilih foto favorit.' },
              { step: '04', icon: '✨', title: 'Terima Hasil Edit', desc: 'Foto yang dipilih akan diedit dan dikirimkan ke Google Drive Anda.' },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 120}>
                <div style={{ textAlign: 'center', padding: '8px 16px' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(232,200,122,0.08)', border: '1px solid rgba(232,200,122,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', margin: '0 auto 16px' }}>
                    {s.icon}
                  </div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '0.7rem', color: 'rgba(232,200,122,0.5)', letterSpacing: '0.2em', marginBottom: 8 }}>{s.step}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 10 }}>{s.title}</div>
                  <p style={{ fontSize: '0.83rem', color: 'rgba(240,237,232,0.5)', lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ KONTAK ═══════════ */}
      <section id="kontak" style={{ padding: '100px 24px', maxWidth: 1440, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="lp-section-tag">📱 Hubungi Kami</span>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 300, marginBottom: 16 }}>
              Siap <span style={{ color: '#e8c87a', fontStyle: 'italic' }}>Bekerja Sama</span> dengan Anda
            </h2>
            <p style={{ color: 'rgba(240,237,232,0.55)', maxWidth: 480, margin: '0 auto', lineHeight: 1.8 }}>
              Ceritakan momen apa yang ingin Anda abadikan. Kami siap membantu mewujudkannya.
            </p>
          </div>
        </FadeIn>

        <div className="lp-contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 32 }}>

          {/* Contact Info */}
          <FadeIn delay={100}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: '📱', label: 'WhatsApp', value: '+62 815-3413-7376', link: 'https://wa.me/6281534137376' },
                { icon: '📍', label: 'Lokasi', value: 'Indonesia', link: null },
                { icon: '🕐', label: 'Jam Operasional', value: 'Setiap hari, 08.00 – 20.00 WIB', link: null },
              ].map((c, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(232,200,122,0.08)', border: '1px solid rgba(232,200,122,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                      {c.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(240,237,232,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{c.label}</div>
                      {c.link
                        ? <a href={c.link} target="_blank" rel="noopener noreferrer" style={{ color: '#e8c87a', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>{c.value}</a>
                        : <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{c.value}</div>
                      }
                    </div>
                  </div>
                </div>
              ))}

              {/* Social / WA CTA */}
              <a
                href="https://wa.me/6281534137376"
                target="_blank"
                rel="noopener noreferrer"
                className="lp-btn-gold"
                style={{ justifyContent: 'center', marginTop: 8, textDecoration: 'none' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                Chat WhatsApp Sekarang
              </a>
            </div>
          </FadeIn>

          {/* Contact Form */}
          <FadeIn delay={200}>
            <div className="lp-card" style={{ padding: '32px' }}>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.3rem', fontWeight: 300, marginBottom: 6 }}>Kirim Pesan</h3>
              <p style={{ fontSize: '0.83rem', color: 'rgba(240,237,232,0.45)', marginBottom: 24 }}>Isi form ini dan kami akan membalasnya via WhatsApp.</p>

              {contactSent && (
                <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#4ade80', fontSize: '0.875rem' }}>
                  ✓ Pesan terkirim! Kami akan segera menghubungi Anda.
                </div>
              )}

              <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nama Lengkap *</label>
                  <input className="lp-input" placeholder="Nama Anda" required value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nomor WhatsApp *</label>
                  <input className="lp-input" placeholder="08xx / +62xx" required value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Pesan / Kebutuhan *</label>
                  <textarea className="lp-input" rows={4} placeholder="Ceritakan momen yang ingin diabadikan, tanggal rencana, dan pertanyaan Anda..." required value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} style={{ resize: 'vertical', minHeight: 100 }} />
                </div>
                <button type="submit" className="lp-btn-gold" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  Kirim via WhatsApp
                </button>
              </form>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" style={{ padding: '100px 24px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span className="lp-section-tag">❓ FAQ</span>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 300, marginBottom: 16 }}>
                Pertanyaan <span style={{ color: '#e8c87a', fontStyle: 'italic' }}>yang Sering</span> Ditanyakan
              </h2>
              <p style={{ color: 'rgba(240,237,232,0.55)', lineHeight: 1.8 }}>
                Tidak menemukan jawaban yang Anda cari? Hubungi kami langsung via WhatsApp.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQS.map((f, i) => (
              <FadeIn key={i} delay={i * 60}>
                <FaqItem q={f.q} a={f.a} index={i} />
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={200}>
            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <p style={{ color: 'rgba(240,237,232,0.45)', fontSize: '0.875rem', marginBottom: 16 }}>Masih ada pertanyaan lain?</p>
              <a href="https://wa.me/6281534137376" target="_blank" rel="noopener noreferrer" className="lp-btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                Tanya Langsung ke Kami →
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 24px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', padding: 3, background: 'rgba(232,200,122,0.08)', border: '1px solid rgba(232,200,122,0.15)' }}>
              <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: 'rgba(240,237,232,0.7)' }}>
              Khansa <span style={{ color: '#e8c87a' }}>Project</span>
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'rgba(240,237,232,0.3)', textAlign: 'center' }}>
            © {new Date().getFullYear()} Khansa Project. Dibuat dengan ♥ untuk mengabadikan kenangan.
          </p>
          <button onClick={() => nav('/login')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'rgba(240,237,232,0.25)', textDecoration: 'none' }}>
            Admin →
          </button>
        </div>
      </footer>
    </div>
  )
}
