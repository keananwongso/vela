# Vela

Vela, Latin for "sails", is a procurement intelligence system for palm oil mills in Riau, Indonesia. A sail does not create the wind; it turns existing forces into direction. Vela does the same with public data, turning crop-health signals, weather context, and commodity prices into district-level truck dispatch decisions.

## The problem

Palm oil mills need to make one high-stakes decision every week:

> which districts should we prioritize for FFB pickup right now?

The harvest window is short. Dispatch too early and fruit is underripe. Dispatch too late and quality drops, loose fruit falls, FFA rises, and rain can block road access entirely. Every missed window affects both procurement cost and mill revenue.

Three public datasets matter here:

- satellite NDVI trends
- BMKG weather forecasts
- CPO / FFB prices

Each one is useful, but only in combination. Vela is the synthesis layer that turns them into one operational recommendation.

## Who it's for

Primary users:

- palm oil mill procurement heads
- mill managers
- operations teams running truck dispatch decisions

Riau is a strong starting point because it represents a major share of Indonesia's palm oil output, and collection timing decisions happen every cycle.

## What Vela does

Vela gives the procurement team:

- a district-level weekly dispatch view
- a live CPO price view
- a Riau map with recommendation status
- a plain-language detail panel for why a district is marked send, wait, or avoid

The current dashboard supports two modes:

- `Simple`: grouped decisions for operators
- `Terminal`: denser diagnostic view

## How it works

At a high level:

1. n8n pulls NDVI, weather, and price inputs
2. an LLM synthesizes one recommendation per district
3. results are written to MongoDB Atlas
4. FastAPI serves the latest district and price data
5. the Next.js dashboard displays the live procurement snapshot

## Current prototype scope

The prototype currently focuses on five canonical Riau districts:

- `kampar`
- `pelalawan`
- `inhu`
- `rohil`
- `siak`

Current dashboard tabs:

- `/overview`
- `/prices`
- `/settings`

`/districts` currently redirects to `/overview`.

## Tech stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Backend: FastAPI
- Database: MongoDB Atlas
- Pipeline: n8n
- Frontend hosting: Vercel
- Backend hosting: Render

## Running locally

### Frontend

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 -m uvicorn backend.main:app --reload
```

The frontend reads `NEXT_PUBLIC_API_BASE_URL` and defaults to `http://127.0.0.1:8000` locally.

### Seed demo data

Seed canonical regions only:

```bash
python3 -m backend.seed_regions
```

Seed the broader demo dataset:

```bash
python3 -m backend.seed
```

## Project structure

```text
app/          Next.js routes and layouts
components/   dashboard UI pieces
lib/          frontend data shaping, types, map data, mock fallback data
backend/      FastAPI app, Mongo helpers, schemas, seed scripts
```

## Deeper docs

- [INTEGRATION_SPEC.md](./INTEGRATION_SPEC.md): MongoDB, n8n, and FastAPI contract
- [CLAUDE.md](./CLAUDE.md): broader project context, product framing, and submission notes
- [render.yaml](./render.yaml): backend Render service definition
- [vercel.json](./vercel.json): frontend Vercel config