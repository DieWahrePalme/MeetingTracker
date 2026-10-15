import { useState } from 'react'
import { actions, useData } from '../data/store'
import { bonNumber } from '../lib/bon'
import type { Meeting } from '../data/types'
import { costCents, formatDuration, formatEuro } from '../lib/money'
import { groupCost, headCount, meetingCost, personSeconds } from '../lib/stats'
import { t } from '../texts'
import { CountUp } from './CountUp'
import { BonSheet } from './Bon'
import { ConfirmDialog } from './ConfirmDialog'
import { MeetingForm } from './MeetingForm'
import { RatingPicker } from './Rating'
import { Sheet } from './Sheet'

export function MeetingDetail({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  const [editing, setEditing] = useState(false)
  const [copying, setCopying] = useState(false)
  const [asking, setAsking] = useState(false)
  const [bon, setBon] = useState(false)
  const { meetings, companyName } = useData()
  if (editing) return <MeetingForm meeting={meeting} onClose={onClose} />
  if (copying) return <MeetingForm copyFrom={meeting} onClose={onClose} />
  if (bon) return <BonSheet meeting={meeting} number={bonNumber(meetings, meeting)} company={companyName} onClose={() => setBon(false)} />
  return (
    <>
    <Sheet
      title={meeting.title}
      onClose={onClose}
      headExtra={
        <button type="button" className="close" aria-label={t.bon.open} onClick={() => setBon(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z" />
          </svg>
        </button>
      } actions={<>
        <button
          className="btn danger"
          onClick={() => setAsking(true)}
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
    {asking && (
      <ConfirmDialog
        message={t.detail.confirmDelete}
        confirmLabel={t.confirm.delete}
        onCancel={() => setAsking(false)}
        onConfirm={() => {
          actions.deleteMeeting(meeting.id)
          onClose()
        }}
      />
    )}
    </>
  )
}
