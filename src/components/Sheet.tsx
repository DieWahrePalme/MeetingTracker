import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { t } from '../texts'

/**
 * Fenster von unten (Griff, Titel, Schließen oben). Der Inhalt scrollt, die Buttons (`actions`)
 * bleiben unten sichtbar. Solange es offen ist, scrollt die Seite dahinter nicht mit.
 * Wenn die Bildschirmtastatur aufgeht (iPhone), richtet es sich nach dem sichtbaren Bereich
 * aus, damit Felder und Buttons nicht verdeckt werden.
 */
export function Sheet({ title, onClose, children, actions }: { title: string; onClose: () => void; children: ReactNode; actions?: ReactNode }) {
  const [view, setView] = useState<{ top: number; height: number; keyboard: boolean } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.documentElement.classList.add('sheet-open')
    return () => document.documentElement.classList.remove('sheet-open')
  }, [])

  useEffect(() => {
    const v = window.visualViewport
    if (!v) return
    // Der sichtbare Bereich ändert sich mit der Tastatur. Safari meldet das Ende nicht immer per Ereignis,
    // darum zusätzlich alle 300 ms nachsehen (setzt nur neu, wenn sich etwas geändert hat).
    const update = () =>
      setView((prev) => {
        const height = Math.min(v.height, window.innerHeight) // nie größer als der Bildschirm
        const next = { top: v.offsetTop, height, keyboard: window.innerHeight - height > 120 }
        return prev && prev.top === next.top && prev.height === next.height ? prev : next
      })
    update()
    v.addEventListener('resize', update)
    v.addEventListener('scroll', update)
    const id = setInterval(update, 300)
    return () => {
      v.removeEventListener('resize', update)
      v.removeEventListener('scroll', update)
      clearInterval(id)
    }
  }, [])

  // Nach oben/unten wischen im Fenster schließt die Tastatur (statt daneben tippen zu müssen).
  const touchY = useRef(0)
  const dismissKeyboardOnScroll = (e: React.TouchEvent) => {
    const a = document.activeElement
    if (a instanceof HTMLInputElement && Math.abs(e.touches[0].clientY - touchY.current) > 14) a.blur()
  }

  return (
    <div
      className={'overlay' + (view?.keyboard ? ' kb' : '')}
      style={view ? { top: view.top, height: view.height, bottom: 'auto' } : undefined}
      onClick={onClose}
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onFocus={(e) => {
          // Angetipptes Feld in die Mitte des sichtbaren Bereichs holen (nach dem Aufgehen der Tastatur)
          const el = e.target as HTMLElement
          if (el.matches('input, select, textarea')) setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 320)
        }}
      >
        <div className="grabber" aria-hidden="true" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="close" aria-label={t.sheet.close} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="sheet-body" onTouchStart={(e) => (touchY.current = e.touches[0].clientY)} onTouchMove={dismissKeyboardOnScroll}>
          {children}
        </div>
        {actions && <div className="sheet-actions">{actions}</div>}
      </div>
    </div>
  )
}
