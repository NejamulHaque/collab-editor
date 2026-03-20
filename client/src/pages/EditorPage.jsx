import { useRef, useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCollabEditor } from '../hooks/useCollabEditor'
import OnlineUsers from '../components/OnlineUsers'
import LanguageSelector from '../components/LanguageSelector'
import CommandPalette from '../components/CommandPalette'
import ShortcutsModal from '../components/ShortcutsModal'
import AIChatPanel from '../components/AIChatPanel'
import TerminalPanel from '../components/TerminalPanel'
import HistoryPanel from '../components/HistoryPanel'
import LiveChat from '../components/LiveChat'
import InviteModal from '../components/InviteModal'
import ViewerLog from '../components/ViewerLog'
import SketchPanel from '../components/SketchPanel'
import WebPreviewPanel from '../components/WebPreviewPanel'
import SplitPane from '../components/SplitPane'
import RichTextEditor from '../components/RichTextEditor'
import Breadcrumbs from '../components/Breadcrumbs'
import SidebarNavigator from '../components/SidebarNavigator'
import SettingsPanel from '../components/SettingsPanel'
import CodeDebuggerPanel from '../components/CodeDebuggerPanel'
import ExportPanel from '../components/ExportPanel'
import { useTheme } from '../context/ThemeContext.jsx'
import { Toaster, toast } from 'react-hot-toast'

// Panel identifiers for right sidebar
const PANELS = {
  AI:      'ai',
  HISTORY: 'history',
  CHAT:    'chat',
  VIEWERS: 'viewers',
  SKETCH:  'sketch',
  PREVIEW: 'preview',
  SETTINGS: 'settings',
  DEBUGGER: 'debugger',
  EXPORT:   'export',
}

export default function EditorPage() {
  const { docId } = useParams()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [userRole, setUserRole] = useState('viewer')
  const isEditable = userRole === 'owner' || userRole === 'editor'
  
  const { 
    connected, peers, wordCount, content, detectedLang, setLanguage, 
    lineWrapping, toggleWrapping, theme: editorTheme, changeTheme, 
    fontSize, changeFontSize, 
    providerRef, ydocRef, viewRef 
  } = useCollabEditor(containerRef, docId, user, isEditable)
  const { theme, toggle } = useTheme()

  const [docTitle, setDocTitle] = useState('Untitled')
  const [editingTitle, setEditingTitle] = useState(false)
  const [selectedLang, setSelectedLang] = useState('auto')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [zenMode, setZenMode] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [recentDocs, setRecentDocs] = useState([])
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })

  // Panel visibility
  const [rightPanel, setRightPanel] = useState(null)   // null | PANELS.*
  const [showTerminal, setShowTerminal] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showViewers, setShowViewers] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false) // Sidebar Quick-Switch
  const [editorMode, setEditorMode] = useState('code') // 'code' | 'doc'
  const [showModePopup, setShowModePopup] = useState(false)

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
          window.history.replaceState({}, document.title, window.location.pathname)
          toast.success('Successfully joined the document!')
        } catch (e) {
          toast.error('Invalid or expired invite link.')
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


  // Cursor tracking
  useEffect(() => {
    if (!viewRef?.current) return
    const updateCursor = () => {
      const state = viewRef.current.state
      const pos = state.selection.main.head
      const line = state.doc.lineAt(pos)
      setCursorPos({ line: line.number, col: pos - line.from + 1 })
    }
    const interval = setInterval(updateCursor, 100)
    return () => clearInterval(interval)
  }, [viewRef, editorMode])

  // Advanced Notifications: Presence (Joined/Left)
  const prevPeersRef = useRef([])
  const rightPanelRef = useRef(rightPanel)
  useEffect(() => { rightPanelRef.current = rightPanel }, [rightPanel])

  useEffect(() => {
    if (!connected) return
    const prev = prevPeersRef.current
    const current = peers
    current.forEach(p => {
      if (!prev.find(x => x.clientId === p.clientId)) {
        toast.success(`${p.name} joined the document`, { position: 'bottom-right', style: { fontSize: 13, background: 'var(--bg2)', color: 'var(--text)' } })
      }
    })
    prev.forEach(p => {
      if (!current.find(x => x.clientId === p.clientId)) {
        toast(`${p.name} left the document`, { icon: '👋', position: 'bottom-right', style: { fontSize: 13, background: 'var(--bg2)', color: 'var(--text)' } })
      }
    })
    prevPeersRef.current = current
  }, [peers, connected])

  // Global Live Chat Popups
  useEffect(() => {
    if (!connected || !ydocRef.current) return
    const ydoc = ydocRef.current
    const chatArray = ydoc.getArray('chat-messages')
    const handleNewChat = (event) => {
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
      if (mod && e.key === '/')  { e.preventDefault(); setShortcutsOpen(true); return }
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
      if (mod && e.shiftKey && e.key === 'A') { e.preventDefault(); togglePanel(PANELS.AI); return }
      if (mod && e.shiftKey && e.key === 'T') { e.preventDefault(); setShowTerminal(s => !s); return }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  // Click outside to close mode popup
  useEffect(() => {
    if (!showModePopup) return
    const close = () => setShowModePopup(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [showModePopup])

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
    if (!isEditable) { setEditingTitle(false); return }
    const trimmed = newTitle.trim()
    if (!trimmed || trimmed === docTitle) { setEditingTitle(false); return }
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/docs/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: trimmed })
      })
      setDocTitle(trimmed)
      autoLangFromTitle(trimmed)
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
  
  const handleApplyCode = useCallback((newCode) => {
    if (editorMode === 'code' && viewRef.current) {
      const view = viewRef.current
      const selection = view.state.selection.main
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: newCode },
        selection: { anchor: selection.from + newCode.length }
      })
      toast.success('Code applied to editor', { position: 'bottom-center', style: { fontSize: 13 } })
    } else if (editorMode === 'doc' && window.tiptap) {
      window.tiptap.chain().focus().insertContent(`\n${newCode}\n`).run()
      toast.success('Snippet applied to document', { position: 'bottom-center', style: { fontSize: 13 } })
    } else {
      toast.error('No active editor found to apply code')
    }
  }, [editorMode, viewRef])

  const rightPanelNode = (() => {
    if (!rightPanel) return null
    const lang = selectedLang === 'auto' ? detectedLang : selectedLang
    switch(rightPanel) {
      case PANELS.AI:       return <AIChatPanel code={content} language={lang} onClose={() => setRightPanel(null)} onApplyCode={handleApplyCode} />
      case PANELS.HISTORY:  return <HistoryPanel docId={docId} onClose={() => setRightPanel(null)} onRestore={handleRestore} />
      case PANELS.CHAT:     return <LiveChat peers={peers} ydocRef={ydocRef} providerRef={providerRef} />
      case PANELS.VIEWERS:  return <ViewerLog docId={docId} onClose={() => setRightPanel(null)} />
      case PANELS.SKETCH:   return <SketchPanel ydocRef={ydocRef} onClose={() => setRightPanel(null)} />
      case PANELS.PREVIEW:  return <WebPreviewPanel code={content} language={selectedLang === 'auto' ? detectedLang : selectedLang} onClose={() => setRightPanel(null)} />
      case PANELS.SETTINGS: return <SettingsPanel fontSize={fontSize} setFontSize={changeFontSize} theme={theme} toggleTheme={toggle} onClose={() => setRightPanel(null)} />
      case PANELS.DEBUGGER: return <CodeDebuggerPanel code={content} language={lang} onClose={() => setRightPanel(null)} onApplyFix={(fixedCode) => {
        if (window.tiptap) {
          window.tiptap.commands.setContent(fixedCode);
          toast.success('AI Fix Applied');
        }
      }} />
      case PANELS.EXPORT:   return <ExportPanel code={content} title={docTitle} onClose={() => setRightPanel(null)} />
      default: return null
    }
  })()

  const editorPane = (
    <div className="workspace-bg" style={{ position: 'relative' }}>
      {/* Bottom-Left Floating Controller */}
      <div className="bottom-left-controller">
        <div className="floating-mode-card">
          <button 
            className={`mode-toggle-btn ${editorMode === 'code' ? 'active' : ''}`}
            onClick={() => setEditorMode('code')}
          >
            &lt;/&gt; Code
          </button>
          <button 
            className={`mode-toggle-btn ${editorMode === 'doc' ? 'active' : ''}`}
            onClick={() => setEditorMode('doc')}
          >
            📝 Doc
          </button>
        </div>
      </div>

      <div className="floating-editor-card" style={{ display: editorMode === 'code' ? 'flex' : 'none', flexDirection: 'column' }}>
        {/* Code Editor Pro Toolbar */}
        <div style={{ 
          padding: '8px 16px', 
          background: 'var(--bg2)', 
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>Theme</span>
            <select 
              value={editorTheme} 
              onChange={(e) => changeTheme(e.target.value)}
              style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, padding: '2px 6px' }}
            >
              <option value="dark">One Dark</option>
              <option value="light">Atom Light</option>
            </select>
          </div>

          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

          <button 
            onClick={toggleWrapping}
            style={{ 
              background: lineWrapping ? 'var(--accent-light)' : 'transparent',
              color: lineWrapping ? 'var(--accent)' : 'var(--text2)',
              border: '1px solid' + (lineWrapping ? 'var(--accent)' : 'var(--border)'),
              borderRadius: 6,
              fontSize: 12,
              padding: '4px 10px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Wrap: {lineWrapping ? 'ON' : 'OFF'}
          </button>

          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>Font</span>
            <input 
              type="number" 
              value={fontSize}
              onChange={(e) => changeFontSize(parseInt(e.target.value))}
              style={{ width: 45, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, padding: '2px 6px' }}
            />
          </div>
        </div>

        <div 
          ref={containerRef} 
          style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }} 
        />
      </div>
      {editorMode === 'doc' && (
        <div className="floating-editor-card">
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
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      {!zenMode && (
        <div style={{ 
          height: 64, 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 20px', 
          flexShrink: 0, 
          background: 'var(--bg)', 
          zIndex: 10,
          position: 'relative',
          gap: 20
        }}>
          {/* Left Column: Sidebar Toggle + Breadcrumbs + Language Selector */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16,
            overflow: 'visible', // Crucial for LanguageSelector dropdown
            minWidth: 0,
            flex: 1,
            justifyContent: 'flex-start'
          }}>
            {/* Far Left: Logo */}
            <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 800 }}>C</div>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>CollabSheets</span>
            </Link>

            <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }}/>

            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              style={{ 
                background: showSidebar ? 'var(--accent-light)' : 'var(--bg2)',
                border: '1px solid ' + (showSidebar ? 'var(--accent)' : 'var(--border)'),
                borderRadius: '10px',
                width: 36, height: 36,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
                color: showSidebar ? 'var(--accent)' : 'var(--text2)',
                transition: 'all {0.2s}',
                flexShrink: 0
              }}
              title="Toggle Sidebar Navigator"
            >
              {showSidebar ? '⇠' : '⇢'}
            </button>
            <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              {!editingTitle && (
                <Breadcrumbs 
                  docTitle={docTitle} 
                  isEditable={isEditable} 
                  onRename={() => isEditable && setEditingTitle(true)}
                  connected={connected}
                  initials={user.name ? user.name.split(' ').map(n=>n[0]).join('').toUpperCase() : ''}
                />
              )}
              {editingTitle && isEditable && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                  <input
                    autoFocus
                    defaultValue={docTitle}
                    onBlur={e => saveTitle(e.target.value)}
                    onKeyDown={e => { if(e.key==='Enter') saveTitle(e.target.value); if(e.key==='Escape') setEditingTitle(false) }}
                    style={{ 
                      padding: '8px 14px', 
                      fontSize: 13, 
                      fontWeight: 700, 
                      background: 'var(--bg2)', 
                      border: '2px solid var(--accent)', 
                      borderRadius: 10, 
                      color: 'var(--text)', 
                      outline: 'none', 
                      width: '100%',
                      maxWidth: 200,
                      boxShadow: 'var(--shadow-md)'
                    }}
                  />
                </div>
              )}
              {userRole === 'owner' && <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)', flexShrink: 0 }}>OWNER</span>}
            </div>
          </div>


          {/* Right Column: Peers + Panel Actions + Share */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            justifyContent: 'flex-end',
            minWidth: 0,
            flexShrink: 0,
            overflow: 'visible'
          }}>
            <OnlineUsers peers={peers} currentUser={user} />
            <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }}/>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <PanelBtn active={rightPanel === PANELS.AI} onClick={() => togglePanel(PANELS.AI)} title="AI Assistant (Ctrl+Shift+A)">🤖 <span className="btn-label">AI Assistant</span></PanelBtn>
              <PanelBtn active={rightPanel === PANELS.PREVIEW} onClick={() => togglePanel(PANELS.PREVIEW)} title="Live Preview">👁️ <span className="btn-label">Live Preview</span></PanelBtn>
              <PanelBtn active={showTerminal} onClick={() => setShowTerminal(s => !s)} title="Run Code (Ctrl+Shift+T)">▶️ <span className="btn-label">Run Code</span></PanelBtn>
              
              <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }}/>
              
              {/* Feature Panels */}
              <PanelBtn compact active={rightPanel === PANELS.SKETCH} onClick={() => togglePanel(PANELS.SKETCH)} title="Sketchboard/Whiteboard">🎨</PanelBtn>
              <PanelBtn compact active={rightPanel === PANELS.DEBUGGER} onClick={() => togglePanel(PANELS.DEBUGGER)} title="AI Debugger">🪲</PanelBtn>
              <PanelBtn compact active={rightPanel === PANELS.HISTORY} onClick={() => togglePanel(PANELS.HISTORY)} title="Version History">🕒</PanelBtn>
              
              <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }}/>
              
              <PanelBtn compact active={rightPanel === PANELS.SETTINGS} onClick={() => togglePanel(PANELS.SETTINGS)} title="Settings">⚙️</PanelBtn>
              <PanelBtn compact active={rightPanel === PANELS.EXPORT} onClick={() => togglePanel(PANELS.EXPORT)} title="Export Document">📥</PanelBtn>
              <PanelBtn compact active={rightPanel === PANELS.CHAT} onClick={() => togglePanel(PANELS.CHAT)} title="Live Chat">💬</PanelBtn>
            </div>

            <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }}/>
            
            <button onClick={() => setShowInvite(true)} className="btn-glow" style={{ ...primaryBtn, padding: '8px 14px', flexShrink: 0 }}>Share</button>
          </div>
        </div>
      )}

      {/* Modern Status Bar */}
      {!zenMode && showStats && (
        <div style={{ height: 32, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 20, background: 'var(--bg2)', flexShrink: 0, zIndex: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={statItem}>Ln {cursorPos.line}, Col {cursorPos.col}</span>
            <span style={divider}/>
            <span style={statItem}>{wordCount.toLocaleString()} words</span>
            <span style={statItem}>{readingTime} min read</span>
          </div>
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', fontSize: 11, fontWeight: 700 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }}/>
              Saved
            </div>
            {editorMode === 'code' && detectedLang && detectedLang !== 'auto' && (
              <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 10 }}>{detectedLang.toUpperCase()}</span>
            )}
            <span style={statItem}>{peers.length + 1} typing</span>
          </div>
        </div>
      )}

      <SplitPane
        left={showSidebar ? (
          <SidebarNavigator 
            docs={recentDocs} 
            currentId={docId} 
            onClose={() => setShowSidebar(false)} 
          />
        ) : null}
        center={editorPane}
        right={rightPanelNode}
        bottom={showTerminal
          ? <TerminalPanel code={content} language={selectedLang === 'auto' ? detectedLang : selectedLang} onClose={() => setShowTerminal(false)} />
          : null
        }
        leftWidth={240}
        rightWidth={rightPanel === PANELS.AI ? 400 : 340}
        bottomHeight={240}
      />

      {zenMode && (
        <div className="fade-in" style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: 'var(--text)', color: 'var(--bg)', padding: '10px 24px', borderRadius: 30, fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-lg)', zIndex: 1000 }}>
          <span style={{ fontWeight: 600 }}>Zen Mode Active</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <kbd>Ctrl</kbd><kbd>K</kbd><kbd>Z</kbd>
          </div>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)' }}/>
          <button onClick={() => setZenMode(false)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Exit</button>
        </div>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onCommand={handleCommand} recentDocs={recentDocs} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      {showInvite && <InviteModal docId={docId} onClose={() => setShowInvite(false)} />}
      {/* Floating Language Selector (Bottom Right) */}
      {editorMode === 'code' && !zenMode && (
        <div style={{
          position: 'fixed',
          bottom: showStats ? 52 : 20,
          right: 20,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 10,
          pointerEvents: 'none'
        }}>
          <div style={{ pointerEvents: 'auto' }}>
            <LanguageSelector 
              currentLang={selectedLang} 
              detectedLang={detectedLang} 
              onSelect={handleLangSelect} 
              upward={true}
            />
          </div>
        </div>
      )}

      <Toaster />
    </div>
  )
}

function PanelBtn({ children, active, onClick, title, compact }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`tooltip tooltip-bottom panel-btn ${compact ? 'compact' : ''}`}
      data-tip={title}
      style={{
        padding: compact ? '0' : '0 12px', 
        width: compact ? 34 : 'auto',
        height: 32,
        background: active ? 'var(--accent-light)' : 'transparent',
        border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
        borderRadius: compact ? 8 : 20,
        cursor: 'pointer',
        fontSize: compact ? 16 : 11,
        fontWeight: 700,
        color: active ? 'var(--accent)' : 'var(--text2)',
        transition: 'all .25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        whiteSpace: 'nowrap',
        letterSpacing: '0.3px',
        flexShrink: 0,
        lineHeight: 1,
        gap: 6
      }}
      onMouseOver={e => { if(!active) { e.currentTarget.style.background='var(--bg2)'; e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; } }}
      onMouseOut={e  => { if(!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text2)'; } }}
    >
      {children}
    </button>
  )
}

const primaryBtn = { padding: '8px 18px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }
const modeBtn    = { border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }
const statItem   = { fontSize: 11, color: 'var(--text3)', fontWeight: 600, fontFamily: 'var(--font-mono)' }
const divider    = { width: 1, height: 12, background: 'var(--border2)' }
const iconBtnStyle = { width: 34, height: 34, borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'all .2s' }
const ghostBtn   = { padding: '6px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 13, fontWeight: 600, transition: 'all .2s' }