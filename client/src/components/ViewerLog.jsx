import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

export default function ViewerLog({ docId, onClose }) {
  const [viewers, setViewers] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!docId) return
    fetchViewers()
    // Log this view
    fetch(`${API}/invite/view/${docId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {})
  }, [docId])

  async function fetchViewers() {
    try {
      const res = await fetch(`${API}/invite/viewers/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setViewers(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  function timeAgo(iso) {
    const m = Math.floor((Date.now() - new Date(iso)) / 60000)
    if (m < 1)    return 'just now'
    if (m < 60)   return `${m}m ago`
    if (m < 1440) return `${Math.floor(m/60)}h ago`
    return `${Math.floor(m/1440)}d ago`
  }

  return (
    <div style={panel}>
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>👁️</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Viewer Log</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{viewers.length} unique</span>
        </div>
        <button onClick={onClose} style={iconBtn}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={emptyMsg}>Loading…</div>}
        {!loading && viewers.length === 0 && (
          <div style={emptyMsg}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>👁️</div>
            <div>No views recorded yet.</div>
          </div>
        )}
        {viewers.map(v => (
          <div key={v.id} style={row}>
            <div style={avatar}>{(v.name || 'U')[0].toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{v.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{v.email}</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right' }}>
              <div>{timeAgo(v.viewed_at)}</div>
              <div style={{ marginTop: 1 }}>Last seen</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
        <button onClick={fetchViewers} style={refreshBtn}>↺ Refresh</button>
      </div>
    </div>
  )
}

const panel = { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', borderLeft: '1px solid var(--border)' }
const header = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg2)' }
const row = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border)' }
const avatar = { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const emptyMsg = { padding: '30px 16px', fontSize: 13, color: 'var(--text3)', textAlign: 'center' }
const iconBtn = { padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text3)', borderRadius: 6 }
const refreshBtn = { padding: '5px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text2)', fontWeight: 600 }
