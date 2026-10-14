import type { FlatGroup } from '../data/types'
import { parseEuroToCents } from '../lib/money'
import { t } from '../texts'

/** Rohtexte der beiden Felder; daraus wird bei Bedarf die Pauschale berechnet. */
export interface GroupInput {
  count: string
  rate: string
}

export const emptyGroupInput: GroupInput = { count: '', rate: '' }

export function groupToInput(g?: FlatGroup): GroupInput {
  return g ? { count: String(g.count), rate: String(g.rateCents / 100).replace('.', ',') } : emptyGroupInput
}

const countOf = (g: GroupInput) => Math.max(0, Math.floor(Number(g.count) || 0))

/** Gültige Pauschale oder null (Anzahl 0 oder Satz ungültig). */
export function inputToGroup(g: GroupInput): FlatGroup | null {
  const count = countOf(g)
  const rateCents = parseEuroToCents(g.rate)
  return count > 0 && rateCents !== null ? { count, rateCents } : null
}

/** Fehlertext, wenn eine Anzahl > 0 ohne gültigen Satz eingegeben wurde. */
export function groupError(g: GroupInput): string {
  return countOf(g) > 0 && parseEuroToCents(g.rate) === null ? t.group.errRate : ''
}

export function GroupFields({ value, onChange }: { value: GroupInput; onChange: (v: GroupInput) => void }) {
  return (
    <div className="field">
      <span>{t.group.title}</span>
      <p className="muted">{t.group.note}</p>
      <div className="group-grid">
        <label className="field">
          <small>{t.group.count}</small>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            value={value.count}
            onChange={(e) => onChange({ ...value, count: e.target.value })}
          />
        </label>
        <label className="field">
          <small>{t.group.rate}</small>
          <input
            inputMode="decimal"
            placeholder={t.group.rateHint}
            value={value.rate}
            onChange={(e) => onChange({ ...value, rate: e.target.value })}
          />
        </label>
      </div>
    </div>
  )
}
