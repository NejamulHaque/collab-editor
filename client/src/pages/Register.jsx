import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useTheme } from '../context/ThemeContext.jsx'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
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

  const pwStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3
  const pwColor = ['','#ef4444','#f59e0b','#10b981'][pwStrength]
  const pwLabel = ['','Weak','Good','Strong'][pwStrength]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      <div style={{ flex: 1, background: dark ? '#064e3b' : 'linear-gradient(135deg,#064e3b,#047857)', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/H&S.png" alt="Logo" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>CollabSheets</span>
          </div>
          <button onClick={toggle} style={iconBtn}>{dark ? '☀️' : '🌙'}</button>
        </div>
        <div>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 20 }}>Start building<br />together today.</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 40 }}>Free forever. No credit card. Invite your whole team.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['Create account in 30 seconds', 'Create your first document', 'Share link and start collaborating'].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i+1}</div>
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          Already have an account?{' '}
          <Link to="/" style={{ color: '#6ee7b7', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>

      <div style={{ width: 500, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.5px' }}>Create account</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>Join thousands of teams already collaborating</p>

          {error && <div style={errorStyle}>{error}</div>}

          <GoogleBtn onClick={handleGoogleSignIn} disabled={loading} />

          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
            <span style={{ padding: '0 12px', fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>OR CONTINUE WITH EMAIL</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
          </div>

          <form onSubmit={handleSubmit}>
            <Field label="Full name" type="text" placeholder="Najamul Haque" value={form.name} onChange={v => setForm({...form, name: v})} />
            <Field label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={v => setForm({...form, email: v})} />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Password</label>
              <input
                type="password" placeholder="Min. 6 characters" value={form.password}
                onChange={e => setForm({...form, password: e.target.value})} required
                style={{ display: 'block', width: '100%', padding: '11px 14px', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', background: 'var(--bg)', color: 'var(--text)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              {form.password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i<=pwStrength ? pwColor : 'var(--border)', transition:'background .3s' }}/>)}
                  </div>
                  <span style={{ fontSize: 11, color: pwColor, fontWeight: 700 }}>{pwLabel} password</span>
                </div>
              )}
            </div>
            <button type="submit" disabled={loading} style={{ display:'block', width:'100%', padding:'12px', background: loading ? 'var(--text3)' : 'linear-gradient(135deg,#059669,#047857)', color:'#fff', border:'none', borderRadius:'var(--radius)', fontSize:15, fontWeight:700, cursor: loading ? 'not-allowed':'pointer', marginTop:8 }}>
              {loading ? 'Creating account...' : 'Create free account'}
            </button>
          </form>
          <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 16 }}>By registering you agree to our Terms of Service.</p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, type, placeholder, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} required
        style={{ display:'block', width:'100%', padding:'11px 14px', borderRadius:'var(--radius)', border:'1.5px solid var(--border)', fontSize:14, outline:'none', background:'var(--bg)', color:'var(--text)' }}
        onFocus={e => e.target.style.borderColor='var(--accent)'}
        onBlur={e => e.target.style.borderColor='var(--border)'}
      />
    </div>
  )
}


const iconBtn = { background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:16 }
const errorStyle = { background:'#fef2f2', color:'#b91c1c', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:18, border:'1px solid #fecaca' }

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