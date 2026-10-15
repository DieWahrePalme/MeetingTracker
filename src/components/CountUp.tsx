import { useEffect, useRef, useState } from 'react'

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Nur in den ersten Sekunden nach dem Öffnen der Seite zählt eine neu gezeigte Zahl von 0 hoch (Tabwechsel später: sofort)
const OPENED = typeof performance !== 'undefined' ? performance.now() : 0
const justOpened = () => performance.now() - OPENED < 2500

/**
 * Zeigt eine Zahl. Sie zählt hoch beim ersten Öffnen der Seite (oder mit `fromZero`, z. B. im Bon) und wenn sich der
 * Wert ändert (vom alten zum neuen Wert). Beim Wechsel von `resetKey` (z. B. Kosten/Zeit/Spaß) erscheint der neue Wert sofort.
 * Bei "Bewegung reduzieren" erscheint der Wert immer sofort.
 */
export function CountUp({ value, format, resetKey = '', duration = 700, fromZero = false }: { value: number; format: (v: number) => string; resetKey?: string; duration?: number; fromZero?: boolean }) {
  const animateFirst = !reducedMotion() && (fromZero || justOpened())
  const [shown, setShown] = useState(animateFirst ? 0 : value)
  const prev = useRef(animateFirst ? 0 : value)
  const lastKey = useRef(resetKey)

  useEffect(() => {
    const keyChanged = lastKey.current !== resetKey
    lastKey.current = resetKey
    if (reducedMotion() || keyChanged || prev.current === value) {
      prev.current = value
      setShown(value)
      return
    }
    const from = prev.current
    prev.current = value
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      setShown(from + (value - from) * (1 - Math.pow(1 - p, 3))) // langsam auslaufend
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, resetKey, duration])

  return <>{format(Math.round(shown))}</>
}
