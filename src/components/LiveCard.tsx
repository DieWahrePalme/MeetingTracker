import { useEffect, useState } from 'react'
import { actions, useData } from '../data/store'
import type { LiveMeeting } from '../data/types'
import { costCents, formatDuration, formatEuro } from '../lib/money'
import { PersonPicker } from './PersonPicker'
import { RatingPicker } from './Rating'
import { pickOptions } from '../lib/people'
import { GroupFields, groupError, groupToInput, inputToGroup } from './GroupFields'
import { t } from '../texts'

export function LiveCard() {
  const { live } = useData()
  if (!live) {
    return (
      <button className="btn primary wide" onClick={actions.startLive}>
        {t.live.start}
      </button>
    )
  }
  // Eigene Komponente, damit die Eingabefelder bei jedem neuen Meeting frisch starten.
  return <LiveRunning live={live} key={live.startedAt} />
}

function LiveRunning({ live }: { live: LiveMeeting }) {
  const { people, teams, meetings } = useData()
  const [now, setNow] = useState(Date.now())
  const [group, setGroup] = useState(() => groupToInput(live.group))
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  const seconds = Math.max(0, Math.floor((now - live.startedAt) / 1000))
  const flat = inputToGroup(group)
  const cents =
    people.filter((p) => live.personIds.includes(p.id)).reduce((sum, p) => sum + costCents(p.rateCents, seconds), 0) +
    (flat ? costCents(flat.count * flat.rateCents, seconds) : 0)
  return (
    <section className="card live">
      <span className="pill">{t.live.running}</span>
      <p className="timer" aria-live="off">{formatDuration(seconds)}</p>
      <p className="muted">{t.live.costNow} <strong>{formatEuro(cents)}</strong></p>
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
      <GroupFields
        value={group}
        onChange={(v) => {
          setGroup(v)
          actions.updateLive({ group: inputToGroup(v) })
        }}
      />
      {groupError(group) && <p className="error">{groupError(group)}</p>}
      <RatingPicker value={live.rating} onChange={(r) => actions.updateLive({ rating: r ?? null })} />
      <div className="row">
        <button className="btn ghost" onClick={() => confirm(t.live.confirmCancel) && actions.cancelLive()}>{t.live.cancel}</button>
        <button className="btn primary" onClick={actions.stopLive}>{t.live.stop}</button>
      </div>
    </section>
  )
}
