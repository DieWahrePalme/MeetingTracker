import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' damit die Seite auch unter https://<name>.github.io/MeetingTracker/ funktioniert
export default defineConfig({
  base: './',
  plugins: [react()],
})
