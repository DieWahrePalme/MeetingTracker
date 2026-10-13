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
