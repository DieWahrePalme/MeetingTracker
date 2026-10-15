import { useEffect, useState } from 'react'
import type { Meeting } from '../data/types'
import { clock, renderBonPng, shareBon } from '../lib/bon'
import { formatDuration, formatEuro } from '../lib/money'
import { headCount, meetingCost, personSeconds } from '../lib/stats'
import { t } from '../texts'
import { CountUp } from './CountUp'
import { RatingIcon } from './Rating'
import { Sheet } from './Sheet'

/** Meeting-Bon nach dem Stoppen: Zeitstempel, Dauer, Personen, Summe, Stempel. */
export function BonSheet({ meeting, number, company, onClose }: { meeting: Meeting; number: number; company: string; onClose: () => void }) {
  const end = meeting.startedAt + meeting.durationSec * 1000
  const [png, setPng] = useState<Blob | null>(null)
  const [failed, setFailed] = useState(false)
  // Das Bild schon beim Öffnen erzeugen, damit "Teilen" sofort auf den Tipp reagiert (Safari verlangt das)
  useEffect(() => {
    let alive = true
    renderBonPng(meeting, number, company).then((b) => alive && setPng(b), () => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [meeting, number, company])
  const run = (fn: (b: Blob) => unknown) => async () => {
    try {
      const b = png ?? (await renderBonPng(meeting, number, company))
      await fn(b)
    } catch {
      setFailed(true)
    }
  }
  return (
    <Sheet
      title={t.bon.sheetTitle}
      onClose={onClose}
      actions={
        <>
          <button className="btn ghost" onClick={onClose}>{t.bon.done}</button>
          <button className="btn primary" aria-disabled={!png} onClick={run((b) => shareBon(meeting, b))}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 15V3M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
            </svg>
            {t.bon.share}
          </button>
        </>
      }
    >
      <div className="bon-wrap">
        <div className="bon">
          <h3>{t.bon.title}</h3>
          <p className="center">{company} · {t.bon.no(number)}</p>
          <hr />
          <div className="b-head">
            <p className="b-title">{meeting.title}</p>
            <div className="stamp" aria-hidden="true">
              {t.bon.stamp}
              <small>{clock(end)}</small>
            </div>
          </div>
          <div className="b-row"><span>{t.bon.date}</span><span>{new Date(meeting.startedAt).toLocaleDateString('de-DE')}</span></div>
          <div className="b-row"><span>{t.bon.start}</span><span>{clock(meeting.startedAt)}</span></div>
          <div className="b-row"><span>{t.bon.end}</span><span>{clock(end)}</span></div>
          <div className="b-row"><span>{t.bon.duration}</span><span>{formatDuration(meeting.durationSec)}</span></div>
          <hr />
          <div className="b-row"><span>{t.bon.people}</span><span>{headCount(meeting)}</span></div>
          <div className="b-row"><span>{t.bon.personTime}</span><span>{formatDuration(personSeconds(meeting))}</span></div>
          {meeting.rating && (
            <div className="b-row">
              <span>{t.bon.rating}</span>
              <span><RatingIcon rating={meeting.rating} size={16} label /></span>
            </div>
          )}
          <hr />
          <div className="b-sum">
            <span>{t.bon.sum}</span>
            <strong><CountUp value={meetingCost(meeting)} format={formatEuro} duration={1100} /></strong>
          </div>
          <div className="barcode" aria-hidden="true" />
          <p className="thanks">{t.bon.thanks}</p>
        </div>
      </div>
      {failed && <p className="error center-text" role="alert">{t.bon.failed}</p>}
    </Sheet>
  )
}
