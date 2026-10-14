import { describe, expect, it } from 'vitest'
import { parseData } from './store'

const base = (meeting: object) => ({
  version: 1,
  companyName: 'X',
  people: [],
  meetings: [{ id: 'a', title: 't', startedAt: 1, durationSec: 60, participants: [], ...meeting }],
})

describe('Import (parseData)', () => {
  it('alte Dateien ohne Pauschale funktionieren weiter', () => {
    const d = parseData(base({}))
    expect(d.meetings[0].group).toBeUndefined()
  })
  it('liest eine Pauschale', () => {
    const d = parseData(base({ group: { count: 8, rateCents: 3000 } }))
    expect(d.meetings[0].group).toEqual({ count: 8, rateCents: 3000 })
  })
  it('Anzahl 0 wird zu keiner Pauschale', () => {
    expect(parseData(base({ group: { count: 0, rateCents: 3000 } })).meetings[0].group).toBeUndefined()
  })
  it('alte Dateien haben keine Bewertung', () => {
    expect(parseData(base({})).meetings[0].rating).toBeUndefined()
  })
  it('liest Bewertungen', () => {
    for (const r of ['up', 'neutral', 'down'] as const) {
      expect(parseData(base({ rating: r })).meetings[0].rating).toBe(r)
    }
  })
  it('lehnt ungültige Bewertungen ab', () => {
    expect(() => parseData(base({ rating: 'super' }))).toThrow()
    expect(() => parseData(base({ rating: 1 }))).toThrow()
  })
  it('lehnt kaputte Pauschalen ab', () => {
    expect(() => parseData(base({ group: { count: -1, rateCents: 3000 } }))).toThrow()
    expect(() => parseData(base({ group: { count: 2.5, rateCents: 3000 } }))).toThrow()
    expect(() => parseData(base({ group: 'x' }))).toThrow()
  })
})
