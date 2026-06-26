import { useEffect } from 'react'

export default function Modal({ children, onClose, fullScreen = false }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`
          relative w-full bg-surface border border-surface-border shadow-2xl z-10 animate-slide-up
          ${fullScreen
            ? 'h-full rounded-none'
            : 'max-h-[92dvh] rounded-t-3xl sm:rounded-2xl sm:max-w-lg mx-auto overflow-y-auto scrollbar-none'
          }
        `}
      >
        {children}
      </div>
    </div>
  )
}
