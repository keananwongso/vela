# Vela Integration Spec

This document defines the integration contract between the data pipeline, MongoDB, FastAPI, and the Next.js dashboard.

## Ownership

- Keanan: MongoDB schema, FastAPI, dashboard consumption
- Ali: n8n ingestion, transforms, LLM synthesis, Mongo writes

## Canonical Region IDs

Use these exact IDs everywhere:

```json
[
  { "id": "kampar", "name": "Kampar" },
  { "id": "pelalawan", "name": "Pelalawan" },
  { "id": "inhu", "name": "Indragiri Hulu" },
  { "id": "rohil", "name": "Rokan Hilir" },
  { "id": "siak", "name": "Siak" }
]
```

Rules:

- Never write `IndragiriHulu`, `indragiri_hulu`, `rokan-hilir`, or other variants.
- `region_id` must match one of the IDs above exactly.

## Timestamp Rule

All timestamps must be ISO 8601 UTC.

Example:

```json
"2026-05-04T10:00:00Z"
```

## MongoDB Collections

Required collections:

- `regions`
- `ndvi_readings`
- `weather_forecasts`
- `price_data`
- `recommendations`

## Document Shapes

`regions`

```json
{
  "id": "kampar",
  "name": "Kampar",
  "province": "Riau",
  "crop_type": "palm_oil"
}
```

`ndvi_readings`

```json
{
  "region_id": "kampar",
  "timestamp": "2026-05-04T10:00:00Z",
  "ndvi": 0.74,
  "source": "sentinel_hub",
  "run_id": "vela-w18-2026-05-04"
}
```

`weather_forecasts`

```json
{
  "region_id": "kampar",
  "timestamp": "2026-05-04T10:00:00Z",
  "rainfall_probability": 0.22,
  "temperature_min": 24,
  "temperature_max": 31,
  "wind_condition": "light",
  "source": "bmkg_wrapper",
  "run_id": "vela-w18-2026-05-04"
}
```

`price_data`

```json
{
  "province": "Riau",
  "timestamp": "2026-05-04T10:00:00Z",
  "commodity": "cpo",
  "price": 12400,
  "unit": "IDR/kg",
  "source": "badan_pangan",
  "run_id": "vela-w18-2026-05-04"
}
```

`recommendations`

```json
{
  "region_id": "kampar",
  "generated_at": "2026-05-04T10:00:00Z",
  "crop_health": "good",
  "action": "Dispatch now",
  "price_signal": "CPO above 4-week average; maintain aggressive procurement",
  "confidence": 0.82,
  "source": "openai",
  "prompt_version": "v1",
  "run_id": "vela-w18-2026-05-04"
}
```

## LLM Output Contract

The n8n flow should force JSON-only output.

Required shape:

```json
{
  "region_id": "kampar",
  "crop_health": "good",
  "action": "Dispatch now",
  "price_signal": "CPO above 4-week average; maintain aggressive procurement",
  "confidence": 0.82
}
```

Allowed values:

- `crop_health`: `good` | `moderate` | `at_risk`
- `confidence`: decimal from `0` to `1`

## n8n Workflow Rules

- One run should generate one `run_id`, reused across all inserted documents.
- Use upsert logic where possible.
- Do not mix raw source fields into `recommendations`.
- If one source fails, log the failure and either skip that region or mark the run partial.
- Do not silently write malformed records.

## FastAPI Read Contract

The backend will expose:

- `GET /regions`
- `GET /regions/{id}/latest`
- `GET /regions/{id}/history`
- `GET /prices/cpo`

The pipeline only needs to match the Mongo schema above. FastAPI will handle response shaping for the dashboard.

## MongoDB Indexes

Create these indexes:

- `regions.id` unique
- `ndvi_readings`: `{ region_id: 1, timestamp: -1 }`
- `weather_forecasts`: `{ region_id: 1, timestamp: -1 }`
- `price_data`: `{ province: 1, commodity: 1, timestamp: -1 }`
- `recommendations`: `{ region_id: 1, generated_at: -1 }`

## Minimum Acceptance Test

Before full automation:

1. n8n writes one sample record into each collection.
2. Each record has correct `region_id`, timestamp, and `run_id`.
3. FastAPI can read those records successfully.

## Failure Modes To Avoid

- inconsistent `region_id`
- non-JSON LLM output
- local time instead of UTC
- duplicate writes on rerun
- scraped price data without `source` or timestamp
- changing field names mid-build
