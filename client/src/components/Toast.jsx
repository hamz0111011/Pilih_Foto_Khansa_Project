import { useState, useCallback, useEffect } from 'react'

// ── Toast Context & Hook ──────────────────────────────────────
let _addToast = null

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((msg, type = 'info', ms = 3000) => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms)
  }, [])

  _addToast = addToast

  return { toasts, addToast }
}

export function toast(msg, type = 'info') {
  _addToast?.(msg, type)
}

export function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
      ))}
    </div>
  )
}
