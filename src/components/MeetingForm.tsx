import { useState } from 'react'
import { actions, useData } from '../data/store'
import type { Meeting, Rating } from '../data/types'
import { t } from '../texts'
import { GroupFields, groupError, groupToInput, inputToGroup } from './GroupFields'
import { pickOptions } from '../lib/people'
import { PersonPicker } from './PersonPicker'
import { RatingPicker } from './Rating'
import { Sheet } from './Sheet'

const pad = (n: number) => String(n).padStart(2, '0')
const toDateStr = (ms: number) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** `meeting` = bearbeiten, `copyFrom` = als Vorlage für ein neues Meeting (Duplizieren). */
export function MeetingForm({ meeting, copyFrom, startDate, heading, onClose }: { meeting?: Meeting; copyFrom?: Meeting; startDate?: number; heading?: string; onClose: () => void }) {
  const { people, teams, meetings } = useData()
  const src = meeting ?? copyFrom
  const initialDate = toDateStr(meeting?.startedAt ?? Date.now())
  const [title, setTitle] = useState(src?.title ?? '')
  const [date, setDate] = useState(toDateStr(startDate ?? meeting?.startedAt ?? Date.now()))
  const dur = src?.durationSec ?? 1800
  const [h, setH] = useState(String(Math.floor(dur / 3600)))
  const [m, setM] = useState(String(Math.floor((dur % 3600) / 60)))
  const [s, setS] = useState(String(dur % 60))
  const [ids, setIds] = useState<string[]>(src?.participants.map((p) => p.personId) ?? [])
  const [group, setGroup] = useState(groupToInput(src?.group))
  const [rating, setRating] = useState<Rating | undefined>(meeting?.rating)

  // Zuletzt genutzte zuerst; archivierte nur, wenn sie schon im Meeting sind; gelöschte Personen aus dem Meeting bleiben wählbar.
  const options = pickOptions(people, meetings, src?.participants.map((p) => p.personId) ?? [], src?.participants ?? [])

  const durationSec = (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0)
  const flat = inputToGroup(group)
  const error =
    durationSec <= 0 ? t.form.errDuration : groupError(group) || (ids.length === 0 && !flat ? t.form.errPeople : '')

  function save() {
    if (error) return
    let startedAt = meeting?.startedAt ?? Date.now()
    if (date !== initialDate || !meeting) {
      const [y, mo, d] = date.split('-').map(Number)
      startedAt = new Date(y, mo - 1, d, 12).getTime()
    }
    actions.saveMeeting({ id: meeting?.id, title: title.trim() || 'Meeting', startedAt, durationSec, personIds: ids, group: flat, rating })
    onClose()
  }

  return (
    <Sheet title={heading ?? (meeting ? t.form.editTitle : copyFrom ? t.form.copyTitle : t.form.newTitle)} onClose={onClose} actions={<>
        <button className="btn ghost" onClick={onClose}>{t.form.cancel}</button>
        <button className="btn primary" disabled={!!error} onClick={save}>{t.form.save}</button>
      </>}>
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
          <PersonPicker options={options} selected={ids} onChange={setIds} teams={teams} />
        )}
      </div>
      <GroupFields value={group} onChange={setGroup} />
      <RatingPicker value={rating} onChange={setRating} />
      {error && <p className="error">{error}</p>}
    </Sheet>
  )
}
