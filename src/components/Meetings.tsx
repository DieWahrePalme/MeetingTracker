import { useEffect, useRef, useState } from 'react'
import { useData } from '../data/store'
import { suggestRecurring } from '../lib/recurring'
import type { Suggestion } from '../lib/recurring'
import type { Meeting } from '../data/types'
import { AUTO, FUN_UNITS, UNIT_KEY, formatUnits, storedChoice, unitFor } from '../lib/fun'
import { formatDuration, formatEuro } from '../lib/money'
import { headCount, matches, matchesRating, matchesSearch, meetingCost, noFilter, personSeconds, valueByRating } from '../lib/stats'
import type { Filter, RatingFilter, RatingKey } from '../lib/stats'
import { t } from '../texts'
import { CountUp } from './CountUp'
import { LiveCard } from './LiveCard'
import { MeetingDetail } from './MeetingDetail'
import { MeetingForm } from './MeetingForm'
import { RatingIcon } from './Rating'
import { BackupBanner } from './BackupBanner'
import { Suggestions } from './Suggestions'

const num = (v: string) => (v === '' ? null : Number(v))

type Metric = 'cost' | 'time' | 'fun'
const METRIC_KEY = 'meetingtracker.metric'

/** Anzeige: Kosten in Euro oder Zeit aller Teilnehmer. Die Wahl bleibt auf diesem Gerät gespeichert. */
function useMetric(): [Metric, (m: Metric) => void] {
  const [metric, setMetric] = useState<Metric>(() => {
    try {
      const v = localStorage.getItem(METRIC_KEY)
      return v === 'time' || v === 'fun' ? v : 'cost'
    } catch {
      return 'cost'
    }
  })
  // Der Akzent (Orange = Geld, Blau = Zeit) hängt am Attribut data-metric
  useEffect(() => {
    document.documentElement.dataset.metric = metric
  }, [metric])
  return [
    metric,
    (m) => {
      setMetric(m)
      try {
        localStorage.setItem(METRIC_KEY, m)
      } catch {
        /* nicht gespeichert, gilt nur für diese Sitzung */
      }
    },
  ]
}

/** Gewählte Spaß-Einheit (Döner, Hochregal, Maybach), bleibt auf diesem Gerät gespeichert. */
function useFunUnit(): [string, (id: string) => void] {
  const [id, setId] = useState(storedChoice)
  return [
    id,
    (next) => {
      setId(next)
      try {
        localStorage.setItem(UNIT_KEY, next)
      } catch {
        /* gilt nur für diese Sitzung */
      }
    },
  ]
}

const METRICS = ['cost', 'time', 'fun'] as const

/** Preis je Einheit fürs Menü: "8,50 €", "1.200 €" */
const priceText = (cents: number) => (cents % 100 === 0 ? `${(cents / 100).toLocaleString('de-DE')} €` : formatEuro(cents))

export function Meetings() {
  const { meetings, hiddenSuggestions } = useData()
  const [metric, setMetric] = useMetric()
  const [unitId, setUnitId] = useFunUnit()
  const key = metric + unitId
  const [menuOpen, setMenuOpen] = useState(false)
  // Langer Druck auf den Smiley öffnet das Einheiten-Menü; der Klick, der danach noch folgt, wird übergangen.
  const press = useRef<{ timer: number; long: boolean }>({ timer: 0, long: false })
  const startPress = () => {
    press.current.long = false
    window.clearTimeout(press.current.timer)
    press.current.timer = window.setTimeout(() => {
      press.current.long = true
      setMetric('fun')
      setMenuOpen(true)
    }, 450)
  }
  const endPress = () => window.clearTimeout(press.current.timer)
  const onMetricClick = (k: Metric) => {
    if (press.current.long) {
      press.current.long = false
      return
    }
    if (k === 'fun' && metric === 'fun') setMenuOpen(!menuOpen)
    else {
      setMenuOpen(false)
      setMetric(k)
    }
  }
  // Einblenden (rise) nur für neu hinzugekommene Einträge, nicht beim Laden oder Tabwechsel
  const seen = useRef<Set<string> | null>(null)
  if (seen.current === null) seen.current = new Set(meetings.map((m) => m.id))
  useEffect(() => {
    meetings.forEach((m) => seen.current?.add(m.id))
  }, [meetings])
  const [filter, setFilter] = useState<Filter>(noFilter)
  const [sort, setSort] = useState<'newest' | 'value'>('newest')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>(null)
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [suggested, setSuggested] = useState<Suggestion | null>(null)

  const valueOf = (m: Meeting) => (metric === 'time' ? personSeconds(m) : meetingCost(m))
  // Formatierer für einen Zielwert: bei "automatisch" bleibt die Einheit während des Hochzählens gleich
  const fmtFor = (target: number) => (v: number) => (metric === 'time' ? formatDuration(v) : metric === 'fun' ? formatUnits(v, unitFor(unitId, target)) : formatEuro(v))
  const sum = (ms: Meeting[]) => ms.reduce((s, m) => s + valueOf(m), 0)

  const inPeriod = meetings.filter((m) => matches(m, filter))
  const filtered = inPeriod.filter((m) => matchesRating(m, ratingFilter) && matchesSearch(m, search))
  const split = valueByRating(inPeriod, valueOf)
  const splitTotal = sum(inPeriod)
  const anyRated = inPeriod.some((m) => m.rating)
  const list: Meeting[] = [...filtered].sort((a, b) => (sort === 'newest' ? b.startedAt - a.startedAt : valueOf(b) - valueOf(a)))
  const max = Math.max(1, ...list.map(valueOf))
  const periodActive = filter.year !== null || filter.month !== null || filter.day !== null
  const active = periodActive || ratingFilter !== null || search.trim() !== ''
  const filterCount = (filter.year !== null ? 1 : 0) + (filter.month !== null ? 1 : 0) + (filter.day !== null ? 1 : 0) + (ratingFilter !== null ? 1 : 0)
  const years = [...new Set([new Date().getFullYear(), ...meetings.map((m) => new Date(m.startedAt).getFullYear())])].sort((a, b) => b - a)
  // Die große Zahl schrumpft, wenn sie länger wird als etwa "5.000,60 €", damit sie in eine Zeile passt.
  const heroValue = sum(meetings)
  const heroUnit = unitFor(unitId, heroValue)
  const heroText = fmtFor(heroValue)(heroValue)
  const open = meetings.find((m) => m.id === openId)
  const suggestions = suggestRecurring(meetings, Date.now(), hiddenSuggestions)

  return (
    <>
      <div className="cols">
      <div className="col-side">
      <section className="hero">
        <div className="hero-top">
          <p className="label">{metric === 'cost' ? t.total : metric === 'time' ? t.totalTime : t.fun.total(heroUnit.many)}</p>
          <div className="metric-switch" data-m={metric} role="radiogroup" aria-label={t.metric.label}>
            <span className="thumb" aria-hidden="true" />
            {METRICS.map((k) => (
              <button key={k} className={'opt ' + k} role="radio" aria-checked={metric === k} aria-label={t.metric[k]}
                onClick={() => onMetricClick(k)}
                {...(k === 'fun' ? { onPointerDown: startPress, onPointerUp: endPress, onPointerLeave: endPress, onPointerCancel: endPress, onContextMenu: (e: React.MouseEvent) => e.preventDefault() } : {})}
              >
                {k === 'cost' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.5 6.6A7 7 0 1 0 17.5 17.4M5 10h9M5 14h9" />
                  </svg>
                ) : k === 'time' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8.5 14.5c1 1.4 2.2 2 3.5 2s2.5-.6 3.5-2M9 9.5h.01M15 9.5h.01" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          {menuOpen && (
            <>
              <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="fun-menu" role="menu" aria-label={t.fun.unit}>
                {[{ id: AUTO, one: t.fun.auto }, ...FUN_UNITS].map((u) => (
                  <button
                    key={u.id}
                    role="menuitemradio"
                    aria-checked={u.id === unitId}
                    onClick={() => {
                      setUnitId(u.id)
                      setMenuOpen(false)
                    }}
                  >
                    <span>{u.one}{'cents' in u && ` (${priceText(u.cents)})`}</span>
                    {u.id === unitId && <span aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <p className="total" style={{ fontSize: `calc(clamp(2.5rem, 13vw, 3.8rem) * ${Math.min(1, 10 / heroText.length)})` }}>
          <CountUp value={heroValue} format={fmtFor(heroValue)} resetKey={key} />
        </p>
        <p className="muted">
          {metric === 'cost'
            ? t.totalSub(meetings.length, formatDuration(meetings.reduce((s, m) => s + m.durationSec, 0)))
            : metric === 'time'
              ? t.totalSubTime(meetings.length)
              : `${t.fun.also} ${FUN_UNITS.filter((u) => u.id !== heroUnit.id).map((u) => formatUnits(heroValue, u)).join(' · ')}`}
        </p>
      </section>

      <BackupBanner hasData={meetings.length > 0} />

      <Suggestions items={suggestions} onCreate={setSuggested} />

      <div className="actions">
        <LiveCard />
        <button className="btn ghost" onClick={() => setAdding(true)}>{t.manualShort}</button>
      </div>

      {anyRated && (
        <section className="card split">
          <div className="line">
            <small className="muted">{metric === 'time' ? t.rating.badTime : metric === 'fun' ? t.rating.badFun : t.rating.badCost}</small>
            <strong className="mid bad"><CountUp value={split.down.value} format={fmtFor(split.down.value)} resetKey={key} /></strong>
          </div>
          <div className="stack-bar" role="img" aria-label={t.rating.split}>
            {(['up', 'neutral', 'down', 'none'] as RatingKey[]).map((k) =>
              split[k].value > 0 ? <i key={k} className={`seg seg-${k}`} style={{ flexGrow: split[k].value }} /> : null,
            )}
          </div>
          <ul className="plain legend">
            {(['up', 'neutral', 'down', 'none'] as RatingKey[]).map((k) => (
              <li key={k}>
                <i className={`dot seg-${k}`} />
                <span>{t.rating[k]}</span>
                <strong>{splitTotal > 0 ? Math.round((split[k].value / splitTotal) * 100) : 0} %</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
      </div>

      <div className="col-main">
      <div className="searchbar">
        <input
          type="search"
          className="input"
          value={search}
          placeholder={t.search.placeholder}
          aria-label={t.search.label}
          autoComplete="off"
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className={'icon-btn' + (filterOpen || filterCount > 0 ? ' on' : '')}
          aria-label={t.filter.title}
          aria-expanded={filterOpen}
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h9M19 7h1M4 17h1M11 17h9" />
            <circle cx="16" cy="7" r="2.4" />
            <circle cx="8" cy="17" r="2.4" />
          </svg>
          {filterCount > 0 && <span className="count" aria-hidden="true">{filterCount}</span>}
        </button>
      </div>

      {filterOpen && (
        <section className="card filter-card">
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
          <div className="segment" role="group" aria-label={t.sort.title}>
            {(['newest', 'value'] as const).map((k) => (
              <button key={k} className={sort === k ? 'on' : ''} aria-pressed={sort === k} onClick={() => setSort(k)}>
                {k === 'newest' ? t.sort.newest : metric === 'time' ? t.sort.longest : t.sort.expensive}
              </button>
            ))}
          </div>
        </section>
      )}

      {active && (
        <div className="line result-line">
          <div>
            <small className="muted">{t.filter.result}</small>
            <strong className="mid"><CountUp value={sum(filtered)} format={fmtFor(sum(filtered))} resetKey={key} duration={500} /></strong>
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

      {list.length === 0 ? (
        <p className="muted empty">{meetings.length === 0 ? t.list.empty : search.trim() ? t.list.noHits : t.list.emptyFiltered}</p>
      ) : (
        <ul className="plain list meeting-list">
          {list.map((m) => (
            <li key={m.id} className={seen.current && !seen.current.has(m.id) ? 'rise' : undefined}>
              <button className="row-item" onClick={() => setOpenId(m.id)}>
                <div className="grow">
                  <strong className="title">
                    {m.title}
                    {m.rating && <RatingIcon rating={m.rating} size={16} label />}
                  </strong>
                  <small className="muted">
                    {new Date(m.startedAt).toLocaleDateString('de-DE')} · {formatDuration(m.durationSec)} · {t.list.people(headCount(m))}
                  </small>
                  <span className="bar"><i style={{ width: `${(valueOf(m) / max) * 100}%` }} /></span>
                </div>
                <strong className="cost"><CountUp value={valueOf(m)} format={fmtFor(valueOf(m))} resetKey={key} duration={550} /></strong>
              </button>
            </li>
          ))}
        </ul>
      )}
      </div>
      </div>

      {adding && <MeetingForm onClose={() => setAdding(false)} />}
      {suggested && (
        <MeetingForm
          copyFrom={suggested.last}
          heading={t.form.createTitle}
          startDate={suggested.daysUntil <= 0 ? suggested.dueAt : undefined}
          onClose={() => setSuggested(null)}
        />
      )}
      {open && <MeetingDetail meeting={open} onClose={() => setOpenId(null)} />}
    </>
  )
}
