import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'
import { Toaster, toast } from 'react-hot-toast'
import SettingsPanel from '../components/SettingsPanel'
import "./Dashboard.css";

const COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6']
const docColor = id => { if(!id) return COLORS[0]; const n = id.charCodeAt(0)+id.charCodeAt(id.length-1); return COLORS[n%COLORS.length] }
const timeAgo = d => { const s=Math.floor((Date.now()-new Date(d))/1000); if(s<60) return 'just now'; if(s<3600) return `${Math.floor(s/60)}m ago`; if(s<86400) return `${Math.floor(s/3600)}h ago`; if(s<604800) return `${Math.floor(s/86400)}d ago`; return new Date(d).toLocaleDateString() }

const TEMPLATES = [
  { icon: '📝', title: 'Meeting Notes', color: '#6366f1', content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n1. \n2. \n3. \n\n## Action Items\n- [ ] \n- [ ] \n\n## Notes\n' },
  { icon: '💻', title: 'Code Snippet', color: '#10b981', content: '// Title: My Code Snippet\n// Language: JavaScript\n\nfunction main() {\n  console.log("Hello, World!");\n}\n\nmain();\n' },
  { icon: '📋', title: 'To-Do List', color: '#f59e0b', content: '# To-Do List\n\n## High Priority\n- [ ] \n- [ ] \n\n## Medium Priority\n- [ ] \n- [ ] \n\n## Low Priority\n- [ ] \n' },
  { icon: '📄', title: 'Blank Document', color: '#8b5cf6', content: '' },
]

export default function Dashboard() {
  const [docs, setDocs] = useState([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(null)
  const [renaming, setRenaming] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [starred, setStarred] = useState(() => JSON.parse(localStorage.getItem('starred') || '[]'))
  const [sidebarTab, setSidebarTab] = useState('all') // 'all' | 'starred' | 'analytics' | 'settings'
  const [globalFontSize, setGlobalFontSize] = useState(() => parseInt(localStorage.getItem('globalFontSize') || '14'))
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const initials = user.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || 'U'
  const menuRef = useRef()

  useEffect(() => { fetchDocs() }, [])
  useEffect(() => {
    function handler(e) { if(menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(null) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const st = localStorage.getItem('token')
    if (!st) { navigate('/'); return }
    if (!sessionStorage.getItem('greeted')) {
      setTimeout(() => toast(`Welcome back, ${user.name?.split(' ')[0] || 'there'} 👋`, { position: 'bottom-center', style: { fontSize: 14 } }), 500)
      sessionStorage.setItem('greeted', 'true')
    }
  }, [navigate, user.name])

  async function fetchDocs() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/docs`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (res.ok && Array.isArray(json)) setDocs(json)
    } catch(e) {
      toast.error('Failed to load documents.')
    } finally { setLoading(false) }
  }

  async function createDoc(templateTitle, templateContent) {
    const docTitle = templateTitle || title.trim()
    if (!docTitle) return
    setCreating(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/docs`, { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body: JSON.stringify({ title: docTitle }) })
      const json = await res.json()
      if (res.ok) {
        setDocs(d => [json, ...d])
        toast.success(`Created "${json.title}"`, { style: { fontSize: 13 } })
        navigate(`/doc/${json.id}`)
      } else toast.error(json.error || 'Failed to create doc')
    } catch(err) { toast.error('Creation failed') } finally { setCreating(false); setTitle('') }
  }

  async function deleteDoc(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this document?')) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/docs/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
      if (res.ok) {
        setDocs(d => d.filter(x => x.id !== id))
        toast('Document deleted', { icon: '🗑️', style: { fontSize: 13 } })
      } else {
        const err = await res.json()
        toast.error(err.error || 'Delete failed')
      }
    } catch(err) { toast.error('Delete failed') }
    setMenuOpen(null)
  }

  async function renameDoc(id) {
    if (!renameVal.trim()) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/docs/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body: JSON.stringify({ title: renameVal }) })
      if (res.ok) {
        setDocs(d => d.map(x => x.id===id ? {...x, title: renameVal} : x))
        toast.success('Document renamed', { style: { fontSize: 13 } })
      } else {
        const err = await res.json()
        toast.error(err.error || 'Rename failed')
      }
    } catch(err) { toast.error('Rename failed') }
    setRenaming(null); setMenuOpen(null)
  }

  function copyLink(id, e) {
    e.stopPropagation()
    navigator.clipboard.writeText(`${window.location.origin}/doc/${id}`)
    setMenuOpen(null)
    toast.success('Link copied!', { style: { fontSize: 13 } })
  }

  function toggleStar(id, e) {
    e.stopPropagation()
    const next = starred.includes(id) ? starred.filter(x => x !== id) : [...starred, id]
    setStarred(next)
    localStorage.setItem('starred', JSON.stringify(next))
  }

  function logout() { localStorage.clear(); navigate('/') }

  // Filter docs based on sidebar tab + search
  let filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()))
  if (sidebarTab === 'starred') filtered = filtered.filter(d => starred.includes(d.id))

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font)' }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: 'var(--bg)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/H&S.png" alt="Logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.3px' }}>CollabSheets</span>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.5px' }}>COLLABORATIVE EDITOR</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px' }} className="stagger">
          {[
            { id: 'all', icon: '📄', label: 'All Documents', count: docs.length },
            { id: 'starred', icon: '⭐', label: 'Starred', count: starred.length },
            { id: 'analytics', icon: '📊', label: 'Analytics' },
            { id: 'settings', icon: '⚙️', label: 'Settings' },
          ].map(tab => (
            <div key={tab.id} onClick={() => setSidebarTab(tab.id)} style={{
              padding: '10px 12px', borderRadius: 8, fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 2,
              background: sidebarTab === tab.id ? 'var(--accent-light)' : 'transparent',
              color: sidebarTab === tab.id ? 'var(--accent)' : 'var(--text2)',
              transition: 'all .15s',
            }}>
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
                <span style={{ flex: 1 }}>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{ fontSize: 11, background: sidebarTab === tab.id ? 'var(--accent)' : 'var(--bg3)',
                    color: sidebarTab === tab.id ? '#fff' : 'var(--text3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                    {tab.count}
                  </span>
                )}
            </div>
          ))}
          <div style={{ height: 1, background: 'var(--border)', margin: '12px 4px' }} />

          {/* Quick Stats */}
          <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Stats</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '4px 8px' }}>
            <StatMini icon="📄" value={docs.length} label="Docs" />
            <StatMini icon="📊" value={docs.reduce((a, d) => a + (d.title?.split(/\s+/).length || 0), 0)} label="Words" />
          </div>
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <button onClick={toggle} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontWeight: 600, transition: 'all .15s' }}>
            {theme==='dark' ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>
          <div onClick={() => setProfileOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: 'var(--bg2)', transition: 'all .15s', border: '1px solid transparent' }}
            onMouseOver={e=>{e.currentTarget.style.background='var(--bg3)';e.currentTarget.style.borderColor='var(--border)'}} onMouseOut={e=>{e.currentTarget.style.background='var(--bg2)';e.currentTarget.style.borderColor='transparent'}}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '36px 48px', maxWidth: 960, overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }} className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.7px' }}>
              {sidebarTab === 'analytics' ? '📊 Analytics' : (sidebarTab === 'starred' ? '⭐ Starred' : (sidebarTab === 'settings' ? '⚙️ Settings' : 'My Documents'))}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                {sidebarTab === 'starred' ? starred.length : docs.length} items
              </div>
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text3)' }}>
            {sidebarTab === 'analytics' ? 'Project insights and productivity metrics' : 
             (sidebarTab === 'starred' ? `${starred.length} starred document${starred.length !== 1 ? 's' : ''}` : (sidebarTab === 'settings' ? 'Customize your editor experience' : 'Create, manage, and collaborate on your documents'))}
          </p>
        </div>

        {sidebarTab === 'settings' ? (
          <div className="fade-in" style={{ maxWidth: 600 }}>
            <SettingsPanel 
              fontSize={globalFontSize} 
              setFontSize={(s) => { setGlobalFontSize(s); localStorage.setItem('globalFontSize', s) }} 
              theme={theme} 
              toggleTheme={toggle} 
              onClose={() => setSidebarTab('all')} 
            />
          </div>
        ) : sidebarTab === 'analytics' ? (
          <div className="fade-in">
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 30 }}>
                <div style={analyticsCard}>
                   <h3 style={cardTitle}>Commit Frequency</h3>
                   <div style={heatmapGrid}>
                      {[...Array(28)].map((_, i) => (
                        <div key={i} style={{ 
                          width: 14, height: 14, borderRadius: 3, 
                          background: `rgba(99, 102, 241, ${Math.random() * 0.9 + 0.1})`,
                          border: '1px solid var(--border)' 
                        }} />
                      ))}
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10, color: 'var(--text3)' }}>
                      <span>Less</span>
                      <span>More</span>
                   </div>
                </div>
                <div style={analyticsCard}>
                   <h3 style={cardTitle}>Language Distribution</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { label: 'JavaScript', val: 45, color: '#f59e0b' },
                        { label: 'Python', val: 30, color: '#6366f1' },
                        { label: 'HTML/CSS', val: 15, color: '#10b981' },
                        { label: 'Other', val: 10, color: '#8b5cf6' }
                      ].map(l => (
                        <div key={l.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, fontWeight: 600 }}>
                            <span style={{ color: 'var(--text2)' }}>{l.label}</span>
                            <span style={{ color: 'var(--text)' }}>{l.val}%</span>
                          </div>
                          <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${l.val}%`, height: '100%', background: l.color }} />
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div style={analyticsCard}>
                <h3 style={cardTitle}>Productivity Insights</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                   <StatItem label="Avg. session" value="42m" change="+12%" />
                   <StatItem label="Typing speed" value="64 wpm" change="+5%" />
                   <StatItem label="Collaboration" value="High" change="Stable" />
                   <StatItem label="Files/Hr" value="2.4" change="-0.8" />
                </div>
             </div>
          </div>
        ) : (
          <div className="fade-in">
            {/* Stats Cards */}
            {sidebarTab === 'all' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }} className="stagger">
                <StatCard icon="📄" value={docs.length} label="Total Documents" gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" />
                <StatCard icon="⭐" value={starred.length} label="Starred" gradient="linear-gradient(135deg,#f59e0b,#f97316)" />
                <StatCard icon="📊" value={docs.length > 0 ? `${Math.ceil(docs.length * 2.4)}k` : '0'} label="Est. Words" gradient="linear-gradient(135deg,#10b981,#06b6d4)" />
              </div>
            )}

            {/* Templates */}
            {sidebarTab === 'all' && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Start from template</div>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                  {TEMPLATES.map(t => (
                    <button key={t.title} onClick={() => createDoc(t.title)} disabled={creating} className="card-hover" style={{
                      minWidth: 140, padding: '18px 16px', borderRadius: 12, background: 'var(--bg)',
                      border: '1.5px solid var(--border)', cursor: 'pointer', textAlign: 'left', flexShrink: 0,
                      transition: 'all .2s',
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: t.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 10 }}>{t.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* New doc */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', border: '1.5px dashed var(--border2)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, transition: 'all .2s' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 20, flexShrink: 0 }}>+</div>
              <input
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: 'var(--text)', background: 'transparent', fontFamily: 'var(--font)' }}
                placeholder="New document title... (press Enter)"
                value={title}
                onChange={e=>setTitle(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&createDoc()}
              />
              <button onClick={() => createDoc()} disabled={creating||!title.trim()} className="btn-glow" style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: creating||!title.trim()?'not-allowed':'pointer', opacity: creating||!title.trim()?0.5:1, flexShrink: 0 }}>
                {creating?'Creating...':'Create'}
              </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 16 }}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents..." style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)', transition: 'border .15s' }} onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
            </div>

            {/* Docs List */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72 }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 80 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{search?'No results':'No documents yet'}</p>
                <p style={{ fontSize: 14, color: 'var(--text3)' }}>{search?'Try a different term':'Create your first document above'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="stagger" ref={menuRef}>
                {filtered.map(doc => (
                  <div key={doc.id} style={{ position: 'relative', zIndex: menuOpen === doc.id ? 10 : 1 }}>
                    {renaming === doc.id ? (
                      <div style={{ display: 'flex', gap: 8, background: 'var(--bg2)', borderRadius: 12, padding: 14, border: '1.5px solid var(--accent)' }}>
                        <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')renameDoc(doc.id);if(e.key==='Escape')setRenaming(null)}}
                          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, background: 'transparent', color: 'var(--text)', fontFamily: 'var(--font)' }}/>
                        <button onClick={()=>renameDoc(doc.id)} style={{ padding: '6px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                        <button onClick={()=>setRenaming(null)} style={{ padding: '6px 14px', background: 'var(--bg3)', color: 'var(--text2)', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    ) : (
                      <div onClick={()=>navigate(`/doc/${doc.id}`)} className="card-hover" style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', cursor: 'pointer' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: docColor(doc.id), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 20, fontWeight: 900, color: 'rgba(255,255,255,0.9)' }}>{doc.title[0]?.toUpperCase()}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{doc.title}</div>
                            {starred.includes(doc.id) && <span style={{ fontSize: 12 }}>⭐</span>}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Edited {timeAgo(doc.updated_at)}</div>
                        </div>
                        {/* Star toggle */}
                        <button onClick={e => toggleStar(doc.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '4px 6px', borderRadius: 6, color: starred.includes(doc.id) ? '#f59e0b' : 'var(--text3)', transition: 'all .15s' }}
                          onMouseOver={e=>e.target.style.background='var(--bg3)'} onMouseOut={e=>e.target.style.background='none'}>
                          {starred.includes(doc.id) ? '★' : '☆'}
                        </button>
                        <button onClick={e=>{e.stopPropagation();setMenuOpen(menuOpen===doc.id?null:doc.id)}} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 6, color: 'var(--text3)', fontSize: 18, lineHeight: 1 }}
                          onMouseOver={e=>e.target.style.background='var(--bg3)'} onMouseOut={e=>e.target.style.background='none'}>⋯</button>
                        {menuOpen===doc.id && (
                          <div className="scale-in" style={{ position: 'absolute', right: 12, top: 60, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', zIndex: 100, minWidth: 180, overflow: 'hidden' }}>
                            {[
                              ['✏️', 'Rename', ()=>{setRenaming(doc.id);setRenameVal(doc.title);setMenuOpen(null)}],
                              ['🔗', 'Copy link', e=>copyLink(doc.id,e)],
                              ['🗑️', 'Delete', e=>deleteDoc(doc.id,e)],
                            ].map(([icon,label,action])=>(
                              <button key={label} onClick={action} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: label==='Delete'?'var(--red)':'var(--text)', textAlign: 'left', transition: 'background .1s' }}
                                onMouseOver={e=>e.currentTarget.style.background='var(--bg2)'} onMouseOut={e=>e.currentTarget.style.background='none'}>
                                <span>{icon}</span>{label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Profile modal */}
      {profileOpen && (
        <div className="modal-backdrop" onClick={()=>setProfileOpen(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 22 }}>{initials}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{user.name}</div>
                <div style={{ fontSize: 14, color: 'var(--text3)' }}>{user.email}</div>
              </div>
            </div>
            <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: 'var(--text2)' }}>Total documents</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{docs.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: 'var(--text2)' }}>Starred</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{starred.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text2)' }}>Member since</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{new Date().toLocaleDateString('en',{month:'long',year:'numeric'})}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={()=>setProfileOpen(false)} style={{ flex: 1, padding: '10px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>Close</button>
              <button onClick={logout} style={{ flex: 1, padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#b91c1c', fontWeight: 600 }}>Sign out</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating About Developer */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>
        {aboutOpen && (
          <div className="scale-in" style={{ position: 'absolute', bottom: 70, right: 0, width: 340, background: 'var(--bg)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '24px 20px', textAlign: 'center', position: 'relative' }}>
               <button onClick={()=>setAboutOpen(false)} style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.1)', color:'#fff', border:'none', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14 }}>✕</button>
               <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', padding: 3, margin: '0 auto 12px' }}>
                 <img src="/H&S.png" alt="Developer" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
               </div>
               <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Nejamul Haque</h3>
               <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Full Stack Developer & AI Engineer</p>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <a href="https://github.com/NejamulHaque" target="_blank" rel="noreferrer" style={{ flex: 1, padding: '8px 0', textAlign: 'center', background: 'var(--bg2)', color: 'var(--text)', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)' }}>GitHub</a>
                <a href="https://linkedin.com/in/nejamulhaque" target="_blank" rel="noreferrer" style={{ flex: 1, padding: '8px 0', textAlign: 'center', background: 'var(--bg2)', color: 'var(--text)', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)' }}>LinkedIn</a>
                <a href="https://portfolio-nejamulhaque.vercel.app/" target="_blank" rel="noreferrer" style={{ flex: 1, padding: '8px 0', textAlign: 'center', background: 'var(--bg2)', color: 'var(--text)', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)' }}>Portfolio</a>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: 'var(--bg2)', borderRadius: 12, border: '1px dashed var(--border2)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Support my work ☕</h4>
                <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 12px', lineHeight: 1.4 }}>If you find CollabSheets helpful, consider supporting its development!</p>
                <div style={{ background: '#fff', padding: 8, display: 'inline-block', borderRadius: 8, boxShadow: 'var(--shadow)', marginBottom: 8 }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=nejamulhaque@freecharge&pn=Nejamul%20Haque&cu=INR`} alt="UPI QR Code" style={{ width: 120, height: 120, display: 'block' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, letterSpacing: 0.5 }}>SCAN TO PAY VIA UPI</div>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setAboutOpen(!aboutOpen)}
          className="btn-glow"
          style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', boxShadow: 'var(--shadow-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transition: 'transform .2s' }}
        >
          {aboutOpen ? '✕' : '👨‍💻'}
        </button>
      </div>

      <Toaster />
    </div>
  )
}

/* Stat Card */
function StatCard({ icon, value, label, gradient }) {
  return (
    <div className="card-hover" style={{ padding: '20px 18px', borderRadius: 14, background: 'var(--bg)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -10, right: -10, width: 50, height: 50, borderRadius: '50%', background: gradient, opacity: 0.1 }} />
      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  )
}

/* Sidebar stat mini */
function StatMini({ icon, value, label }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--border)', textAlign: 'center' }}>
      <div style={{ fontSize: 14 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function StatItem({ label, value, change }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 10, color: change.startsWith('+') ? '#10b981' : (change === 'Stable' ? 'var(--text3)' : '#ef4444'), fontWeight: 700 }}>{change}</div>
    </div>
  )
}

const analyticsCard = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)' }
const cardTitle = { fontSize: 15, fontWeight: 800, color: 'var(--text)', margin: '0 0 20px 0', letterSpacing: '-0.3px' }
const heatmapGrid = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, width: 'fit-content' }