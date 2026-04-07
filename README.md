# SiteSense MVP

SiteSense is a production-style proptech MVP focused on **Chicago land intelligence**, modular/affordable development underwriting, and portfolio-style deal analysis.

## What is included

- SignalMap™ dashboard with Chicago-centered mapping, Smart Filters, and HotZones™ overlays.
- Scenario Presets, Unit Mix Templates, Exit Strategy toggle, Cash-vs-Financing toggle, and timeline carrying costs.
- Editable DealScore™ weights + strategy personas for custom investment logic.
- Sensitivity slider (rent/cost stress test), confidence meter, and separate risk score.
- “Why NOT build here?” counter-case, auto strategy label, deal story generator, and pro next-step guidance.
- Deal Pitch Mode with investor-friendly big-number snapshot.
- DealVault™ saved opportunities with favorites, structured notes, tags, and duplicate deal support.
- Recently viewed list and Top 5 deal highlights.
- ReturnLens™ ROI summary with cost-vs-value chart.
- CSV export for selected deal and clean PDF export stub.
- Mock dataset with 24 Chicago land opportunities + neighborhood strategic metadata.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Recharts
- react-map-gl (Mapbox)
- Papaparse for CSV export

## Local run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Optional map setup

To enable live Mapbox tiles:

1. Copy `.env.example` to `.env`
2. Set `VITE_MAPBOX_TOKEN`
3. Restart `npm run dev`

Without a token, SignalMap™ shows a branded fallback canvas while all filtering/scoring logic still works.

## Suggested real data integrations (next step)

- **Chicago City-Owned Lots / land inventory**: Chicago Data Portal (Socrata API)
- **Cook County parcel and ownership**: Cook County Assessor / Recorder data feeds
- **Zoning and land use**: Chicago zoning datasets + zoning map APIs
- **Rents / demand**: HUD fair market rent + private comps APIs (Rentometer, CoStar, MLS feeds)
- **Transit access**: CTA GTFS/station feeds or Google Places transit matrices
- **Construction costs**: RSMeans or internal GC bid database

## Folder structure

```text
src/
  components/
    ComparisonView.tsx
    DashboardView.tsx
    DealContext.tsx
    SavedDealsView.tsx
  data/
    sites.ts
  lib/
    finance.ts
    store.ts
    types.ts
  App.tsx
  main.tsx
  styles.css
```
