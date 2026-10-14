import { describe, expect, it } from 'vitest'
import { lastUsed, norm, pickOptions } from './people'
import type { Meeting, Person } from '../data/types'

const person = (id: string, name: string, archived = false): Person => ({ id, name, rateCents: 3000, ...(archived && { archived }) })
const meeting = (startedAt: number, ids: string[]): Meeting => ({
  id: String(startedAt),
  title: 't',
  startedAt,
  durationSec: 60,
  participants: ids.map((id) => ({ personId: id, name: id, rateCents: 3000 })),
})

describe('norm', () => {
  it('ignoriert Groß/Kleinschreibung und Umlaute', () => {
    expect(norm('  Jürgen ')).toBe('jurgen')
  })
})

describe('Auswahl der Personen', () => {
  const people = [person('a', 'Anna'), person('b', 'Bernd'), person('c', 'Clara'), person('d', 'Dora', true)]

  it('zuletzt genutzte zuerst, Rest alphabetisch', () => {
    const ms = [meeting(100, ['c']), meeting(200, ['b']), meeting(50, ['c'])]
    expect(lastUsed(ms).get('c')).toBe(100)
    expect(pickOptions(people, ms).map((o) => o.id)).toEqual(['b', 'c', 'a'])
  })
  it('ohne Meetings alphabetisch', () => {
    expect(pickOptions(people, []).map((o) => o.name)).toEqual(['Anna', 'Bernd', 'Clara'])
  })
  it('archivierte fehlen, außer sie sind schon im Meeting', () => {
    expect(pickOptions(people, []).some((o) => o.id === 'd')).toBe(false)
    expect(pickOptions(people, [], ['d']).some((o) => o.id === 'd')).toBe(true)
  })
  it('Teilnehmer gelöschter Personen bleiben wählbar', () => {
    const ghost = [{ personId: 'x', name: 'Ehemaliger', rateCents: 3000 }]
    expect(pickOptions(people, [], [], ghost).some((o) => o.id === 'x')).toBe(true)
  })
})
