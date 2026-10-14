import type { Meeting } from '../data/types'
import { formatDuration, formatEuro } from '../lib/money'
import { headCount, meetingCost, personSeconds } from '../lib/stats'
import { t } from '../texts'
import { CountUp } from './CountUp'
import { RatingIcon } from './Rating'
import { Sheet } from './Sheet'

const clock = (ms: number) => new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

/** Meeting-Bon nach dem Stoppen: Zeitstempel, Dauer, Personen, Summe, Stempel. */
export function BonSheet({ meeting, number, company, onClose }: { meeting: Meeting; number: number; company: string; onClose: () => void }) {
  const end = meeting.startedAt + meeting.durationSec * 1000
  return (
    <Sheet
      title={t.bon.sheetTitle}
      onClose={onClose}
      actions={<button className="btn primary" onClick={onClose}>{t.bon.done}</button>}
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
    </Sheet>
  )
}
