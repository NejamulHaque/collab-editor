import { useState, useEffect, useRef, useCallback } from 'react'

export const COMMANDS = [
  { id: 'file.new',        group: 'File',        label: 'New document',           icon: '📄', shortcut: 'Ctrl+N' },
  { id: 'file.export.md',  group: 'File',        label: 'Export as Markdown',     icon: '⬇',  shortcut: '' },
  { id: 'file.export.txt', group: 'File',        label: 'Export as text file',    icon: '⬇',  shortcut: '' },
  { id: 'file.copy.link',  group: 'File',        label: 'Copy share link',        icon: '🔗', shortcut: '' },
  { id: 'file.rename',     group: 'File',        label: 'Rename document',        icon: '✏️', shortcut: 'F2' },
  { id: 'file.dashboard',  group: 'File',        label: 'Go to dashboard',        icon: '🏠', shortcut: 'Ctrl+Shift+H' },

  { id: 'editor.find',     group: 'Editor',      label: 'Find in document',       icon: '🔍', shortcut: 'Ctrl+F' },
  { id: 'editor.undo',     group: 'Editor',      label: 'Undo last change',       icon: '↩',  shortcut: 'Ctrl+Z' },
  { id: 'editor.redo',     group: 'Editor',      label: 'Redo last change',       icon: '↪',  shortcut: 'Ctrl+Y' },
  { id: 'editor.selectAll',group: 'Editor',      label: 'Select all',             icon: '⬜', shortcut: 'Ctrl+A' },
  { id: 'editor.wordwrap', group: 'Editor',      label: 'Toggle word wrap',       icon: '↵',  shortcut: 'Alt+Z' },
  { id: 'editor.copy',     group: 'Editor',      label: 'Copy all content',       icon: '📋', shortcut: '' },

  { id: 'lang.javascript', group: 'Language',    label: 'Switch to JavaScript',   icon: '🟨', shortcut: '' },
  { id: 'lang.typescript', group: 'Language',    label: 'Switch to TypeScript',   icon: '🔷', shortcut: '' },
  { id: 'lang.python',     group: 'Language',    label: 'Switch to Python',       icon: '🐍', shortcut: '' },
  { id: 'lang.html',       group: 'Language',    label: 'Switch to HTML',         icon: '🌐', shortcut: '' },
  { id: 'lang.css',        group: 'Language',    label: 'Switch to CSS',          icon: '🎨', shortcut: '' },
  { id: 'lang.json',       group: 'Language',    label: 'Switch to JSON',         icon: '📦', shortcut: '' },
  { id: 'lang.java',       group: 'Language',    label: 'Switch to Java',         icon: '☕', shortcut: '' },
  { id: 'lang.cpp',        group: 'Language',    label: 'Switch to C / C++',      icon: '⚙️', shortcut: '' },
  { id: 'lang.rust',       group: 'Language',    label: 'Switch to Rust',         icon: '🦀', shortcut: '' },
  { id: 'lang.sql',        group: 'Language',    label: 'Switch to SQL',          icon: '🗄️', shortcut: '' },
  { id: 'lang.markdown',   group: 'Language',    label: 'Switch to Markdown',     icon: '📝', shortcut: '' },
  { id: 'lang.plaintext',  group: 'Language',    label: 'Switch to Plain text',   icon: '📃', shortcut: '' },

  { id: 'view.theme',      group: 'View',        label: 'Toggle dark / light mode', icon: '🌙', shortcut: '' },
  { id: 'view.zen',        group: 'View',        label: 'Toggle zen mode',        icon: '🧘', shortcut: 'Ctrl+K Z' },
  { id: 'view.stats',      group: 'View',        label: 'Toggle stats bar',       icon: '📊', shortcut: '' },
  { id: 'view.fontup',     group: 'View',        label: 'Increase font size',     icon: '🔡', shortcut: 'Ctrl+=' },
  { id: 'view.fontdown',   group: 'View',        label: 'Decrease font size',     icon: '🔤', shortcut: 'Ctrl+-' },

  { id: 'collab.share',    group: 'Collaborate', label: 'Share document link',    icon: '⤴',  shortcut: '' },
  { id: 'collab.users',    group: 'Collaborate', label: 'Show online users',      icon: '👥', shortcut: '' },
]

function fuzzyScore(str, query) {
  if (!query) return 1
  const s = str.toLowerCase()
  const q = query.toLowerCase()
  if (s.startsWith(q)) return 10
  if (s.includes(q)) return 5
  let score = 0, qi = 0
  for (let i = 0; i < s.length && qi < q.length; i++) {
    if (s[i] === q[qi]) { score += (qi === 0 ? 3 : 1); qi++ }
  }
  return qi === q.length ? score / s.length : 0
}

function HighlightedLabel({ label, query }) {
  if (!query) return <span>{label}</span>
  const idx = label.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <span>{label}</span>
  return (
    <span>
      {label.slice(0, idx)}
      <mark style={{ background: 'rgba(99,102,241,0.18)', color: 'var(--accent)', borderRadius: 3, padding: '0 1px', fontWeight: 700 }}>
        {label.slice(idx, idx + query.length)}
      </mark>
      {label.slice(idx + query.length)}
    </span>
  )
}

export default function CommandPalette({ open, onClose, onCommand, recentDocs = [] }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef()
  const itemRefs = useRef({})

  const docCommands = recentDocs.slice(0, 5).map(doc => ({
    id: `doc.open.${doc.id}`,
    group: 'Recent Documents',
    label: doc.title,
    icon: '📄',
    shortcut: '',
    docId: doc.id,
  }))

  const allCommands = [...docCommands, ...COMMANDS]

  const results = query.trim()
    ? allCommands
        .map(c => ({ ...c, score: fuzzyScore(c.label + ' ' + c.group, query) }))
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score)
    : allCommands

  const grouped = results.reduce((acc, cmd) => {
    acc[cmd.group] = acc[cmd.group] || []
    acc[cmd.group].push(cmd)
    return acc
  }, {})

  const flat = Object.values(grouped).flat()

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 20)
    }
  }, [open])

  useEffect(() => { setSelected(0) }, [query])

  useEffect(() => {
    itemRefs.current[selected]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selected])

  const run = useCallback((cmd) => {
    onCommand(cmd)
    onClose()
  }, [onCommand, onClose])

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flat.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (flat[selected]) run(flat[selected]) }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }, [flat, selected, run, onClose])

  if (!open) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}
      onMouseDown={onClose}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 600, background: 'var(--bg)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 32px 96px rgba(0,0,0,0.4), 0 0 0 1px var(--border)', animation: 'paletteIn .12s ease' }}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
          <svg width="16" height="16" fill="none" stroke="var(--text3)" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a command or search..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: 'var(--text)', background: 'transparent', caretColor: 'var(--accent)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 20, lineHeight: 1, padding: '0 2px' }}>×</button>
          )}
          <kbd style={kbd}>esc</kbd>
        </div>

        {/* Results list */}
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {flat.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>
              No results for <span style={{ color: 'var(--text)', fontWeight: 600 }}>"{query}"</span>
            </div>
          ) : (
            Object.entries(grouped).map(([group, cmds]) => (
              <div key={group}>
                <div style={{ padding: '10px 16px 4px', fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '.08em', textTransform: 'uppercase', userSelect: 'none' }}>
                  {group}
                </div>
                {cmds.map(cmd => {
                  const idx = flat.indexOf(cmd)
                  const active = idx === selected
                  return (
                    <div
                      key={cmd.id}
                      ref={el => itemRefs.current[idx] = el}
                      onMouseDown={() => run(cmd)}
                      onMouseEnter={() => setSelected(idx)}
                      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 16px', cursor: 'pointer', background: active ? 'var(--accent-light)' : 'transparent', borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`, transition: 'background .06s' }}
                    >
                      <span style={{ fontSize: 15, width: 22, textAlign: 'center', flexShrink: 0, lineHeight: 1 }}>{cmd.icon}</span>
                      <span style={{ flex: 1, fontSize: 14, color: active ? 'var(--accent)' : 'var(--text)', fontWeight: active ? 600 : 400, lineHeight: 1.3 }}>
                        <HighlightedLabel label={cmd.label} query={query} />
                      </span>
                      {cmd.shortcut && (
                        <div style={{ display: 'flex', gap: 3 }}>
                          {cmd.shortcut.split('+').map((k, i) => <kbd key={i} style={kbd}>{k}</kbd>)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
          {[['↑ ↓', 'navigate'], ['↵', 'run'], ['esc', 'close']].map(([k, l]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)' }}>
              <kbd style={kbd}>{k}</kbd><span>{l}</span>
            </div>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>{flat.length} results</span>
        </div>
      </div>

      <style>{`
        @keyframes paletteIn {
          from { opacity: 0; transform: translateY(-16px) scale(0.96); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  )
}

const kbd = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '2px 6px', borderRadius: 5,
  border: '1px solid var(--border2)', background: 'var(--bg3)',
  fontSize: 11, fontFamily: 'var(--font-mono)',
  color: 'var(--text2)', fontWeight: 500,
  flexShrink: 0, whiteSpace: 'nowrap', lineHeight: '18px'
}