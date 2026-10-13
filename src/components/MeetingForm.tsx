import { useState } from 'react'
import { actions, useData } from '../data/store'
import type { Meeting } from '../data/types'
import { t } from '../texts'
import { Sheet } from './Sheet'

const pad = (n: number) => String(n).padStart(2, '0')
const toDateStr = (ms: number) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function MeetingForm({ meeting, onClose }: { meeting?: Meeting; onClose: () => void }) {
  const { people } = useData()
  const initialDate = toDateStr(meeting?.startedAt ?? Date.now())
  const [title, setTitle] = useState(meeting?.title ?? '')
  const [date, setDate] = useState(initialDate)
  const dur = meeting?.durationSec ?? 1800
  const [h, setH] = useState(String(Math.floor(dur / 3600)))
  const [m, setM] = useState(String(Math.floor((dur % 3600) / 60)))
  const [s, setS] = useState(String(dur % 60))
  const [ids, setIds] = useState<string[]>(meeting?.participants.map((p) => p.personId) ?? [])

  // Auch gelöschte Personen aus dem Meeting bleiben wählbar.
  const options = [
    ...people.map((p) => ({ id: p.id, name: p.name })),
    ...(meeting?.participants.filter((p) => !people.some((x) => x.id === p.personId)).map((p) => ({ id: p.personId, name: p.name })) ?? []),
  ]

  const durationSec = (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0)
  const error = durationSec <= 0 ? t.form.errDuration : ids.length === 0 ? t.form.errPeople : ''

  function save() {
    if (error) return
    let startedAt = meeting?.startedAt ?? Date.now()
    if (date !== initialDate || !meeting) {
      const [y, mo, d] = date.split('-').map(Number)
      startedAt = new Date(y, mo - 1, d, 12).getTime()
    }
    actions.saveMeeting({ id: meeting?.id, title: title.trim() || 'Meeting', startedAt, durationSec, personIds: ids })
    onClose()
  }

  return (
    <Sheet title={meeting ? t.form.editTitle : t.form.newTitle} onClose={onClose}>
      <label className="field">
        <span>{t.form.title}</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meeting" />
      </label>
      <label className="field">
        <span>{t.form.date}</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <div className="field">
        <span>{t.form.duration}</span>
        <div className="dur">
          {([[h, setH, t.form.h], [m, setM, t.form.m], [s, setS, t.form.s]] as const).map(([v, set, label]) => (
            <label key={label}>
              <input type="number" inputMode="numeric" min={0} value={v} onChange={(e) => set(e.target.value)} />
              <small>{label}</small>
            </label>
          ))}
        </div>
      </div>
      <div className="field">
        <span>{t.form.who}</span>
        {options.length === 0 ? (
          <p className="muted">{t.form.noPeople}</p>
        ) : (
          <div className="chips">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                className={'chip' + (ids.includes(o.id) ? ' on' : '')}
                aria-pressed={ids.includes(o.id)}
                onClick={() => setIds(ids.includes(o.id) ? ids.filter((x) => x !== o.id) : [...ids, o.id])}
              >
                {o.name}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button className="btn ghost" onClick={onClose}>{t.form.cancel}</button>
        <button className="btn primary" disabled={!!error} onClick={save}>{t.form.save}</button>
      </div>
    </Sheet>
  )
}
