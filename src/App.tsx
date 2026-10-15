import { useState } from 'react'
import { Data } from './components/Data'
import { Meetings } from './components/Meetings'
import { People } from './components/People'
import { useData } from './data/store'
import { t } from './texts'

type Tab = 'meetings' | 'people' | 'data'

export default function App() {
  const [tab, setTab] = useState<Tab>('meetings')
  const { companyName } = useData()
  return (
    <div className="app">
      <header>
        <span className="brand">{companyName}</span>
        <nav className="topnav" aria-label="Bereiche">
          {(['meetings', 'people', 'data'] as const).map((k) => (
            <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
              {t.tabs[k]}
            </button>
          ))}
        </nav>
      </header>
      <main className={tab === 'meetings' ? '' : tab === 'people' ? 'people' : 'narrow'}>{tab === 'meetings' ? <Meetings /> : tab === 'people' ? <People /> : <Data />}</main>
    </div>
  )
}
