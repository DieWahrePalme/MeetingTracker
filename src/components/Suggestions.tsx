import { actions } from '../data/store'
import type { Suggestion } from '../lib/recurring'
import { t } from '../texts'

/** Vorschläge für wiederkehrende Meetings: ein Tipp öffnet das Formular mit den Werten des letzten Termins. */
export function Suggestions({ items, onCreate }: { items: Suggestion[]; onCreate: (s: Suggestion) => void }) {
  if (items.length === 0) return null
  return (
    <section className="card suggest" aria-label={t.suggest.title}>
      <p className="label">{t.suggest.title}</p>
      <ul className="plain">
        {items.slice(0, 3).map((s) => (
          <li key={s.id} className="suggest-item">
            <div className="grow">
              <strong>{s.title}</strong>
              <small className="muted">
                {t.suggest.every(s.intervalDays)} · {t.suggest.last(new Date(s.last.startedAt).toLocaleDateString('de-DE'))}
              </small>
              <span className={'pill' + (s.daysUntil <= 0 ? ' due' : '')}>{t.suggest.due(s.daysUntil)}</span>
            </div>
            <div className="suggest-actions">
              <button className="btn primary" onClick={() => onCreate(s)}>{t.suggest.create}</button>
              <button className="link" onClick={() => actions.hideSuggestion(s.id)}>{t.suggest.hide}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
