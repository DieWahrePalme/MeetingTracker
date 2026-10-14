export interface Person {
  id: string
  name: string
  rateCents: number // Cent pro Stunde
}

/** Kopie der Person zum Zeitpunkt des Speicherns, damit spätere Satzänderungen alte Meetings nicht ändern. */
export interface Participant {
  personId: string
  name: string
  rateCents: number
}

export type Rating = 'up' | 'neutral' | 'down'

/** Pauschale für anonyme Teilnehmer: Anzahl und Stundensatz pro Person (Cent), im Meeting gespeichert. */
export interface FlatGroup {
  count: number
  rateCents: number
}

export interface Meeting {
  id: string
  title: string
  startedAt: number // ms seit 1970
  durationSec: number
  participants: Participant[]
  group?: FlatGroup
  rating?: Rating // optional: Daumen hoch / neutral / Daumen runter
}

export interface LiveMeeting {
  title: string
  startedAt: number
  personIds: string[]
  group?: FlatGroup
  rating?: Rating
}

export interface AppData {
  version: 1
  companyName: string
  people: Person[]
  meetings: Meeting[]
  live: LiveMeeting | null
}
