# CTFtime Points Calculator

A lightweight Next.js app to calculate your team’s CTFtime rating immediately after a CTF ends. It lets you:
- Compute an event’s rating using the standard formula with your numbers.
- Aggregate a team’s top-N event results and include organizer (hosted) points automatically.
- Do this right away, without waiting for CTFtime to publish/roll points.

Main application directory: `web/`

> Note: There’s some legacy Python/Flask code in the root, but the production app is the Next.js app inside `web/`.

---

## Why this exists
CTFtime updates and allocations can take a while after an event. This tool helps teams validate their expected ratings instantly for precision planning and bragging rights.

- You can calculate your event rating with the raw numbers you know as soon as results are out.
- You can estimate your team’s overall points by combining your best finishes and organizer points for the season.

---

## Features
- Event rating calculator with the exact formula:
  - result = (team_points / best_points + 1 / team_place) × weight
- Team totals (Top-N) scraped from CTFtime team page.
- Organizer points fetched directly from CTFtime team API and included as a separate “hosted/organizer” row.
- Links to events when available; totals update when you change N.

Data sources:
- Event weight page: https://ctftime.org/event/<id>/ (fallback for weight scraping)
- Team results page: https://ctftime.org/team/<team_id>/ (for placing/results)
- Team API (organizer points): https://ctftime.org/api/v1/teams/<team_id>/

---

## Quick start (local)
Requires Node.js 20+.

Windows PowerShell:
```powershell
cd web
npm install
npm run dev
```
Then open http://localhost:3000.

---

## How to use

### 1) Event rating (single event)
- Go to “Event Rating”.
- Enter:
  - Your team points (from event scoreboard)
  - Best team points (1st place points)
  - Your team position (1 for 1st, 2 for 2nd, …)
  - Event weight
- The app calculates with six decimal precision:
  - result = (team_points / best_points + 1 / team_place) × weight

### 2) Team total (Top-N)
- Go to “Team Total Points”.
- Enter your CTFtime Team ID and choose N (use 10 for official total).
- If you check “Include organizer points”, the app fetches the current season’s organizer_points from the CTFtime Team API and injects them into your results automatically. The hosted/organizer row is marked and counted in the total.

---

## API overview (server routes)
These routes live under `web/app/api/*` and are deployed with the app.

- GET `/api/event?id=<event_id>`
  - Returns `{ weight }` by scraping the event page.

- POST `/api/calc-event`
  - Body: `{ team_points, best_points, team_place, weight }`
  - Returns: `{ result, points_coef, place_coef }`
  - Formula: `(team_points/best_points + 1/team_place) * weight`

- GET `/api/team?team_id=<id>`
  - Pass-through to CTFtime Team API (with a friendly UA header). Returns `{ team: ... }`.

- POST `/api/team-events`
  - Body: `{ team_id, top_n, include_hosted, hosted_points?, year? }`
  - Behavior:
    - Scrapes the team’s event results and sorts by rating points.
    - If `include_hosted` is true:
      - Prefer `hosted_points` (direct number). Otherwise, fetch organizer_points from the CTFtime Team API for `year` (defaults to current).
      - Injects a hosted/organizer row into the events list and re-sorts.
    - Returns: `{ events, top, total, hosted_points, year }`.
  - Backward compatibility: If you also provide `event_id/hosted_event_id` (older flow), it may approximate hosted points as `weight * 2`.

---

## Project structure
```
. 
├─ README.md                # You are here
├─ web/                     # Main Next.js app (Next 14 / React 18 / TS)
│  ├─ app/
│  │  ├─ event/             # Event rating page
│  │  ├─ team/              # Team totals page
│  │  └─ api/               # Next.js server routes
│  ├─ public/
│  ├─ package.json
│  └─ tsconfig.json
└─ (legacy files)           # Python/Flask remnants not used by the Next.js app
```

---

## Deployment

https://www.ctfpoints-calculator.me/

---

## Notes & caveats
- This project is not affiliated with CTFtime. Respect their rate limits and robots.txt. A simple UA is set in requests.
- Event weights and team results come from public pages that may change. If parsing breaks, update the selectors/regex.
- Organizer points are read from the team API per season. If you want historical seasons, pass `year` to `/api/team-events` or we can add a year selector to the UI.

---
