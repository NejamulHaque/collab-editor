import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

const ROLES = ['viewer', 'editor', 'owner']

export default function InviteModal({ docId, projectId, onClose }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [members, setMembers] = useState([])
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (docId) fetchMembers()
  }, [docId])

  async function fetchMembers() {
    try {
      const res = await fetch(`${API}/invite/members/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setMembers(Array.isArray(data) ? data : [])
    } catch {}
  }

  async function sendInvite() {
    if (!email.trim()) return
    setSending(true)
    setSent(false)
    setError(null)
    try {
      const res = await fetch(`${API}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ doc_id: docId, project_id: projectId, invitee_email: email.trim(), role }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      setSent(true)
      setEmail('')
      fetchMembers()
    } catch (err) {
      setError(err.message)
    }
    setSending(false)
  }

  async function removeMember(uid) {
    try {
      await fetch(`${API}/invite/members/${docId}/${uid}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      })
      setMembers(prev => prev.filter(m => m.id !== uid))
    } catch {}
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header */}
        <div style={header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>👥</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Share & Invite</span>
          </div>
          <button onClick={onClose} style={iconBtn}>✕</button>
        </div>

        {/* Share link */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input
            readOnly value={window.location.href}
            style={{ flex: 1, padding: '7px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}
          />
          <button onClick={copyLink} style={copyBtn}>⤴ Copy Link</button>
        </div>

        {/* Invite form */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Invite by email</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendInvite()}
              placeholder="colleague@example.com"
              style={{ flex: 1, padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }}
            />
            <select value={role} onChange={e => setRole(e.target.value)} style={select}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={sendInvite} disabled={!email.trim() || sending} style={sendBtn}>
              {sending ? '…' : 'Invite'}
            </button>
          </div>
          {sent && <div style={{ marginTop: 8, fontSize: 12, color: '#059669', fontWeight: 600 }}>✓ Invite sent!</div>}
          {error && <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>{error}</div>}
        </div>

        {/* Member list */}
        <div style={{ padding: '10px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>
            Members ({members.length})
          </div>
          {members.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)' }}>No members yet.</div>}
          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={avatar}>{(m.name || 'U')[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{m.email}</div>
              </div>
              <span style={{ ...roleBadge, background: m.role === 'owner' ? '#ede9fe' : m.role === 'editor' ? '#dbeafe' : '#f3f4f6', color: m.role === 'owner' ? '#7c3aed' : m.role === 'editor' ? '#1d4ed8' : '#374151' }}>
                {m.role}
              </span>
              {m.id !== user.id && m.role !== 'owner' && (
                <button onClick={() => removeMember(m.id)} style={{ ...iconBtn, color: '#ef4444', fontSize: 11 }} title="Remove">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }
const modal = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, width: 480, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }
const header = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }
const avatar = { width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const roleBadge = { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }
const iconBtn = { padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text3)', borderRadius: 6 }
const copyBtn = { padding: '7px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap' }
const sendBtn = { padding: '8px 16px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }
const select = { padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer' }
