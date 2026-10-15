/** Spaß-Modus: Kosten in "Einheiten" umrechnen (Inside-Joke-Preise in Cent). Weitere Einheiten einfach ergänzen. */
export interface FunUnit {
  id: string
  cents: number
  one: string
  many: string
}

export const FUN_UNITS: FunUnit[] = [
  { id: 'kaffee', cents: 350, one: 'Kaffee', many: 'Kaffee' },
  { id: 'doener', cents: 850, one: 'Döner', many: 'Döner' },
  { id: 'pizza', cents: 1100, one: 'Pizza', many: 'Pizzen' },
  { id: 'hochregal', cents: 120_000, one: 'Hochregal', many: 'Hochregale' },
  { id: 'maybach', cents: 30_000_000, one: 'Maybach', many: 'Maybachs' },
]

export const AUTO = 'auto'
export const UNIT_KEY = 'meetingtracker.fununit'

const byId = (id: string) => FUN_UNITS.find((u) => u.id === id)
const DOENER = byId('doener')!

/** Gewählte Einheit; "auto" nimmt je nach Betrag die größte passende (Döner, Hochregal, Maybach), unter einem Döner Kaffee. */
export function unitFor(choice: string, cents: number): FunUnit {
  if (choice !== AUTO) return byId(choice) ?? DOENER
  const big = ['maybach', 'hochregal', 'doener'].map((id) => byId(id)!).find((u) => cents >= u.cents)
  return big ?? byId('kaffee')!
}

/** Gespeicherte Wahl dieses Geräts (Standard: automatisch). */
export function storedChoice(): string {
  try {
    const v = localStorage.getItem(UNIT_KEY) ?? AUTO
    return v === AUTO || byId(v) ? v : AUTO
  } catch {
    return AUTO
  }
}

/** Steht der Schalter auf Spaß? Nur dann kommt der Spruch in den Bon. */
export function funMode(): boolean {
  try {
    return localStorage.getItem('meetingtracker.metric') === 'fun'
  } catch {
    return false
  }
}

/** Kurzer Vergleich für den Bon, z. B. "31,8 Döner"; leer bei 0 €. */
export function funText(cents: number): string {
  return cents > 0 ? formatUnits(cents, unitFor(storedChoice(), cents)) : ''
}

/** Anzahl mit sinnvollen Nachkommastellen: 150,2 / 1,06 / 0,004 */
export function formatCount(cents: number, unit: FunUnit): string {
  const n = cents / unit.cents
  const digits = n >= 100 ? 0 : n >= 10 ? 1 : n >= 1 ? 2 : 3
  return n.toLocaleString('de-DE', { maximumFractionDigits: digits })
}

/** "150,2 Döner" */
export function formatUnits(cents: number, unit: FunUnit): string {
  const text = formatCount(cents, unit)
  return `${text} ${text === '1' ? unit.one : unit.many}`
}
