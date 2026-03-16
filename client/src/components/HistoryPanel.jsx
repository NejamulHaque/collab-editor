import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

export default function HistoryPanel({ docId, onClose, onRestore }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewing, setPreviewing] = useState(null)
  const [previewText, setPreviewText] = useState('')
  const [saving, setSaving] = useState(false)
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchVersions()
  }, [docId])

  async function fetchVersions() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/history/${docId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setVersions(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  async function preview(version) {
    setPreviewing(version.id)
    setPreviewText('Loading…')
    try {
      const res = await fetch(`${API}/history/${docId}/${version.id}/content`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setPreviewText(data.text || '(empty)')
    } catch {
      setPreviewText('Failed to load preview.')
    }
  }

  async function saveNamedVersion() {
    const msg = window.prompt('Version name / commit message:', 'Manual save')
    if (!msg) return
    setSaving(true)
    try {
      // We need the current doc state from the parent
      const res = await fetch(`${API}/history/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ commit_msg: msg }),
      })
      if (res.ok) await fetchVersions()
    } catch {}
    setSaving(false)
  }

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso)
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div style={panel}>
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🕐</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Version History</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{versions.length} versions</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={saveNamedVersion} disabled={saving} style={saveBtn} title="Save current as named version">
            {saving ? '…' : '+ Save'}
          </button>
          <button onClick={onClose} style={iconBtn}>✕</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Version list */}
        <div style={list}>
          {loading && <div style={emptyMsg}>Loading…</div>}
          {!loading && versions.length === 0 && <div style={emptyMsg}>No versions yet. Edit and save to create one.</div>}
          {versions.map(v => (
            <div key={v.id} onClick={() => preview(v)}
              style={{ ...versionItem, background: previewing === v.id ? 'var(--bg3)' : 'transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>{v.commit_msg || 'Auto-save'}</span>
                {previewing === v.id && onRestore && (
                  <button
                    onClick={e => { e.stopPropagation(); onRestore(previewText) }}
                    style={{ padding: '2px 9px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
                  >Restore</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{timeAgo(v.created_at)}</span>
                {v.author && <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {v.author}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Preview pane */}
        {previewing && (
          <div style={previewPane}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: 1 }}>PREVIEW</div>
            <pre style={{ flex: 1, overflow: 'auto', padding: '12px', margin: 0, fontSize: 12, fontFamily: 'var(--font-mono)', lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {previewText}
            </pre>
            {onRestore && (
              <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => onRestore(previewText)}
                  style={{ padding: '6px 16px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >Restore this version</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const panel = { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', borderLeft: '1px solid var(--border)' }
const header = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg2)' }
const list = { width: 240, borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }
const previewPane = { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
const versionItem = { padding: '10px 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .1s' }
const emptyMsg = { padding: '20px 16px', fontSize: 13, color: 'var(--text3)', textAlign: 'center' }
const saveBtn = { padding: '4px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--text2)' }
const iconBtn = { padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text3)', borderRadius: 6 }
