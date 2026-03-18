import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
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

  async function handleGoogleSignIn() {
    setError('')
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.displayName,
          email: user.email,
          uid: user.uid
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed: ' + err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)', overflow: 'hidden' }}>
      {/* Left panel */}
      <div style={{ flex: 1, background: dark ? '#0a0e1a' : '#1e1b4b', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        {/* Animated Background Blob */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'pulse 8s infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(50px)', animation: 'pulse 12s infinite alternate-reverse' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="fade-in">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99,102,241,0.3)' }}>
              <img src="/H&S.png" alt="Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
            </div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>CollabSheets</span>
          </div>
          <button onClick={toggle} style={iconBtn}>{dark ? '☀️' : '🌙'}</button>
        </div>

        <div className="stagger" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 20 }}>Elevate your collaboration</div>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 24 }}>Think together.<br /><span className="gradient-text" style={{ filter: 'brightness(1.5)' }}>Code as one.</span></h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 44, maxWidth: 460 }}>
            The next-generation collaborative editor for teams that demand sub-50ms sync latency and zero-conflict merging.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              ['⚡', 'Ultra-low latency sync via WebSockets'],
              ['🔀', 'Conflict-free CRDT architecture'],
              ['📡', 'Local-first & offline persistence'],
              ['🔒', 'Enterprise-grade isolation & JWT auth'],
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: 500 }}>
                <span style={{ fontSize: 20, width: 28 }}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }} className="fade-in">
          <div style={{ display: 'flex' }}>
            {['R','A','S','M','K'].map((l,i) => (
              <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', background: ['#6366f1','#06b6d4','#10b981','#f59e0b','#ec4899'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12, border: '2px solid #1e1b4b', marginLeft: i ? -10 : 0, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>{l}</div>
            ))}
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginLeft: 8, fontWeight: 600 }}>Trusted by 2,400+ developers</span>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 540, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }} className="fade-in">
        <div style={{ width: '100%', maxWidth: 380 }} className="stagger">
          <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 8, letterSpacing: '-1px' }}>Welcome back</h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 32, fontWeight: 500 }}>Enter your details to access your workspace</p>

          {error && <div className="scale-in" style={errorStyle}>{error}</div>}

          <GoogleBtn onClick={handleGoogleSignIn} disabled={loading} />

          <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
            <span style={{ padding: '0 16px', fontSize: 11, color: 'var(--text3)', fontWeight: 800, letterSpacing: '0.05em' }}>OR EMAIL</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
          </div>

          <form onSubmit={handleSubmit} className="stagger">
            <Field label="Email Address" type="email" placeholder="you@company.com" value={form.email} onChange={v => setForm({...form, email: v})} />
            <Field label="Password" type="password" placeholder="••••••••" value={form.password} onChange={v => setForm({...form, password: v})} />
            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <a href="#" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</a>
            </div>
            <Btn loading={loading} label="Sign in" loadingLabel="Signing in..." />
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Create one for free</Link>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse { from { opacity: 0.4; transform: scale(1); } to { opacity: 0.7; transform: scale(1.1); } }
      `}</style>
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


const iconBtn = { background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }
const errorStyle = { background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 18, border: '1px solid #fecaca' }

function GoogleBtn({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '11px',
        background: 'var(--bg)', color: 'var(--text)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
        fontSize: 15, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background .15s',
      }}
      onMouseOver={e => { if (!disabled) e.currentTarget.style.background = 'var(--bg2)' }}
      onMouseOut={e => { e.currentTarget.style.background = 'var(--bg)' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
      Continue with Google
    </button>
  )
}