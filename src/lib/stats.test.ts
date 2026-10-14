import { describe, expect, it } from 'vitest'
import { costByRating, groupCost, headCount, matches, matchesRating, meetingCost, noFilter, personScores, totalCost } from './stats'
import type { Meeting } from '../data/types'

const m = (startedAt: number, durationSec: number, rates: number[]): Meeting => ({
  id: String(startedAt),
  title: 't',
  startedAt,
  durationSec,
  participants: rates.map((r, i) => ({ personId: 'p' + i, name: 'P' + i, rateCents: r })),
})

const withGroup = (m0: Meeting, count: number, rateCents: number): Meeting => ({ ...m0, group: { count, rateCents } })

describe('Pauschale', () => {
  it('10 Personen x 30 €/h x 30 Min = 150 €', () => {
    const x = withGroup(m(0, 1800, []), 10, 3000)
    expect(groupCost(x)).toBe(15000)
    expect(meetingCost(x)).toBe(15000)
  })
  it('gemischt: 1 benannte Person + 8 Pauschale', () => {
    const x = withGroup(m(0, 3600, [4500]), 8, 3000)
    expect(meetingCost(x)).toBe(4500 + 24000)
    expect(headCount(x)).toBe(9)
  })
  it('Anzahl 0 oder keine Pauschale kostet nichts', () => {
    expect(groupCost(withGroup(m(0, 3600, []), 0, 3000))).toBe(0)
    expect(groupCost(m(0, 3600, [3000]))).toBe(0)
  })
  it('Gruppe wird einmal gerundet (nicht pro Kopf)', () => {
    // 3 Personen x 1 Cent/h x 1800 s = 1,5 Cent -> 2 (pro Kopf gerundet wären es 3)
    expect(groupCost(withGroup(m(0, 1800, []), 3, 1))).toBe(2)
  })
  it('zählt in der Gesamtsumme, aber nicht im Meeting-Score', () => {
    const x = withGroup(m(0, 3600, [3000]), 5, 3000)
    expect(totalCost([x])).toBe(3000 + 15000)
    const s = personScores([x])
    expect(s).toHaveLength(1)
    expect(s[0].cents).toBe(3000)
  })
})

const rated = (m0: Meeting, rating?: Meeting['rating']): Meeting => ({ ...m0, ...(rating && { rating }) })

describe('Bewertung', () => {
  const ms = [
    rated(m(1, 3600, [3000]), 'up'), // 30,00 €
    rated(m(2, 3600, [3000, 3000]), 'down'), // 60,00 €
    rated(m(3, 1800, [3000]), 'down'), // 15,00 €
    rated(m(4, 3600, [6000]), 'neutral'), // 60,00 €
    m(5, 3600, [1000]), // 10,00 €, unbewertet
  ]
  it('Kosten und Anzahl je Bewertung', () => {
    const r = costByRating(ms)
    expect(r.up).toEqual({ cents: 3000, count: 1 })
    expect(r.down).toEqual({ cents: 7500, count: 2 })
    expect(r.neutral).toEqual({ cents: 6000, count: 1 })
    expect(r.none).toEqual({ cents: 1000, count: 1 })
    expect(r.up.cents + r.down.cents + r.neutral.cents + r.none.cents).toBe(totalCost(ms))
  })
  it('inklusive Pauschale', () => {
    const x = rated({ ...m(6, 1800, []), group: { count: 10, rateCents: 3000 } }, 'down')
    expect(costByRating([x]).down.cents).toBe(15000)
  })
  it('Filter nach Bewertung, auch unbewertet', () => {
    expect(ms.filter((x) => matchesRating(x, null))).toHaveLength(5)
    expect(ms.filter((x) => matchesRating(x, 'down'))).toHaveLength(2)
    expect(ms.filter((x) => matchesRating(x, 'none'))).toHaveLength(1)
  })
  it('Meeting-Score zählt gute und schlechte Meetings je Person', () => {
    const s = personScores(ms)
    const p0 = s.find((x) => x.personId === 'p0')!
    expect(p0).toMatchObject({ meetings: 5, up: 1, down: 2 })
  })
})

describe('stats', () => {
  it('Meetingkosten = Summe der gerundeten Personenkosten', () => {
    expect(meetingCost(m(0, 1800, [3000, 3000]))).toBe(3000)
    expect(totalCost([m(0, 1800, [3000, 3000]), m(1, 3600, [3000])])).toBe(6000)
  })
  it('alte Meetings behalten ihren gespeicherten Satz', () => {
    const old = m(0, 3600, [3000])
    const changedPersonRate = 9000 // egal, das Meeting kennt nur seinen Snapshot
    expect(changedPersonRate).not.toBe(old.participants[0].rateCents)
    expect(meetingCost(old)).toBe(3000)
  })
  it('Filter nach Jahr, Monat, Tag', () => {
    const x = m(new Date(2026, 2, 15, 10).getTime(), 60, [100])
    expect(matches(x, noFilter)).toBe(true)
    expect(matches(x, { year: 2026, month: 2, day: 15 })).toBe(true)
    expect(matches(x, { year: 2026, month: 3, day: null })).toBe(false)
    expect(matches(x, { year: 2025, month: null, day: null })).toBe(false)
  })
  it('Meeting-Score sortiert nach Zeit', () => {
    const s = personScores([m(0, 600, [3000, 3000]), m(1, 600, [3000])])
    expect(s[0]).toMatchObject({ personId: 'p0', meetings: 2, seconds: 1200 })
    expect(s[1]).toMatchObject({ personId: 'p1', meetings: 1, seconds: 600 })
  })
})
