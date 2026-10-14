# MeetingTracker: PRD

## Goal
A simple, good-looking website that shows what meetings cost. Not a calendar,
only cost tracking. Idea from Moritz (2026-10-13).

## Core idea
- **One company only** (e.g. "Unternehmen A", name editable). It has **people**,
  each with their **own hourly rate** (e.g. Thomas, Tom, Justus: 30 EUR/h).
  A guest is simply created as a person (e.g. "Besucher") with their own rate.
- A **meeting** has a title, a date and participants (chosen from the company's
  people) and a duration. Cost per person = rate x duration; meeting cost = sum.
  Example: 30 min, two people at 30 EUR/h = 15 EUR each, 30 EUR total.
- **Live meeting**: "Meeting starten" starts a timer, people can be added
  while it runs, "Stoppen" ends it and saves the meeting with the measured time.
  Also possible: add a past meeting by typing the duration.

## Main screen (like a bank account)
- Very large **total** at the top: what all meetings have cost so far.
- Below, the list of meetings, **newest first**, each with title, date,
  duration, number of people and cost. Tap a meeting for details (who, cost per
  person), edit and delete.
- Make it easy to see which meetings drove the total up (e.g. a subtle bar
  or highlight for the most expensive ones, sort/filter by cost).

## People view
- "Meeting score" per person: who spends the most time in meetings, how many
  meetings, total hours, total cost caused. Ranking, simple bars.

## Meetings bewerten (Wunsch von Moritz, 2026-10-14)
Jedes Meeting kann optional bewertet werden: Daumen hoch (gut), neutral, Daumen runter (schlecht).
- Drei große Buttons mit eigenen SVG-Icons (keine Emojis), nochmal tippen entfernt die Bewertung.
  Zu setzen im Live-Timer (vor dem Stoppen), im Nachtragen-Formular, im Detail (speichert sofort) und im Bearbeiten.
- Liste: kleines Icon pro Meeting, unbewertet zeigt nichts.
- Startseite: Karte "Davon in schlechten Meetings: X" und ein dünner gestapelter Balken mit der Aufteilung der Kosten
  nach Bewertung (gut / neutral / schlecht / unbewertet), nur sichtbar, wenn mindestens ein Meeting bewertet ist.
  Die Karte folgt dem Zeitraumfilter.
- Filter-Chips (Alle / Gut / Neutral / Schlecht / Unbewertet), kombinierbar mit Jahr/Monat/Tag und der Sortierung.
- Personenansicht: pro Person Anzahl guter und schlechter Meetings, der Meeting-Score bleibt unverändert.
- Daten: optionales Feld `rating` ('up' | 'neutral' | 'down') am Meeting. Alte Meetings und Exporte funktionieren weiter.

## Meeting-Pauschale (Wunsch von Moritz, 2026-10-14)
Für Meetings, bei denen man nicht jeden einzeln anlegen will (z. B. 10 Personen à 30 €/h).
- Im Formular (Nachtragen, Bearbeiten und Live-Timer) gibt es einen optionalen Block "Pauschale":
  Anzahl Personen und Stundensatz pro Person. Benannte Personen und Pauschale lassen sich mischen
  (z. B. 2 benannte + 8 Pauschale) oder die Pauschale steht allein.
- Kosten der Pauschale = Anzahl x Satz x Sekunden / 3600, einmal auf ganze Cent gerundet.
  Meetingkosten = benannte Personen + Pauschale.
- Gespeichert wird `group: { count, rateCents }` im Meeting (optionales Feld, Schema bleibt Version 1).
  Alte Meetings und alte Exporte funktionieren unverändert.
- Live-Timer: Pauschale vor oder während des Laufs änderbar, es zählen die Werte beim Stoppen.
- Detail: Zeile "8 weitere Teilnehmer × 30,00 €/h" mit Kosten. Liste: Personenzahl inkl. Pauschale.
- Statistik: Die Pauschale zählt in Gesamt-, Monats- und Jahressummen, aber nicht im Meeting-Score (anonym).

## Gehaltsrechner im Personenformular (Wunsch von Moritz, 2026-10-13)
Optional neben dem Stundensatz: "Aus Jahresgehalt berechnen". Jahresbrutto eingeben,
der Stundensatz wird vorgeschlagen und bleibt von Hand änderbar. Gespeichert wird
immer nur der Stundensatz (Cent), das Gehalt wird nicht gespeichert.
- Arbeitgeberkosten ca. 61.000 / 91.000 / 119.000 € bei 50.000 / 75.000 / 100.000 € brutto,
  dazwischen linear, darunter 22 %, darüber 19 % Aufschlag (Näherung, Konstanten in `src/lib/salary.ts`).
- Stunden pro Jahr: 1.700 (produktiv, ohne Urlaub, Feiertage, Krankheit), 2.080 (40 Std x 52) oder eigene Zahl.
- Satz = Arbeitgeberkosten / Stunden, auf ganze Cent gerundet. Schalter "nur Brutto" rechnet Brutto / Stunden.
- Hinweis im Formular: "Näherungswert, inkl. ca. 20 % Arbeitgeberkosten".
- Beispiele (Tests): 1.700 Std: 35,88 / 53,53 / 70,00 €; 2.080 Std: 29,33 / 43,75 / 57,21 €.

## Look and feel
Very simple, very light, modern, banking style (Revolut, Finanzguru): big
numbers, soft cards, clear hierarchy, lots of whitespace, smooth small
animations (respect `prefers-reduced-motion`). Mobile first, great on desktop.
Light mode first, dark mode if cheap. German UI.

## Data and privacy
Everything stays in the browser, nothing is sent anywhere. JSON export/import
for backup and to move to another device. The repo may be public (code only,
no real data). Hosting later: GitHub Pages or Cloudflare Pages.

## Out of scope (for now)
Accounts and login, shared teams, backend, calendar sync, currencies other
than EUR, native app.

## Done when
Create company and people with rates, add meetings (manual and live timer),
see the big total and the newest-first list, see the per-person meeting score,
export/import data, runs smoothly on a phone, money maths covered by tests.

## Decisions (Moritz, 2026-10-13)
- Only one company, no company switcher.
- Every person has one fixed hourly rate; no per-meeting rate overrides. Guests
  are created as normal people (e.g. "Besucher").
- The timer and all durations count in **seconds** (exact), shown as h:mm:ss.
  Cost = rate x seconds / 3600, rounded to whole cents once per person per meeting.

## Open questions (ask Moritz)
Should the total be filterable by month? What happens to old meetings when a
person's rate changes (suggest: meetings keep the rate they had when saved)?
Name and domain for later.
