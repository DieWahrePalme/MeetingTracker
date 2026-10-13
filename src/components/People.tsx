import { useRef, useState } from 'react'
import { actions, useData } from '../data/store'
import type { Person } from '../data/types'
import { formatEuro, formatHours, parseEuroToCents } from '../lib/money'
import { personScores } from '../lib/stats'
import { t } from '../texts'
import { Sheet } from './Sheet'

function PersonForm({ person, onClose }: { person?: Person; onClose: () => void }) {
  const [name, setName] = useState(person?.name ?? '')
  const [rate, setRate] = useState(person ? String(person.rateCents / 100).replace('.', ',') : '')
  const [tried, setTried] = useState(false)
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
