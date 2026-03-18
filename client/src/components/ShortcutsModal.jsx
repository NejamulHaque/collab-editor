import { useEffect } from 'react'

const SECTIONS = [
  {
    title: 'General',
    icon: '⌨️',
    shortcuts: [
      { keys: ['Ctrl', 'P'], action: 'Command Palette' },
      { keys: ['Ctrl', '/'], action: 'Show Shortcuts' },
      { keys: ['Ctrl', 'K', 'Z'], action: 'Toggle Zen Mode' },
      { keys: ['F2'], action: 'Rename Document' },
      { keys: ['Ctrl', 'Shift', 'H'], action: 'Go to Dashboard' },
    ],
  },
  {
    title: 'Editor',
    icon: '📝',
    shortcuts: [
      { keys: ['Ctrl', '='], action: 'Increase Font Size' },
      { keys: ['Ctrl', '-'], action: 'Decrease Font Size' },
      { keys: ['Ctrl', 'Z'], action: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo' },
      { keys: ['Ctrl', 'A'], action: 'Select All' },
    ],
  },
  {
    title: 'Panels',
    icon: '📋',
    shortcuts: [
      { keys: ['Ctrl', 'Shift', 'A'], action: 'Toggle AI Assistant' },
      { keys: ['Ctrl', 'Shift', 'T'], action: 'Toggle Terminal' },
    ],
  },
  {
    title: 'Collaboration',
    icon: '👥',
    shortcuts: [
      { keys: ['Ctrl', 'Shift', 'S'], action: 'Share Document' },
      { keys: ['Enter'], action: 'Send Chat Message' },
    ],
  },
]

export default function ShortcutsModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={modal}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Keyboard Shortcuts</h2>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Navigate like a pro</p>
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '60vh', overflowY: 'auto' }}>
          {SECTIONS.map(section => (
            <div key={section.title}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>{section.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{section.title}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {section.shortcuts.map(s => (
                  <div key={s.action} style={row}>
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{s.action}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {s.keys.map((k, i) => (
                        <kbd key={i}>{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 20, padding: '12px 0 0', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Press <kbd>Esc</kbd> to close</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>CollabSheets v2.0</span>
        </div>
      </div>
    </div>
  )
}

const modal = {
  background: 'var(--bg)',
  borderRadius: 16,
  padding: '24px 28px',
  width: 520,
  maxWidth: '90vw',
  boxShadow: 'var(--shadow-lg)',
  border: '1px solid var(--border)',
  animation: 'scaleIn .2s ease',
}

const closeBtn = {
  width: 32, height: 32, borderRadius: 8,
  background: 'var(--bg2)', border: '1px solid var(--border)',
  cursor: 'pointer', fontSize: 14, color: 'var(--text3)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all .15s',
}

const row = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  borderRadius: 8,
  background: 'var(--bg2)',
  border: '1px solid transparent',
  transition: 'all .15s',
}
