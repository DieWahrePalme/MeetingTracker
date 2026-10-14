// Design-Vorschau: Looks lassen sich im Reiter "Daten" umschalten (nur Farben und Formen, keine Logik).
export type Theme = 'standard' | 'bon' | 'klipy'
export const THEMES: Theme[] = ['standard', 'bon', 'klipy']

const KEY = 'meetingtracker.theme'

export function getTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'bon' || v === 'klipy' ? v : 'standard'
  } catch {
    return 'standard'
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* gilt dann nur für diese Sitzung */
  }
}

/** Kosten oder Zeit: manche Looks färben den Akzent danach (z. B. Kassenbon: Orange = Geld, Blau = Zeit). */
export function applyMetric(metric: 'cost' | 'time') {
  document.documentElement.dataset.metric = metric
}
