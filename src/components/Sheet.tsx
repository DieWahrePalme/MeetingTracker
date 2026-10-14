import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { t } from '../texts'

const TEXT_TYPES = ['text', 'search', 'number', 'email', 'tel', 'url', 'password']
const isTextField = (el: Element | null) =>
  (el instanceof HTMLInputElement && TEXT_TYPES.includes(el.type)) || el instanceof HTMLTextAreaElement

/**
 * Fenster von unten (Griff, Titel, Schließen oben). Der Inhalt scrollt, die Buttons (`actions`)
 * bleiben unten sichtbar. Solange es offen ist, scrollt die Seite dahinter nicht mit.
 *
 * Tastatur (iPhone): Nur solange ein Textfeld im Fenster aktiv ist, richtet sich das Fenster nach dem
 * sichtbaren Bereich über der Tastatur und wird kompakt (ohne Buttons unten). Ohne aktives Textfeld
 * ist es immer voll hoch, so kann ein veralteter Wert von Safari nichts verstellen.
 */
export function Sheet({ title, onClose, children, actions }: { title: string; onClose: () => void; children: ReactNode; actions?: ReactNode }) {
  const [typing, setTyping] = useState(false)
  const [vp, setVp] = useState<{ top: number; height: number } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.documentElement.classList.add('sheet-open')
    return () => document.documentElement.classList.remove('sheet-open')
  }, [])

  // Sichtbaren Bereich nur beobachten, solange getippt wird. Safari meldet Änderungen nicht immer
  // per Ereignis, darum zusätzlich alle 300 ms nachsehen.
  useEffect(() => {
    const v = window.visualViewport
    if (!typing || !v) {
      setVp(null)
      return
    }
    const update = () =>
      setVp((prev) => {
        const next = { top: v.offsetTop, height: Math.min(v.height, window.innerHeight) }
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
  }, [typing])

  const keyboard = typing && vp !== null && window.innerHeight - vp.height > 120

  // Nach oben/unten wischen schließt die Tastatur, außer in der Trefferliste (dort wird gescrollt).
  const touch = useRef({ y: 0, inList: false })
  const dismissKeyboardOnScroll = (e: React.TouchEvent) => {
    const a = document.activeElement
    if (!touch.current.inList && isTextField(a) && Math.abs(e.touches[0].clientY - touch.current.y) > 14) (a as HTMLElement).blur()
  }

  return (
    <div
      className={'overlay' + (keyboard ? ' kb' : '')}
      style={keyboard && vp ? { top: vp.top, height: vp.height, bottom: 'auto' } : undefined}
      onClick={onClose}
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onFocus={(e) => {
          const el = e.target as HTMLElement
          if (!isTextField(el) && !el.matches('select')) return
          setTyping(isTextField(el))
          // Angetipptes Feld nach dem Aufgehen der Tastatur ins Bild holen (Suche: ganz nach oben)
          const block = el.dataset.scroll === 'start' ? 'start' : 'center'
          setTimeout(() => el.scrollIntoView({ block, behavior: 'smooth' }), 320)
        }}
        onBlur={() => setTimeout(() => setTyping(isTextField(document.activeElement)), 60)}
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
        <div
          className="sheet-body"
          onTouchStart={(e) => (touch.current = { y: e.touches[0].clientY, inList: !!(e.target as HTMLElement).closest('.pick-list, .chips.picked') })}
          onTouchMove={dismissKeyboardOnScroll}
        >
          {children}
        </div>
        {actions && <div className="sheet-actions">{actions}</div>}
      </div>
    </div>
  )
}
