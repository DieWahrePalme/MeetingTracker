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
const toTimeStr = (ms: number) => {
  const d = new Date(ms)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** `meeting` = bearbeiten, `copyFrom` = als Vorlage für ein neues Meeting (Duplizieren). */
export function MeetingForm({ meeting, copyFrom, startDate, heading, onClose }: { meeting?: Meeting; copyFrom?: Meeting; startDate?: number; heading?: string; onClose: () => void }) {
  const { people, teams, meetings } = useData()
  const src = meeting ?? copyFrom
  const initialDate = toDateStr(meeting?.startedAt ?? Date.now())
  const initialTime = toTimeStr(meeting?.startedAt ?? Date.now())
  const [title, setTitle] = useState(src?.title ?? '')
  const [date, setDate] = useState(toDateStr(startDate ?? meeting?.startedAt ?? Date.now()))
  const [time, setTime] = useState(toTimeStr(src?.startedAt ?? Date.now()))
  const dur = src?.durationSec ?? 1800
  const [h, setH] = useState(String(Math.floor(dur / 3600)))
  const [m, setM] = useState(String(Math.floor((dur % 3600) / 60)))
  const [s, setS] = useState(String(dur % 60))
  const [ids, setIds] = useState<string[]>(src?.participants.map((p) => p.personId) ?? [])
  const [group, setGroup] = useState(groupToInput(src?.group))
  const [rating, setRating] = useState<Rating | undefined>(meeting?.rating)
  const [tried, setTried] = useState(false)
  const [more, setMore] = useState(!!src?.group || !!meeting?.rating)

  // Zuletzt genutzte zuerst; archivierte nur, wenn sie schon im Meeting sind; gelöschte Personen aus dem Meeting bleiben wählbar.
  const options = pickOptions(people, meetings, src?.participants.map((p) => p.personId) ?? [], src?.participants ?? [])

  const durationSec = (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0)
  const flat = inputToGroup(group)
  const showMore = more || !!groupError(group)
  const summary = [flat && t.form.moreGroup(flat.count), rating && t.rating[rating]].filter(Boolean).join(' · ')
  const error =
    durationSec <= 0 ? t.form.errDuration : groupError(group) || (ids.length === 0 && !flat ? t.form.errPeople : '')

  function save() {
    if (error) return setTried(true)
    let startedAt = meeting?.startedAt ?? Date.now()
    // Unverändert lassen (samt Sekunden), wenn weder Tag noch Uhrzeit angefasst wurden
    if (date !== initialDate || time !== initialTime || !meeting) {
      const [y, mo, d] = date.split('-').map(Number)
      const [hh, mi] = (time || '12:00').split(':').map(Number)
      startedAt = new Date(y, mo - 1, d, hh, mi).getTime()
    }
    actions.saveMeeting({ id: meeting?.id, title: title.trim() || 'Meeting', startedAt, durationSec, personIds: ids, group: flat, rating })
    onClose()
  }

  return (
    <Sheet title={heading ?? (meeting ? t.form.editTitle : copyFrom ? t.form.copyTitle : t.form.newTitle)} onClose={onClose} actions={<>
        <button className="btn ghost" onClick={onClose}>{t.form.cancel}</button>
        <button className="btn primary" aria-disabled={!!error} onClick={save}>{t.form.save}</button>
      </>}>
      <div className="form-list">
        <div className="form-row">
          <input className="bare" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.form.titlePlaceholder} aria-label={t.form.title} />
        </div>
        <label className="form-row">
          <span>{t.form.date}</span>
          <input className="bare right" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="form-row">
          <span>{t.form.time}</span>
          <input className="bare right" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <div className="form-row" role="group" aria-label={t.form.duration}>
          <span>{t.form.duration}</span>
          <div className="dur-inline">
            {([[h, setH, t.form.h], [m, setM, t.form.m], [s, setS, t.form.s]] as const).map(([v, set, label]) => (
              <label key={label}>
                <input type="number" inputMode="numeric" min={0} value={v} onChange={(e) => set(e.target.value)} aria-label={label} />
                <small>{label}</small>
              </label>
            ))}
          </div>
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

      <div className="more">
        <button type="button" className="disclosure" aria-expanded={showMore} onClick={() => setMore(!more)}>
          <span>{t.form.more}</span>
          {summary && <span className="badge">{summary}</span>}
          <svg className="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {showMore && (
          <>
            <GroupFields value={group} onChange={setGroup} />
            <RatingPicker value={rating} onChange={setRating} />
          </>
        )}
      </div>
      {(tried ? error : groupError(group)) && <p className="error" role="alert">{tried ? error : groupError(group)}</p>}
    </Sheet>
  )
}
