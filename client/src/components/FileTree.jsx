import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL

export default function FileTree({ projectId, activeDocId, onClose }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(new Set())
  const [renaming, setRenaming] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!projectId) return
    fetchTree()
  }, [projectId])

  async function fetchTree() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/files/${projectId}/tree`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setFiles(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  async function createItem(parentId, isFolder) {
    const name = window.prompt(isFolder ? 'Folder name:' : 'File name (e.g. index.js):')
    if (!name?.trim()) return
    try {
      await fetch(`${API}/files/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), is_folder: isFolder, parent_id: parentId || null }),
      })
      fetchTree()
    } catch {}
  }

  async function deleteItem(id) {
    if (!window.confirm('Delete this item?')) return
    try {
      await fetch(`${API}/files/${projectId}/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      })
      fetchTree()
    } catch {}
  }

  async function renameItem(id) {
    if (!renameVal.trim()) return
    try {
      await fetch(`${API}/files/${projectId}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: renameVal.trim() }),
      })
      setRenaming(null)
      fetchTree()
    } catch {}
  }

  function getIcon(file) {
    if (file.is_folder) return expanded.has(file.id) ? '📂' : '📁'
    const ext = file.name.split('.').pop().toLowerCase()
    const icons = { js:'🟨', jsx:'⚛️', ts:'🔷', tsx:'⚛️', py:'🐍', html:'🌐', css:'🎨', json:'📋', md:'📝', java:'☕', cpp:'⚙️', rs:'🦀', sql:'🗄️', sh:'🖥️', txt:'📄' }
    return icons[ext] || '📄'
  }

  // Build tree structure from flat list
  function buildTree(flat, parentId = null) {
    return flat.filter(f => (f.parent_id || null) === parentId)
      .sort((a, b) => {
        if (a.is_folder !== b.is_folder) return a.is_folder ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }

  function renderNode(file, depth = 0) {
    const children = buildTree(files, file.id)
    const isActive = file.doc_id === activeDocId
    const isExpanded = expanded.has(file.id)

    return (
      <div key={file.id}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            paddingLeft: 8 + depth * 14, paddingRight: 8, height: 28,
            cursor: 'pointer', borderRadius: 4, margin: '1px 4px',
            background: isActive ? 'var(--accent-light)' : 'transparent',
            color: isActive ? 'var(--accent)' : 'var(--text)',
            fontWeight: isActive ? 600 : 400,
            transition: 'background .1s',
          }}
          onClick={() => {
            if (file.is_folder) {
              setExpanded(prev => {
                const next = new Set(prev)
                next.has(file.id) ? next.delete(file.id) : next.add(file.id)
                return next
              })
            } else if (file.doc_id) {
              navigate(`/doc/${file.doc_id}`)
            }
          }}
          onMouseEnter={e => {
            if (!isActive) e.currentTarget.style.background = 'var(--bg2)'
          }}
          onMouseLeave={e => {
            if (!isActive) e.currentTarget.style.background = 'transparent'
          }}
        >
          {file.is_folder && (
            <span style={{ fontSize: 8, color: 'var(--text3)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .15s' }}>▶</span>
          )}
          <span style={{ fontSize: 13 }}>{getIcon(file)}</span>
          {renaming === file.id ? (
            <input
              autoFocus value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              onBlur={() => renameItem(file.id)}
              onKeyDown={e => { if (e.key === 'Enter') renameItem(file.id); if (e.key === 'Escape') setRenaming(null) }}
              onClick={e => e.stopPropagation()}
              style={{ flex: 1, fontSize: 12, background: 'var(--bg)', border: '1px solid var(--accent)', borderRadius: 4, padding: '1px 5px', color: 'var(--text)', outline: 'none' }}
            />
          ) : (
            <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              onDoubleClick={e => { e.stopPropagation(); setRenaming(file.id); setRenameVal(file.name) }}>
              {file.name}
            </span>
          )}
          <div style={{ display: 'flex', gap: 1, opacity: 0, transition: 'opacity .1s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}
          >
            {file.is_folder && (
              <>
                <button onClick={e => { e.stopPropagation(); createItem(file.id, false) }} style={tinyBtn} title="New file">+📄</button>
                <button onClick={e => { e.stopPropagation(); createItem(file.id, true) }} style={tinyBtn} title="New folder">+📁</button>
              </>
            )}
            <button onClick={e => { e.stopPropagation(); deleteItem(file.id) }} style={{ ...tinyBtn, color: '#ef4444' }} title="Delete">✕</button>
          </div>
        </div>
        {file.is_folder && isExpanded && children.map(c => renderNode(c, depth + 1))}
      </div>
    )
  }

  const roots = buildTree(files)

  return (
    <div style={panel}>
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>🗂️</span>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Files</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => createItem(null, false)} style={iconBtn} title="New file">+📄</button>
          <button onClick={() => createItem(null, true)} style={iconBtn} title="New folder">+📁</button>
          <button onClick={fetchTree} style={iconBtn} title="Refresh">↺</button>
          {onClose && <button onClick={onClose} style={iconBtn}>✕</button>}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
        {loading && <div style={emptyMsg}>Loading…</div>}
        {!loading && roots.length === 0 && (
          <div style={emptyMsg}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🗂️</div>
            <div>Empty project. Click + to add files.</div>
          </div>
        )}
        {roots.map(f => renderNode(f))}
      </div>
    </div>
  )
}

const panel = { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', borderRight: '1px solid var(--border)', minWidth: 0 }
const header = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg2)' }
const emptyMsg = { padding: '24px 16px', fontSize: 12, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.8 }
const iconBtn = { padding: '3px 7px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text3)', borderRadius: 5 }
const tinyBtn = { padding: '1px 4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: 'var(--text3)', borderRadius: 4 }
