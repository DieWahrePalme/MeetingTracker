import type { Meeting, Participant, Person } from '../data/types'

export interface PickOption {
  id: string
  name: string
}

const collator = new Intl.Collator('de')

/** Normalisiert Text für die Suche: ohne Groß/Kleinschreibung und Umlaute. */
export const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

/** Zeitpunkt der letzten Teilnahme je Person (aus den gespeicherten Meetings). */
export function lastUsed(meetings: Meeting[]): Map<string, number> {
  const out = new Map<string, number>()
  for (const m of meetings) {
    for (const p of m.participants) {
      if ((out.get(p.personId) ?? -1) < m.startedAt) out.set(p.personId, m.startedAt)
    }
  }
  return out
}

/**
 * Auswahl für ein Meeting: zuletzt genutzte Personen zuerst, dann alphabetisch.
 * Archivierte Personen fehlen, außer sie sind in `keepIds` (z. B. schon im bearbeiteten Meeting).
 * `ghosts` sind Teilnehmer gelöschter Personen aus einem bestehenden Meeting.
 */
export function pickOptions(people: Person[], meetings: Meeting[], keepIds: string[] = [], ghosts: Participant[] = []): PickOption[] {
  const last = lastUsed(meetings)
  const list: PickOption[] = [
    ...people.filter((p) => !p.archived || keepIds.includes(p.id)).map((p) => ({ id: p.id, name: p.name })),
    ...ghosts.filter((g) => !people.some((p) => p.id === g.personId)).map((g) => ({ id: g.personId, name: g.name })),
  ]
  return list.sort((a, b) => (last.get(b.id) ?? -1) - (last.get(a.id) ?? -1) || collator.compare(a.name, b.name))
}
