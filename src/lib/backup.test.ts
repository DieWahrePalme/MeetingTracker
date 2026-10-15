import { describe, expect, it } from 'vitest'
import { daysSince, shouldRemind } from './backup'

const DAY = 86_400_000
const now = 100 * DAY

describe('Backup-Erinnerung', () => {
  it('keine Daten: nie erinnern', () => {
    expect(shouldRemind({ hasData: false, last: null, since: now - 50 * DAY, snoozedUntil: null, now })).toBe(false)
  })
  it('letztes Backup vor 13 Tagen: nein, vor 14 Tagen: ja', () => {
    expect(shouldRemind({ hasData: true, last: now - 13 * DAY, since: null, snoozedUntil: null, now })).toBe(false)
    expect(shouldRemind({ hasData: true, last: now - 14 * DAY, since: null, snoozedUntil: null, now })).toBe(true)
  })
  it('noch nie gesichert: zählt ab dem Beginn der Daten', () => {
    expect(shouldRemind({ hasData: true, last: null, since: now - 3 * DAY, snoozedUntil: null, now })).toBe(false)
    expect(shouldRemind({ hasData: true, last: null, since: now - 20 * DAY, snoozedUntil: null, now })).toBe(true)
  })
  it('weggeklickt: bis zum Ablauf Ruhe', () => {
    expect(shouldRemind({ hasData: true, last: now - 30 * DAY, since: null, snoozedUntil: now + DAY, now })).toBe(false)
    expect(shouldRemind({ hasData: true, last: now - 30 * DAY, since: null, snoozedUntil: now - 1, now })).toBe(true)
  })
  it('daysSince zählt ganze Tage', () => {
    expect(daysSince(now - 2.9 * DAY, now)).toBe(2)
    expect(daysSince(now + DAY, now)).toBe(0)
  })
})
