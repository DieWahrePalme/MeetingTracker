import { useState } from 'react'
import { actions } from '../data/store'
import type { Meeting } from '../data/types'
import { costCents, formatDuration, formatEuro } from '../lib/money'
import { groupCost, meetingCost } from '../lib/stats'
import { t } from '../texts'
import { MeetingForm } from './MeetingForm'
import { RatingPicker } from './Rating'
import { Sheet } from './Sheet'

export function MeetingDetail({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  const [editing, setEditing] = useState(false)
  if (editing) return <MeetingForm meeting={meeting} onClose={onClose} />
  return (
    <Sheet title={meeting.title} onClose={onClose}>
      <p className="muted">
        {new Date(meeting.startedAt).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
        {formatDuration(meeting.durationSec)}
      </p>
      <p className="big">{formatEuro(meetingCost(meeting))}</p>
      <h3>{t.detail.perPerson}</h3>
      <ul className="plain">
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
      <RatingPicker value={meeting.rating} onChange={(r) => actions.setRating(meeting.id, r ?? null)} />
      <div className="row">
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
        <button className="btn ghost" onClick={() => setEditing(true)}>{t.detail.edit}</button>
        <button className="btn primary" onClick={onClose}>{t.detail.close}</button>
      </div>
    </Sheet>
  )
}
