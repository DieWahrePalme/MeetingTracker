import { useRef, useState } from 'react'
import { actions, parseData, useData } from '../data/store'
import { t } from '../texts'
import { ConfirmDialog } from './ConfirmDialog'

/** Reiter "Daten": Unternehmen, Sicherung (Export/Import), Demo und Löschen. */
export function Data() {
  const data = useData()
  const [msg, setMsg] = useState('')
  const [pendingText, setPendingText] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function download() {
    const url = URL.createObjectURL(new Blob([actions.exportJson()], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `meetingtracker-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Erst die Datei prüfen, dann erst nach dem Ersetzen fragen
  async function onPick(file: File) {
    setMsg('')
    try {
      const text = await file.text()
      parseData(JSON.parse(text))
      setPendingText(text)
    } catch {
      setMsg(t.data.importFail)
    }
  }
  function doImport(text: string) {
    try {
      actions.importJson(text)
      setMsg(t.data.importOk)
    } catch {
      setMsg(t.data.importFail)
    }
  }

  return (
    <>
      <label className="field company">
        <span>{t.people.company}</span>
        <input value={data.companyName} onChange={(e) => actions.setCompanyName(e.target.value)} />
      </label>

      <section className="card">
        <h2>{t.data.backup}</h2>
        <p className="muted">{t.data.note}</p>
        <button className="btn primary" onClick={download}>{t.data.export}</button>
        <button className="btn ghost" onClick={() => fileRef.current?.click()}>{t.data.import}</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void onPick(f)
          }}
        />
        {msg && <p className="muted" role="status">{msg}</p>}
      </section>

      <section className="card">
        <h2>{t.data.more}</h2>
        {data.people.length === 0 && data.meetings.length === 0 && (
          <button className="btn ghost" onClick={actions.loadDemo}>{t.data.demo}</button>
        )}
        <button className="btn danger" onClick={() => setClearing(true)}>{t.data.clear}</button>
      </section>

      {pendingText !== null && (
        <ConfirmDialog
          message={t.data.importConfirm}
          confirmLabel={t.confirm.import}
          onCancel={() => setPendingText(null)}
          onConfirm={() => {
            const text = pendingText
            setPendingText(null)
            doImport(text)
          }}
        />
      )}
      {clearing && (
        <ConfirmDialog
          message={t.data.clearConfirm}
          confirmLabel={t.confirm.clearAll}
          onCancel={() => setClearing(false)}
          onConfirm={() => {
            setClearing(false)
            actions.clearAll()
          }}
        />
      )}
    </>
  )
}
