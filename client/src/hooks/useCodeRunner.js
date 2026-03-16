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
