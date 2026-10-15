import { useEffect, useRef } from 'react'
import { t } from '../texts'

/**
 * Eigene Rückfrage im Design der App (statt der Browser-Popups). Der Fokus startet auf "Abbrechen",
 * Escape und ein Tipp daneben brechen ab. Gehört neben ein Sheet, nicht hinein.
 */
export function ConfirmDialog({ message, confirmLabel, onConfirm, onCancel }: { message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    // Im Capture-Schritt, damit Escape nicht zusätzlich das Fenster dahinter schließt
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onCancel()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onCancel])

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={message} onClick={(e) => e.stopPropagation()}>
        <p className="dialog-text">{message}</p>
        <div className="dialog-actions">
          <button ref={cancelRef} className="btn ghost" onClick={onCancel}>{t.confirm.cancel}</button>
          <button className="btn danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
