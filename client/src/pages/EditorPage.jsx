import { useRef, useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCollabEditor } from '../hooks/useCollabEditor'
import OnlineUsers from '../components/OnlineUsers'
import LanguageSelector from '../components/LanguageSelector'
import CommandPalette from '../components/CommandPalette'
import AIChatPanel from '../components/AIChatPanel'
import TerminalPanel from '../components/TerminalPanel'
import HistoryPanel from '../components/HistoryPanel'
import CommentsPanel from '../components/CommentsPanel'
import LiveChat from '../components/LiveChat'
import InviteModal from '../components/InviteModal'
import ViewerLog from '../components/ViewerLog'
import SplitPane from '../components/SplitPane'
import RichTextEditor from '../components/RichTextEditor'
import { useTheme } from '../context/ThemeContext.jsx'
import { Toast, useToast } from '../components/Toast.jsx'
import { Toaster, toast } from 'react-hot-toast'

// Panel identifiers for right sidebar
const PANELS = {
  AI:      'ai',
  HISTORY: 'history',
  COMMENTS:'comments',
  CHAT:    'chat',
  VIEWERS: 'viewers',
}

export default function EditorPage() {
  const { docId } = useParams()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [userRole, setUserRole] = useState('viewer')
  const isEditable = userRole === 'owner' || userRole === 'editor'
  
  const { connected, peers, wordCount, content, detectedLang, setLanguage, providerRef, ydocRef } = useCollabEditor(containerRef, docId, user, isEditable)
  const { theme, toggle } = useTheme()
  const { toast: showToast, show } = useToast() // Renamed to avoid conflict with react-hot-toast's toast

  const [docTitle, setDocTitle] = useState('Untitled')
  const [editingTitle, setEditingTitle] = useState(false)
  const [selectedLang, setSelectedLang] = useState('auto')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [zenMode, setZenMode] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [fontSize, setFontSize] = useState(14)
  const [recentDocs, setRecentDocs] = useState([])

  // Panel visibility
  const [rightPanel, setRightPanel] = useState(null)   // null | PANELS.*
  const [showTerminal, setShowTerminal] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showViewers, setShowViewers] = useState(false)
  const [editorMode, setEditorMode] = useState('code') // 'code' | 'doc'

  const token = localStorage.getItem('token')
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  // Load title + recent docs
  useEffect(() => {
    async function load() {
      // First, check for invite link
      const params = new URLSearchParams(window.location.search)
      const inviteToken = params.get('invite')
      if (inviteToken && token) {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/invite/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ token: inviteToken })
          })
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname)
          if (show) show('You have joined the document!', 'success')
        } catch (e) {
          if (show) show('Invalid or expired invite link.', 'error')
        }
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/docs`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const docs = await res.json()
        setRecentDocs(Array.isArray(docs) ? docs : [])
        const doc = docs.find(d => d.id === docId)
        if (doc) { setDocTitle(doc.title); autoLangFromTitle(doc.title) }

        // Fetch user role
        const membersRes = await fetch(`${import.meta.env.VITE_API_URL}/invite/members/${docId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const members = await membersRes.json()
        const me = members.find(m => m.id === user.id)
        if (me) setUserRole(me.role)
      } catch(e) {}
    }
    load()
  }, [docId, token])

  // Log this view
  useEffect(() => {
    if (!docId || !token) return
    fetch(`${import.meta.env.VITE_API_URL}/invite/view/${docId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {})
  }, [docId])

  // Apply font size to editor
  useEffect(() => {
    const el = document.querySelector('.cm-editor')
    if (el) el.style.fontSize = `${fontSize}px`
  }, [fontSize])

  // Advanced Notifications: Presence (Joined/Left)
  const prevPeersRef = useRef([])
  // We use this ref to access the current rightPanel inside event listeners without closure staleness
  const rightPanelRef = useRef(rightPanel)
  useEffect(() => { rightPanelRef.current = rightPanel }, [rightPanel])

  useEffect(() => {
    if (!connected) return
    const prev = prevPeersRef.current
    const current = peers
    
    // find new peers
    current.forEach(p => {
      if (!prev.find(x => x.clientId === p.clientId)) {
        toast.success(`${p.name} joined the document`, { position: 'bottom-right', style: { fontSize: 13, background: 'var(--bg2)', color: 'var(--text)' } })
      }
    })
    
    // find left peers
    prev.forEach(p => {
      if (!current.find(x => x.clientId === p.clientId)) {
        toast(`${p.name} left the document`, { icon: '👋', position: 'bottom-right', style: { fontSize: 13, background: 'var(--bg2)', color: 'var(--text)' } })
      }
    })
    
    prevPeersRef.current = current
  }, [peers, connected])

  // Advanced Notifications: Global Live Chat Popups
  useEffect(() => {
    if (!connected || !ydocRef.current) return
    const ydoc = ydocRef.current
    const chatArray = ydoc.getArray('chat-messages')
    
    const handleNewChat = (event) => {
      // Don't show popup if they already have the chat panel open!
      if (rightPanelRef.current === PANELS.CHAT) return

      event.changes.added.forEach(item => {
        item.content.getContent().forEach(msg => {
          if (msg.authorId !== user.id) {
            toast((t) => (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: msg.color || 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {(msg.author || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 13, color: 'var(--text)' }}>{msg.author}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{msg.content}</div>
                </div>
                <button 
                  onClick={() => { toast.dismiss(t.id); setRightPanel(PANELS.CHAT) }}
                  style={{ marginLeft: 'auto', padding: '6px 12px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: '0.2s' }}
                >
                  Reply
                </button>
              </div>
            ), { duration: 5000, position: 'top-right', style: { background: 'var(--bg)', border: '1px solid var(--border)' } })
          }
        })
      })
    }
    
    chatArray.observe(handleNewChat)
    return () => chatArray.unobserve(handleNewChat)
  }, [connected, user.id, setRightPanel])

  function togglePanel(name) {
    setRightPanel(prev => prev === name ? null : name)
  }

  // Global keyboard shortcuts
  useEffect(() => {
    function handler(e) {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === 'p')  { e.preventDefault(); setPaletteOpen(true); return }
      if (mod && e.key === 'k') {
        window._pendingK = () => setZenMode(z => !z)
        setTimeout(() => { window._pendingK = null }, 800)
        return
      }
      if (e.key === 'z' && window._pendingK) { e.preventDefault(); window._pendingK(); window._pendingK = null; return }
      if (mod && (e.key === '=' || e.key === '+')) { e.preventDefault(); setFontSize(f => Math.min(f + 1, 24)); return }
      if (mod && e.key === '-') { e.preventDefault(); setFontSize(f => Math.max(f - 1, 10)); return }
      if (mod && e.shiftKey && e.key === 'H') { e.preventDefault(); navigate('/dashboard'); return }
      if (e.key === 'F2') { e.preventDefault(); setEditingTitle(true); return }
      // Feature shortcuts
      if (mod && e.shiftKey && e.key === 'A') { e.preventDefault(); togglePanel(PANELS.AI); return }
      if (mod && e.shiftKey && e.key === 'T') { e.preventDefault(); setShowTerminal(s => !s); return }
      if (mod && e.shiftKey && e.key === 'C') { e.preventDefault(); togglePanel(PANELS.COMMENTS); return }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, rightPanel])

  function autoLangFromTitle(title) {
    const ext = title.split('.').pop().toLowerCase()
    const map = { js:'javascript', jsx:'javascript', ts:'typescript', tsx:'typescript', py:'python', html:'html', css:'css', json:'json', java:'java', cpp:'cpp', c:'cpp', rs:'rust', sql:'sql', md:'markdown', php:'php', xml:'xml', txt:'plaintext' }
    if (map[ext]) { setSelectedLang(map[ext]); setLanguage(map[ext]) }
    if (['md', 'txt', 'rtf', 'doc', 'docx'].includes(ext)) { setEditorMode('doc') } else { setEditorMode('code') }
  }

  function handleLangSelect(langId) {
    setSelectedLang(langId)
    setLanguage(langId)
    toast.success(`Language: ${langId === 'auto' ? 'Auto detect' : langId}`, { style: { fontSize: 13 } })
  }

  async function saveTitle(newTitle) {
    if (!isEditable || !newTitle.trim()) return
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/docs/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle })
      })
      setDocTitle(newTitle)
      autoLangFromTitle(newTitle)
      toast.success('Title saved', { position: 'bottom-center', style: { fontSize: 13 } })
    } catch(e) {
      toast.error('Failed to save title')
    }
    setEditingTitle(false)
  }

  function exportContent(ext, mime) {
    const blob = new Blob([content], { type: mime })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${docTitle.replace(/\.[^.]+$/, '')}.${ext}`
    a.click()
    toast.success(`Exported as .${ext}`, { position: 'bottom-center', style: { fontSize: 13 } })
  }

  function handleRestore(text) {
    if (!window.confirm('Restore this version? Your current content will be replaced.')) return
    navigator.clipboard.writeText(text)
    toast('Version copied! Select all and paste to restore.', { icon: '📋', position: 'bottom-center', style: { fontSize: 13 } })
  }

  const handleCommand = useCallback((cmd) => {
    switch(cmd.id) {
      case 'file.new':        navigate('/dashboard'); break
      case 'file.export.md':  exportContent('md', 'text/markdown'); break
      case 'file.export.txt': exportContent('txt', 'text/plain'); break
      case 'file.copy.link':  navigator.clipboard.writeText(window.location.href); toast.success('Link copied!', { position: 'bottom-center', style: { fontSize: 13 }}); break
      case 'file.rename':     setEditingTitle(true); break
      case 'file.dashboard':  navigate('/dashboard'); break
      case 'editor.copy':     navigator.clipboard.writeText(content); toast.success('Content copied', { position: 'bottom-center', style: { fontSize: 13 }}); break
      case 'view.theme':      toggle(); toast(`Switched to ${theme === 'dark' ? 'light' : 'dark'} mode`, { icon: theme==='dark'?'☀️':'🌙', position: 'bottom-center', style: { fontSize: 13 }}); break
      case 'view.zen':        setZenMode(z => !z); break
      case 'view.stats':      setShowStats(s => !s); break
      case 'view.fontup':     setFontSize(f => Math.min(f+1, 24)); break
      case 'view.fontdown':   setFontSize(f => Math.max(f-1, 10)); break
      case 'collab.share':    setShowInvite(true); break
      case 'collab.users':    toast(`${peers.length + 1} user(s) online`, { icon: '👥', position: 'bottom-center', style: { fontSize: 13 }}); break
      default:
        if (cmd.id.startsWith('lang.')) handleLangSelect(cmd.id.replace('lang.', ''))
        else if (cmd.id.startsWith('doc.open.')) navigate(`/doc/${cmd.docId}`)
    }
  }, [theme, zenMode, fontSize, peers, content, docTitle, navigate, toggle])

  // Right panel component
  const rightPanelNode = (() => {
    if (!rightPanel) return null
    const lang = selectedLang === 'auto' ? detectedLang : selectedLang
    switch(rightPanel) {
      case PANELS.AI:       return <AIChatPanel code={content} language={lang} onClose={() => setRightPanel(null)} />
      case PANELS.HISTORY:  return <HistoryPanel docId={docId} onClose={() => setRightPanel(null)} onRestore={handleRestore} />
      case PANELS.COMMENTS: return <CommentsPanel docId={docId} onClose={() => setRightPanel(null)} />
      case PANELS.CHAT:     return <LiveChat peers={peers} ydocRef={ydocRef} providerRef={providerRef} />
      case PANELS.VIEWERS:  return <ViewerLog docId={docId} onClose={() => setRightPanel(null)} />
      default: return null
    }
  })()

  // Main editor pane
  // We must always render the containerRef to keep CodeMirror alive, but we conditionally hide it
  const editorPane = (
    <>
      <div 
        ref={containerRef} 
        style={{ flex: 1, overflow: 'auto', background: 'var(--bg)', display: editorMode === 'code' ? 'block' : 'none' }} 
      />
      {editorMode === 'doc' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          <RichTextEditor 
            ydocRef={ydocRef} 
            providerRef={providerRef} 
            user={user} 
            editable={isEditable}
            docTitle={docTitle}
            setDocTitle={setDocTitle}
            saveTitle={saveTitle}
            peers={peers}
            onBack={() => navigate('/dashboard')}
            onSwitchMode={() => setEditorMode('code')}
          />
        </div>
      )}
    </>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>

      {/* Toolbar — hidden in zen mode */}
      {!zenMode && (
        <div style={{ height: 52, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6, flexShrink: 0, background: 'var(--bg)' }}>

          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 }}>
            <button onClick={() => navigate('/dashboard')} style={ghostBtn}
              onMouseOver={e=>e.currentTarget.style.background='var(--bg2)'}
              onMouseOut={e=>e.currentTarget.style.background='none'}>
              ← Back
            </button>
            <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }}/>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>C</div>
          {/* Title Area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            {editingTitle && isEditable ? (
              <input
                autoFocus
                defaultValue={docTitle}
                onBlur={e => saveTitle(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter') saveTitle(e.target.value); if(e.key==='Escape') setEditingTitle(false) }}
                style={{ padding: '4px 8px', fontSize: 16, fontWeight: 700, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', outline: 'none', width: '250px' }}
              />
            ) : (
              <div 
                onClick={() => isEditable && setEditingTitle(true)} 
                style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', cursor: isEditable ? 'text' : 'default', padding: '4px 8px', borderRadius: 6, transition: 'background 0.2s' }}
                title={isEditable ? "Click to rename (F2)" : "View only"}
              >
                {docTitle} {!isEditable && <span style={{fontSize: 12, marginLeft: 8, background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4, color: 'var(--text3)'}}>View Only</span>}
              </div>
            )}
            
            {/* Owner badge or nothing */}
            {userRole === 'owner' && <span style={{ fontSize: 10, padding: '2px 6px', background: '#f3e8ff', color: '#9333ea', borderRadius: 10, fontWeight: 700 }}>OWNER</span>}
          </div>
          </div>

          {/* Center */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 6, padding: 2, border: '1px solid var(--border)' }}>
              <button onClick={() => setEditorMode('code')} style={{ ...modeBtn, background: editorMode === 'code' ? 'var(--bg)' : 'transparent', boxShadow: editorMode === 'code' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: editorMode === 'code' ? 'var(--text)' : 'var(--text2)' }}>&lt;/&gt; Code</button>
              <button onClick={() => setEditorMode('doc')} style={{ ...modeBtn, background: editorMode === 'doc' ? 'var(--bg)' : 'transparent', boxShadow: editorMode === 'doc' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: editorMode === 'doc' ? 'var(--text)' : 'var(--text2)' }}>📝 Doc</button>
            </div>
            {editorMode === 'code' && <LanguageSelector currentLang={selectedLang} detectedLang={detectedLang} onSelect={handleLangSelect} />}
            <button onClick={() => setPaletteOpen(true)} title="Command Palette (Ctrl+P)" style={cmdBtn}>
              <span>⌘</span><span>Commands</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: connected?'#f0fdf4':'#fef2f2', color: connected?'#166534':'#991b1b', border: `1px solid ${connected?'#bbf7d0':'#fecaca'}` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected?'#16a34a':'#dc2626', animation: connected?'pulse 2s infinite':'none' }}/>
              {connected ? 'Live' : 'Reconnecting…'}
            </div>
          </div>

          {/* Right — Feature buttons + user tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'flex-end' }}>
            <OnlineUsers peers={peers} currentUser={user} />
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }}/>

            {/* Feature panel toggles */}
            <PanelBtn active={rightPanel === PANELS.AI}       onClick={() => togglePanel(PANELS.AI)}      title="AI Assistant (Ctrl+Shift+A)">🤖</PanelBtn>
            <PanelBtn active={showTerminal}                   onClick={() => setShowTerminal(s => !s)}    title="Terminal (Ctrl+Shift+T)">▶</PanelBtn>
            <PanelBtn active={rightPanel === PANELS.HISTORY}  onClick={() => togglePanel(PANELS.HISTORY)} title="Version History">🕐</PanelBtn>
            <PanelBtn active={rightPanel === PANELS.COMMENTS} onClick={() => togglePanel(PANELS.COMMENTS)} title="Comments (Ctrl+Shift+C)">💬</PanelBtn>
            <PanelBtn active={rightPanel === PANELS.CHAT}     onClick={() => togglePanel(PANELS.CHAT)}    title="Live Chat">🗨️</PanelBtn>
            <PanelBtn active={rightPanel === PANELS.VIEWERS}  onClick={() => togglePanel(PANELS.VIEWERS)} title="Viewer Log">👁️</PanelBtn>

            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }}/>
            <button onClick={toggle} style={outlineBtn} title="Toggle theme">{theme==='dark'?'☀️':'🌙'}</button>
            <button onClick={() => exportContent('txt','text/plain')} style={outlineBtn}>⬇ Export</button>
            <button onClick={() => setShowInvite(true)} style={primaryBtn}>👥 Share</button>
          </div>
        </div>
      )}

      {/* Stats bar */}
      {!zenMode && showStats && (
        <div style={{ height: 30, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 18, background: 'var(--bg2)', flexShrink: 0 }}>
          <span style={stat}>{wordCount.toLocaleString()} words</span>
          <span style={stat}>{content.length.toLocaleString()} chars</span>
          <span style={stat}>{readingTime} min read</span>
          {editorMode === 'code' && <span style={stat}>Font {fontSize}px</span>}
          <span style={{ ...stat, marginLeft: 'auto' }}>{peers.length + 1} editing</span>
          {detectedLang && detectedLang !== 'auto' && selectedLang === 'auto' && (
            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, background: 'var(--accent-light)', padding: '1px 8px', borderRadius: 10 }}>
              Auto: {detectedLang}
            </span>
          )}
        </div>
      )}

      {/* Main content with SplitPane */}
      <SplitPane
        center={editorPane}
        right={rightPanelNode}
        bottom={showTerminal
          ? <TerminalPanel code={content} language={selectedLang === 'auto' ? detectedLang : selectedLang} onClose={() => setShowTerminal(false)} />
          : null
        }
        rightWidth={rightPanel === PANELS.AI ? 380 : 320}
        bottomHeight={220}
      />

      {/* Zen mode hint */}
      {zenMode && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '8px 18px', borderRadius: 20, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Zen mode</span>
          <kbd style={kbd}>Ctrl+K Z</kbd>
          <span>or</span>
          <button onClick={() => setZenMode(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 5, padding: '2px 10px', color: '#fff', cursor: 'pointer', fontSize: 12 }}>Exit</button>
        </div>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onCommand={handleCommand} recentDocs={recentDocs} />
      <Toaster />

      {/* Invite modal */}
      {showInvite && <InviteModal docId={docId} onClose={() => setShowInvite(false)} />}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

function PanelBtn({ children, active, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '5px 9px',
        background: active ? 'var(--accent-light)' : 'none',
        border: active ? '1px solid var(--accent)' : '1px solid transparent',
        borderRadius: 7,
        cursor: 'pointer',
        fontSize: 14,
        color: active ? 'var(--accent)' : 'var(--text3)',
        transition: 'all .1s',
        flexShrink: 0,
      }}
      onMouseOver={e => { if(!active) e.currentTarget.style.background='var(--bg2)' }}
      onMouseOut={e  => { if(!active) e.currentTarget.style.background='none' }}
    >
      {children}
    </button>
  )
}

const ghostBtn   = { display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, border:'none', background:'none', cursor:'pointer', color:'var(--text2)', fontSize:13, fontWeight:500, flexShrink:0, transition:'background .1s' }
const outlineBtn = { padding:'5px 10px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', fontSize:13, color:'var(--text2)', fontWeight:500, flexShrink:0 }
const primaryBtn = { display:'flex', alignItems:'center', gap:5, padding:'6px 13px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', flexShrink:0 }
const cmdBtn     = { display:'flex', alignItems:'center', gap:6, padding:'5px 10px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', fontSize:13, color:'var(--text2)', fontWeight:500, transition:'all .15s', flexShrink:0 }
const modeBtn    = { border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.1s', display: 'flex', alignItems: 'center', gap: 4 }
const stat       = { fontSize:12, color:'var(--text3)', whiteSpace:'nowrap' }
const kbd        = { background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:5, padding:'1px 6px', fontSize:11, color:'#fff' }