import { useEffect, useState } from 'react'
import { actions, useData } from '../data/store'
import { costCents, formatDuration, formatEuro } from '../lib/money'
import { t } from '../texts'

export function LiveCard() {
  const { live, people } = useData()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!live) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [live])

  if (!live) {
    return (
      <button className="btn primary wide" onClick={actions.startLive}>
        {t.live.start}
      </button>
    )
  }
  const seconds = Math.max(0, Math.floor((now - live.startedAt) / 1000))
  const cents = people.filter((p) => live.personIds.includes(p.id)).reduce((sum, p) => sum + costCents(p.rateCents, seconds), 0)
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
        <div className="chips">
          {people.map((p) => {
            const on = live.personIds.includes(p.id)
            return (
              <button
                key={p.id}
                className={'chip' + (on ? ' on' : '')}
                aria-pressed={on}
                onClick={() => actions.updateLive({ personIds: on ? live.personIds.filter((x) => x !== p.id) : [...live.personIds, p.id] })}
              >
                {p.name}
              </button>
            )
          })}
        </div>
      )}
      <div className="row">
        <button className="btn ghost" onClick={() => confirm(t.live.confirmCancel) && actions.cancelLive()}>{t.live.cancel}</button>
        <button className="btn primary" onClick={actions.stopLive}>{t.live.stop}</button>
      </div>
    </section>
  )
}
