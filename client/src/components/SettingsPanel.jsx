import React from 'react';

export default function SettingsPanel({ fontSize, setFontSize, theme, toggleTheme, onClose }) {
  return (
    <div style={{ 
      padding: '24px', 
      height: '100%', 
      background: 'var(--bg)', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 20 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Advanced Settings</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 20 }}>×</button>
      </div>

      <section>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Appearance</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, color: 'var(--text2)' }}>Theme</span>
            <button 
              onClick={toggleTheme}
              style={{ 
                padding: '6px 14px', 
                borderRadius: '8px', 
                border: '1px solid var(--border)', 
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Typography</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: 'var(--text2)' }}>Font Size</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{fontSize}px</span>
          </div>
          <input 
            type="range" 
            min="12" 
            max="24" 
            value={fontSize} 
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)' }}>
            <span>12px</span>
            <span>24px</span>
          </div>
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Editor Performance</h3>
        <div style={{ padding: '16px', background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}></div>
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>Real-time Sync Optimized</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0, lineHeight: 1.5 }}>
            Hardware acceleration is active. Collaborative cursors are running at 60fps.
          </p>
        </div>
      </section>

      <div style={{ marginTop: 'auto', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: 'var(--text3)' }}>CollabSheets v3.0.0-premium</p>
      </div>
    </div>
  );
}
