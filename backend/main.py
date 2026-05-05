from __future__ import annotations

from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.config import CORS_ALLOW_ORIGINS
from backend.db import get_collection
from backend.sample_data import REGION_ORDER

app = FastAPI(title="Vela API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def iso_week_label(timestamp: str) -> str:
    date = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    return date.strftime("%b %d")


def crop_health_to_status(crop_health: str | None) -> str:
    mapping = {
        "good": "green",
        "moderate": "amber",
        "at_risk": "red",
    }
    return mapping.get(crop_health or "", "amber")


def latest_document(collection_name: str, query: dict, sort_field: str) -> dict | None:
    return get_collection(collection_name).find_one(query, sort=[(sort_field, -1)])


def list_region_documents() -> list[dict]:
    collection = get_collection("regions")
    documents = list(collection.find({}))
    documents.sort(key=lambda region: REGION_ORDER.index(region["id"]) if region["id"] in REGION_ORDER else len(REGION_ORDER))
    return documents


@app.get("/regions")
def get_regions() -> dict:
    latest_cpo = latest_document("price_data", {"province": "Riau", "commodity": "cpo"}, "timestamp")
    regions = []
    last_sync = None

    for region in list_region_documents():
        recommendation = latest_document("recommendations", {"region_id": region["id"]}, "generated_at")
        ndvi = latest_document("ndvi_readings", {"region_id": region["id"]}, "timestamp")
        updated_at = recommendation["generated_at"] if recommendation else ndvi["timestamp"] if ndvi else None

        if updated_at and (last_sync is None or updated_at > last_sync):
            last_sync = updated_at

        regions.append(
            {
                "id": region["id"],
                "name": region["name"],
                "status": crop_health_to_status(recommendation["crop_health"] if recommendation else None),
                "action": recommendation["action"] if recommendation else "Awaiting synthesis output",
                "ndvi": ndvi["ndvi"] if ndvi else None,
                "confidence": recommendation["confidence"] if recommendation else None,
                "latestPrice": latest_cpo["price"] if latest_cpo else None,
                "updatedAt": updated_at,
            }
        )

    return {
        "regions": regions,
        "summary": {
            "province": "Riau",
            "districtCount": len(regions),
            "lastSync": last_sync,
        },
    }


@app.get("/regions/{region_id}/latest")
def get_region_latest(region_id: str) -> dict:
    region = get_collection("regions").find_one({"id": region_id}, {"_id": 0})
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")

    recommendation = latest_document("recommendations", {"region_id": region_id}, "generated_at")
    ndvi = latest_document("ndvi_readings", {"region_id": region_id}, "timestamp")
    weather = latest_document("weather_forecasts", {"region_id": region_id}, "timestamp")
    cpo = latest_document("price_data", {"province": region["province"], "commodity": "cpo"}, "timestamp")
    ffb = latest_document("price_data", {"province": region["province"], "commodity": "ffb"}, "timestamp")

    return {
        "region": region,
        "recommendation": {
            "cropHealth": recommendation["crop_health"] if recommendation else None,
            "status": crop_health_to_status(recommendation["crop_health"] if recommendation else None),
            "action": recommendation["action"] if recommendation else None,
            "priceSignal": recommendation["price_signal"] if recommendation else None,
            "confidence": recommendation["confidence"] if recommendation else None,
            "generatedAt": recommendation["generated_at"] if recommendation else None,
        },
        "signals": {
            "ndvi": ndvi["ndvi"] if ndvi else None,
            "rainfallProbability": weather["rainfall_probability"] if weather else None,
            "temperatureMin": weather["temperature_min"] if weather else None,
            "temperatureMax": weather["temperature_max"] if weather else None,
            "windCondition": weather["wind_condition"] if weather else None,
            "cpoPrice": cpo["price"] if cpo else None,
            "ffbPrice": ffb["price"] if ffb else None,
        },
    }


@app.get("/regions/{region_id}/history")
def get_region_history(region_id: str) -> dict:
    region = get_collection("regions").find_one({"id": region_id}, {"_id": 0})
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")

    ndvi_history = list(
        get_collection("ndvi_readings")
        .find({"region_id": region_id}, {"_id": 0})
        .sort("timestamp", 1)
    )
    weather_history = list(
        get_collection("weather_forecasts")
        .find({"region_id": region_id}, {"_id": 0})
        .sort("timestamp", 1)
    )
    recommendation_history = list(
        get_collection("recommendations")
        .find({"region_id": region_id}, {"_id": 0})
        .sort("generated_at", 1)
    )
    cpo_history = list(
        get_collection("price_data")
        .find({"province": region["province"], "commodity": "cpo"}, {"_id": 0})
        .sort("timestamp", 1)
    )
    ffb_history = list(
        get_collection("price_data")
        .find({"province": region["province"], "commodity": "ffb"}, {"_id": 0})
        .sort("timestamp", 1)
    )

    return {
        "region": region,
        "history": {
            "ndvi": ndvi_history,
            "weather": weather_history,
            "recommendations": recommendation_history,
            "cpoPrices": cpo_history,
            "ffbPrices": ffb_history,
        },
    }


@app.get("/prices/cpo")
def get_cpo_prices() -> dict:
    cpo_series = list(
        get_collection("price_data")
        .find({"province": "Riau", "commodity": "cpo"}, {"_id": 0})
        .sort("timestamp", 1)
    )
    ffb_latest = latest_document("price_data", {"province": "Riau", "commodity": "ffb"}, "timestamp")

    if not cpo_series:
        return {
            "commodity": "cpo",
            "province": "Riau",
            "unit": "IDR/kg",
            "currentPrice": None,
            "lastUpdated": None,
            "series": [],
            "ffbReference": ffb_latest["price"] if ffb_latest else None,
        }

    current = cpo_series[-1]

    return {
        "commodity": "cpo",
        "province": "Riau",
        "unit": current["unit"],
        "currentPrice": current["price"],
        "lastUpdated": current["timestamp"],
        "series": [
            {
                "timestamp": point["timestamp"],
                "week": iso_week_label(point["timestamp"]),
                "price": point["price"],
            }
            for point in cpo_series
        ],
        "ffbReference": ffb_latest["price"] if ffb_latest else None,
    }
