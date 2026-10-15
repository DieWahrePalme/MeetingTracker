import { useEffect, useState } from 'react'
import { BonSheet } from './Bon'
import { actions, useData } from '../data/store'
import type { LiveMeeting, Meeting } from '../data/types'
import { costCents, formatDuration, formatEuro } from '../lib/money'
import { PersonPicker } from './PersonPicker'
import { RatingPicker } from './Rating'
import { pickOptions } from '../lib/people'
import { GroupFields, groupError, groupToInput, inputToGroup } from './GroupFields'
import { t } from '../texts'
import { ConfirmDialog } from './ConfirmDialog'

export function LiveCard() {
  const { live, meetings, companyName } = useData()
  const [bonId, setBonId] = useState<string | null>(null)
  const bon = bonId ? meetings.find((m) => m.id === bonId) : undefined
  const sheet = bon && <BonSheet meeting={bon} number={meetings.length} company={companyName} onClose={() => setBonId(null)} />
  if (!live) {
    return (
      <>
        <button className="btn primary" onClick={actions.startLive}>
          {t.live.start}
        </button>
        {sheet}
      </>
    )
  }
  // Eigene Komponente, damit die Eingabefelder bei jedem neuen Meeting frisch starten.
  return (
    <>
      <LiveRunning live={live} key={live.startedAt} onStopped={(m) => setBonId(m.id)} />
      {sheet}
    </>
  )
}

function LiveRunning({ live, onStopped }: { live: LiveMeeting; onStopped: (m: Meeting) => void }) {
  const { people, teams, meetings } = useData()
  const [now, setNow] = useState(Date.now())
  const [group, setGroup] = useState(() => groupToInput(live.group))
  const [asking, setAsking] = useState(false)
  const [tried, setTried] = useState(false)
  const [more, setMore] = useState(!!live.group || !!live.rating)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  const seconds = Math.max(0, Math.floor((now - live.startedAt) / 1000))
  const flat = inputToGroup(group)
  const cents =
    people.filter((p) => live.personIds.includes(p.id)).reduce((sum, p) => sum + costCents(p.rateCents, seconds), 0) +
    (flat ? costCents(flat.count * flat.rateCents, seconds) : 0)
  const hasPeople = live.personIds.length > 0 || !!flat
  const showMore = more || !!groupError(group)
  const summary = [flat && t.form.moreGroup(flat.count), live.rating && t.rating[live.rating]].filter(Boolean).join(' · ')
  return (
    <>
    <section className="card live">
      <div className="live-top">
        <span className="pill">{t.live.running}</span>
        <button
          className="icon-btn trash"
          aria-label={t.live.cancel}
          onClick={() => setAsking(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
          </svg>
        </button>
      </div>
      <div className="live-main">
        <div>
          <p className="timer" aria-live="off">{formatDuration(seconds)}</p>
          <p className="muted">{t.live.costNow} <strong>{formatEuro(cents)}</strong></p>
        </div>
        <button
          className="btn primary stop"
          aria-label={t.live.stopLabel}
          onClick={() => {
            if (!hasPeople) return setTried(true)
            const m = actions.stopLive()
            if (m) onStopped(m)
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="5" y="5" width="14" height="14" rx="2.5" />
          </svg>
          {t.live.stop}
        </button>
      </div>
      {tried && !hasPeople && <p className="error" role="alert">{t.live.errPeople}</p>}
      <input
        className="input"
        value={live.title}
        placeholder={t.live.titlePlaceholder}
        onChange={(e) => actions.updateLive({ title: e.target.value })}
      />
      <p className="label">{t.live.who}</p>
      {people.length === 0 ? (
        <p className="muted">{t.live.needPeople}</p>
      ) : (
        <PersonPicker
          options={pickOptions(people, meetings, live.personIds)}
          selected={live.personIds}
          onChange={(ids) => actions.updateLive({ personIds: ids })}
          teams={teams}
        />
      )}
      <div className="more">
        <button type="button" className="disclosure" aria-expanded={showMore} onClick={() => setMore(!more)}>
          <span>{t.live.more}</span>
          {summary && <span className="badge">{summary}</span>}
          <svg className="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {showMore && (
          <>
            <GroupFields
              value={group}
              onChange={(v) => {
                setGroup(v)
                actions.updateLive({ group: inputToGroup(v) })
              }}
            />
            {groupError(group) && <p className="error">{groupError(group)}</p>}
            <RatingPicker value={live.rating} onChange={(r) => actions.updateLive({ rating: r ?? null })} />
          </>
        )}
      </div>
    </section>
    {asking && (
      <ConfirmDialog
        message={t.live.confirmCancel}
        confirmLabel={t.confirm.discard}
        onCancel={() => setAsking(false)}
        onConfirm={() => actions.cancelLive()}
      />
    )}
    </>
  )
}
