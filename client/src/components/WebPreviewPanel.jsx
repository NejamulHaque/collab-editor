import { useState, useEffect, useMemo } from 'react'

export default function WebPreviewPanel({ code, language, onClose }) {
  const [srcDoc, setSrcDoc] = useState('')

  useEffect(() => {
    let content = ''
    const lang = language?.toLowerCase()

    if (lang === 'html') {
      content = code
    } else if (lang === 'javascript' || lang === 'typescript') {
      content = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: sans-serif; padding: 20px; background: #fff; color: #333; }
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script>${code}<\/script>
          </body>
        </html>
      `
    } else if (lang === 'css') {
      content = `
        <!DOCTYPE html>
        <html>
          <head><style>${code}</style></head>
          <body>
            <h1>CSS Preview</h1>
            <p>This is a live preview of your styles.</p>
            <div style="padding: 20px; border: 1px solid #ccc;">Content Box</div>
          </body>
        </html>
      `
    } else {
      content = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center; color: #666;">
            <h3>No preview available for "${language}"</h3>
            <p>Switch to HTML, CSS, or JavaScript to see a live preview.</p>
          </body>
        </html>
      `
    }
    setSrcDoc(content)
  }, [code, language])

  return (
    <div style={panel}>
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🌐</span>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Web Preview</span>
          <span style={{ fontSize: 10, background: 'var(--accent-light)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>LIVE</span>
        </div>
        <button onClick={onClose} style={iconBtn}>✕</button>
      </div>

      <div style={{ flex: 1, background: '#fff', position: 'relative' }}>
        <iframe
          srcDoc={srcDoc}
          title="web-preview"
          sandbox="allow-scripts"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
      
      <div style={footer}>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
          Real-time rendering • Isolated sandbox
        </span>
      </div>
    </div>
  )
}

const panel = { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', borderLeft: '1px solid var(--border)' }
const header = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }
const footer = { padding: '8px 12px', borderTop: '1px solid var(--border)', background: 'var(--bg2)', textAlign: 'center' }
const iconBtn = { padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text3)', borderRadius: 6 }
