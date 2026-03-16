import { useState, useCallback, useRef } from 'react'

const API = import.meta.env.VITE_API_URL

export function useAI() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const sendMessage = useCallback(async (userText, code, language) => {
    if (!userText.trim()) return
    const userMsg = { role: 'user', content: userText.trim() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setError(null)

    // Build history to send (last 8 turns max)
    const historyToSend = [...(messages.slice(-8)), userMsg]

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: historyToSend, code, language }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setError(err.message)
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }, [messages])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, loading, error, sendMessage, clearChat }
}
