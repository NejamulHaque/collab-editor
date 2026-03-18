import React from 'react';
import { Link } from 'react-router-dom';

export default function Breadcrumbs({ docTitle, isEditable, onRename, connected, initials }) {
  return (
    <nav style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 12, 
      background: 'rgba(255, 255, 255, 0.05)', 
      backdropFilter: 'blur(10px)',
      padding: '6px 16px',
      borderRadius: '24px',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      maxWidth: 'fit-content',
      minWidth: 0
    }}>
      <Link to="/dashboard" className="breadcrumb-item" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        textDecoration: 'none',
        color: 'var(--text2)',
        fontSize: '13px',
        fontWeight: 600,
        transition: 'color 0.2s',
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--bg2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          boxShadow: 'inset 0 0 0 1px var(--border)'
        }}>🏠</div>
        <span className="breadcrumb-label" style={{ 
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '60px'
        }}>Dashboard</span>
      </Link>

      <span style={{ color: 'var(--text3)', fontSize: '14px', opacity: 0.5 }}>/</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div 
          onClick={(e) => { e.stopPropagation(); isEditable && onRename(); }}
          style={{ 
            fontSize: '14px', 
            fontWeight: 700, 
            color: 'var(--text)', 
            cursor: isEditable ? 'pointer' : 'default',
            padding: '6px 12px',
            borderRadius: '8px',
            transition: 'all 0.2s',
            background: isEditable ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: isEditable ? '1px dashed transparent' : 'none'
          }}
          onMouseOver={e => { if(isEditable) { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.borderColor = 'var(--accent)'; } }}
          onMouseOut={e => { if(isEditable) { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'; e.currentTarget.style.borderColor = 'transparent'; } }}
          className={isEditable ? "breadcrumb-active" : ""}
          title={isEditable ? "Click to rename" : ""}
        >
          <span style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            background: connected ? '#22c55e' : '#f59e0b',
            boxShadow: connected ? '0 0 12px #22c55e88' : 'none',
            animation: connected ? 'pulse 2s infinite' : 'none',
            flexShrink: 0
          }} />
          <span style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100px'
          }}>
            {docTitle}
          </span>
        </div>
      </div>

      {initials && (
        <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: 24, 
            height: 24, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
            color: '#fff', 
            fontSize: '10px', 
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--bg)'
          }}>
            {initials}
          </div>
        </div>
      )}

      <style>{`
        .breadcrumb-item:hover { color: var(--accent) !important; }
        .breadcrumb-item:hover .breadcrumb-label { text-decoration: underline; }
        .breadcrumb-active:hover { background: var(--bg2) !important; }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}</style>
    </nav>
  );
}
