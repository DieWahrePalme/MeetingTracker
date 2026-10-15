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

## Bedienung bei vielen Personen (Wunsch von Moritz, 2026-10-14)
Getestet mit 50 Personen auf iPhone-Format (393 x 659).
- Drei Reiter oben wie auf einer normalen Webseite (scrollen mit der Seite weg, keine feste Leiste unten, damit sie nicht mit der Safari-Leiste kollidiert): Meetings, Personen, Daten.
  "Daten" enthält Unternehmen, Export/Import, Demo und Löschen (vorher ganz unten bei den Personen).
- Fenster (Meeting, Person): Inhalt scrollt, die Buttons stehen fest am unteren Rand und sind immer sichtbar.
- Personenauswahl im Meeting (Nachtragen, Bearbeiten, Live-Timer): bis 8 Personen als Chips, darüber Suche (ohne
  Beachtung von Groß/Kleinschreibung und Umlauten), Trefferliste, "Alle Treffer wählen", Enter wählt einen einzelnen Treffer,
  gewählte Personen stehen oben als Chips zum Entfernen, "Leeren".
- Reiter Personen: Umschalter Liste / Teams / Score, Suche, Meeting-Score zeigt zuerst die Top 10 ("Alle anzeigen").

## Wiederkehrende Meetings vorschlagen (Wunsch von Moritz, 2026-10-14)
Die App erkennt aus den gespeicherten Meetings, was regelmäßig stattfindet, und schlägt das nächste vor. Es wird nichts extra gespeichert (nur ausgeblendete Vorschläge).
- **Erkennung** (`src/lib/recurring.ts`): gleicher Titel (ohne Groß/Kleinschreibung), mindestens 3 verschiedene Tage, gleichmäßiger Abstand
  (jeder Abstand höchstens 25 %, mindestens 1 Tag, neben dem mittleren; Abstand bis 62 Tage). Unbenannte Meetings ("Meeting") zählen nie.
  Es zählen die letzten 6 Termine.
- **Anzeige:** Karte "Wiederkehrend" auf der Startseite (max. 3), z. B. "Wochenplanung · jede Woche · zuletzt am 7.10.2026 · heute fällig".
  Sichtbar ab einen Tag vor der Fälligkeit bis höchstens einen Abstand überfällig.
- **Anlegen:** Ein Tipp öffnet das Duplizieren-Formular mit Personen, Dauer, Pauschale und Titel des letzten Termins. Datum ist der Fälligkeitstag (bei überfällig) oder heute.
- **Ausblenden:** Blendet den Vorschlag für diesen Termin aus (`hiddenSuggestions: ["titel|tag"]`, optional). Beim nächsten Termin der Serie erscheint wieder ein Vorschlag.

## Teams, Archiv, Duplizieren, Suche (Wunsch von Moritz, 2026-10-14)
- **Teams:** Im Reiter Personen gibt es den Umschalter "Teams". Ein Team hat einen Namen und Mitglieder. In der Meeting-Auswahl
  (Nachtragen, Bearbeiten, Live) wählt ein Tipp auf den Team-Chip alle Mitglieder, ein zweiter Tipp wählt sie wieder ab.
  Archivierte oder gelöschte Mitglieder werden dabei übersprungen. Daten: `teams: [{ id, name, personIds }]` (optional, alte Dateien ohne Teams funktionieren).
- **Zuletzt genutzt zuerst:** In der Auswahl stehen Personen nach letzter Teilnahme oben, der Rest alphabetisch (aus den Meetings abgeleitet, nichts Zusätzliches gespeichert).
- **Archiv:** Person mit Haken "Archiviert" erscheint nicht mehr in der Auswahl, bleibt aber in alten Meetings und im Meeting-Score.
  In der Personenliste stehen archivierte Personen eingeklappt unter "Archiv anzeigen". Daten: `archived?: boolean`.
- **Meeting duplizieren:** Im Meeting-Detail "Duplizieren": Formular mit gleichen Personen, Dauer, Pauschale und Titel, Datum heute, ohne Bewertung. Sätze werden neu aus den aktuellen Personen genommen.
- **Suche in der Meeting-Liste:** Suchfeld (ab 6 Meetings) nach Titel oder Personenname, kombinierbar mit Zeitraum, Bewertung und Sortierung.
- Kein CSV-Import (Moritz braucht ihn nicht).

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

## Anzeige Kosten oder Zeit, aufgeräumte Startseite (Wunsch von Moritz, 2026-10-14)
- **Icon-Schalter € | Uhr** oben rechts auf der Startseite, wie der Hell/Dunkel-Schalter (merkt sich die Wahl auf dem Gerät, `localStorage` `meetingtracker.metric`).
  Kosten = Stundenlohn × Zeit (wie bisher, in Euro). Zeit = Dauer × Teilnehmer, also 1 Std. mit 10 Personen = 10 Std.
  Teilnehmer = benannte Personen + Pauschale. Anzeige als Std:Min:Sek wie `200:45:12` (200 Std., 45 Min., 12 Sek.), ohne Tausenderpunkt.
  Die große Zahl schrumpft automatisch, wenn sie länger wird als etwa `5.000,60 €` (gilt auch für große Kosten), damit sie immer in eine Zeile passt.
- Der Umschalter gilt für: Gesamtzahl oben, Wert je Meeting in der Liste (und der Balken), "Davon in schlechten Meetings", Aufteilung nach Bewertung, Ergebniszeile bei Filtern und die Sortierung ("Teuerste" bei Kosten, "Längste" bei Zeit). Das Meeting-Detail zeigt beides: Kosten groß, darunter "40 Personen · Gesamtzeit 60:00:00".
- **Suche mit Filter-Symbol:** Suchfeld und daneben ein Filter-Symbol (mit Zähler für aktive Filter). Es klappt Jahr/Monat/Tag, Bewertung und Sortierung auf. Bei aktiven Filtern steht darunter eine schlanke Zeile mit dem Ergebnis und "Zurücksetzen".
- "Meeting starten" und "Nachtragen" stehen nebeneinander, die Bewertungs-Karte ist kompakter (Wert, Balken, eine Legendenzeile).

## Design: Kassenbon (2026-10-14, von Moritz gewählt)
Die Vorschau mit drei Looks ist entschieden und entfernt, Kassenbon ist der einzige Look (hell und dunkel nach Geräteeinstellung).
- **Farben:** Papier `#F4F1EA` / dunkel `#0E0D0C`, Tinte `#14110F`. **Orange `#FF5B14` = Geld, Blau `#2B4BFF` = Zeit** (der Kosten/Zeit-Schalter setzt `data-metric` am `html`-Element und wechselt den Akzent). Bewertung: Grün, Grau, Rot.
- **Formen:** Tintenlinien um Buttons und Umschalter, kleiner harter Schatten an Buttons, gepunktete Bon-Linien in Listen, Beträge im Detail in Monospace, große Zahlen in Space Grotesk (SIL OFL, über `@fontsource` ausgeliefert, keine Fremdserver). Der gewählte Umschalter ist in Hell dunkel mit heller Schrift und in Dunkel hell mit dunkler Schrift.
- **Kontraste** (gerechnet, Soll 4,5:1 für Text): alle Paare in Hell und Dunkel bestehen, z. B. Schrift auf Orange-Button 6,1:1 (hell) / 7,3:1 (dunkel), Akzentschrift auf Karte 5,6:1 / 8,4:1, grauer Text auf Karte 6,2:1 / 6,4:1.
- **Modus sofort erkennbar:** Die große Zahl und ihre Beschriftung, die Werte in der Liste, Button, Reiter-Unterstreichung und Schalter-Knopf tragen die Modusfarbe (Orange Geld, Blau Zeit, Wechsel weich). Im Schalter zeigt jedes Symbol schon vorab seine Farbe (€ orange, Uhr blau). Kontraste gerechnet: große Zahl hell 3,8:1 / 5,2:1, dunkel 7,5:1 / 8,1:1 (Soll 3:1), kleine Werte mindestens 5,1:1.
- **Zahlen zählen hoch** (`CountUp`): beim Laden, beim Umschalten Kosten/Zeit (von 0) und bei geänderten Werten (vom alten Wert). Bei "Bewegung reduzieren" erscheinen sie sofort.
- **Weitere Bewegung:** Daumen "poppt" beim Bewerten, Listeneinträge schweben ein, Bon wird von oben ausgedruckt, dann fällt der Stempel. Alles aus bei "Bewegung reduzieren".
- **Live-Meeting:** "Stoppen" steht neben der Zeit, "Verwerfen" ist ein Mülleimer-Symbol oben rechts (mit Rückfrage).
- **Meeting-Bon** nach dem Stoppen eines Live-Meetings: Nr., Titel, Datum, Beginn, Ende, Dauer, Personen, Gesamtzeit, Bewertung, SUMME (zählt hoch), Barcode, Stempel "GESTOPPT" mit Uhrzeit. Bon-Papier ist in beiden Modi hell (Thermopapier). Beim Nachtragen gibt es keinen Bon.

## Gestaltung nach Apples HIG (2026-10-14, nach Screenshots von Moritz)
Rein visuell, keine Logik. Getestet auf iPhone-Format mit 50 Personen, hell und dunkel.
- Grundgröße 17 px (iOS), alle Größen in rem, Kontraste geprüft (Text auf Fläche mindestens 4,5:1).
- Listen als gruppierte Fläche mit feinen Trennlinien statt einzelner schwebender Karten (Meetings, Personen, Score, Detail).
- Buttons als Kapseln mit klaren Rollen: Hauptaktion gefüllt, zweite Aktion grau, Löschen rot getönt (nie als Hauptbutton). Druckzustand überall.
- Umschalter (Segmente) immer volle Breite und gleich breit. Chips-Reihen scrollen waagerecht statt umzubrechen.
- Fenster (Sheets): Griff, Titel, Schließen oben (X), Buttons fest unten, Seite dahinter ist gesperrt (kein Durchscrollen).
- Startseite: Gesamtkosten, dann "Meeting starten" und "Meeting nachtragen" zusammen, Bewertungs-Aufteilung, Suche, Filter eingeklappt (Zähler "n aktiv"), Sortierung, Liste.
- Reiter oben als Textreiter mit Unterstreichung. `theme-color` für hell und dunkel.
- Tastatur (iPhone): Tastaturmodus gilt nur, solange ein Textfeld im Fenster aktiv ist (so kann ein veralteter Wert von Safari nichts verstellen). Dann richtet sich das Fenster nach dem sichtbaren Bereich (`visualViewport`, alle 300 ms geprüft) und wird kompakt: kleiner Kopf, Buttons unten ausgeblendet bis "Fertig", gewählte Personen als eine wischbare Reihe, Suche ganz oben. Ohne aktives Textfeld ist das Fenster immer voll hoch.
  Tastatur schließen: "Fertig" neben der Personensuche, Enter, oder im Fenster wischen (nicht in der Trefferliste). Beim Antippen von Personen, Teams, "Alle wählen" und "Leeren" bleibt der Cursor im Suchfeld, damit man schnell mehrere hintereinander wählen kann (gilt für Meeting und Team).
- Fenster bewegen sich nie seitlich: Gitter mit `minmax(0, 1fr)`, Felder mit `min-width: 0`, `overflow-x: hidden`, `touch-action: pan-y`.
- Meeting-Formular minimal: Titel, Datum und Dauer als schlanke Zeilen wie in iOS-Einstellungen, Teilnehmer, und "Pauschale und Bewertung" eingeklappt (zeigt eine Zusammenfassung, öffnet sich von selbst bei vorhandener Pauschale oder Bewertung).
- Texte: Verben auf Buttons, kurze Hinweise, "Std." bei Zeiten, Reiter "Score" statt "Meeting-Score" (passt in den Umschalter).

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

## Bon exportieren (2026-10-15)
- Im Bon-Fenster (nach dem Stoppen und aus dem Meeting-Detail über das Teilen-Symbol): großer Knopf **Teilen** (Teilen-Menü des Geräts, am PC Download). Das Drucker-Symbol im Detail öffnet den Bon.
- Das Bild (PNG) wird im Browser selbst gezeichnet (Canvas), nichts verlässt das Gerät. Bon-Nr. = Platz in der zeitlichen Reihenfolge.

## Spaß-Modus (2026-10-15)
- Dritte Stellung im Schalter neben Kosten und Zeit (Smiley, Farbe Pink). Rechnet Kosten in Spaß-Einheiten um: Kaffee 3,50 €, Döner 8,50 €, Pizza 11 €, Hochregal 1.200 €, Maybach 300.000 € (Inside-Joke, Preise in `src/lib/fun.ts`).
- Standard ist "Automatisch" (größte passende Einheit, unter einem Döner Kaffee). Andere Einheit: langer Druck oder Tipp auf den aktiven Smiley öffnet ein Menü. Die Wahl bleibt im Browser.
- Der Bon zeigt unter der Summe "Das sind X Döner."
