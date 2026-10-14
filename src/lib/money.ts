// Alle Beträge in Cent, alle Dauern in Sekunden (ganze Zahlen).

/** Kosten einer Person: Satz (Cent/Stunde) x Sekunden / 3600, einmal auf ganze Cent gerundet (halbe Cent nach oben). */
export function costCents(rateCentsPerHour: number, seconds: number): number {
  return Math.floor((rateCentsPerHour * seconds * 2 + 3600) / 7200)
}

const intFormat = new Intl.NumberFormat('de-DE')

/** 123456 -> "1.234,56 €" */
export function formatEuro(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  const euros = Math.trunc(abs / 100)
  const rest = String(abs % 100).padStart(2, '0')
  return `${sign}${intFormat.format(euros)},${rest} €`
}

/** "30", "30,5", "1.234,56", "30.50" -> Cent, sonst null */
export function parseEuroToCents(text: string): number | null {
  let t = text.replace(/\/\s*h|pro\s*stunde|euro|eur/gi, '').replace(/[\s€]/g, '')
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(t)
  if (!m) return null
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0') || 0)
}

/** 3725 -> "1:02:05" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/**
 * Zeit als "Std. / Min." für Summen über Personen: 36000 -> "10 Std.", 5400 -> "1 Std. 30 Min.",
 * 2700 -> "45 Min.", 30 -> "30 Sek." Ab einer Minute wird auf ganze Minuten gerundet.
 */
export function formatPersonTime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  if (s > 0 && s < 60) return `${s} Sek.`
  const totalMinutes = Math.round(s / 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m} Min.`
  return m === 0 ? `${intFormat.format(h)} Std.` : `${intFormat.format(h)} Std. ${m} Min.`
}

/** Stunden mit einer Nachkommastelle für Statistiken: 5400 -> "1,5 h" */
export function formatHours(totalSeconds: number): string {
  return `${(Math.round(totalSeconds / 360) / 10).toLocaleString('de-DE', { minimumFractionDigits: 1 })} h`
}

/** 3588 -> "35,88" (für Eingabefelder, ohne Eurozeichen) */
export function centsToInput(cents: number): string {
  return `${Math.trunc(cents / 100)},${String(cents % 100).padStart(2, '0')}`
}
