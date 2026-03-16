import { useState, useCallback } from 'react'

export function useToast() {
  const [toast, setToast] = useState(null)

  const show = useCallback((msg, duration = 3000) => {
    setToast(msg)
    setTimeout(() => setToast(null), duration)
  }, [])

  return { toast, show }
}

export function Toast({ message }) {
  if (!message) return null
  return <div className="toast">{message}</div>
}