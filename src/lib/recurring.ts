import type { Meeting } from '../data/types'
import { norm } from './people'

export interface Suggestion {
  /** Eindeutig je Serie und Fälligkeitstag, zum Ausblenden. */
  id: string
  title: string
  /** Das letzte Meeting der Serie, dient als Vorlage. */
  last: Meeting
  intervalDays: number
  dueAt: number // ms, Tag der Fälligkeit (lokal 12:00)
  daysUntil: number // negativ = überfällig
}

const MIN_OCCURRENCES = 3 // mindestens 3 Tage mit diesem Titel, also 2 Abstände
const MAX_INTERVAL_DAYS = 62
const DEFAULT_TITLE = 'meeting' // unbenannte Meetings gehören nicht zusammen

/** Kalendertag (lokal) als fortlaufende Zahl. */
export function dayNo(ms: number): number {
  const d = new Date(ms)
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000)
}

function dayToMs(day: number): number {
  const d = new Date(day * 86_400_000)
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12).getTime()
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

/**
 * Erkennt wiederkehrende Meetings: gleicher Titel, mindestens 3 Tage, gleichmäßiger Abstand
 * (jeder Abstand höchstens 25 % neben dem mittleren). Vorgeschlagen wird, wenn das nächste
 * morgen, heute oder höchstens einen Abstand überfällig ist. Es wird nichts gespeichert.
 */
export function suggestRecurring(meetings: Meeting[], now: number, hidden: string[] = []): Suggestion[] {
  const groups = new Map<string, Meeting[]>()
  for (const m of meetings) {
    const key = norm(m.title)
    if (!key || key === DEFAULT_TITLE) continue
    groups.set(key, [...(groups.get(key) ?? []), m])
  }
  const today = dayNo(now)
  const out: Suggestion[] = []
  for (const [key, list] of groups) {
    list.sort((a, b) => a.startedAt - b.startedAt)
    const last = list[list.length - 1]
    // ein Eintrag je Kalendertag, die letzten 6 Tage zählen
    const days = [...new Set(list.map((m) => dayNo(m.startedAt)))].slice(-6)
    if (days.length < MIN_OCCURRENCES) continue
    const gaps = days.slice(1).map((d, i) => d - days[i])
    const interval = median(gaps)
    const tolerance = Math.max(1, Math.round(interval * 0.25))
    if (interval < 1 || interval > MAX_INTERVAL_DAYS || gaps.some((g) => Math.abs(g - interval) > tolerance)) continue
    const dueDay = days[days.length - 1] + interval
    const daysUntil = dueDay - today
    if (daysUntil > 1 || daysUntil < -interval) continue
    const id = `${key}|${dueDay}`
    if (hidden.includes(id)) continue
    out.push({ id, title: last.title, last, intervalDays: interval, dueAt: dayToMs(dueDay), daysUntil })
  }
  return out.sort((a, b) => a.daysUntil - b.daysUntil || a.title.localeCompare(b.title, 'de'))
}
