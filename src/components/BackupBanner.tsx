import { useEffect, useState } from 'react'
import { backupDue, daysSince, exportBackup, lastBackup, noteData, snoozeBackup } from '../lib/backup'
import { t } from '../texts'

/** Dezente Erinnerung auf der Meetings-Seite: nach etwa 14 Tagen ohne Backup, wegklickbar (dann eine Woche Ruhe). */
export function BackupBanner({ hasData }: { hasData: boolean }) {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    if (hasData) noteData()
  }, [hasData])
  if (hidden || !backupDue(hasData)) return null
  const last = lastBackup()
  return (
    <section className="card backup-banner" aria-label={t.data.backup}>
      <p>{last ? t.backupBanner.ago(daysSince(last)) : t.backupBanner.never}</p>
      <div className="dialog-actions">
        <button className="btn ghost" onClick={() => { snoozeBackup(); setHidden(true) }}>{t.backupBanner.later}</button>
        <button className="btn primary" onClick={() => void exportBackup().then((ok) => ok && setHidden(true)).catch(() => {})}>{t.backupBanner.action}</button>
      </div>
    </section>
  )
}
