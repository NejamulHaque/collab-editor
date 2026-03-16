import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * LiveChat — real-time peer messaging using a Yjs shared array.
 * Messages are broadcast to all connected peers instantly.
 */
export default function LiveChat({ peers, ydocRef, providerRef }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const initedRef = useRef(false)

  // Setup: listen to the shared Yjs array for chat
  useEffect(() => {
    const ydoc = ydocRef?.current
    if (!ydoc) return

    const yarray = ydoc.getArray('chat-messages')

    // Sync messages from Yjs array
    function syncMessages() {
      setMessages(yarray.toArray())
    }

    // If there are already messages (from another session), load them
    syncMessages()

    // Listen for changes pushed by any peer
    yarray.observe(syncMessages)
    initedRef.current = true

    return () => {
      yarray.unobserve(syncMessages)
    }
  }, [ydocRef?.current])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(() => {
    if (!input.trim()) return
    const ydoc = ydocRef?.current
    if (!ydoc) return

    const yarray = ydoc.getArray('chat-messages')
    const msg = {
      id: Date.now() + Math.random(),
      content: input.trim(),
      author: user.name || 'Anonymous',
      authorId: user.id,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
    }
    yarray.push([msg])
    setInput('')
  }, [input, ydocRef, user])

  const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  function peerColor(name) {
    let hash = 0
    for (const c of (name || '')) hash = c.charCodeAt(0) + (hash * 31)
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div style={panel}>
      {/* Online peers header */}
      <div style={peersBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, letterSpacing: 0.5 }}>LIVE CHAT</span>
          <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg3)', padding: '1px 7px', borderRadius: 10 }}>
            {peers.length + 1} online
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ ...dot, background: '#16a34a' }} />
            <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>You</span>
          </div>
          {peers.map(p => (
            <div key={p.clientId} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ ...dot, background: p.color || peerColor(p.name) }} />
              <span style={{ fontSize: 11, color: 'var(--text2)' }}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={msgArea}>
        {messages.length === 0 && (
          <div style={{ padding: '28px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>
              Chat with your collaborators in real-time.<br />
              Messages sync instantly across all peers.
            </div>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.authorId === user.id
          return (
            <div key={msg.id} style={{ padding: '5px 12px', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: peerColor(msg.author), color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(msg.author || '?')[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{msg.author}</span>
                </div>
              )}
              <div style={{
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: isMe ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'var(--bg2)',
                color: isMe ? '#fff' : 'var(--text)',
                fontSize: 13,
                lineHeight: 1.5,
                border: isMe ? 'none' : '1px solid var(--border)',
                wordBreak: 'break-word',
              }}>
                {msg.content}
              </div>
              <span style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2, padding: '0 2px' }}>{msg.time}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={inputArea}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Type a message… (Enter to send)"
          style={chatInput}
        />
        <button onClick={sendMessage} disabled={!input.trim()} style={sendBtn}>➤</button>
      </div>
    </div>
  )
}

const panel = { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', borderLeft: '1px solid var(--border)' }
const peersBar = { padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0 }
const dot = { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }
const msgArea = { flex: 1, overflowY: 'auto', paddingBottom: 4 }
const inputArea = { display: 'flex', gap: 6, padding: '10px 12px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg2)' }
const chatInput = { flex: 1, padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }
const sendBtn = { padding: '8px 14px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 16 }
