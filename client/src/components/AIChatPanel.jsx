import { useState, useRef, useEffect } from 'react'
import { useAI } from '../hooks/useAI'

const SUGGESTIONS = [
  'Explain what this code does',
  'Find any bugs in my code',
  'Optimize this code',
  'Add comments to this code',
  'Convert this to TypeScript',
]

export default function AIChatPanel({ code, language, onClose, onApplyCode }) {
  const { messages, loading, sendMessage, clearChat } = useAI()
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleSend(text) {
    const msg = text || input.trim()
    if (!msg) return
    sendMessage(msg, code, language)
    setInput('')
  }

  return (
    <div style={panel}>
      {/* Header */}
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>AI Assistant</span>
          <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', padding: '1px 7px', borderRadius: 10, border: '1px solid var(--border)' }}>
            {language || 'auto'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={clearChat} title="Clear chat" style={iconBtn}>🗑</button>
          <button onClick={onClose} title="Close" style={iconBtn}>✕</button>
        </div>
      </div>

      {/* Messages */}
      <div style={msgArea}>
        {messages.length === 0 && (
          <div style={{ padding: '16px 12px' }}>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.5 }}>
              Ask me anything about your code — I can explain, debug, refactor, or generate snippets.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => handleSend(s)} style={suggBtn}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 12px', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '92%',
              padding: '8px 12px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.role === 'user' ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'var(--bg2)',
              color: msg.role === 'user' ? '#fff' : 'var(--text)',
              fontSize: 13,
              lineHeight: 1.6,
              border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              <MarkdownText text={msg.content} isAssistant={msg.role === 'assistant'} onApplyCode={onApplyCode} />
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: `bounce 1s ${i * 0.15}s infinite` }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>Thinking…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={inputArea}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Ask about your code… (Enter to send)"
          rows={2}
          style={textarea}
        />
        <button onClick={() => handleSend()} disabled={!input.trim() || loading} style={sendBtn}>
          {loading ? '⏳' : '➤'}
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
      `}</style>
    </div>
  )
}

// Minimal markdown renderer — handles code blocks and bold
function MarkdownText({ text, isAssistant, onApplyCode }) {
  if (!isAssistant) return <span>{text}</span>
  const parts = text.split(/(```[\s\S]*?```)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const lines = part.slice(3, -3).split('\n')
          const lang = lines[0].trim()
          const code = lines.slice(1).join('\n')
          return (
            <div key={i} style={{ position: 'relative', margin: '10px 0' }}>
              <pre style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', fontSize: 12, fontFamily: 'var(--font-mono)', overflowX: 'auto', border: '1px solid var(--border)', color: 'var(--text)', marginBottom: 0 }}>
                {lang && <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>{lang}</div>}
                {code}
              </pre>
              <button 
                onClick={() => onApplyCode?.(code)} 
                style={{ 
                  position: 'absolute', top: 6, right: 6, 
                  background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', 
                  border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 6, 
                  padding: '4px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s', backdropFilter: 'blur(4px)'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = '#fff' }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; e.currentTarget.style.color = '#6366f1' }}
              >
                Apply to Editor
              </button>
            </div>
          )
        }
        // Handle **bold**
        const boldParts = part.split(/\*\*(.*?)\*\*/g)
        return (
          <span key={i}>
            {boldParts.map((bp, j) => j % 2 === 1 ? <strong key={j}>{bp}</strong> : bp)}
          </span>
        )
      })}
    </>
  )
}

const panel = { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', borderLeft: '1px solid var(--border)', minWidth: 0 }
const header = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg2)' }
const msgArea = { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 8 }
const inputArea = { display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg2)', alignItems: 'flex-end' }
const textarea = { flex: 1, resize: 'none', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', lineHeight: 1.5 }
const sendBtn = { padding: '8px 14px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 16, flexShrink: 0 }
const iconBtn = { padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text3)', borderRadius: 6 }
const suggBtn = { textAlign: 'left', padding: '7px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text2)', transition: 'all .15s' }
