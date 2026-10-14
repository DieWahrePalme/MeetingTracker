// Die einzige Stelle, die Daten speichert. Später kann hier ein Backend angeschlossen werden.
import { useSyncExternalStore } from 'react'
import type { AppData, FlatGroup, Meeting, Participant, Person, Rating, Team } from './types'

const KEY = 'meetingtracker.v1'

const emptyData = (): AppData => ({
  version: 1,
  companyName: 'Unternehmen A',
  people: [],
  teams: [],
  hiddenSuggestions: [],
  meetings: [],
  live: null,
})

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null
const isInt = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0
const isStr = (x: unknown): x is string => typeof x === 'string'

/** Optionale Pauschale; Anzahl 0 zählt als keine Pauschale. */
function parseGroup(x: unknown): FlatGroup | undefined {
  if (x === undefined || x === null) return undefined
  if (!isObj(x) || !isInt(x.count) || !isInt(x.rateCents)) throw new Error('Ungültige Pauschale')
  return x.count === 0 ? undefined : { count: x.count, rateCents: x.rateCents }
}

/** Optionale Bewertung. */
function parseRating(x: unknown): Rating | undefined {
  if (x === undefined || x === null) return undefined
  if (x === 'up' || x === 'neutral' || x === 'down') return x
  throw new Error('Ungültige Bewertung')
}

/** Prüft importierte Daten streng, wirft bei Fehlern. */
export function parseData(raw: unknown): AppData {
  if (!isObj(raw) || raw.version !== 1) throw new Error('Unbekanntes Format')
  if (!isStr(raw.companyName) || !Array.isArray(raw.people) || !Array.isArray(raw.meetings)) {
    throw new Error('Unvollständige Daten')
  }
  const people = raw.people.map((p): Person => {
    if (!isObj(p) || !isStr(p.id) || !isStr(p.name) || !isInt(p.rateCents)) throw new Error('Ungültige Person')
    return { id: p.id, name: p.name, rateCents: p.rateCents, ...(p.archived === true && { archived: true }) }
  })
  // Teams sind optional (alte Dateien haben keine)
  const rawTeams = raw.teams === undefined || raw.teams === null ? [] : raw.teams
  if (!Array.isArray(rawTeams)) throw new Error('Ungültige Teams')
  const teams = rawTeams.map((x): Team => {
    if (!isObj(x) || !isStr(x.id) || !isStr(x.name) || !Array.isArray(x.personIds)) throw new Error('Ungültiges Team')
    return { id: x.id, name: x.name, personIds: x.personIds.filter(isStr) }
  })
  const meetings = raw.meetings.map((m): Meeting => {
    if (!isObj(m) || !isStr(m.id) || !isStr(m.title) || !isInt(m.startedAt) || !isInt(m.durationSec) || !Array.isArray(m.participants)) {
      throw new Error('Ungültiges Meeting')
    }
    const participants = m.participants.map((p): Participant => {
      if (!isObj(p) || !isStr(p.personId) || !isStr(p.name) || !isInt(p.rateCents)) throw new Error('Ungültige Teilnehmer')
      return { personId: p.personId, name: p.name, rateCents: p.rateCents }
    })
    const group = parseGroup(m.group)
    const rating = parseRating(m.rating)
    return { id: m.id, title: m.title, startedAt: m.startedAt, durationSec: m.durationSec, participants, ...(group && { group }), ...(rating && { rating }) }
  })
  let live: AppData['live'] = null
  if (isObj(raw.live) && isStr(raw.live.title) && isInt(raw.live.startedAt) && Array.isArray(raw.live.personIds)) {
    let group: FlatGroup | undefined
    let rating: Rating | undefined
    try {
      group = parseGroup(raw.live.group)
      rating = parseRating(raw.live.rating)
    } catch {
      /* kaputte Zusatzdaten im laufenden Meeting ignorieren */
    }
    live = { title: raw.live.title, startedAt: raw.live.startedAt, personIds: raw.live.personIds.filter(isStr), ...(group && { group }), ...(rating && { rating }) }
  }
  const hiddenSuggestions = Array.isArray(raw.hiddenSuggestions) ? raw.hiddenSuggestions.filter(isStr) : []
  return { version: 1, companyName: raw.companyName, people, teams, hiddenSuggestions, meetings, live }
}

function load(): AppData {
  try {
    const text = localStorage.getItem(KEY)
    if (text) return parseData(JSON.parse(text))
  } catch {
    /* kaputt oder blockiert: leer starten */
  }
  return emptyData()
}

let state: AppData = load()
const listeners = new Set<() => void>()

function set(next: AppData) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* Speicher voll oder blockiert */
  }
  listeners.forEach((l) => l())
}

export function useData(): AppData {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}

// crypto.randomUUID gibt es nur über HTTPS oder localhost, daher ein Ersatz (z. B. für http über Tailscale).
const uid = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)

// ---- Aktionen ----
export const actions = {
  setCompanyName(name: string) {
    set({ ...state, companyName: name })
  },
  savePerson(p: { id?: string; name: string; rateCents: number; archived?: boolean }) {
    if (p.id) {
      set({
        ...state,
        people: state.people.map((x) => {
          if (x.id !== p.id) return x
          const { archived: _old, ...rest } = x
          return { ...rest, name: p.name, rateCents: p.rateCents, ...(p.archived && { archived: true }) }
        }),
      })
    } else {
      set({ ...state, people: [...state.people, { id: uid(), name: p.name, rateCents: p.rateCents }] })
    }
  },
  deletePerson(id: string) {
    set({
      ...state,
      people: state.people.filter((x) => x.id !== id),
      teams: state.teams.map((tm) => ({ ...tm, personIds: tm.personIds.filter((pid) => pid !== id) })),
    })
  },
  saveTeam(tm: { id?: string; name: string; personIds: string[] }) {
    if (tm.id) {
      set({ ...state, teams: state.teams.map((x) => (x.id === tm.id ? { ...x, name: tm.name, personIds: tm.personIds } : x)) })
    } else {
      set({ ...state, teams: [...state.teams, { id: uid(), name: tm.name, personIds: tm.personIds }] })
    }
  },
  hideSuggestion(id: string) {
    set({ ...state, hiddenSuggestions: [...state.hiddenSuggestions, id].slice(-200) })
  },
  deleteTeam(id: string) {
    set({ ...state, teams: state.teams.filter((x) => x.id !== id) })
  },
  /** Neue Teilnehmer bekommen den aktuellen Satz, schon vorhandene behalten ihren gespeicherten Satz. */
  saveMeeting(m: { id?: string; title: string; startedAt: number; durationSec: number; personIds: string[]; group?: FlatGroup | null; rating?: Rating | null }) {
    const old = m.id ? state.meetings.find((x) => x.id === m.id) : undefined
    const participants: Participant[] = m.personIds.flatMap((pid) => {
      const kept = old?.participants.find((p) => p.personId === pid)
      if (kept) return [kept]
      const person = state.people.find((p) => p.id === pid)
      return person ? [{ personId: pid, name: person.name, rateCents: person.rateCents }] : []
    })
    const meeting: Meeting = {
      id: m.id ?? uid(),
      title: m.title,
      startedAt: m.startedAt,
      durationSec: m.durationSec,
      participants,
      ...(m.group && m.group.count > 0 && { group: m.group }),
      ...(m.rating && { rating: m.rating }),
    }
    set({ ...state, meetings: old ? state.meetings.map((x) => (x.id === old.id ? meeting : x)) : [...state.meetings, meeting] })
    return meeting
  },
  /** Bewertung direkt am gespeicherten Meeting setzen oder (null) entfernen. */
  setRating(id: string, rating: Rating | null) {
    set({
      ...state,
      meetings: state.meetings.map((x) => {
        if (x.id !== id) return x
        const { rating: _old, ...rest } = x
        return rating ? { ...rest, rating } : rest
      }),
    })
  },
  deleteMeeting(id: string) {
    set({ ...state, meetings: state.meetings.filter((x) => x.id !== id) })
  },
  startLive() {
    set({ ...state, live: { title: '', startedAt: Date.now(), personIds: [] } })
  },
  updateLive(patch: { title?: string; personIds?: string[]; group?: FlatGroup | null; rating?: Rating | null }) {
    if (!state.live) return
    const { group, rating, ...rest } = patch
    const next = { ...state.live, ...rest }
    if (group !== undefined) {
      if (group) next.group = group
      else delete next.group
    }
    if (rating !== undefined) {
      if (rating) next.rating = rating
      else delete next.rating
    }
    set({ ...state, live: next })
  },
  /** Beendet das laufende Meeting, speichert es und liefert es zurück (für den Bon). */
  stopLive(): Meeting | undefined {
    const l = state.live
    if (!l) return undefined
    const durationSec = Math.max(1, Math.round((Date.now() - l.startedAt) / 1000))
    const saved = actions.saveMeeting({ title: l.title.trim() || 'Meeting', startedAt: l.startedAt, durationSec, personIds: l.personIds, group: l.group, rating: l.rating })
    set({ ...state, live: null })
    return saved
  },
  cancelLive() {
    set({ ...state, live: null })
  },
  loadDemo() {
    const people: Person[] = [
      { id: uid(), name: 'Person A', rateCents: 3000 },
      { id: uid(), name: 'Person B', rateCents: 4500 },
      { id: uid(), name: 'Person C', rateCents: 6000 },
      { id: uid(), name: 'Besucher', rateCents: 2500 },
    ]
    const day = 86_400_000
    const now = Date.now()
    const mk = (title: string, daysAgo: number, min: number, idx: number[], group?: FlatGroup, rating?: Rating): Meeting => ({
      id: uid(),
      title,
      startedAt: now - daysAgo * day,
      durationSec: min * 60,
      participants: idx.map((i) => ({ personId: people[i].id, name: people[i].name, rateCents: people[i].rateCents })),
      ...(group && { group }),
      ...(rating && { rating }),
    })
    set({
      ...state,
      people,
      teams: [{ id: uid(), name: 'Team Beispiel', personIds: [people[0].id, people[1].id, people[2].id] }],
      meetings: [
        mk('Wochenplanung', 7, 30, [0, 1], undefined, 'up'),
        mk('Wochenplanung', 14, 30, [0, 1], undefined, 'up'),
        mk('Wochenplanung', 21, 30, [0, 1], undefined, 'neutral'),
        mk('Abstimmung Projekt', 3, 90, [0, 1, 2], undefined, 'neutral'),
        mk('Kurzes Update', 8, 15, [0, 2], undefined, 'up'),
        mk('Teamrunde mit Pauschale', 5, 60, [0], { count: 8, rateCents: 3000 }, 'down'),
        mk('Workshop mit Besuch', 40, 150, [0, 1, 2, 3], undefined, 'down'),
        mk('Jahresrückblick', 400, 120, [0, 1, 2]),
      ],
    })
  },
  exportJson(): string {
    return JSON.stringify({ ...state, live: null }, null, 2)
  },
  importJson(text: string) {
    set(parseData(JSON.parse(text)))
  },
  clearAll() {
    set(emptyData())
  },
}
