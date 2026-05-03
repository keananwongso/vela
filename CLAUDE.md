@AGENTS.md
a# CLAUDE.md — Vela

This file gives you full context on the Vela project. Read it before touching any code.

---

## What is Vela

Vela is an enterprise procurement intelligence dashboard for palm oil mill managers in Riau, Indonesia. It turns three free, public datasets into one weekly procurement decision per district — fully automated, no hardware, no data entry required.

**One-line pitch:** Helping palm oil mills in Riau decide when to dispatch collection trucks before rain disrupts FFB supply from smallholder farms.

**The sail metaphor:** A sail does not create the wind. It turns what already exists into direction. Vela did not build the satellites or the weather stations. It built the synthesis layer.

---

## The Problem

Palm oil mills in Riau need to make one critical decision every week: when to dispatch collection trucks to collect Fresh Fruit Bunches (FFB) from smallholder farms.

The optimal harvest window for FFB is only 2 to 4 days. Miss it early and you collect underripe fruit — lower oil grade, mill deducts price at the gate. Miss it late and loose fruit falls to the ground, FFA spikes, quality collapses. Rain blocking road access makes a late window even worse.

Three public datasets together define the optimal dispatch window:
1. Satellite NDVI trends — crop health and when the loose-fruit threshold will be crossed
2. BMKG weather forecasts — will trucks reach farms within the window?
3. CPO/FFB prices from Badan Pangan Nasional — does the price justify buying aggressively this week?

Each dataset alone is useless. Nobody has automated the synthesis layer. That is the gap Vela fills.

---

## Who It Is For

**Primary buyer:** Palm oil mill procurement heads and mill managers in Riau province.

Riau produces ~23% of Indonesia's total palm oil output — one province, over $10B in annual supply chain value. These buyers currently rely on phone calls to field officers and gut feel.

**Secondary beneficiary:** 2.6M smallholder farmers. When the mill has better data, it needs fewer middlemen. Farmers get fairer prices as a downstream consequence.

**Expansion path:** Same pipeline reads rice in Central Java with a config change. B2B first, province by province, then commodity by commodity.

---

## System Architecture

```
Weekly cron (n8n)
    |
    |-- Agromonitoring / Sentinel Hub  →  NDVI score per kecamatan
    |-- BMKG community REST wrapper    →  3-day weather forecast per kelurahan
    |-- Badan Pangan (HTML scrape)     →  CPO/FFB prices by province
    |
    └── LLM synthesis (OpenAI / Claude API)
            |
            └── JSON output per district:
                  - crop_health: good | moderate | at_risk
                  - action: "Dispatch now" | "Hold this week" | "Prioritize Kampar instead"
                  - price_signal: string
            |
            └── MongoDB Atlas (free M0)
                    Collections: regions, ndvi_readings, weather_forecasts, price_data, recommendations
            |
            └── FastAPI
                    GET /regions
                    GET /regions/{id}/latest
                    GET /regions/{id}/history
                    GET /prices/{commodity}
            |
            └── Next.js 16.2 dashboard (Vercel)
```

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend framework | Next.js 16.2 + TypeScript + Tailwind CSS |
| UI components | shadcn/ui |
| Charts | Recharts |
| Map | react-simple-maps (GeoJSON for Riau kecamatan) |
| Frontend hosting | Vercel (free tier) |
| Agent pipeline | n8n (weekly cron) |
| AI model | OpenAI API or Claude API |
| Database | MongoDB Atlas (free M0 cluster) |
| API layer | FastAPI (Python) |
| Backend hosting | Railway or Render (free tier) |

---

## Frontend Structure

```
/app
  /overview        — main landing view (map + cards + chart)
  /districts       — table view of all districts
  /prices          — expanded CPO price chart
  /settings        — region selector, refresh info

/components
  sidebar.tsx      — dark nav sidebar
  overview.tsx     — KPI cards + map + recommendation cards + chart
  riau-map.tsx     — react-simple-maps choropleth
  cards.tsx        — horizontal scroll recommendation cards
  chart.tsx        — Recharts CPO line chart
  districts.tsx    — sortable district table
  prices.tsx       — expanded price view
  settings.tsx     — minimal placeholder

/data
  data.ts          — all mocked data as typed constants (swap for API later)
```

---

## Design System

**Color role rule:** `brand` is for UI actions only. `healthy` is for data signals only. Do not use `healthy` decoratively.

| Token | Value | Usage |
|---|---|---|
| Ink | `#0F1A1F` | Primary text, dark sidebar background, tooltip background |
| Brand | `#1A5C3A` | UI actions only: primary buttons, active nav, logo, CTAs |
| Canvas | `#F5F3EE` | Warm off-white main content area |
| Healthy | `#4A7A5A` | Data signals only: healthy status, positive deltas, map districts, chart series |
| Monitor | `#C68A0E` | Moderate/monitor status |
| At risk red | `#C0392B` | At risk status |
| Card surface | `#FFFFFF` | Card backgrounds |
| Border | `#E2DDD6` | All borders and dividers |
| Muted | `#6B7A72` | Labels, metadata, secondary copy |

**Typography:**
- Display headers (`Procurement overview`, section titles): `Instrument Serif`
- Body and UI text (nav, labels, card body): `Inter`
- All numeric data values (prices, percentages, tonnage): `JetBrains Mono`

---

## Mocked Data (use until API is ready)

**5 districts:**

| District | Status | NDVI | Moisture | FFA | Yield | Trucks | Action |
|---|---|---|---|---|---|---|---|
| Kampar | healthy | 0.74 | 21% | 2.1% | 4.2 t/ha | 6 | Dispatch now — peak yield window |
| Pelalawan | monitor | 0.61 | 28% | 2.8% | 3.4 t/ha | 2 | Hold this week — moisture rising |
| Indragiri Hulu | at_risk | 0.43 | 34% | 3.6% | 2.1 t/ha | 0 | Prioritize Kampar instead |
| Rokan Hilir | healthy | 0.71 | 22% | 2.2% | 4.0 t/ha | 5 | Dispatch now |
| Siak | healthy | 0.69 | 23% | 2.3% | 3.9 t/ha | 4 | Dispatch now |

**CPO price data:**

- Current spot: 12,400 IDR/kg (Dumai port)
- 4-week average: 12,285 IDR/kg
- Signal: favorable (current is above 4-week average)
- WoW change: +70 IDR/kg (+0.6%)

**8-week CPO history:**

| Week | Price (IDR/kg) |
|---|---|
| Mar 03 | 11,820 |
| Mar 10 | 11,950 |
| Mar 17 | 12,080 |
| Mar 24 | 12,010 |
| Mar 31 | 12,130 |
| Apr 07 | 12,270 |
| Apr 14 | 12,310 |
| Apr 21 | 12,400 |

**KPI cards (overview header):**
- Districts Ready: 3 of 5 (+1 vs last week)
- Forecast Intake: 2,840 tonnes FFB (+6.2% WoW)
- CPO Spot Dumai: 12,400 IDR/kg (+0.6% favorable)
- Fleet Utilization: 78% (stable)

**Mill context:**
- Mill name: PT Sawit Riau
- User: Budi Santoso, Procurement lead
- Fleet count: 14 trucks

---

## Team Split

| Keanan | Ali |
|---|---|
| Architecture diagram | n8n pipeline build |
| Pitch deck | MongoDB Atlas setup |
| Demo video | FastAPI endpoints |
| Dashboard (Next.js frontend) | Data ingestion from all 3 sources |
| Product framing and narrative | LLM prompt engineering |

**Integration contract:** Keanan's frontend calls Ali's FastAPI. The API shape is the single agreed contract. Frontend mocks data locally until Ali's endpoints are live, then swaps in the real URLs.

---

## Competition Context

**Competition:** Code the Future: AI for a Better Indonesia
**Organizers:** GenDigital Academy x Skystar Capital x Hacktiv8
**Track:** University
**Deadline:** 9 May 2026

**Required submission deliverables:**
1. Functional prototype (this dashboard)
2. 5-minute pitch and demo video
3. Pitch deck (separate file)
4. Architecture diagram screenshot
5. System prompt used in LLM node
6. Integration proof (screenshot of successful API call writing to MongoDB)
7. Tool list

**Scoring rubric:**
- Technical Execution and Integration: 25%
- Problem Statement and Target Users: 25%
- Impact and Usefulness: 20%
- Presentation Quality and Scalability: 20%
- User Experience and Design: 10%

---

## Important Rules for Claude Code

- All data lives in `data.ts` as typed constants. No API calls yet.
- Use `JetBrains Mono` for every number on screen without exception.
- No lorem ipsum or placeholder text anywhere visible in the app.
- All four tabs must be fully navigable with no blank screens.
- Use `brand` (`#1A5C3A`) for UI actions only: buttons, active nav, logo, CTAs.
- Use `healthy` (`#4A7A5A`) for data signals only: badges, map districts, positive deltas, chart data. Never decorative.
- The CPO chart fill area should be very subtle and derived from `healthy`.
- The map must use real Riau GeoJSON boundaries, not abstract polygons.
- The app must be Vercel-ready with no build errors.
