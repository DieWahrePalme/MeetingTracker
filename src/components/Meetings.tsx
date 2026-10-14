import { useState } from 'react'
import { useData } from '../data/store'
import { suggestRecurring } from '../lib/recurring'
import type { Suggestion } from '../lib/recurring'
import type { Meeting } from '../data/types'
import { formatDuration, formatEuro } from '../lib/money'
import { costByRating, headCount, matches, matchesRating, matchesSearch, meetingCost, noFilter, totalCost } from '../lib/stats'
import type { Filter, RatingFilter, RatingKey } from '../lib/stats'
import { t } from '../texts'
import { LiveCard } from './LiveCard'
import { MeetingDetail } from './MeetingDetail'
import { MeetingForm } from './MeetingForm'
import { RatingIcon } from './Rating'
import { Suggestions } from './Suggestions'

const num = (v: string) => (v === '' ? null : Number(v))

export function Meetings() {
  const { meetings, hiddenSuggestions } = useData()
  const [filter, setFilter] = useState<Filter>(noFilter)
  const [sort, setSort] = useState<'newest' | 'expensive'>('newest')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>(null)
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [suggested, setSuggested] = useState<Suggestion | null>(null)

  const inPeriod = meetings.filter((m) => matches(m, filter))
  const filtered = inPeriod.filter((m) => matchesRating(m, ratingFilter) && matchesSearch(m, search))
  const split = costByRating(inPeriod)
  const splitTotal = totalCost(inPeriod)
  const anyRated = inPeriod.some((m) => m.rating)
  const list: Meeting[] = [...filtered].sort((a, b) =>
    sort === 'newest' ? b.startedAt - a.startedAt : meetingCost(b) - meetingCost(a),
  )
  const max = Math.max(1, ...list.map(meetingCost))
  const periodActive = filter.year !== null || filter.month !== null || filter.day !== null
  const active = periodActive || ratingFilter !== null || search.trim() !== ''
  const years = [...new Set([new Date().getFullYear(), ...meetings.map((m) => new Date(m.startedAt).getFullYear())])].sort((a, b) => b - a)
  const open = meetings.find((m) => m.id === openId)
  const suggestions = suggestRecurring(meetings, Date.now(), hiddenSuggestions)

  return (
    <>
      <section className="hero">
        <p className="label">{t.total}</p>
        <p className="total">{formatEuro(totalCost(meetings))}</p>
        <p className="muted">{t.totalSub(meetings.length, formatDuration(meetings.reduce((s, m) => s + m.durationSec, 0)))}</p>
      </section>

      <Suggestions items={suggestions} onCreate={setSuggested} />

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
        {(meetings.length >= 6 || search) && (
          <input
            type="search"
            className="input"
            value={search}
            placeholder={t.search.placeholder}
            aria-label={t.search.placeholder}
            autoComplete="off"
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
        <div className="chips rating-filter" role="group" aria-label={t.rating.filter}>
          {([null, 'up', 'neutral', 'down', 'none'] as const).map((k) => (
            <button
              key={k ?? 'all'}
              className={'chip' + (ratingFilter === k ? ' on' : '')}
              aria-pressed={ratingFilter === k}
              onClick={() => setRatingFilter(k)}
            >
              {k && k !== 'none' && <RatingIcon rating={k} size={16} />}
              {k === null ? t.rating.all : t.rating[k]}
            </button>
          ))}
        </div>
        {active && (
          <div className="line result">
            <div>
              <small className="muted">{t.filter.result}</small>
              <strong className="mid">{formatEuro(totalCost(filtered))}</strong>
            </div>
            <button
              className="link"
              onClick={() => {
                setFilter(noFilter)
                setRatingFilter(null)
                setSearch('')
              }}
            >
              {t.filter.reset}
            </button>
          </div>
        )}
      </section>

      {anyRated && (
        <section className="card split">
          <div className="line">
            <div>
              <small className="muted">{t.rating.badCost}</small>
              <strong className="mid bad">{formatEuro(split.down.cents)}</strong>
            </div>
          </div>
          <div className="stack-bar" role="img" aria-label={t.rating.split}>
            {(['up', 'neutral', 'down', 'none'] as RatingKey[]).map((k) =>
              split[k].cents > 0 ? <i key={k} className={`seg seg-${k}`} style={{ flexGrow: split[k].cents }} /> : null,
            )}
          </div>
          <ul className="plain legend">
            {(['up', 'neutral', 'down', 'none'] as RatingKey[]).map((k) => (
              <li key={k}>
                <i className={`dot seg-${k}`} />
                <span>{t.rating[k]}</span>
                <strong>{splitTotal > 0 ? Math.round((split[k].cents / splitTotal) * 100) : 0} %</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

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
                  <strong className="title">
                    {m.title}
                    {m.rating && <RatingIcon rating={m.rating} size={16} label />}
                  </strong>
                  <small className="muted">
                    {new Date(m.startedAt).toLocaleDateString('de-DE')} · {formatDuration(m.durationSec)} · {t.list.people(headCount(m))}
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
      {suggested && (
        <MeetingForm
          copyFrom={suggested.last}
          startDate={suggested.daysUntil <= 0 ? suggested.dueAt : undefined}
          onClose={() => setSuggested(null)}
        />
      )}
      {open && <MeetingDetail meeting={open} onClose={() => setOpenId(null)} />}
    </>
  )
}
