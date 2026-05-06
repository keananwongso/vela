# Vela

Vela is a small dashboard prototype for palm oil procurement planning in Riau, Indonesia.

It shows:

- district crop health and dispatch status
- weekly recommendations by district
- CPO price trends
- basic workspace and team settings

The app is built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

## Running locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The root route redirects to `/overview`.

## Backend setup

Create and activate a virtual environment, copy `.env.example` to `.env`, then install the Python backend dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
cp .env.example .env
python3 -m pip install -r backend/requirements.txt
```

Seed the canonical regions and start the FastAPI server:

```bash
python3 -m backend.seed_regions
python3 -m uvicorn backend.main:app --reload
```

Optional: seed the broader demo dataset for the dashboard prototype:

```bash
python3 -m backend.seed
```

The frontend reads from `NEXT_PUBLIC_API_BASE_URL` and falls back to local mock data if the API is unavailable. The n8n pipeline should POST to `https://<render-or-railway-service>/api/ingest` once the Python backend is deployed.

## Available scripts

```bash
npm run dev
npm run build
npm run start
```

## Pages

- `/overview` shows the main procurement dashboard with KPIs, the Riau map, recommendation cards, and the price chart
- `/districts` shows a sortable table for district-level crop and dispatch data
- `/prices` shows CPO price history and trend signals
- `/settings` shows sample workspace preferences and team access

## Project structure

```text
app/
  (dashboard)/
    overview/
    districts/
    prices/
    settings/
components/
lib/
```

- `app/` contains the routes and layouts
- `components/` contains the sidebar, map, chart, cards, and status UI
- `lib/data.ts` contains the mock district, map, mill, user, and price data

## Notes

- This project includes a FastAPI backend for MongoDB Atlas reads and n8n ingestion
- The Riau map uses a committed, Riau-only subset of geoBoundaries `gbOpen` Indonesia ADM2 simplified GeoJSON, derived from BPS/WFP/OCHA boundary data under the license reported by the geoBoundaries metadata endpoint
- `vercel.json` is included for deployment on Vercel
- `INTEGRATION_SPEC.md` defines the MongoDB, n8n, and FastAPI contract for the next integration phase
