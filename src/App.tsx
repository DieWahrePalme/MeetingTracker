import { useState } from 'react'
import { Data } from './components/Data'
import { Meetings } from './components/Meetings'
import { People } from './components/People'
import { useData } from './data/store'
import { t } from './texts'

type Tab = 'meetings' | 'people' | 'data'

// Einfache eigene Icons für die Tab-Leiste
const ICONS: Record<Tab, React.ReactNode> = {
  meetings: (
    <>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M18 14.4c1.9.8 3 2.6 3 5.6" />
    </>
  ),
  data: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </>
  ),
}

export default function App() {
  const [tab, setTab] = useState<Tab>('meetings')
  const { companyName } = useData()
  return (
    <div className="app">
      <header>
        <span className="brand">{companyName}</span>
      </header>
      <main>{tab === 'meetings' ? <Meetings /> : tab === 'people' ? <People /> : <Data />}</main>
      <nav className="tabbar" aria-label="Bereiche">
        <div className="tabbar-inner">
          {(['meetings', 'people', 'data'] as const).map((k) => (
            <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => { setTab(k); window.scrollTo(0, 0) }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {ICONS[k]}
              </svg>
              <span>{t.tabs[k]}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
