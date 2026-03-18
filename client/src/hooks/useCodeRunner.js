import { useState, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL

export function useCodeRunner() {
  const [output, setOutput] = useState(null)   // { stdout, stderr, exitCode, mode }
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)

  const runCode = useCallback(async (code, language, stdin) => {
    if (!code?.trim()) return
    setRunning(true)
    setError(null)
    setOutput(null)

    // Optimization: Run JavaScript client-side for instant results
    if (language === 'javascript') {
      try {
        const logs = []
        const originalLog = console.log
        const originalError = console.error
        
        console.log = (...args) => logs.push(args.map(a => String(a)).join(' '))
        console.error = (...args) => logs.push('ERROR: ' + args.map(a => String(a)).join(' '))

        const startTime = performance.now()
        // eslint-disable-next-line no-eval
        eval(code)
        const endTime = performance.now()

        console.log = originalLog
        console.error = originalError

        setOutput({ 
          stdout: logs.join('\n'), 
          stderr: '', 
          exitCode: 0, 
          mode: '⚡ Instant JS (Client)',
          duration: (endTime - startTime).toFixed(1) + 'ms'
        })
        setRunning(false)
        return
      } catch (err) {
        setOutput({ stdout: '', stderr: err.message, exitCode: 1, mode: '⚡ Instant JS (Client)' })
        setRunning(false)
        return
      }
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/execute/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code, language, stdin: stdin || '' }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setOutput(data)
    } catch (err) {
      setError(err.message)
      setOutput({ stdout: '', stderr: err.message, exitCode: -1 })
    } finally {
      setRunning(false)
    }
  }, [])

  const clearOutput = useCallback(() => setOutput(null), [])

  return { output, running, error, runCode, clearOutput }
}
