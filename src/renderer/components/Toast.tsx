import React, { useEffect, useState, useCallback } from 'react'

interface ToastMessage {
  id: string
  message: string
  type: 'info' | 'success' | 'error'
}

let addToast: (message: string, type: ToastMessage['type']) => void = () => {}

export function showToast(message: string, type: ToastMessage['type'] = 'info'): void {
  addToast(message, type)
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  addToast = useCallback((message: string, type: ToastMessage['type']) => {
    const id = Date.now().toString(36)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  if (toasts.length === 0) return null

  const typeStyles: Record<string, string> = {
    info: 'bg-obsidian-700 border-obsidian-500',
    success: 'bg-green-900/80 border-green-600/40',
    error: 'bg-dragon-600/20 border-dragon-600/40'
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg border text-sm text-obsidian-100 shadow-xl animate-slide-in pointer-events-auto ${
            typeStyles[toast.type]
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
