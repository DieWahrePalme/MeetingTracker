import { useState } from 'react'
import { useData } from '../data/store'
import type { Meeting } from '../data/types'
import { formatDuration, formatEuro } from '../lib/money'
import { matches, meetingCost, noFilter, totalCost } from '../lib/stats'
import type { Filter } from '../lib/stats'
import { t } from '../texts'
import { LiveCard } from './LiveCard'
import { MeetingDetail } from './MeetingDetail'
import { MeetingForm } from './MeetingForm'

const num = (v: string) => (v === '' ? null : Number(v))

export function Meetings() {
  const { meetings } = useData()
  const [filter, setFilter] = useState<Filter>(noFilter)
  const [sort, setSort] = useState<'newest' | 'expensive'>('newest')
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const filtered = meetings.filter((m) => matches(m, filter))
  const list: Meeting[] = [...filtered].sort((a, b) =>
    sort === 'newest' ? b.startedAt - a.startedAt : meetingCost(b) - meetingCost(a),
  )
  const max = Math.max(1, ...list.map(meetingCost))
  const active = filter.year !== null || filter.month !== null || filter.day !== null
  const years = [...new Set([new Date().getFullYear(), ...meetings.map((m) => new Date(m.startedAt).getFullYear())])].sort((a, b) => b - a)
  const open = meetings.find((m) => m.id === openId)

  return (
    <>
      <section className="hero">
        <p className="label">{t.total}</p>
        <p className="total">{formatEuro(totalCost(meetings))}</p>
        <p className="muted">{t.totalSub(meetings.length, formatDuration(meetings.reduce((s, m) => s + m.durationSec, 0)))}</p>
      </section>

      <LiveCard />

      <section className="card">
        <div className="filters" role="group" aria-label={t.filter.title}>
          <label>
            <small>{t.filter.year}</small>
            <select value={filter.year ?? ''} onChange={(e) => setFilter({ ...filter, year: num(e.target.value) })}>
              <option value="">{t.filter.all}</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label>
            <small>{t.filter.month}</small>
            <select value={filter.month ?? ''} onChange={(e) => setFilter({ ...filter, month: num(e.target.value), day: null })}>
              <option value="">{t.filter.all}</option>
              {t.filter.months.map((name, i) => <option key={name} value={i}>{name}</option>)}
            </select>
          </label>
          <label>
            <small>{t.filter.day}</small>
            <select value={filter.day ?? ''} disabled={filter.month === null} onChange={(e) => setFilter({ ...filter, day: num(e.target.value) })}>
              <option value="">{t.filter.all}</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}.</option>)}
            </select>
          </label>
        </div>
        {active && (
          <div className="line result">
            <div>
              <small className="muted">{t.filter.result}</small>
              <strong className="mid">{formatEuro(totalCost(filtered))}</strong>
            </div>
            <button className="link" onClick={() => setFilter(noFilter)}>{t.filter.reset}</button>
          </div>
        )}
      </section>

      <div className="segment" role="group">
        {(['newest', 'expensive'] as const).map((k) => (
          <button key={k} className={sort === k ? 'on' : ''} aria-pressed={sort === k} onClick={() => setSort(k)}>
            {t.sort[k]}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="muted empty">{meetings.length === 0 ? t.list.empty : t.list.emptyFiltered}</p>
      ) : (
        <ul className="plain list">
          {list.map((m) => (
            <li key={m.id}>
              <button className="row-item" onClick={() => setOpenId(m.id)}>
                <div className="grow">
                  <strong>{m.title}</strong>
                  <small className="muted">
                    {new Date(m.startedAt).toLocaleDateString('de-DE')} · {formatDuration(m.durationSec)} · {t.list.people(m.participants.length)}
                  </small>
                  <span className="bar"><i style={{ width: `${(meetingCost(m) / max) * 100}%` }} /></span>
                </div>
                <strong className="cost">{formatEuro(meetingCost(m))}</strong>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button className="btn ghost wide" onClick={() => setAdding(true)}>{t.manual}</button>

      {adding && <MeetingForm onClose={() => setAdding(false)} />}
      {open && <MeetingDetail meeting={open} onClose={() => setOpenId(null)} />}
    </>
  )
}
