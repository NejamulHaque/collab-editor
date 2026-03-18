import React, { useState, useEffect } from 'react';

export default function CodeDebuggerPanel({ code, language, onClose, onApplyFix }) {
  const [issues, setIssues] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    analyzeCode();
  }, [code, language]);

  const analyzeCode = () => {
    setIsAnalyzing(true);
    // Simulated AI Analysis
    setTimeout(() => {
      const foundIssues = [];
      
      if (code.includes('console.log') && !code.includes('//')) {
        foundIssues.push({
          id: 1,
          type: 'warning',
          title: 'Debug logs detected',
          description: 'Consider removing console.log statements before production.',
          suggestion: 'Remove all console logs',
          fix: code.replace(/console\.log\(.*\);?/g, '')
        });
      }

      if (code.includes('var ')) {
        foundIssues.push({
          id: 2,
          type: 'error',
          title: 'Legacy "var" keyword',
          description: 'Use "let" or "const" for better block scoping and to avoid hoisting issues.',
          suggestion: 'Replace var with const/let',
          fix: code.replace(/var /g, 'const ')
        });
      }

      if (code.length > 500 && !code.includes('function') && !code.includes('const')) {
        foundIssues.push({
          id: 3,
          type: 'performance',
          title: 'Large monolithic block',
          description: 'This code block is becoming hard to maintain. Consider refactoring into functions.',
          suggestion: 'Refactor to functions',
          fix: null
        });
      }

      setIssues(foundIssues);
      setIsAnalyzing(false);
    }, 1200);
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
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>AI Debugger</h2>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Real-time code analysis</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 20 }}>×</button>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, padding: '12px', background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: issues.length > 0 ? 'var(--accent)' : 'var(--green)' }}>{issues.length}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', marginTop: 4 }}>Total Issues</div>
        </div>
        <div style={{ flex: 1, padding: '12px', background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{isAnalyzing ? '...' : (100 - (issues.length * 5)) + '%'}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', marginTop: 4 }}>Health Score</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isAnalyzing ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontSize: 13 }}>
            <div className="pulse" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', margin: '0 auto 16px', opacity: 0.2 }}></div>
            Analyzing code patterns...
          </div>
        ) : issues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, border: '1px dashed var(--border)', borderRadius: 16 }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>✨</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Clean Code</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>No major issues detected by AI.</div>
          </div>
        ) : (
          issues.map(issue => (
            <div key={issue.id} style={{ 
              padding: '16px', 
              background: 'var(--bg2)', 
              borderRadius: '12px', 
              border: '1px solid' + (issue.type === 'error' ? ' #ef444444' : ' var(--border)'),
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, 
                background: issue.type === 'error' ? '#ef4444' : (issue.type === 'warning' ? '#f59e0b' : '#6366f1') 
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ 
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase', 
                  color: issue.type === 'error' ? '#ef4444' : (issue.type === 'warning' ? '#f59e0b' : '#6366f1') 
                }}>{issue.type}</span>
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>{issue.title}</h4>
              <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 16px', lineHeight: 1.5 }}>{issue.description}</p>
              
              {issue.fix && (
                <button 
                  onClick={() => onApplyFix(issue.fix)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'none'}
                >
                  Apply Fix: {issue.suggestion}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <style>{`
        .pulse { animation: pulseAnim 1.5s infinite ease-in-out; }
        @keyframes pulseAnim {
          0% { transform: scale(0.8); opacity: 0.2; }
          50% { transform: scale(1.2); opacity: 0.4; }
          100% { transform: scale(0.8); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
