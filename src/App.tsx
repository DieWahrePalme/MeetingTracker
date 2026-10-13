import { useState } from 'react'
import { Meetings } from './components/Meetings'
import { People } from './components/People'
import { useData } from './data/store'
import { t } from './texts'

export default function App() {
  const [tab, setTab] = useState<'meetings' | 'people'>('meetings')
  const { companyName } = useData()
  return (
    <div className="app">
      <header>
        <span className="brand">{companyName}</span>
        <nav className="segment" aria-label="Bereiche">
          {(['meetings', 'people'] as const).map((k) => (
            <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
              {t.tabs[k]}
            </button>
          ))}
        </nav>
      </header>
      <main>{tab === 'meetings' ? <Meetings /> : <People />}</main>
    </div>
  )
}
