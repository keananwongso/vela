from __future__ import annotations

RUN_ID = "vela-seed-2026-05-04"

REGION_ORDER = ["kampar", "pelalawan", "inhu", "rohil", "siak"]

REGIONS = [
    {"id": "kampar", "name": "Kampar", "province": "Riau", "crop_type": "palm_oil"},
    {"id": "pelalawan", "name": "Pelalawan", "province": "Riau", "crop_type": "palm_oil"},
    {"id": "inhu", "name": "Indragiri Hulu", "province": "Riau", "crop_type": "palm_oil"},
    {"id": "rohil", "name": "Rokan Hilir", "province": "Riau", "crop_type": "palm_oil"},
    {"id": "siak", "name": "Siak", "province": "Riau", "crop_type": "palm_oil"},
]

NDVI_READINGS = [
    {"region_id": "kampar", "timestamp": "2026-04-07T06:00:00Z", "ndvi": 0.71, "source": "sentinel_hub", "run_id": RUN_ID},
    {"region_id": "kampar", "timestamp": "2026-04-14T06:00:00Z", "ndvi": 0.73, "source": "sentinel_hub", "run_id": RUN_ID},
    {"region_id": "kampar", "timestamp": "2026-04-21T06:00:00Z", "ndvi": 0.74, "source": "sentinel_hub", "run_id": RUN_ID},
    {"region_id": "pelalawan", "timestamp": "2026-04-07T06:00:00Z", "ndvi": 0.64, "source": "sentinel_hub", "run_id": RUN_ID},
    {"region_id": "pelalawan", "timestamp": "2026-04-14T06:00:00Z", "ndvi": 0.62, "source": "sentinel_hub", "run_id": RUN_ID},
    {"region_id": "pelalawan", "timestamp": "2026-04-21T06:00:00Z", "ndvi": 0.61, "source": "sentinel_hub", "run_id": RUN_ID},
    {"region_id": "inhu", "timestamp": "2026-04-07T06:00:00Z", "ndvi": 0.49, "source": "sentinel_hub", "run_id": RUN_ID},
    {"region_id": "inhu", "timestamp": "2026-04-14T06:00:00Z", "ndvi": 0.46, "source": "sentinel_hub", "run_id": RUN_ID},
    {"region_id": "inhu", "timestamp": "2026-04-21T06:00:00Z", "ndvi": 0.43, "source": "sentinel_hub", "run_id": RUN_ID},
    {"region_id": "rohil", "timestamp": "2026-04-07T06:00:00Z", "ndvi": 0.68, "source": "sentinel_hub", "run_id": RUN_ID},
    {"region_id": "rohil", "timestamp": "2026-04-14T06:00:00Z", "ndvi": 0.69, "source": "sentinel_hub", "run_id": RUN_ID},
    {"region_id": "rohil", "timestamp": "2026-04-21T06:00:00Z", "ndvi": 0.71, "source": "sentinel_hub", "run_id": RUN_ID},
    {"region_id": "siak", "timestamp": "2026-04-07T06:00:00Z", "ndvi": 0.66, "source": "sentinel_hub", "run_id": RUN_ID},
    {"region_id": "siak", "timestamp": "2026-04-14T06:00:00Z", "ndvi": 0.67, "source": "sentinel_hub", "run_id": RUN_ID},
    {"region_id": "siak", "timestamp": "2026-04-21T06:00:00Z", "ndvi": 0.68, "source": "sentinel_hub", "run_id": RUN_ID},
]

WEATHER_FORECASTS = [
    {"region_id": "kampar", "timestamp": "2026-04-07T06:00:00Z", "rainfall_probability": 0.28, "temperature_min": 24, "temperature_max": 31, "wind_condition": "light", "source": "bmkg_wrapper", "run_id": RUN_ID},
    {"region_id": "kampar", "timestamp": "2026-04-14T06:00:00Z", "rainfall_probability": 0.24, "temperature_min": 24, "temperature_max": 31, "wind_condition": "light", "source": "bmkg_wrapper", "run_id": RUN_ID},
    {"region_id": "kampar", "timestamp": "2026-04-21T06:00:00Z", "rainfall_probability": 0.22, "temperature_min": 24, "temperature_max": 31, "wind_condition": "light", "source": "bmkg_wrapper", "run_id": RUN_ID},
    {"region_id": "pelalawan", "timestamp": "2026-04-07T06:00:00Z", "rainfall_probability": 0.34, "temperature_min": 24, "temperature_max": 30, "wind_condition": "moderate", "source": "bmkg_wrapper", "run_id": RUN_ID},
    {"region_id": "pelalawan", "timestamp": "2026-04-14T06:00:00Z", "rainfall_probability": 0.38, "temperature_min": 24, "temperature_max": 30, "wind_condition": "moderate", "source": "bmkg_wrapper", "run_id": RUN_ID},
    {"region_id": "pelalawan", "timestamp": "2026-04-21T06:00:00Z", "rainfall_probability": 0.41, "temperature_min": 24, "temperature_max": 30, "wind_condition": "moderate", "source": "bmkg_wrapper", "run_id": RUN_ID},
    {"region_id": "inhu", "timestamp": "2026-04-07T06:00:00Z", "rainfall_probability": 0.46, "temperature_min": 23, "temperature_max": 30, "wind_condition": "moderate", "source": "bmkg_wrapper", "run_id": RUN_ID},
    {"region_id": "inhu", "timestamp": "2026-04-14T06:00:00Z", "rainfall_probability": 0.49, "temperature_min": 23, "temperature_max": 30, "wind_condition": "moderate", "source": "bmkg_wrapper", "run_id": RUN_ID},
    {"region_id": "inhu", "timestamp": "2026-04-21T06:00:00Z", "rainfall_probability": 0.53, "temperature_min": 23, "temperature_max": 29, "wind_condition": "heavy", "source": "bmkg_wrapper", "run_id": RUN_ID},
    {"region_id": "rohil", "timestamp": "2026-04-07T06:00:00Z", "rainfall_probability": 0.27, "temperature_min": 24, "temperature_max": 31, "wind_condition": "light", "source": "bmkg_wrapper", "run_id": RUN_ID},
    {"region_id": "rohil", "timestamp": "2026-04-14T06:00:00Z", "rainfall_probability": 0.25, "temperature_min": 24, "temperature_max": 31, "wind_condition": "light", "source": "bmkg_wrapper", "run_id": RUN_ID},
    {"region_id": "rohil", "timestamp": "2026-04-21T06:00:00Z", "rainfall_probability": 0.2, "temperature_min": 24, "temperature_max": 31, "wind_condition": "light", "source": "bmkg_wrapper", "run_id": RUN_ID},
    {"region_id": "siak", "timestamp": "2026-04-07T06:00:00Z", "rainfall_probability": 0.29, "temperature_min": 24, "temperature_max": 31, "wind_condition": "light", "source": "bmkg_wrapper", "run_id": RUN_ID},
    {"region_id": "siak", "timestamp": "2026-04-14T06:00:00Z", "rainfall_probability": 0.26, "temperature_min": 24, "temperature_max": 31, "wind_condition": "light", "source": "bmkg_wrapper", "run_id": RUN_ID},
    {"region_id": "siak", "timestamp": "2026-04-21T06:00:00Z", "rainfall_probability": 0.24, "temperature_min": 24, "temperature_max": 31, "wind_condition": "light", "source": "bmkg_wrapper", "run_id": RUN_ID},
]

PRICE_DATA = [
    {"province": "Riau", "timestamp": "2026-03-03T06:00:00Z", "commodity": "cpo", "price": 11820, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
    {"province": "Riau", "timestamp": "2026-03-10T06:00:00Z", "commodity": "cpo", "price": 11950, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
    {"province": "Riau", "timestamp": "2026-03-17T06:00:00Z", "commodity": "cpo", "price": 12080, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
    {"province": "Riau", "timestamp": "2026-03-24T06:00:00Z", "commodity": "cpo", "price": 12010, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
    {"province": "Riau", "timestamp": "2026-03-31T06:00:00Z", "commodity": "cpo", "price": 12130, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
    {"province": "Riau", "timestamp": "2026-04-07T06:00:00Z", "commodity": "cpo", "price": 12270, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
    {"province": "Riau", "timestamp": "2026-04-14T06:00:00Z", "commodity": "cpo", "price": 12310, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
    {"province": "Riau", "timestamp": "2026-04-21T06:00:00Z", "commodity": "cpo", "price": 12400, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
    {"province": "Riau", "timestamp": "2026-03-03T06:00:00Z", "commodity": "ffb", "price": 2360, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
    {"province": "Riau", "timestamp": "2026-03-10T06:00:00Z", "commodity": "ffb", "price": 2390, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
    {"province": "Riau", "timestamp": "2026-03-17T06:00:00Z", "commodity": "ffb", "price": 2410, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
    {"province": "Riau", "timestamp": "2026-03-24T06:00:00Z", "commodity": "ffb", "price": 2400, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
    {"province": "Riau", "timestamp": "2026-03-31T06:00:00Z", "commodity": "ffb", "price": 2430, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
    {"province": "Riau", "timestamp": "2026-04-07T06:00:00Z", "commodity": "ffb", "price": 2450, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
    {"province": "Riau", "timestamp": "2026-04-14T06:00:00Z", "commodity": "ffb", "price": 2470, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
    {"province": "Riau", "timestamp": "2026-04-21T06:00:00Z", "commodity": "ffb", "price": 2480, "unit": "IDR/kg", "source": "badan_pangan", "run_id": RUN_ID},
]

RECOMMENDATIONS = [
    {"region_id": "kampar", "generated_at": "2026-04-07T09:00:00Z", "crop_health": "good", "action": "Dispatch now", "price_signal": "CPO above trailing average; maintain procurement volume", "confidence": 0.79, "source": "openai", "prompt_version": "v1", "run_id": RUN_ID},
    {"region_id": "kampar", "generated_at": "2026-04-14T09:00:00Z", "crop_health": "good", "action": "Dispatch now", "price_signal": "CPO above trailing average; prioritize high-yield collection", "confidence": 0.81, "source": "openai", "prompt_version": "v1", "run_id": RUN_ID},
    {"region_id": "kampar", "generated_at": "2026-04-21T09:00:00Z", "crop_health": "good", "action": "Dispatch now — peak yield window", "price_signal": "CPO above 4-week average; maintain aggressive procurement", "confidence": 0.82, "source": "openai", "prompt_version": "v1", "run_id": RUN_ID},
    {"region_id": "pelalawan", "generated_at": "2026-04-07T09:00:00Z", "crop_health": "moderate", "action": "Hold this week", "price_signal": "Weather risk offsets price support", "confidence": 0.64, "source": "openai", "prompt_version": "v1", "run_id": RUN_ID},
    {"region_id": "pelalawan", "generated_at": "2026-04-14T09:00:00Z", "crop_health": "moderate", "action": "Hold this week", "price_signal": "Moisture trend softens near-term intake quality", "confidence": 0.63, "source": "openai", "prompt_version": "v1", "run_id": RUN_ID},
    {"region_id": "pelalawan", "generated_at": "2026-04-21T09:00:00Z", "crop_health": "moderate", "action": "Hold this week — moisture rising", "price_signal": "CPO favorable, but road access risk argues for caution", "confidence": 0.61, "source": "openai", "prompt_version": "v1", "run_id": RUN_ID},
    {"region_id": "inhu", "generated_at": "2026-04-07T09:00:00Z", "crop_health": "at_risk", "action": "Prioritize Kampar instead", "price_signal": "Protect quality and avoid weak intake conversion", "confidence": 0.48, "source": "openai", "prompt_version": "v1", "run_id": RUN_ID},
    {"region_id": "inhu", "generated_at": "2026-04-14T09:00:00Z", "crop_health": "at_risk", "action": "Prioritize Kampar instead", "price_signal": "Rainfall trend increases spoilage risk", "confidence": 0.45, "source": "openai", "prompt_version": "v1", "run_id": RUN_ID},
    {"region_id": "inhu", "generated_at": "2026-04-21T09:00:00Z", "crop_health": "at_risk", "action": "Prioritize Kampar instead", "price_signal": "Preserve procurement margin by shifting trucks to healthier districts", "confidence": 0.43, "source": "openai", "prompt_version": "v1", "run_id": RUN_ID},
    {"region_id": "rohil", "generated_at": "2026-04-07T09:00:00Z", "crop_health": "good", "action": "Dispatch now", "price_signal": "Steady route access supports collection", "confidence": 0.68, "source": "openai", "prompt_version": "v1", "run_id": RUN_ID},
    {"region_id": "rohil", "generated_at": "2026-04-14T09:00:00Z", "crop_health": "good", "action": "Dispatch now", "price_signal": "Weather stable and crop signal improving", "confidence": 0.7, "source": "openai", "prompt_version": "v1", "run_id": RUN_ID},
    {"region_id": "rohil", "generated_at": "2026-04-21T09:00:00Z", "crop_health": "good", "action": "Dispatch now — stable conditions", "price_signal": "CPO remains supportive and field risk is low", "confidence": 0.71, "source": "openai", "prompt_version": "v1", "run_id": RUN_ID},
    {"region_id": "siak", "generated_at": "2026-04-07T09:00:00Z", "crop_health": "good", "action": "Dispatch now", "price_signal": "Healthy crop and clear route window", "confidence": 0.65, "source": "openai", "prompt_version": "v1", "run_id": RUN_ID},
    {"region_id": "siak", "generated_at": "2026-04-14T09:00:00Z", "crop_health": "good", "action": "Dispatch now", "price_signal": "Strong NDVI with manageable weather variance", "confidence": 0.67, "source": "openai", "prompt_version": "v1", "run_id": RUN_ID},
    {"region_id": "siak", "generated_at": "2026-04-21T09:00:00Z", "crop_health": "good", "action": "Dispatch — clear weather window", "price_signal": "CPO favorable and pickup timing remains efficient", "confidence": 0.68, "source": "openai", "prompt_version": "v1", "run_id": RUN_ID},
]
