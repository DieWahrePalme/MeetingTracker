import { describe, expect, it } from 'vitest'
import { NOMINAL_HOURS, PRODUCTIVE_HOURS, employerCostCents, suggestedRateCents } from './salary'

const eur = (n: number) => n * 100

describe('Arbeitgeberkosten', () => {
  it('Stützpunkte', () => {
    expect(employerCostCents(eur(50_000))).toBe(eur(61_000))
    expect(employerCostCents(eur(75_000))).toBe(eur(91_000))
    expect(employerCostCents(eur(100_000))).toBe(eur(119_000))
  })
  it('darunter 22 %, darüber 19 %', () => {
    expect(employerCostCents(eur(30_000))).toBe(eur(36_600))
    expect(employerCostCents(eur(120_000))).toBe(eur(119_000) + eur(20_000) * 1.19)
  })
  it('linear dazwischen', () => {
    expect(employerCostCents(eur(62_500))).toBe(eur(76_000))
  })
})

describe('Stundensatz-Vorschlag', () => {
  it('1700 Stunden: ca. 36 / 54 / 70 €', () => {
    expect(suggestedRateCents(eur(50_000), PRODUCTIVE_HOURS)).toBe(3588)
    expect(suggestedRateCents(eur(75_000), PRODUCTIVE_HOURS)).toBe(5353)
    expect(suggestedRateCents(eur(100_000), PRODUCTIVE_HOURS)).toBe(7000)
  })
  it('2080 Stunden: ca. 29 / 44 / 57 €', () => {
    expect(suggestedRateCents(eur(50_000), NOMINAL_HOURS)).toBe(2933)
    expect(suggestedRateCents(eur(75_000), NOMINAL_HOURS)).toBe(4375)
    expect(suggestedRateCents(eur(100_000), NOMINAL_HOURS)).toBe(5721)
  })
  it('nur Brutto', () => {
    expect(suggestedRateCents(eur(51_000), 1700, true)).toBe(3000)
  })
  it('0 Stunden ergibt 0', () => {
    expect(suggestedRateCents(eur(50_000), 0)).toBe(0)
  })
})
