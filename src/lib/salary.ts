// Näherung für Deutschland, KEINE Gehaltsabrechnung: Vorschlag für einen Stundensatz aus dem Jahresbrutto.
// Arbeitgeberkosten = Brutto + Arbeitgeberanteil. Der Anteil sinkt bei hohen Gehältern
// (Beitragsbemessungsgrenzen). Zwischen den Stützpunkten wird linear interpoliert,
// darunter gilt 22 %, darüber 19 %. Alle Beträge in Cent (ganze Zahlen).

/** Stützpunkte: Jahresbrutto -> Arbeitgeberkosten, in Euro. */
const ANCHORS_EUR: ReadonlyArray<readonly [number, number]> = [
  [50_000, 61_000],
  [75_000, 91_000],
  [100_000, 119_000],
]
const SHARE_BELOW_PCT = 22 // unter dem ersten Stützpunkt
const SHARE_ABOVE_PCT = 19 // über dem letzten Stützpunkt

/** Produktive Stunden pro Jahr: ohne Urlaub, Feiertage, Krankheit. */
export const PRODUCTIVE_HOURS = 1700
/** Nominal: 40 Stunden x 52 Wochen. */
export const NOMINAL_HOURS = 2080

const divRound = (a: number, b: number) => Math.round(a / b)

/** Arbeitgeberkosten pro Jahr in Cent. */
export function employerCostCents(grossYearCents: number): number {
  const pts = ANCHORS_EUR.map(([g, c]) => [g * 100, c * 100] as const)
  const first = pts[0]
  const last = pts[pts.length - 1]
  if (grossYearCents <= first[0]) return divRound(grossYearCents * (100 + SHARE_BELOW_PCT), 100)
  if (grossYearCents >= last[0]) return last[1] + divRound((grossYearCents - last[0]) * (100 + SHARE_ABOVE_PCT), 100)
  for (let i = 1; i < pts.length; i++) {
    const [g0, c0] = pts[i - 1]
    const [g1, c1] = pts[i]
    if (grossYearCents <= g1) return c0 + divRound((grossYearCents - g0) * (c1 - c0), g1 - g0)
  }
  return last[1]
}

/** Stundensatz-Vorschlag in Cent (einmal gerundet). grossOnly: nur Brutto / Stunden. */
export function suggestedRateCents(grossYearCents: number, hoursPerYear: number, grossOnly = false): number {
  if (hoursPerYear <= 0) return 0
  const base = grossOnly ? grossYearCents : employerCostCents(grossYearCents)
  return divRound(base, hoursPerYear)
}
