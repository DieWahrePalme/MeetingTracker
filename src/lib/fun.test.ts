import { describe, expect, it } from 'vitest'
import { AUTO, FUN_UNITS, formatUnits, unitFor } from './fun'

describe('Spaß-Einheiten', () => {
  const doener = FUN_UNITS.find((u) => u.id === 'doener')!
  it('rechnet in Einheiten um', () => {
    expect(formatUnits(8500, doener)).toBe('10 Döner')
    expect(formatUnits(850, doener)).toBe('1 Döner')
  })
  it('automatisch: größte passende Einheit, unter einem Döner Kaffee', () => {
    expect(unitFor(AUTO, 4000).id).toBe('doener')
    expect(unitFor(AUTO, 130_000).id).toBe('hochregal')
    expect(unitFor(AUTO, 40_000_000).id).toBe('maybach')
    expect(unitFor(AUTO, 500).id).toBe('kaffee')
    expect(unitFor('pizza', 5).id).toBe('pizza')
  })
})
