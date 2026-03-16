import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      {/* Left panel */}
      <div style={{ flex: 1, background: dark ? '#1e1b4b' : 'linear-gradient(135deg,#1e1b4b,#4338ca)', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/H&S.png" alt="Logo" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>CollabSheets</span>
          </div>
          <button onClick={toggle} style={iconBtn}>{dark ? '☀️' : '🌙'}</button>
        </div>

        <div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 16 }}>Why engineers choose us</div>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 20 }}>Code together.<br />Ship faster.</h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 40, maxWidth: 440 }}>
            Real-time collaborative code editor powered by CRDTs. No merge conflicts. Works offline. Built for engineering teams.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['⚡', 'Sub-50ms sync latency via WebSockets'],
              ['🔀', 'Conflict-free CRDT merging — no data loss'],
              ['📡', 'Offline-first — works without internet'],
              ['🔒', 'JWT auth + end-to-end room isolation'],
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                <span style={{ fontSize: 18, width: 24 }}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['R','A','S','M','K'].map((l,i) => (
            <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: ['#6366f1','#06b6d4','#10b981','#f59e0b','#ec4899'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, border: '2px solid rgba(255,255,255,0.2)', marginLeft: i ? -8 : 0 }}>{l}</div>
          ))}
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginLeft: 6 }}>2,400+ developers collaborating</span>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 500, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.5px' }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>Sign in to your workspace</p>

          {error && <div style={errorStyle}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <Field label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={v => setForm({...form, email: v})} />
            <Field label="Password" type="password" placeholder="••••••••" value={form.password} onChange={v => setForm({...form, password: v})} />
            <Btn loading={loading} label="Sign in" loadingLabel="Signing in..." />
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text2)' }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Create one free</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, type, placeholder, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        style={{ display: 'block', width: '100%', padding: '11px 14px', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', background: 'var(--bg)', color: 'var(--text)', transition: 'border .15s' }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

function Btn({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{ display: 'block', width: '100%', padding: '12px', background: loading ? 'var(--text3)' : 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, transition: 'opacity .15s' }}
    >
      {loading ? loadingLabel : label}
    </button>
  )
}

const logoStyle = { width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }
const iconBtn = { background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }
const errorStyle = { background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 18, border: '1px solid #fecaca' }