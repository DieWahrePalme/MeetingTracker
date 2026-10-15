import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { t } from '../texts'

/**
 * Eigene Rückfrage im Design der App (statt der Browser-Popups). Der Fokus startet auf "Abbrechen",
 * Escape und ein Tipp daneben brechen ab. Gehört neben ein Sheet, nicht hinein.
 */
export function ConfirmDialog({ message, confirmLabel, onConfirm, onCancel }: { message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  // Die Rückfrage-Funktion in einer Ref halten, damit der Effekt nicht bei jedem Neuzeichnen (Live-Timer!) neu startet
  const cancel = useRef(onCancel)
  cancel.current = onCancel

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    // Alles dahinter sperren: kein Klick, kein Tab, kein Screenreader erreicht die Seite darunter
    const root = document.getElementById('root')
    root?.setAttribute('inert', '')
    cancelRef.current?.focus()
    // Im Capture-Schritt, damit Escape nicht zusätzlich das Fenster dahinter schließt
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      cancel.current()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      root?.removeAttribute('inert')
      before?.focus?.()
    }
  }, [])

  return createPortal(
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={message} onClick={(e) => e.stopPropagation()}>
        <p className="dialog-text">{message}</p>
        <div className="dialog-actions">
          <button ref={cancelRef} className="btn ghost" onClick={onCancel}>{t.confirm.cancel}</button>
          <button className="btn danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
