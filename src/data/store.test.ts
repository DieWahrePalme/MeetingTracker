import { describe, expect, it } from 'vitest'
import { actions, parseData } from './store'

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

describe('Teams und Archiv', () => {
  const file = (extra: object) => ({ version: 1, companyName: 'X', people: [], meetings: [], ...extra })

  it('alte Dateien ohne Teams funktionieren', () => {
    expect(parseData(file({})).teams).toEqual([])
  })
  it('liest Teams und archivierte Personen', () => {
    const d = parseData(
      file({
        people: [{ id: 'a', name: 'A', rateCents: 100, archived: true }, { id: 'b', name: 'B', rateCents: 100 }],
        teams: [{ id: 't', name: 'Team', personIds: ['a', 'b'] }],
      }),
    )
    expect(d.people[0].archived).toBe(true)
    expect(d.people[1].archived).toBeUndefined()
    expect(d.teams[0].personIds).toEqual(['a', 'b'])
  })
  it('lehnt kaputte Teams ab', () => {
    expect(() => parseData(file({ teams: 'x' }))).toThrow()
    expect(() => parseData(file({ teams: [{ id: 't' }] }))).toThrow()
  })
  it('Person löschen entfernt sie aus Teams; Archivieren lässt sie im Team', () => {
    actions.clearAll()
    actions.savePerson({ name: 'A', rateCents: 100 })
    actions.savePerson({ name: 'B', rateCents: 100 })
    const ids = JSON.parse(actions.exportJson()).people.map((p: { id: string }) => p.id)
    actions.saveTeam({ name: 'T', personIds: ids })
    actions.savePerson({ id: ids[0], name: 'A', rateCents: 100, archived: true })
    let d = JSON.parse(actions.exportJson())
    expect(d.people[0].archived).toBe(true)
    expect(d.teams[0].personIds).toEqual(ids)
    actions.savePerson({ id: ids[0], name: 'A', rateCents: 100, archived: false })
    expect(JSON.parse(actions.exportJson()).people[0].archived).toBeUndefined()
    actions.deletePerson(ids[0])
    d = JSON.parse(actions.exportJson())
    expect(d.teams[0].personIds).toEqual([ids[1]])
    actions.clearAll()
  })
})
