import { describe, expect, it } from 'vitest'
import { matches, meetingCost, noFilter, personScores, totalCost } from './stats'
import type { Meeting } from '../data/types'

const m = (startedAt: number, durationSec: number, rates: number[]): Meeting => ({
  id: String(startedAt),
  title: 't',
  startedAt,
  durationSec,
  participants: rates.map((r, i) => ({ personId: 'p' + i, name: 'P' + i, rateCents: r })),
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
