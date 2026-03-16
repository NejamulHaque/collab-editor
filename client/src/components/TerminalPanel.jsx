import { useRef, useEffect, useState } from 'react'
import { useCodeRunner } from '../hooks/useCodeRunner'

const RUNNABLE = ['python', 'javascript', 'typescript', 'java', 'cpp', 'rust', 'bash']

export default function TerminalPanel({ code, language, onClose }) {
  const { output, running, runCode, clearOutput } = useCodeRunner()
  const [stdinVal, setStdinVal] = useState('')
  const [showStdin, setShowStdin] = useState(false)
  const bottomRef = useRef(null)
  const canRun = RUNNABLE.includes(language)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [output])

  // Auto-detect if code needs input
  useEffect(() => {
    if (!code) return
    const needsInput = /\binput\s*\(|scanf|readline|read\s*\(|gets|cin\s*>>|stdin/i.test(code)
    if (needsInput && !showStdin) setShowStdin(true)
  }, [code])

  function handleRun() {
    runCode(code, language, stdinVal)
  }

  return (
    <div style={panel}>
      {/* Header */}
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>▶</span>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Terminal</span>
          {!canRun && (
            <span style={{ fontSize: 11, color: '#f59e0b', background: '#fef3c7', padding: '1px 8px', borderRadius: 10 }}>
              {language || 'auto'} not executable
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setShowStdin(s => !s)} style={{ ...iconBtn, color: showStdin ? '#6366f1' : '#6b7280', background: showStdin ? '#ede9fe' : 'none', borderRadius: 6 }} title="Toggle stdin input">
            ⌨
          </button>
          {output && <button onClick={clearOutput} style={iconBtn} title="Clear">🗑</button>}
          <button onClick={onClose} style={iconBtn} title="Close">✕</button>
          <button
            onClick={handleRun}
            disabled={running || !canRun || !code?.trim()}
            style={{ ...runBtn, opacity: (running || !canRun || !code?.trim()) ? 0.5 : 1 }}
          >
            {running ? <><SpinIcon /> Running…</> : '▶ Run'}
          </button>
        </div>
      </div>

      {/* Stdin input area */}
      {showStdin && (
        <div style={stdinArea}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', letterSpacing: 1 }}>STDIN</span>
            <span style={{ fontSize: 10, color: '#4b5563' }}>— Provide input values, one per line</span>
          </div>
          <textarea
            value={stdinVal}
            onChange={e => setStdinVal(e.target.value)}
            placeholder={"Enter input values here, one per line.\nExample:\n5\nhello\n42"}
            rows={3}
            style={stdinTextarea}
          />
        </div>
      )}

      {/* Output area */}
      <div style={outputArea}>
        {!output && !running && (
          <div style={{ color: '#6b7280', fontSize: 13, padding: '20px 16px' }}>
            {canRun
              ? <>
                  Press ▶ Run to execute your <strong>{language}</strong> code.
                  {'\n'}Click ⌨ to provide stdin input for programs that use <code>input()</code>.
                </>
              : `Code execution is available for: ${RUNNABLE.join(', ')}`}
          </div>
        )}

        {running && (
          <div style={{ color: '#06b6d4', fontSize: 13, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <SpinIcon /> Executing…
          </div>
        )}

        {output && (
          <>
            {/* Exit code + mode badge */}
            <div style={{ padding: '6px 16px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 10,
                background: output.exitCode === 0 ? '#166534' : '#991b1b',
                color: output.exitCode === 0 ? '#bbf7d0' : '#fecaca',
              }}>
                Exit {output.exitCode === 0 ? '✓ 0' : `✗ ${output.exitCode}`}
              </span>
              {output.mode && (
                <span style={{ fontSize: 10, color: '#6b7280' }}>{output.mode}</span>
              )}
            </div>

            {/* stdin echo */}
            {stdinVal && (
              <pre style={{ ...codeBlock, color: '#93c5fd', borderBottom: '1px solid #1f2937' }}>
                <span style={{ ...label, color: '#60a5fa' }}>STDIN</span>
                {stdinVal}
              </pre>
            )}

            {/* stdout */}
            {output.stdout && (
              <pre style={{ ...codeBlock, color: '#d1fae5' }}>
                <span style={label}>STDOUT</span>
                {output.stdout}
              </pre>
            )}

            {/* stderr */}
            {output.stderr && (
              <pre style={{ ...codeBlock, color: '#fca5a5' }}>
                <span style={{ ...label, color: '#f87171' }}>STDERR</span>
                {output.stderr}
              </pre>
            )}

            {!output.stdout && !output.stderr && (
              <div style={{ color: '#6b7280', fontSize: 13, padding: '12px 16px' }}>No output.</div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function SpinIcon() {
  return (
    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: 14 }}>↻</span>
  )
}

const panel = { display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', borderTop: '1px solid #1f2937', minWidth: 0 }
const header = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #1f2937', flexShrink: 0, background: '#161b22' }
const stdinArea = { padding: '8px 12px', borderBottom: '1px solid #1f2937', background: '#0d1117', flexShrink: 0 }
const stdinTextarea = { width: '100%', resize: 'vertical', background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font-mono, monospace)', color: '#93c5fd', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }
const outputArea = { flex: 1, overflowY: 'auto', fontFamily: 'var(--font-mono, monospace)', fontSize: 13 }
const codeBlock = { margin: 0, padding: '10px 16px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7 }
const label = { display: 'block', fontSize: 10, fontWeight: 700, color: '#6b7280', marginBottom: 4, letterSpacing: 1 }
const runBtn = { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, flexShrink: 0 }
const iconBtn = { padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6b7280', borderRadius: 6 }
