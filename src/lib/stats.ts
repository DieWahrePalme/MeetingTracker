import { costCents } from './money'
import type { Meeting } from '../data/types'

export interface Filter {
  year: number | null
  month: number | null // 0-11
  day: number | null // 1-31
}

export const noFilter: Filter = { year: null, month: null, day: null }

export function meetingCost(m: Meeting): number {
  return m.participants.reduce((sum, p) => sum + costCents(p.rateCents, m.durationSec), 0)
}

export function totalCost(ms: Meeting[]): number {
  return ms.reduce((sum, m) => sum + meetingCost(m), 0)
}

export function matches(m: Meeting, f: Filter): boolean {
  const d = new Date(m.startedAt)
  return (
    (f.year === null || d.getFullYear() === f.year) &&
    (f.month === null || d.getMonth() === f.month) &&
    (f.day === null || d.getDate() === f.day)
  )
}

export interface PersonScore {
  personId: string
  name: string
  meetings: number
  seconds: number
  cents: number
}

export function personScores(ms: Meeting[]): PersonScore[] {
  const map = new Map<string, PersonScore>()
  for (const m of [...ms].sort((a, b) => a.startedAt - b.startedAt)) {
    for (const p of m.participants) {
      const s = map.get(p.personId) ?? { personId: p.personId, name: p.name, meetings: 0, seconds: 0, cents: 0 }
      s.name = p.name
      s.meetings += 1
      s.seconds += m.durationSec
      s.cents += costCents(p.rateCents, m.durationSec)
      map.set(p.personId, s)
    }
  }
  return [...map.values()].sort((a, b) => b.seconds - a.seconds)
}
