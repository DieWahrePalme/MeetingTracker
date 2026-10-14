import { describe, expect, it } from 'vitest'
import { suggestRecurring } from './recurring'
import type { Meeting } from '../data/types'

// Oktober 2026, lokale Zeit
const at = (day: number, hour = 10) => new Date(2026, 9, day, hour).getTime()
const m = (title: string, day: number): Meeting => ({ id: `${title}${day}`, title, startedAt: at(day), durationSec: 1800, participants: [] })
const weekly = (title: string, days: number[]) => days.map((d) => m(title, d))

describe('wiederkehrende Meetings', () => {
  it('wöchentlich: heute fällig', () => {
    const s = suggestRecurring(weekly('Wochenplanung', [1, 8, 15]), at(22))
    expect(s).toHaveLength(1)
    expect(s[0]).toMatchObject({ title: 'Wochenplanung', intervalDays: 7, daysUntil: 0 })
  })
  it('morgen fällig und überfällig werden vorgeschlagen', () => {
    expect(suggestRecurring(weekly('A', [1, 8, 15]), at(21))[0].daysUntil).toBe(1)
    expect(suggestRecurring(weekly('A', [1, 8, 15]), at(25))[0].daysUntil).toBe(-3)
  })
  it('zu früh oder mehr als einen Abstand überfällig: kein Vorschlag', () => {
    expect(suggestRecurring(weekly('A', [1, 8, 15]), at(19))).toHaveLength(0) // noch 3 Tage
    expect(suggestRecurring(weekly('A', [1, 8, 15]), at(30))).toHaveLength(0) // 8 Tage überfällig
  })
  it('braucht mindestens 3 Termine', () => {
    expect(suggestRecurring(weekly('A', [8, 15]), at(22))).toHaveLength(0)
  })
  it('unregelmäßige Abstände sind keine Serie', () => {
    expect(suggestRecurring(weekly('A', [1, 3, 15]), at(29))).toHaveLength(0)
  })
  it('Abstände mit kleiner Abweichung zählen (7, 8 Tage)', () => {
    expect(suggestRecurring(weekly('A', [1, 8, 16]), at(23))).toHaveLength(1)
  })
  it('Titel zählt ohne Groß/Kleinschreibung, unbenannte "Meeting" nie', () => {
    const mixed = [m('Daily', 1), m('daily', 8), m('DAILY', 15)]
    expect(suggestRecurring(mixed, at(22))).toHaveLength(1)
    expect(suggestRecurring(weekly('Meeting', [1, 8, 15]), at(22))).toHaveLength(0)
  })
  it('mehrere Meetings am selben Tag zählen einmal', () => {
    const ms = [m('A', 1), m('A', 1), m('A', 8), m('A', 15)]
    expect(suggestRecurring(ms, at(22))).toHaveLength(1)
  })
  it('ausgeblendete Vorschläge fehlen, beim nächsten Termin kommt er wieder', () => {
    const ms = weekly('A', [1, 8, 15])
    const s = suggestRecurring(ms, at(22))
    expect(suggestRecurring(ms, at(22), [s[0].id])).toHaveLength(0)
    expect(suggestRecurring([...ms, m('A', 22)], at(29), [s[0].id])).toHaveLength(1)
  })
  it('sortiert nach Fälligkeit', () => {
    const ms = [...weekly('Später', [2, 9, 16]), ...weekly('Früher', [1, 8, 15])]
    expect(suggestRecurring(ms, at(23)).map((x) => x.title)).toEqual(['Früher', 'Später'])
  })
})
