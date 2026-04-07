# SiteSense MVP

SiteSense is a production-style proptech MVP focused on **Chicago land intelligence**, modular/affordable development underwriting, and portfolio-style deal analysis.

## Major upgrade set

This build now includes a full **frontend-only intelligence workstation** with 50 requested UX/analysis upgrades:

- Scenario presets (Conservative, Aggressive, Section 8, Value Add, Premium Rental)
- Editable DealScore weights and strategy personas
- Multi-axis sensitivity controls (rent, cost, exit, vacancy)
- Exit strategy + financing toggles (loan %, rate, term, IO)
- Risk analysis card (cost/rent/timeline/neighborhood/exit)
- Confidence meter + Why-Not-Build section
- Unit mix templates (2/3/4/6 unit, townhome, small mixed-use)
- Timeline carrying costs + break-even outputs
- Top deals, search, sort controls, filter presets, saved custom views
- Scenario duplicate support + scenario labels
- Structured notes, tags, pipeline status, recommendation history
- Local activity feed, guided review checklist, printable summary mode
- Score explanation drawer, smart warning banners, neighborhood summary cards
- Pitch mode investor summary, profit waterfall chart, improved CSV/PDF export screen flow
- Phase 1 add-ons: One-Glance IC Memo, scenario tabs (Base/Bank/Stretch/Stress), delta chips, diligence completeness, and prioritized warning severities

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Recharts
- react-map-gl (Mapbox)
- Papaparse

## Local run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Optional map setup

1. Copy `.env.example` to `.env`
2. Set `VITE_MAPBOX_TOKEN`
3. Restart `npm run dev`

Without a token, the map panel falls back to a branded placeholder while app logic still works.

## Notes

- No backend/API calls were introduced.
- State is persisted in `localStorage` for dashboard/user workflow continuity.
