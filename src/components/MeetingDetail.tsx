import { useState } from 'react'
import { actions } from '../data/store'
import type { Meeting } from '../data/types'
import { costCents, formatDuration, formatEuro } from '../lib/money'
import { groupCost, headCount, meetingCost, personSeconds } from '../lib/stats'
import { t } from '../texts'
import { CountUp } from './CountUp'
import { MeetingForm } from './MeetingForm'
import { RatingPicker } from './Rating'
import { Sheet } from './Sheet'

export function MeetingDetail({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  const [editing, setEditing] = useState(false)
  const [copying, setCopying] = useState(false)
  if (editing) return <MeetingForm meeting={meeting} onClose={onClose} />
  if (copying) return <MeetingForm copyFrom={meeting} onClose={onClose} />
  return (
    <Sheet title={meeting.title} onClose={onClose} actions={<>
        <button
          className="btn danger"
          onClick={() => {
            if (confirm(t.detail.confirmDelete)) {
              actions.deleteMeeting(meeting.id)
              onClose()
            }
          }}
        >
          {t.detail.delete}
        </button>
        <button className="btn primary" onClick={() => setEditing(true)}>{t.detail.edit}</button>
      </>}>
      <div className="detail-top">
        <p className="big"><CountUp value={meetingCost(meeting)} format={formatEuro} /></p>
        <p className="muted">
          {new Date(meeting.startedAt).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
          {formatDuration(meeting.durationSec)} Std.
        </p>
        <p className="muted">{t.detail.personTime(headCount(meeting), formatDuration(personSeconds(meeting)))}</p>
      </div>
      <h3>{t.detail.perPerson}</h3>
      <ul className="plain list detail-list">
        {meeting.participants.map((p) => (
          <li key={p.personId} className="line">
            <div>
              <strong>{p.name}</strong>
              <small className="muted">{t.detail.rate(formatEuro(p.rateCents))}</small>
            </div>
            <strong>{formatEuro(costCents(p.rateCents, meeting.durationSec))}</strong>
          </li>
        ))}
        {meeting.group && (
          <li className="line">
            <div>
              <strong>{t.detail.groupLine(meeting.group.count, formatEuro(meeting.group.rateCents))}</strong>
            </div>
            <strong>{formatEuro(groupCost(meeting))}</strong>
          </li>
        )}
      </ul>
      <div className="duplicate">
        <button className="btn ghost wide" onClick={() => setCopying(true)}>{t.detail.duplicate}</button>
        <small className="muted">{t.detail.duplicateNote}</small>
      </div>
      <RatingPicker value={meeting.rating} onChange={(r) => actions.setRating(meeting.id, r ?? null)} />
    </Sheet>
  )
}
