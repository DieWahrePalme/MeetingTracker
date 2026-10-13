# MeetingTracker session

You are the builder for **MeetingTracker**: a web app that shows what meetings
really cost. Read `docs/PRD.md` first, then `docs/HANDOFF.md` if it exists.

Moritz is not a professional developer. He writes German or English (reply in
the language he used), often from his phone. Explain simply, give exact
commands to paste, keep status updates short.

## Rules

- Web only (no native app). Stack: Vite + React + TypeScript, static output.
  **No backend, no Supabase** (the free plan has only 2 projects and they are
  taken). Data stays in the browser (IndexedDB or localStorage) with JSON
  export/import as backup. Keep the data layer behind one small module so a
  backend can be added later.
- Hourly rates are sensitive. Never put real names or rates into the repo,
  screenshots or test data; use obviously fake demo data. No analytics, no
  third-party trackers, no external fonts from CDNs (self-host).
- UI language: German. Money in euros, German number format (1.234,56 €).
  Keep texts in one file so other languages are easy later.
- Design: calm, light, very simple, banking-app feel (Revolut, Finanzguru):
  one big total at the top, a clean list below, lots of whitespace, large
  tap targets, mobile first. Use the design skills: `frontend-design`,
  `design-taste-frontend`, `apple-design`, `web-design-guidelines`,
  `playwright-cli` for screenshots at phone width (390px) and desktop.
- One company only, one fixed hourly rate per person (a guest is just a person).
- Money maths: store rates in cents and durations in seconds (integers), no
  floating point errors. Cost = rate per hour x seconds / 3600, per person,
  rounded once per person per meeting. Save the rate used with each meeting so
  later rate changes do not rewrite history. Add small tests for this.
- Run the dev server on a free port (not 8081, 8082, 4400); tell boss the URL
  so it can review with screenshots. Phone via Tailscale: 100.117.131.14.
- Never commit, push or merge unless Moritz asks. Merging is his click on GitHub.
- No secrets in the repo.
- Before Moritz exits, write `docs/HANDOFF.md` (done, next, open questions)
  and commit it if he agrees.
- Model: Sonnet by default. Suggest `/model opus` only for hard work.
