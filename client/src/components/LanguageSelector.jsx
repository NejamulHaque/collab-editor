import { useState, useEffect, useRef } from 'react'
import { LANGUAGES } from '../hooks/useCollabEditor'

const LANG_ICONS = {
  auto:       '🔍',
  javascript: '🟨',
  typescript: '🔷',
  python:     '🐍',
  html:       '🌐',
  css:        '🎨',
  json:       '📦',
  java:       '☕',
  cpp:        '⚙️',
  rust:       '🦀',
  sql:        '🗄️',
  markdown:   '📝',
  php:        '🐘',
  xml:        '📄',
  plaintext:  '📃',
}

export default function LanguageSelector({ currentLang, detectedLang, onSelect }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef()

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayLang = LANGUAGES.find(l => l.id === currentLang) || LANGUAGES[0]
  const filtered = LANGUAGES.filter(l =>
    l.label.toLowerCase().includes(search.toLowerCase()) ||
    l.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px',
          background: open ? 'var(--accent-light)' : 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 8, cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
          color: 'var(--text)',
          transition: 'all .15s',
          minWidth: 140,
        }}
        title="Select language"
      >
        <span style={{ fontSize: 15 }}>{LANG_ICONS[displayLang.id] || '📄'}</span>
        <span style={{ flex: 1, textAlign: 'left' }}>{displayLang.label}</span>
        {currentLang === 'auto' && detectedLang && detectedLang !== 'auto' && (
          <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>
            ({LANGUAGES.find(l => l.id === detectedLang)?.label || detectedLang})
          </span>
        )}
        <span style={{ color: 'var(--text3)', fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 38, left: 0,
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 12, boxShadow: 'var(--shadow-lg)',
          zIndex: 200, width: 220, overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search languages..."
              style={{
                width: '100%', padding: '7px 10px',
                borderRadius: 8, border: '1px solid var(--border)',
                fontSize: 13, outline: 'none',
                background: 'var(--bg2)', color: 'var(--text)',
              }}
            />
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {filtered.map(lang => (
              <button
                key={lang.id}
                onClick={() => { onSelect(lang.id); setOpen(false); setSearch('') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 14px',
                  background: lang.id === currentLang ? 'var(--accent-light)' : 'none',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, color: lang.id === currentLang ? 'var(--accent)' : 'var(--text)',
                  fontWeight: lang.id === currentLang ? 600 : 400,
                  textAlign: 'left', transition: 'background .1s',
                }}
                onMouseOver={e => { if (lang.id !== currentLang) e.currentTarget.style.background = 'var(--bg2)' }}
                onMouseOut={e => { if (lang.id !== currentLang) e.currentTarget.style.background = 'none' }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{LANG_ICONS[lang.id] || '📄'}</span>
                <span style={{ flex: 1 }}>{lang.label}</span>
                {lang.ext.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>.{lang.ext[0]}</span>
                )}
                {lang.id === currentLang && <span style={{ color: 'var(--accent)', fontSize: 14 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}