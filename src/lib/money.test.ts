import { describe, expect, it } from 'vitest'
import { costCents, formatDuration, formatEuro, parseEuroToCents } from './money'

describe('costCents', () => {
  it('30 Min bei 30 €/h = 15 €', () => {
    expect(costCents(3000, 1800)).toBe(1500)
  })
  it('zwei Personen: 30 €', () => {
    expect(costCents(3000, 1800) * 2).toBe(3000)
  })
  it('rundet einmal auf ganze Cent (halbe Cent nach oben)', () => {
    // 3000 * 1 / 3600 = 0,8333 -> 1 Cent
    expect(costCents(3000, 1)).toBe(1)
    // 1 Cent/h * 1800 s = 0,5 Cent -> 1
    expect(costCents(1, 1800)).toBe(1)
    // 1 Cent/h * 1799 s = 0,4997 -> 0
    expect(costCents(1, 1799)).toBe(0)
  })
  it('0 Sekunden kosten 0', () => {
    expect(costCents(5000, 0)).toBe(0)
  })
  it('keine Gleitkommafehler bei langen Meetings', () => {
    expect(costCents(12345, 3600 * 8)).toBe(12345 * 8)
  })
})

describe('formatEuro', () => {
  it('deutsches Format', () => {
    expect(formatEuro(123456)).toBe('1.234,56 €')
    expect(formatEuro(5)).toBe('0,05 €')
    expect(formatEuro(0)).toBe('0,00 €')
  })
})

describe('parseEuroToCents', () => {
  it('versteht deutsche und einfache Eingaben', () => {
    expect(parseEuroToCents('30')).toBe(3000)
    expect(parseEuroToCents('30,5')).toBe(3050)
    expect(parseEuroToCents('1.234,56 €')).toBe(123456)
    expect(parseEuroToCents('30.50')).toBe(3050)
    expect(parseEuroToCents('30 €/h')).toBe(3000)
    expect(parseEuroToCents('45,50 Euro')).toBe(4550)
  })
  it('lehnt Unsinn ab', () => {
    expect(parseEuroToCents('')).toBeNull()
    expect(parseEuroToCents('abc')).toBeNull()
    expect(parseEuroToCents('-5')).toBeNull()
    expect(parseEuroToCents('1,234')).toBeNull()
  })
})

describe('formatDuration', () => {
  it('h:mm:ss', () => {
    expect(formatDuration(0)).toBe('0:00:00')
    expect(formatDuration(3725)).toBe('1:02:05')
    expect(formatDuration(36000)).toBe('10:00:00')
  })
})

describe('Zeit aller Teilnehmer als h:mm:ss', () => {
  it('Summen über 100 Stunden bleiben in Stunden', () => {
    expect(formatDuration(200 * 3600 + 45 * 60 + 12)).toBe('200:45:12')
    expect(formatDuration(1234 * 3600)).toBe('1234:00:00')
    expect(formatDuration(36000)).toBe('10:00:00')
  })
})
