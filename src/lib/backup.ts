import { actions } from '../data/store'

/** Backup-Erinnerung: Zeitpunkte liegen nur lokal im Browser (localStorage), nichts verlässt das Gerät. */
const LAST_KEY = 'meetingtracker.lastbackup'
const SINCE_KEY = 'meetingtracker.datasince'
const SNOOZE_KEY = 'meetingtracker.backupsnooze'
export const REMIND_AFTER_DAYS = 14
const DAY = 86_400_000

const read = (k: string): number | null => {
  try {
    const n = Number(localStorage.getItem(k))
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}
const write = (k: string, v: number) => {
  try {
    localStorage.setItem(k, String(v))
  } catch {
    /* gilt nur für diese Sitzung */
  }
}

export const lastBackup = () => read(LAST_KEY)
export const markBackup = (now = Date.now()) => write(LAST_KEY, now)

/** Ganze Tage seit `then` (nie negativ). */
export const daysSince = (then: number, now = Date.now()) => Math.max(0, Math.floor((now - then) / DAY))

/** Merkt sich, ab wann Daten vorhanden sind, damit auch ohne je gemachtes Backup nach 14 Tagen erinnert wird. */
export function noteData(now = Date.now()) {
  if (read(SINCE_KEY) === null) write(SINCE_KEY, now)
}

/** Reine Entscheidung (testbar): erinnern, wenn Daten da sind, das Backup (oder der Datenbeginn) lange her ist und nicht gerade weggeklickt. */
export function shouldRemind(opts: { hasData: boolean; last: number | null; since: number | null; snoozedUntil: number | null; now: number }): boolean {
  const { hasData, last, since, snoozedUntil, now } = opts
  if (!hasData) return false
  if (snoozedUntil !== null && now < snoozedUntil) return false
  const ref = last ?? since
  return ref !== null && now - ref >= REMIND_AFTER_DAYS * DAY
}

export function backupDue(hasData: boolean, now = Date.now()): boolean {
  return shouldRemind({ hasData, last: read(LAST_KEY), since: read(SINCE_KEY), snoozedUntil: read(SNOOZE_KEY), now })
}

/** "Später": eine Woche Ruhe. */
export const snoozeBackup = (now = Date.now()) => write(SNOOZE_KEY, now + 7 * DAY)

/** Sichern: Teilen-Menü des Geräts mit der JSON-Datei (landet z. B. in Dateien/iCloud), sonst normaler Download. Gibt true zurück, wenn gesichert. */
export async function exportBackup(): Promise<boolean> {
  const name = `meetingtracker-${new Date().toISOString().slice(0, 10)}.json`
  const json = actions.exportJson()
  const file = new File([json], name, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name })
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return false // abgebrochen, nicht gesichert
      throw e
    }
  } else {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  markBackup()
  return true
}
