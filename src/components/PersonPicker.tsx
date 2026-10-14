import { useRef, useState } from 'react'
import type { Team } from '../data/types'
import { norm } from '../lib/people'
import type { PickOption } from '../lib/people'
import { t } from '../texts'

/**
 * Personenauswahl. Teams (falls vorhanden) wählen mit einem Tipp alle Mitglieder.
 * Bis 8 Personen als Chips, darüber mit Suche, Trefferliste und Übersicht der Auswahl.
 */
export function PersonPicker({
  options,
  selected,
  onChange,
  teams = [],
  autoFocusSearch = false,
}: {
  options: PickOption[]
  selected: string[]
  onChange: (ids: string[]) => void
  teams?: Team[]
  /** Cursor startet in der Suche (nur sichtbar bei mehr als 8 Personen). */
  autoFocusSearch?: boolean
}) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  // Beim Antippen von Personen, Chips und Links bleibt der Cursor im Suchfeld (Tastatur bleibt offen),
  // so lassen sich schnell mehrere Personen hintereinander wählen.
  const keepFocus = { onMouseDown: (e: React.MouseEvent) => e.preventDefault() }
  const act = (fn: () => void) => () => {
    const had = document.activeElement === searchRef.current
    fn()
    if (had) searchRef.current?.focus({ preventScroll: true })
  }

  // Teams: nur Mitglieder, die gerade wählbar sind (nicht archiviert, nicht gelöscht)
  const available = new Set(options.map((o) => o.id))
  const teamChips = teams
    .map((tm) => ({ tm, members: tm.personIds.filter((id) => available.has(id)) }))
    .filter((x) => x.members.length > 0)
  const teamRow = teamChips.length > 0 && (
    <div className="team-row">
      <span className="muted">{t.pick.teams}</span>
      <div className="chips">
        {teamChips.map(({ tm, members }) => {
          const on = members.every((id) => selected.includes(id))
          return (
            <button
              key={tm.id}
              type="button"
              className={'chip team' + (on ? ' on' : '')}
              aria-pressed={on}
              {...keepFocus}
              onClick={act(() => onChange(on ? selected.filter((id) => !members.includes(id)) : [...new Set([...selected, ...members])]))}
            >
              {tm.name} ({members.length})
            </button>
          )
        })}
      </div>
    </div>
  )

  if (options.length <= 8) {
    return (
      <div className="picker">
        {teamRow}
        <div className="chips">
          {options.map((o) => (
            <button key={o.id} type="button" className={'chip' + (selected.includes(o.id) ? ' on' : '')} aria-pressed={selected.includes(o.id)} onClick={() => toggle(o.id)}>
              {o.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const q = norm(query)
  const matches = q ? options.filter((o) => norm(o.name).includes(q)) : options
  const chosen = options.filter((o) => selected.includes(o.id))
  const allShownSelected = matches.length > 0 && matches.every((o) => selected.includes(o.id))

  return (
    <div className="picker">
      {teamRow}
      <input
        ref={searchRef}
        data-scroll="start"
        autoFocus={autoFocusSearch}
        type="search"
        className="input"
        value={query}
        placeholder={t.pick.search}
        aria-label={t.pick.search}
        enterKeyHint="done"
        autoComplete="off"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (matches.length === 1) {
              toggle(matches[0].id)
              setQuery('')
            }
            e.currentTarget.blur() // Tastatur schließen
          }
        }}
      />
      <div className="picker-head">
        <span>{t.pick.selected(chosen.length)}</span>
        <span className="picker-actions">
          {focused && (
            <button type="button" className="link done" {...keepFocus} onClick={() => searchRef.current?.blur()}>
              {t.pick.done}
            </button>
          )}
          {q && matches.length > 0 && (
            <button
              type="button"
              className="link"
              {...keepFocus}
              onClick={act(() => onChange(allShownSelected ? selected.filter((id) => !matches.some((o) => o.id === id)) : [...new Set([...selected, ...matches.map((o) => o.id)])]))}
            >
              {allShownSelected ? t.pick.unselectShown(matches.length) : t.pick.selectShown(matches.length)}
            </button>
          )}
          {chosen.length > 0 && (
            <button type="button" className="link" {...keepFocus} onClick={act(() => onChange([]))}>
              {t.pick.clear}
            </button>
          )}
        </span>
      </div>
      {chosen.length > 0 && (
        <div className="chips picked">
          {chosen.map((o) => (
            <button key={o.id} type="button" className="chip on" aria-label={t.pick.remove(o.name)} {...keepFocus} onClick={act(() => toggle(o.id))}>
              {o.name} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
      <ul className="plain pick-list">
        {matches.length === 0 && <li className="muted pick-empty">{t.pick.none}</li>}
        {matches.map((o) => {
          const on = selected.includes(o.id)
          return (
            <li key={o.id}>
              <button type="button" className={'pick-row' + (on ? ' on' : '')} aria-pressed={on} {...keepFocus} onClick={act(() => toggle(o.id))}>
                <span className="box" aria-hidden="true">{on ? '✓' : ''}</span>
                {o.name}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
