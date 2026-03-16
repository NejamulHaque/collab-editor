import { useState, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL

export default function CommentsPanel({ docId, onClose }) {
  const [comments, setComments] = useState([])
  const [input, setInput] = useState('')
  const [lineNum, setLineNum] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showResolved, setShowResolved] = useState(false)
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchComments()
    const iv = setInterval(fetchComments, 8000) // poll every 8s
    return () => clearInterval(iv)
  }, [docId])

  async function fetchComments() {
    try {
      const res = await fetch(`${API}/comments/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setComments(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  async function addComment() {
    if (!input.trim()) return
    setSending(true)
    try {
      const res = await fetch(`${API}/comments/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: input.trim(), line_number: lineNum ? parseInt(lineNum) : null }),
      })
      const c = await res.json()
      setComments(prev => [...prev, c])
      setInput('')
      setLineNum('')
    } catch {}
    setSending(false)
  }

  async function toggleResolve(c) {
    try {
      const res = await fetch(`${API}/comments/${docId}/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resolved: !c.resolved }),
      })
      const updated = await res.json()
      setComments(prev => prev.map(x => x.id === c.id ? updated : x))
    } catch {}
  }

  async function deleteComment(id) {
    try {
      await fetch(`${API}/comments/${docId}/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      })
      setComments(prev => prev.filter(c => c.id !== id))
    } catch {}
  }

  const visible = comments.filter(c => showResolved || !c.resolved)
  const resolvedCount = comments.filter(c => c.resolved).length

  function timeAgo(iso) {
    const m = Math.floor((Date.now() - new Date(iso)) / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    if (m < 1440) return `${Math.floor(m/60)}h ago`
    return `${Math.floor(m/1440)}d ago`
  }

  return (
    <div style={panel}>
      {/* Header */}
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>💬</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Comments</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{visible.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {resolvedCount > 0 && (
            <button onClick={() => setShowResolved(s => !s)} style={filterBtn}>
              {showResolved ? 'Hide' : `Show ${resolvedCount} resolved`}
            </button>
          )}
          <button onClick={onClose} style={iconBtn}>✕</button>
        </div>
      </div>

      {/* Comment list */}
      <div style={list}>
        {loading && <div style={emptyMsg}>Loading…</div>}
        {!loading && visible.length === 0 && <div style={emptyMsg}>No comments yet. Be the first!</div>}
        {visible.map(c => (
          <div key={c.id} style={{ ...commentCard, opacity: c.resolved ? 0.6 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={avatar}>{(c.author || 'U')[0].toUpperCase()}</div>
                <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text)' }}>{c.author || 'User'}</span>
                {c.line_number && (
                  <span style={{ fontSize: 10, background: 'var(--accent-light)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>
                    L{c.line_number}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>{timeAgo(c.created_at)}</span>
                <button onClick={() => toggleResolve(c)} title={c.resolved ? 'Unresolve' : 'Resolve'} style={microBtn}>
                  {c.resolved ? '↩' : '✓'}
                </button>
                {c.user_id === user.id && (
                  <button onClick={() => deleteComment(c.id)} title="Delete" style={{ ...microBtn, color: '#ef4444' }}>✕</button>
                )}
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.5, paddingLeft: 26 }}>{c.content}</p>
            {c.resolved && <span style={{ fontSize: 10, color: '#059669', paddingLeft: 26, fontWeight: 700 }}>✓ Resolved</span>}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={inputArea}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input
            type="number"
            value={lineNum}
            onChange={e => setLineNum(e.target.value)}
            placeholder="Line #"
            style={{ ...lineInput }}
          />
          <span style={{ fontSize: 11, color: 'var(--text3)', alignSelf: 'center' }}>optional</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addComment() }}
            placeholder="Add a comment… (Ctrl+Enter to submit)"
            rows={2}
            style={textarea}
          />
          <button onClick={addComment} disabled={!input.trim() || sending} style={sendBtn}>
            {sending ? '…' : '➤'}
          </button>
        </div>
      </div>
    </div>
  )
}

const panel = { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', borderLeft: '1px solid var(--border)' }
const header = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg2)' }
const list = { flex: 1, overflowY: 'auto' }
const commentCard = { padding: '10px 14px', borderBottom: '1px solid var(--border)', transition: 'opacity .2s' }
const avatar = { width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
const inputArea = { padding: '10px 12px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg2)' }
const textarea = { flex: 1, resize: 'none', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }
const sendBtn = { padding: '6px 12px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 16, flexShrink: 0 }
const iconBtn = { padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text3)', borderRadius: 6 }
const filterBtn = { padding: '3px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, cursor: 'pointer', color: 'var(--text2)' }
const microBtn = { padding: '1px 5px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text3)', borderRadius: 4 }
const lineInput = { width: 70, padding: '4px 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text)', outline: 'none' }
const emptyMsg = { padding: '20px', fontSize: 13, color: 'var(--text3)', textAlign: 'center' }
