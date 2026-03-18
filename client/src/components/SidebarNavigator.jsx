import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SidebarNavigator({ docs, currentId, onClose }) {
  const navigate = useNavigate();

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      background: 'var(--bg2)', 
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '0 8px' }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Navigator</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        {docs.map(doc => (
          <button
            key={doc.id}
            onClick={() => navigate(`/doc/${doc.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid ' + (doc.id === currentId ? 'var(--accent)' : 'transparent'),
              background: doc.id === currentId ? 'var(--accent-light)' : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              width: '100%'
            }}
            onMouseOver={e => { if(doc.id !== currentId) e.currentTarget.style.background = 'var(--bg3)' }}
            onMouseOut={e => { if(doc.id !== currentId) e.currentTarget.style.background = 'transparent' }}
          >
            <div style={{ 
              width: 24, 
              height: 24, 
              borderRadius: '6px', 
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              opacity: doc.id === currentId ? 1 : 0.6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              color: '#fff',
              fontWeight: 800
            }}>
              {doc.title[0]?.toUpperCase()}
            </div>
            <span style={{ 
              fontSize: '13px', 
              fontWeight: doc.id === currentId ? 700 : 500,
              color: doc.id === currentId ? 'var(--accent)' : 'var(--text2)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {doc.title}
            </span>
          </button>
        ))}
      </div>
      
      <div style={{ marginTop: 'auto', padding: '20px 8px' }}>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{
            width: '100%',
            padding: '10px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text3)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          ↵ Back to Dashboard
        </button>
      </div>
    </div>
  );
}
