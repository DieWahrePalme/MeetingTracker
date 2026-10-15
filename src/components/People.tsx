import { useState } from 'react'
import { actions, useData } from '../data/store'
import type { Person, Team } from '../data/types'
import { MAX_RATE_CENTS, centsToInput, formatEuro, formatHours, parseEuroToCents } from '../lib/money'
import { NOMINAL_HOURS, PRODUCTIVE_HOURS, suggestedRateCents } from '../lib/salary'
import { norm } from '../lib/people'
import { personScores } from '../lib/stats'
import { t } from '../texts'
import { ConfirmDialog } from './ConfirmDialog'
import { PersonPicker } from './PersonPicker'
import { RatingIcon } from './Rating'
import { Sheet } from './Sheet'

function PersonForm({ person, onClose }: { person?: Person; onClose: () => void }) {
  const [name, setName] = useState(person?.name ?? '')
  const [rate, setRate] = useState(person ? String(person.rateCents / 100).replace('.', ',') : '')
  const [tried, setTried] = useState(false)
  const [asking, setAsking] = useState(false)
  const [archived, setArchived] = useState(person?.archived ?? false)
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
  const rateErr = cents === null ? t.people.errRate : cents > MAX_RATE_CENTS ? t.people.errRateMax : ''
  return (
    <>
    <Sheet title={person ? t.people.editTitle : t.people.newTitle} onClose={onClose} actions={<>
        {person && (
          <button
            className="btn danger"
            onClick={() => setAsking(true)}
          >
            {t.people.delete}
          </button>
        )}
        <button className="btn ghost" onClick={onClose}>{t.people.cancel}</button>
        <button
          className="btn primary"
          onClick={() => {
            if (nameErr || rateErr || cents === null) return setTried(true)
            actions.savePerson({ id: person?.id, name: name.trim(), rateCents: cents, archived })
            onClose()
          }}
        >
          {t.people.save}
        </button>
      </>}>
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
      {person && (
        <label className="check">
          <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
          <span>{t.people.archived}</span>
        </label>
      )}
      {person && <p className="muted">{t.people.archivedNote}</p>}
    </Sheet>
    {asking && person && (
      <ConfirmDialog
        message={t.people.confirmDelete}
        confirmLabel={t.confirm.delete}
        onCancel={() => setAsking(false)}
        onConfirm={() => {
          actions.deletePerson(person.id)
          onClose()
        }}
      />
    )}
    </>
  )
}

const SCORE_PREVIEW = 10

function TeamForm({ team, onClose }: { team?: Team; onClose: () => void }) {
  const { people } = useData()
  const [name, setName] = useState(team?.name ?? '')
  const [ids, setIds] = useState<string[]>(team?.personIds ?? [])
  const [tried, setTried] = useState(false)
  const [asking, setAsking] = useState(false)
  // Nur aktive Personen, alphabetisch (hier zählt nicht die letzte Nutzung)
  const options = people
    .filter((p) => !p.archived)
    .map((p) => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
  const nameErr = name.trim() ? '' : t.people.team.errName
  const membersErr = ids.length > 0 ? '' : t.people.team.errMembers
  return (
    <>
    <Sheet
      title={team ? t.people.team.editTitle : t.people.team.newTitle}
      onClose={onClose}
      actions={
        <>
          {team && (
            <button
              className="btn danger"
              onClick={() => setAsking(true)}
            >
              {t.people.team.delete}
            </button>
          )}
          <button className="btn ghost" onClick={onClose}>{t.people.team.cancel}</button>
          <button
            className="btn primary"
            onClick={() => {
              if (nameErr || membersErr) return setTried(true)
              actions.saveTeam({ id: team?.id, name: name.trim(), personIds: ids })
              onClose()
            }}
          >
            {t.people.team.save}
          </button>
        </>
      }
    >
      <label className="field">
        <span>{t.people.team.name}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus={!team} />
        {tried && nameErr && <small className="error" role="alert">{nameErr}</small>}
      </label>
      <div className="field">
        <span>{t.people.team.members}</span>
        <PersonPicker options={options} selected={ids} onChange={setIds} autoFocusSearch={!!team} />
        {tried && membersErr && <small className="error" role="alert">{membersErr}</small>}
      </div>
    </Sheet>
    {asking && team && (
      <ConfirmDialog
        message={t.people.team.confirmDelete}
        confirmLabel={t.confirm.delete}
        onCancel={() => setAsking(false)}
        onConfirm={() => {
          actions.deleteTeam(team.id)
          onClose()
        }}
      />
    )}
    </>
  )
}

type View = 'list' | 'teams' | 'score'

export function People() {
  const data = useData()
  const [editing, setEditing] = useState<Person | 'new' | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | 'new' | null>(null)
  const [view, setView] = useState<View>('list')
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const q = norm(query)
  const byName = (a: Person, b: Person) => a.name.localeCompare(b.name, 'de')
  const found = (q ? data.people.filter((p) => norm(p.name).includes(q)) : data.people).slice().sort(byName)
  const people = found.filter((p) => !p.archived)
  const archived = found.filter((p) => p.archived)
  const archivedTotal = data.people.filter((p) => p.archived).length
  const activeTotal = data.people.length - archivedTotal
  const allScores = personScores(data.meetings)
  const scores = q ? allScores.filter((s) => norm(s.name).includes(q)) : allScores
  const maxSec = Math.max(1, ...allScores.map((s) => s.seconds))
  const shownScores = showAll || q ? scores : scores.slice(0, SCORE_PREVIEW)
  const personRow = (p: Person) => (
    <li key={p.id}>
      <button className={'row-item' + (p.archived ? ' archived' : '')} onClick={() => setEditing(p)}>
        <strong className="grow">{p.name}</strong>
        <span className="muted">{formatEuro(p.rateCents)}/h</span>
      </button>
    </li>
  )

  return (
    <>
      <div className="segment full" role="group">
        {(['list', 'teams', 'score'] as const).map((k) => (
          <button key={k} className={view === k ? 'on' : ''} aria-pressed={view === k} onClick={() => setView(k)}>
            {k === 'list' ? t.people.viewList : k === 'teams' ? t.people.viewTeams : t.people.viewScore}
          </button>
        ))}
      </div>

      {view !== 'teams' && (data.people.length > 6 || query) && (
        <input
          type="search"
          className="input"
          value={query}
          placeholder={t.people.search}
          aria-label={t.people.search}
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      {view === 'teams' && (
        <button className="btn primary wide" onClick={() => setEditingTeam('new')} disabled={activeTotal === 0}>{t.people.team.add}</button>
      )}
      {view === 'list' && (
        <button className="btn primary wide" onClick={() => setEditing('new')}>{t.people.add}</button>
      )}
      {view !== 'teams' && query && <p className="muted">{t.people.shown(view === 'list' ? found.length : scores.length, view === 'list' ? data.people.length : allScores.length)}</p>}

      {view === 'list' && (
        <>
          {data.people.length === 0 ? (
            <p className="muted empty">{t.people.empty}</p>
          ) : people.length === 0 && archived.length === 0 ? (
            <p className="muted empty">{t.people.noMatch}</p>
          ) : (
            <ul className="plain list">{people.map(personRow)}</ul>
          )}
          {archivedTotal > 0 && (
            <>
              <button className="link archive-toggle" onClick={() => setShowArchive(!showArchive)} aria-expanded={showArchive || !!q}>
                {showArchive || q ? t.people.hideArchive : t.people.showArchive} · {t.people.archiveTitle(archivedTotal)}
              </button>
              {(showArchive || q) && <ul className="plain list">{archived.map(personRow)}</ul>}
            </>
          )}
        </>
      )}

      {view === 'teams' &&
        (data.teams.length === 0 ? (
          <p className="muted empty">{t.people.team.empty}</p>
        ) : (
          <ul className="plain list">
            {data.teams.map((tm) => (
              <li key={tm.id}>
                <button className="row-item" onClick={() => setEditingTeam(tm)}>
                  <strong className="grow">{tm.name}</strong>
                  <span className="muted">{t.people.team.count(tm.personIds.length)}</span>
                </button>
              </li>
            ))}
          </ul>
        ))}

      {view === 'score' && (
        <section>
          <p className="muted">{t.people.rank}</p>
          {scores.length === 0 ? (
            <p className="muted empty">{q ? t.people.noMatch : t.list.empty}</p>
          ) : (
            <ol className="plain list">
              {shownScores.map((s) => (
                <li key={s.personId} className="score">
                  <span className="rank">{allScores.indexOf(s) + 1}</span>
                  <div className="grow">
                    <div className="line">
                      <strong>{s.name}</strong>
                      <strong>{formatEuro(s.cents)}</strong>
                    </div>
                    <small className="muted">{t.people.stats(s.meetings, formatHours(s.seconds))}</small>
                    {(s.up > 0 || s.down > 0) && (
                      <small className="muted rated-line">
                        <RatingIcon rating="up" size={14} /> {s.up} <RatingIcon rating="down" size={14} /> {s.down}
                      </small>
                    )}
                    <span className="bar"><i style={{ width: `${(s.seconds / maxSec) * 100}%` }} /></span>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {!q && scores.length > SCORE_PREVIEW && (
            <button className="btn ghost wide" onClick={() => setShowAll(!showAll)}>
              {showAll ? t.people.showLess : t.people.showAll(scores.length)}
            </button>
          )}
        </section>
      )}

      {editing && <PersonForm person={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {editingTeam && <TeamForm team={editingTeam === 'new' ? undefined : editingTeam} onClose={() => setEditingTeam(null)} />}
    </>
  )
}
