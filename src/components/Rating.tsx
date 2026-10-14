import type { Rating } from '../data/types'
import { t } from '../texts'

// Eigene einfache SVG-Icons, damit sie auf allen Geräten gleich aussehen (keine Emojis).
const PATHS: Record<Rating, React.ReactNode> = {
  up: (
    <>
      <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Z" />
      <path d="M7 11l4-8c1.7 0 3 1.3 3 3v3.5h4.6a2 2 0 0 1 2 2.3l-1.2 6.5a2 2 0 0 1-2 1.7H7" />
    </>
  ),
  neutral: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </>
  ),
  down: (
    <>
      <path d="M7 13V4H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3Z" />
      <path d="M7 13l4 8c1.7 0 3-1.3 3-3v-3.5h4.6a2 2 0 0 0 2-2.3l-1.2-6.5a2 2 0 0 0-2-1.7H7" />
    </>
  ),
}

export function RatingIcon({ rating, size = 20, label = false }: { rating: Rating; size?: number; label?: boolean }) {
  return (
    <svg
      className={`rating-icon rate-${rating}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label ? t.rating[rating] : undefined}
      aria-hidden={label ? undefined : true}
    >
      {PATHS[rating]}
    </svg>
  )
}

const ORDER: Rating[] = ['up', 'neutral', 'down']

/** Drei große Buttons; ein zweiter Tipp auf die gewählte Bewertung entfernt sie wieder. */
export function RatingPicker({ value, onChange }: { value?: Rating; onChange: (r: Rating | undefined) => void }) {
  return (
    <div className="field">
      <span>{t.rating.title}</span>
      <div className="rating-picker" role="group" aria-label={t.rating.title}>
        {ORDER.map((r) => (
          <button
            key={r}
            type="button"
            className={`rate-btn rate-${r}` + (value === r ? ' on' : '')}
            aria-pressed={value === r}
            onClick={() => onChange(value === r ? undefined : r)}
          >
            <RatingIcon rating={r} size={28} />
            <small>{t.rating[r]}</small>
          </button>
        ))}
      </div>
      <small className="muted">{t.rating.hint}</small>
    </div>
  )
}
