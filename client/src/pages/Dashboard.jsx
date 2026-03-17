import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'
import { Toaster, toast } from 'react-hot-toast'

const COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6']
const docColor = id => { if(!id) return COLORS[0]; const n = id.charCodeAt(0)+id.charCodeAt(id.length-1); return COLORS[n%COLORS.length] }
const timeAgo = d => { const s=Math.floor((Date.now()-new Date(d))/1000); if(s<60) return 'just now'; if(s<3600) return `${Math.floor(s/60)}m ago`; if(s<86400) return `${Math.floor(s/3600)}h ago`; if(s<604800) return `${Math.floor(s/86400)}d ago`; return new Date(d).toLocaleDateString() }

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
    // Default greeting toast on login (only show once per session)
    if (!sessionStorage.getItem('greeted')) {
      setTimeout(() => toast(`Welcome back, ${user.name.split(' ')[0]} 👋`, { position: 'bottom-center', style: { fontSize: 14 } }), 500)
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

  async function createDoc() {
    if (!title.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/docs`, { method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}, body: JSON.stringify({ title }) })
      const json = await res.json()
      if (res.ok) {
        setDocs(d => [json, ...d])
        toast.success(`Created "${json.title}"`, { style: { fontSize: 13 } })
        navigate(`/doc/${json.id}`)
      } else toast.error(json.error || 'Failed to create doc')
    } catch(err) { toast.error('Creation failed') } finally { setCreating(false) }
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
    show('Link copied to clipboard')
  }

  function logout() { localStorage.clear(); navigate('/') }

  const filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font)' }}>
      {/* Sidebar */}
      <aside style={{ width:240, background:'var(--bg)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', height:'100vh', position:'sticky', top:0 }}>
        <div style={{ padding:'20px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <img src="/H&S.png" alt="Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
            <span style={{ fontWeight:700, fontSize:16, color:'var(--text)' }}>CollabSheets</span>
          </div>
        </div>

        <nav style={{ flex:1, padding:'12px 8px' }}>
          <div style={{ padding:'8px 12px', borderRadius:8, background:'var(--accent-light)', color:'var(--accent)', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:8, marginBottom: 4, cursor:'pointer' }}>
            <span>📄</span> All Documents
          </div>
        </nav>

        <div style={{ padding:'12px 8px', borderTop:'1px solid var(--border)' }}>
          <button onClick={toggle} style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text2)', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            {theme==='dark' ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>
          <div onClick={() => setProfileOpen(true)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, cursor:'pointer', background:'var(--bg2)' }}
            onMouseOver={e=>e.currentTarget.style.background='var(--bg3)'} onMouseOut={e=>e.currentTarget.style.background='var(--bg2)'}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:12, flexShrink:0 }}>{initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</div>
              <div style={{ fontSize:11, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, padding:'40px 48px', maxWidth:900 }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:26, fontWeight:800, color:'var(--text)', letterSpacing:'-0.5px', marginBottom:4 }}>My Documents</h1>
          <p style={{ fontSize:14, color:'var(--text3)' }}>{docs.length} document{docs.length!==1?'s':''}</p>
        </div>

        {/* New doc */}
        <div style={{ display:'flex', alignItems:'center', gap:12, background:'var(--bg)', border:'1.5px dashed var(--border2)', borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:20, flexShrink:0 }}>+</div>
          <input
            style={{ flex:1, border:'none', outline:'none', fontSize:15, color:'var(--text)', background:'transparent' }}
            placeholder="New document title... (press Enter)"
            value={title}
            onChange={e=>setTitle(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&createDoc()}
          />
          <button onClick={createDoc} disabled={creating||!title.trim()} style={{ padding:'8px 18px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor: creating||!title.trim()?'not-allowed':'pointer', opacity: creating||!title.trim()?0.5:1, flexShrink:0 }}>
            {creating?'Creating...':'Create'}
          </button>
        </div>

        {/* Search */}
        <div style={{ position:'relative', marginBottom:20 }}>
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', fontSize:16 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents..." style={{ width:'100%', padding:'10px 14px 10px 40px', borderRadius:10, border:'1.5px solid var(--border)', fontSize:14, outline:'none', background:'var(--bg)', color:'var(--text)' }} onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
        </div>

        {/* Docs */}
        {loading ? (
          <div style={{ textAlign:'center', padding:80 }}>
            <div style={{ width:32, height:32, border:'3px solid var(--border)', borderTop:'3px solid var(--accent)', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }}/>
            <p style={{ color:'var(--text3)', fontSize:14 }}>Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:80 }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📄</div>
            <p style={{ fontSize:17, fontWeight:600, color:'var(--text)', marginBottom:6 }}>{search?'No results':'No documents yet'}</p>
            <p style={{ fontSize:14, color:'var(--text3)' }}>{search?'Try a different term':'Create your first document above'}</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }} className="fade-in" ref={menuRef}>
            {filtered.map(doc => (
              <div key={doc.id}>
                {renaming === doc.id ? (
                  <div style={{ display:'flex', gap:8, background:'var(--bg2)', borderRadius:12, padding:14, border:'1.5px solid var(--accent)' }}>
                    <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')renameDoc(doc.id);if(e.key==='Escape')setRenaming(null)}}
                      style={{ flex:1, border:'none', outline:'none', fontSize:15, fontWeight:600, background:'transparent', color:'var(--text)' }}/>
                    <button onClick={()=>renameDoc(doc.id)} style={{ padding:'6px 14px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer' }}>Save</button>
                    <button onClick={()=>setRenaming(null)} style={{ padding:'6px 14px', background:'var(--bg3)', color:'var(--text2)', border:'none', borderRadius:6, fontSize:13, cursor:'pointer' }}>Cancel</button>
                  </div>
                ) : (
                  <div onClick={()=>navigate(`/doc/${doc.id}`)} style={{ display:'flex', alignItems:'center', gap:14, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px', cursor:'pointer', transition:'all .15s', position:'relative' }}
                    onMouseOver={e=>{e.currentTarget.style.background='var(--bg2)';e.currentTarget.style.borderColor='var(--border2)'}}
                    onMouseOut={e=>{e.currentTarget.style.background='var(--bg)';e.currentTarget.style.borderColor='var(--border)'}}>
                    <div style={{ width:44, height:44, borderRadius:10, background:docColor(doc.id), display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:20, fontWeight:900, color:'rgba(255,255,255,0.9)' }}>{doc.title[0]?.toUpperCase()}</span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>{doc.title}</div>
                      <div style={{ fontSize:12, color:'var(--text3)' }}>Edited {timeAgo(doc.updated_at)}</div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();setMenuOpen(menuOpen===doc.id?null:doc.id)}} style={{ background:'none', border:'none', cursor:'pointer', padding:'6px 8px', borderRadius:6, color:'var(--text3)', fontSize:18, lineHeight:1 }}
                      onMouseOver={e=>e.target.style.background='var(--bg3)'} onMouseOut={e=>e.target.style.background='none'}>⋯</button>
                    {menuOpen===doc.id && (
                      <div style={{ position:'absolute', right:12, top:56, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10, boxShadow:'var(--shadow-lg)', zIndex:100, minWidth:180, overflow:'hidden' }}>
                        {[
                          ['✏️', 'Rename', ()=>{setRenaming(doc.id);setRenameVal(doc.title);setMenuOpen(null)}],
                          ['🔗', 'Copy link', e=>copyLink(doc.id,e)],
                          ['🗑️', 'Delete', e=>deleteDoc(doc.id,e)],
                        ].map(([icon,label,action])=>(
                          <button key={label} onClick={action} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 14px', background:'none', border:'none', cursor:'pointer', fontSize:14, color: label==='Delete'?'var(--red)':'var(--text)', textAlign:'left' }}
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
      </main>

      {/* Profile modal */}
      {profileOpen && (
        <div className="modal-backdrop" onClick={()=>setProfileOpen(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:22 }}>{initials}</div>
              <div>
                <div style={{ fontSize:18, fontWeight:700, color:'var(--text)' }}>{user.name}</div>
                <div style={{ fontSize:14, color:'var(--text3)' }}>{user.email}</div>
              </div>
            </div>
            <div style={{ background:'var(--bg2)', borderRadius:10, padding:16, marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:8 }}>
                <span style={{ color:'var(--text2)' }}>Total documents</span>
                <span style={{ fontWeight:600, color:'var(--text)' }}>{docs.length}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                <span style={{ color:'var(--text2)' }}>Member since</span>
                <span style={{ fontWeight:600, color:'var(--text)' }}>{new Date().toLocaleDateString('en',{month:'long',year:'numeric'})}</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setProfileOpen(false)} style={{ flex:1, padding:'10px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', fontSize:14, color:'var(--text)', fontWeight:500 }}>Close</button>
              <button onClick={logout} style={{ flex:1, padding:'10px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, cursor:'pointer', fontSize:14, color:'#b91c1c', fontWeight:600 }}>Sign out</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating About Developer Section */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>
        {aboutOpen && (
          <div className="fade-in" style={{ position: 'absolute', bottom: 70, right: 0, width: 340, background: 'var(--bg)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
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
          style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', boxShadow: 'var(--shadow-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, transition: 'transform .2s' }}
          onMouseOver={e=>e.currentTarget.style.transform='scale(1.05)'}
          onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}
          title="About Developer"
        >
          {aboutOpen ? '✕' : '👨‍💻'}
        </button>
      </div>

      <Toaster />
    </div>
  )
}