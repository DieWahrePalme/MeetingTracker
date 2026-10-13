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

export interface Meeting {
  id: string
  title: string
  startedAt: number // ms seit 1970
  durationSec: number
  participants: Participant[]
}

export interface LiveMeeting {
  title: string
  startedAt: number
  personIds: string[]
}

export interface AppData {
  version: 1
  companyName: string
  people: Person[]
  meetings: Meeting[]
  live: LiveMeeting | null
}
