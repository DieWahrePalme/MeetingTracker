import { useRef, useState } from 'react'
import { actions, useData } from '../data/store'
import type { Person } from '../data/types'
import { centsToInput, formatEuro, formatHours, parseEuroToCents } from '../lib/money'
import { NOMINAL_HOURS, PRODUCTIVE_HOURS, suggestedRateCents } from '../lib/salary'
import { personScores } from '../lib/stats'
import { t } from '../texts'
import { Sheet } from './Sheet'

function PersonForm({ person, onClose }: { person?: Person; onClose: () => void }) {
  const [name, setName] = useState(person?.name ?? '')
  const [rate, setRate] = useState(person ? String(person.rateCents / 100).replace('.', ',') : '')
  const [tried, setTried] = useState(false)
  const [calcOpen, setCalcOpen] = useState(false)
  const [salary, setSalary] = useState('')
  const [hoursMode, setHoursMode] = useState<'1700' | '2080' | 'custom'>('1700')
  const [customHours, setCustomHours] = useState('1700')
  const [grossOnly, setGrossOnly] = useState(false)

  const hours = hoursMode === 'custom' ? Math.floor(Number(customHours) || 0) : hoursMode === '2080' ? NOMINAL_HOURS : PRODUCTIVE_HOURS
  const grossCents = parseEuroToCents(salary)
  const suggestion = grossCents !== null && hours > 0 ? suggestedRateCents(grossCents, hours, grossOnly) : null

  /** Trägt den Vorschlag ins Satzfeld ein; danach bleibt es von Hand änderbar. */
  function recalc(next: { salary?: string; hoursMode?: typeof hoursMode; customHours?: string; grossOnly?: boolean }) {
    const sal = parseEuroToCents(next.salary ?? salary)
    const mode = next.hoursMode ?? hoursMode
    const custom = Math.floor(Number(next.customHours ?? customHours) || 0)
    const h = mode === 'custom' ? custom : mode === '2080' ? NOMINAL_HOURS : PRODUCTIVE_HOURS
    if (sal !== null && h > 0) setRate(centsToInput(suggestedRateCents(sal, h, next.grossOnly ?? grossOnly)))
  }
  const cents = parseEuroToCents(rate)
  const nameErr = !name.trim() ? t.people.errName : ''
  const rateErr = cents === null ? t.people.errRate : ''
  return (
    <Sheet title={person ? t.people.editTitle : t.people.newTitle} onClose={onClose}>
      <label className="field">
        <span>{t.people.name}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        {tried && nameErr && <small className="error" role="alert">{nameErr}</small>}
      </label>
      <label className="field">
        <span>{t.people.rate}</span>
        <input value={rate} inputMode="decimal" placeholder={t.people.rateHint} onChange={(e) => setRate(e.target.value)} />
        {tried && rateErr && <small className="error" role="alert">{rateErr}</small>}
      </label>
      <button type="button" className="link calc-toggle" aria-expanded={calcOpen} onClick={() => setCalcOpen(!calcOpen)}>
        {calcOpen ? '− ' : '+ '}{t.people.calc.toggle}
      </button>
      {calcOpen && (
        <div className="calc">
          <label className="field">
            <span>{t.people.calc.salary}</span>
            <input
              value={salary}
              inputMode="decimal"
              placeholder={t.people.calc.salaryHint}
              onChange={(e) => {
                setSalary(e.target.value)
                recalc({ salary: e.target.value })
              }}
            />
          </label>
          <label className="field">
            <span>{t.people.calc.hours}</span>
            <select
              value={hoursMode}
              onChange={(e) => {
                const m = e.target.value as typeof hoursMode
                setHoursMode(m)
                recalc({ hoursMode: m })
              }}
            >
              <option value="1700">{t.people.calc.hours1700}</option>
              <option value="2080">{t.people.calc.hours2080}</option>
              <option value="custom">{t.people.calc.hoursCustom}</option>
            </select>
          </label>
          {hoursMode === 'custom' && (
            <input
              aria-label={t.people.calc.hours}
              type="number"
              inputMode="numeric"
              min={1}
              value={customHours}
              onChange={(e) => {
                setCustomHours(e.target.value)
                recalc({ customHours: e.target.value })
              }}
            />
          )}
          <p className="muted">{t.people.calc.hoursNote}</p>
          <label className="check">
            <input
              type="checkbox"
              checked={grossOnly}
              onChange={(e) => {
                setGrossOnly(e.target.checked)
                recalc({ grossOnly: e.target.checked })
              }}
            />
            <span>{t.people.calc.grossOnly}</span>
          </label>
          {suggestion !== null && (
            <p>
              {t.people.calc.result}: <strong>{formatEuro(suggestion)}/h</strong> <span className="muted">({t.people.calc.apply})</span>
            </p>
          )}
          <p className="muted">{grossOnly ? t.people.calc.hintGross : t.people.calc.hint}</p>
        </div>
      )}
      {person && <p className="muted">{t.people.rateNote}</p>}
      <div className="row">
        {person && (
          <button
            className="btn danger"
            onClick={() => {
              if (confirm(t.people.confirmDelete)) {
                actions.deletePerson(person.id)
                onClose()
              }
            }}
          >
            {t.people.delete}
          </button>
        )}
        <button className="btn ghost" onClick={onClose}>{t.people.cancel}</button>
        <button
          className="btn primary"
          onClick={() => {
            if (nameErr || cents === null) return setTried(true)
            actions.savePerson({ id: person?.id, name: name.trim(), rateCents: cents })
            onClose()
          }}
        >
          {t.people.save}
        </button>
      </div>
    </Sheet>
  )
}

export function People() {
  const data = useData()
  const [editing, setEditing] = useState<Person | 'new' | null>(null)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const scores = personScores(data.meetings)
  const maxSec = Math.max(1, ...scores.map((s) => s.seconds))

  function download() {
    const url = URL.createObjectURL(new Blob([actions.exportJson()], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `meetingtracker-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onImport(file: File) {
    if (!confirm(t.data.importConfirm)) return
    try {
      actions.importJson(await file.text())
      setMsg(t.data.importOk)
    } catch {
      setMsg(t.data.importFail)
    }
  }

  return (
    <>
      <label className="field company">
        <span>{t.people.company}</span>
        <input value={data.companyName} onChange={(e) => actions.setCompanyName(e.target.value)} />
      </label>

      {data.people.length === 0 ? (
        <p className="muted empty">{t.people.empty}</p>
      ) : (
        <ul className="plain list">
          {data.people.map((p) => (
            <li key={p.id}>
              <button className="row-item" onClick={() => setEditing(p)}>
                <strong className="grow">{p.name}</strong>
                <span className="muted">{formatEuro(p.rateCents)}/h</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button className="btn primary wide" onClick={() => setEditing('new')}>{t.people.add}</button>

      {scores.length > 0 && (
        <section>
          <h2>{t.people.title}</h2>
          <p className="muted">{t.people.rank}</p>
          <ol className="plain list">
            {scores.map((s, i) => (
              <li key={s.personId} className="score">
                <span className="rank">{i + 1}</span>
                <div className="grow">
                  <div className="line">
                    <strong>{s.name}</strong>
                    <strong>{formatEuro(s.cents)}</strong>
                  </div>
                  <small className="muted">{t.people.stats(s.meetings, formatHours(s.seconds))}</small>
                  <span className="bar"><i style={{ width: `${(s.seconds / maxSec) * 100}%` }} /></span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h2>{t.data.title}</h2>
        <p className="muted">{t.data.note}</p>
        <div className="stack">
          <button className="btn ghost" onClick={download}>{t.data.export}</button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>{t.data.import}</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) void onImport(f)
            }}
          />
          {data.people.length === 0 && data.meetings.length === 0 && (
            <button className="btn ghost" onClick={actions.loadDemo}>{t.data.demo}</button>
          )}
          <button className="btn danger" onClick={() => confirm(t.data.clearConfirm) && actions.clearAll()}>{t.data.clear}</button>
        </div>
        {msg && <p className="muted" role="status">{msg}</p>}
      </section>

      {editing && <PersonForm person={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  )
}
