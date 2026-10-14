import { useEffect, useRef, useState } from 'react'

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Zeigt eine Zahl und zählt kurz hoch, als würde sie nachladen: beim ersten Zeigen und wenn sich `resetKey`
 * ändert (z. B. Umschalten Kosten/Zeit) von 0, bei geänderten Werten vom bisherigen Wert.
 * Bei "Bewegung reduzieren" erscheint der Wert sofort.
 */
export function CountUp({ value, format, resetKey = '', duration = 700 }: { value: number; format: (v: number) => string; resetKey?: string; duration?: number }) {
  const [shown, setShown] = useState(reducedMotion() ? value : 0)
  const prev = useRef(0)
  const lastKey = useRef(resetKey)

  useEffect(() => {
    if (reducedMotion()) {
      setShown(value)
      prev.current = value
      return
    }
    const from = lastKey.current !== resetKey ? 0 : prev.current
    lastKey.current = resetKey
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
