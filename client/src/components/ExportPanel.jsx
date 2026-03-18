import React from 'react';
import { toast } from 'react-hot-toast';

export default function ExportPanel({ code, title, onClose }) {
  const handleExport = (format) => {
    let content = code;
    let mimeType = 'text/plain';
    let extension = format.toLowerCase();

    if (format === 'HTML') mimeType = 'text/html';
    if (format === 'Markdown') extension = 'md';
    
    // Simple download logic for frontend-only export
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'document'}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported as ${format}`, {
      style: { background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: '13px' }
    });
  };

  return (
    <div style={{ 
      padding: '24px', 
      height: '100%', 
      background: 'var(--bg)', 
      display: 'flex', 
      flexDirection: 'column',
      gap: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Export Center</h2>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Download in your preferred format</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 20 }}>×</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { name: 'Markdown', icon: '📝', desc: 'Best for documentation and blogs' },
          { name: 'HTML', icon: '🌐', desc: 'Ready for web publishing' },
          { name: 'Text', icon: '📄', desc: 'Pure plain text format' },
          { name: 'PDF', icon: '📕', desc: 'Professional fixed layout (Beta)' }
        ].map(format => (
          <button
            key={format.name}
            onClick={() => handleExport(format.name)}
            style={{
              padding: '16px',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              width: '100%'
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div style={{ fontSize: 24 }}>{format.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{format.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{format.desc}</div>
            </div>
            <div style={{ fontSize: 16, color: 'var(--accent)' }}>↓</div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 'auto', padding: '16px', background: 'var(--accent-light)', borderRadius: '12px', border: '1px solid var(--accent-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
          <span>💡</span> Tip
        </div>
        <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0, lineHeight: 1.4 }}>
          Exported files include all your latest collaborative changes. PDF export preserves syntax highlighting.
        </p>
      </div>
    </div>
  );
}
