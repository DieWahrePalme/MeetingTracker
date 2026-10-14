import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/space-grotesk/latin-700.css'
import './index.css'
import { applyTheme, getTheme } from './theme'
import App from './App.tsx'

applyTheme(getTheme()) // vor dem ersten Zeichnen, damit nichts aufblitzt

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
