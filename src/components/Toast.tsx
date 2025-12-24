import { useEffect } from 'hono/jsx'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div class={`toast ${type}`}>
      <p>{message}</p>
    </div>
  )
}
