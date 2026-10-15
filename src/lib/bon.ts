import type { Meeting } from '../data/types'
import { formatDuration, formatEuro } from './money'
import { headCount, meetingCost, personSeconds } from './stats'
import { t } from '../texts'

export const clock = (ms: number) => new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

/** Bon-Nummer = Platz in der zeitlichen Reihenfolge aller Meetings (das älteste ist Nr. 1). */
export function bonNumber(meetings: Meeting[], meeting: Meeting): number {
  const sorted = [...meetings].sort((a, b) => a.startedAt - b.startedAt || a.id.localeCompare(b.id))
  const i = sorted.findIndex((m) => m.id === meeting.id)
  return i < 0 ? meetings.length : i + 1
}

const W = 340 // Breite des Bons in Pixeln (Faktor SCALE macht daraus das Bild)
const MARGIN = 22
const PAD = 20
const SCALE = 3
const PAPER = '#fbf8f1'
const INK = '#14110f'
const STAMP = '#d1450a'
const MONO = 'Menlo, Consolas, "Courier New", monospace'
const NUM = '"Space Grotesk", system-ui, sans-serif'

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    let rest = word
    // Sehr lange Wörter notfalls zeichenweise umbrechen
    while (ctx.measureText(rest).width > maxWidth) {
      let n = rest.length - 1
      while (n > 1 && ctx.measureText(rest.slice(0, n)).width > maxWidth) n--
      if (line) lines.push(line)
      line = ''
      lines.push(rest.slice(0, n))
      rest = rest.slice(n)
    }
    const next = line ? `${line} ${rest}` : rest
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line)
      line = rest
    } else line = next
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  try {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`
  } catch {
    /* ältere Browser: ohne Buchstabenabstand */
  }
}

/** Zeichnet den Bon (Papier mit Zackenkante) ab y = MARGIN und gibt die Höhe des Bildes zurück. */
function draw(ctx: CanvasRenderingContext2D, m: Meeting, number: number, company: string, paint: boolean): number {
  const left = MARGIN + PAD
  const right = MARGIN + W - PAD
  const inner = right - left
  const end = m.startedAt + m.durationSec * 1000
  const TOOTH = 7
  let y = MARGIN + TOOTH + 24

  const rows: [string, string][] = []
  const text = (s: string, x: number, yy: number, font: string, align: CanvasTextAlign = 'left', alpha = 1, spacing = 0) => {
    if (!paint) return
    ctx.font = font
    ctx.textAlign = align
    ctx.globalAlpha = alpha
    setSpacing(ctx, spacing)
    ctx.fillText(s, x, yy)
    ctx.globalAlpha = 1
    setSpacing(ctx, 0)
  }
  const dashed = () => {
    if (paint) {
      ctx.globalAlpha = 0.45
      ctx.strokeStyle = INK
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(left, y)
      ctx.lineTo(right, y)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }
    y += 22
  }

  if (paint) ctx.fillStyle = INK
  text(t.bon.title, MARGIN + W / 2, y, `700 17px ${MONO}`, 'center', 1, 3.5)
  y += 22
  text(`${company} · ${t.bon.no(number)}`, MARGIN + W / 2, y, `13px ${MONO}`, 'center', 0.7)
  y += 14
  dashed()

  // Titel (mit Platz für den Stempel rechts) und Stempel
  ctx.font = `700 17px ${MONO}`
  const titleLines = wrap(ctx, m.title, inner - 120)
  const headTop = y
  titleLines.forEach((l, i) => text(l, left, y + 14 + i * 22, `700 17px ${MONO}`))
  const headH = Math.max(66, titleLines.length * 22 + 14)
  if (paint) {
    ctx.save()
    ctx.translate(right - 52, headTop + 28)
    ctx.rotate((-9 * Math.PI) / 180)
    ctx.strokeStyle = STAMP
    ctx.fillStyle = STAMP
    ctx.lineWidth = 1.5
    ctx.strokeRect(-56, -26, 112, 52)
    ctx.strokeRect(-52.5, -22.5, 105, 45)
    ctx.restore()
    ctx.save()
    ctx.translate(right - 52, headTop + 28)
    ctx.rotate((-9 * Math.PI) / 180)
    ctx.fillStyle = STAMP
    ctx.font = `700 15px ${MONO}`
    ctx.textAlign = 'center'
    setSpacing(ctx, 1.5)
    ctx.fillText(t.bon.stamp, 0, -3)
    ctx.font = `700 12px ${MONO}`
    setSpacing(ctx, 0.5)
    ctx.fillText(clock(end), 0, 14)
    setSpacing(ctx, 0)
    ctx.restore()
    ctx.fillStyle = INK
  }
  y += headH

  rows.push(
    [t.bon.date, new Date(m.startedAt).toLocaleDateString('de-DE')],
    [t.bon.start, clock(m.startedAt)],
    [t.bon.end, clock(end)],
    [t.bon.duration, formatDuration(m.durationSec)],
  )
  const row = ([a, b]: [string, string]) => {
    text(a, left, y, `14px ${MONO}`)
    text(b, right, y, `14px ${MONO}`, 'right')
    y += 21
  }
  rows.forEach(row)
  y += 2
  dashed()
  y -= 4
  row([t.bon.people, String(headCount(m))])
  row([t.bon.personTime, formatDuration(personSeconds(m))])
  if (m.rating) row([t.bon.rating, t.rating[m.rating]])
  y += 2
  dashed()

  // Summe
  y += 12
  text(t.bon.sum, left, y, `14px ${MONO}`)
  text(formatEuro(meetingCost(m)), right, y, `700 32px ${NUM}`, 'right', 1, -1)
  y += 20

  // Strichcode
  if (paint) {
    ctx.fillStyle = INK
    for (let x = 0; x < inner; x += 13) {
      for (const [a, b] of [[0, 2], [5, 6], [8, 11]]) {
        if (x + a < inner) ctx.fillRect(left + x + a, y, Math.min(b, inner - x) - a, 34)
      }
    }
  }
  y += 34 + 22
  text(t.bon.thanks, MARGIN + W / 2, y, `12px ${MONO}`, 'center', 0.75)
  y += 22 + TOOTH
  return y
}

/** Der Bon als PNG (Papier mit Zackenkante auf hellem Grund), ohne dass etwas die Seite verlässt. */
export async function renderBonPng(m: Meeting, number: number, company: string): Promise<Blob> {
  try {
    await Promise.all([document.fonts.load(`700 32px "Space Grotesk"`), document.fonts.load(`500 16px "Space Grotesk"`)])
  } catch {
    /* ohne die Schrift wird die Ersatzschrift genommen */
  }
  const scratch = document.createElement('canvas').getContext('2d')!
  const bodyEnd = draw(scratch, m, number, company, false)
  const height = bodyEnd + MARGIN
  const canvas = document.createElement('canvas')
  canvas.width = (W + MARGIN * 2) * SCALE
  canvas.height = Math.ceil(height * SCALE)
  const ctx = canvas.getContext('2d')!
  ctx.scale(SCALE, SCALE)
  ctx.fillStyle = '#e9e4d8'
  ctx.fillRect(0, 0, W + MARGIN * 2, height)

  // Papier mit Zackenkante oben und unten
  const TOOTH = 7
  const top = MARGIN
  const bottom = bodyEnd
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 4
  ctx.fillStyle = PAPER
  ctx.beginPath()
  const x0 = MARGIN
  const x1 = MARGIN + W
  ctx.moveTo(x0, top + TOOTH)
  for (let x = x0; x < x1; x += 14) {
    ctx.lineTo(Math.min(x + 7, x1), top)
    ctx.lineTo(Math.min(x + 14, x1), top + TOOTH)
  }
  ctx.lineTo(x1, bottom - TOOTH)
  for (let x = x1; x > x0; x -= 14) {
    ctx.lineTo(Math.max(x - 7, x0), bottom)
    ctx.lineTo(Math.max(x - 14, x0), bottom - TOOTH)
  }
  ctx.closePath()
  ctx.fill()
  ctx.shadowColor = 'transparent'

  ctx.fillStyle = INK
  draw(ctx, m, number, company, true)
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png'))), 'image/png'))
}

const fileName = (m: Meeting) => `meeting-bon-${new Date(m.startedAt).toISOString().slice(0, 10)}.png`

/** Teilen-Menü des Geräts mit dem Bild; wo es das nicht gibt (PC), wird die Datei heruntergeladen. */
export async function shareBon(m: Meeting, png: Blob): Promise<void> {
  const file = new File([png], fileName(m), { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: t.bon.title })
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) throw e
    }
    return
  }
  const url = URL.createObjectURL(png)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName(m)
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
