# Handoff

## Done
- Vite + React + TypeScript, rein statisch, Daten im Browser (localStorage) hinter `src/data/store.ts`.
- Geldrechnung in `src/lib/money.ts` (Cent, Sekunden, einmal runden) mit Tests; Statistik/Filter in `src/lib/stats.ts`.
- Startseite: globale Summe oben, Filter Jahr/Monat/Tag, Liste mit Kostenbalken, Sortierung neueste/teuerste.
- Live-Timer (h:mm:ss), Meeting nachtragen, Meeting-Detail mit Bearbeiten/Löschen.
- Personen mit festem Stundensatz, Meeting-Score, JSON-Export/Import, Demo-Daten (fiktiv).
- Satz wird pro Meeting gespeichert (alte Meetings ändern sich nicht).
- Alle Texte in `src/texts.ts` (Deutsch).
- Deploy über GitHub Actions auf GitHub Pages (`.github/workflows/deploy.yml`).

## Next
- Dark Mode und Desktop-Ansicht visuell prüfen, auf dem Handy testen.
- Optional: PWA/Icon, Hinweis zum Backup (Daten liegen nur im Browser).

## Open questions
- Name und Domain.

## Hinweise
- Dev-Server: `npx vite --host --port 5273`. Über http (z. B. Tailscale) gibt es kein `crypto.randomUUID`, daher der Fallback in `store.ts`.
