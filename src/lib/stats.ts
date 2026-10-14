import { costCents } from './money'
import type { Meeting, Rating } from '../data/types'
import { norm } from './people'

export interface Filter {
  year: number | null
  month: number | null // 0-11
  day: number | null // 1-31
}

export const noFilter: Filter = { year: null, month: null, day: null }

/** Pauschale: Anzahl x Satz x Sekunden / 3600, einmal gerundet. */
export function groupCost(m: Pick<Meeting, 'durationSec' | 'group'>): number {
  return m.group ? costCents(m.group.count * m.group.rateCents, m.durationSec) : 0
}

export function meetingCost(m: Meeting): number {
  return m.participants.reduce((sum, p) => sum + costCents(p.rateCents, m.durationSec), 0) + groupCost(m)
}

/** Teilnehmer inklusive Pauschale. */
export function headCount(m: Meeting): number {
  return m.participants.length + (m.group?.count ?? 0)
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

/** Suche in der Meeting-Liste: Titel oder Name eines Teilnehmers. */
export function matchesSearch(m: Meeting, query: string): boolean {
  const q = norm(query)
  return !q || norm(m.title).includes(q) || m.participants.some((p) => norm(p.name).includes(q))
}

export type RatingFilter = Rating | 'none' | null

/** Bewertungsfilter: null = alle, 'none' = unbewertet. */
export function matchesRating(m: Meeting, f: RatingFilter): boolean {
  return f === null || (f === 'none' ? !m.rating : m.rating === f)
}

export type RatingKey = Rating | 'none'

/** Kosten (Cent) und Anzahl Meetings je Bewertung, inklusive unbewertet. */
export function costByRating(ms: Meeting[]): Record<RatingKey, { cents: number; count: number }> {
  const out: Record<RatingKey, { cents: number; count: number }> = {
    up: { cents: 0, count: 0 },
    neutral: { cents: 0, count: 0 },
    down: { cents: 0, count: 0 },
    none: { cents: 0, count: 0 },
  }
  for (const m of ms) {
    const k: RatingKey = m.rating ?? 'none'
    out[k].cents += meetingCost(m)
    out[k].count += 1
  }
  return out
}

export interface PersonScore {
  personId: string
  name: string
  meetings: number
  seconds: number
  cents: number
  up: number // Meetings dieser Person, die mit Daumen hoch bewertet wurden
  down: number
}

export function personScores(ms: Meeting[]): PersonScore[] {
  const map = new Map<string, PersonScore>()
  for (const m of [...ms].sort((a, b) => a.startedAt - b.startedAt)) {
    for (const p of m.participants) {
      const s = map.get(p.personId) ?? { personId: p.personId, name: p.name, meetings: 0, seconds: 0, cents: 0, up: 0, down: 0 }
      s.name = p.name
      s.meetings += 1
      s.seconds += m.durationSec
      s.cents += costCents(p.rateCents, m.durationSec)
      if (m.rating === 'up') s.up += 1
      if (m.rating === 'down') s.down += 1
      map.set(p.personId, s)
    }
  }
  return [...map.values()].sort((a, b) => b.seconds - a.seconds)
}
