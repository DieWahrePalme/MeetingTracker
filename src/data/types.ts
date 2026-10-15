export interface Person {
  id: string
  name: string
  rateCents: number // Cent pro Stunde
  archived?: boolean // archiviert: nicht mehr in der Auswahl, alte Meetings bleiben
}

/** Gespeichertes Team: ein Tipp wählt alle Mitglieder für ein Meeting. */
export interface Team {
  id: string
  name: string
  personIds: string[]
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
  manual?: true // nachgetragen (nicht live gestoppt)
  startSet?: true // bei Nachgetragenem: der Beginn wurde selbst eingegeben
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
  teams: Team[]
  /** Ausgeblendete Vorschläge für wiederkehrende Meetings (Serie + Fälligkeitstag). */
  hiddenSuggestions: string[]
  meetings: Meeting[]
  live: LiveMeeting | null
}
