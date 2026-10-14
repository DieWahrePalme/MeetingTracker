import { useRef, useState } from 'react'
import { actions, useData } from '../data/store'
import { t } from '../texts'

/** Reiter "Daten": Unternehmen, Sicherung (Export/Import), Demo und Löschen. */
export function Data() {
  const data = useData()
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function download() {
    const url = URL.createObjectURL(new Blob([actions.exportJson()], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `meetingtracker-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onImport(file: File) {
    if (!confirm(t.data.importConfirm)) return
    try {
      actions.importJson(await file.text())
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
            if (f) void onImport(f)
          }}
        />
        {msg && <p className="muted" role="status">{msg}</p>}
      </section>

      <section className="card">
        <h2>{t.data.more}</h2>
        {data.people.length === 0 && data.meetings.length === 0 && (
          <button className="btn ghost" onClick={actions.loadDemo}>{t.data.demo}</button>
        )}
        <button className="btn danger" onClick={() => confirm(t.data.clearConfirm) && actions.clearAll()}>{t.data.clear}</button>
      </section>
    </>
  )
}
