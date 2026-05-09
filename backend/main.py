from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime
import logging

from fastapi import APIRouter, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from backend.db import close_mongo_connection, connect_to_mongo, ensure_indexes, get_collection
from backend.sample_data import REGION_ORDER
from backend.schemas import ErrorResponse, IngestPayload, IngestSuccessResponse

ERROR_RESPONSES = {
    400: {"model": ErrorResponse},
    404: {"model": ErrorResponse},
    422: {"model": ErrorResponse},
    500: {"model": ErrorResponse},
}
PROJECTION_NO_ID = {"_id": 0}
logger = logging.getLogger("vela.ingest")


@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_to_mongo()
    await ensure_indexes()
    yield
    await close_mongo_connection()


app = FastAPI(title="Vela API", version="0.2.0", lifespan=lifespan)
ingest_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


def validation_error_detail(exc: RequestValidationError) -> str:
    messages = []
    for error in exc.errors():
        location = ".".join(str(part) for part in error["loc"] if part != "body")
        if location:
            messages.append(f"{location}: {error['msg']}")
        else:
            messages.append(error["msg"])
    return "; ".join(messages)


async def latest_document(collection_name: str, query: dict, sort_field: str) -> dict | None:
    return await get_collection(collection_name).find_one(
        query,
        projection=PROJECTION_NO_ID,
        sort=[(sort_field, -1)],
    )


async def list_region_documents() -> list[dict]:
    documents = await get_collection("regions").find({}, PROJECTION_NO_ID).to_list(length=None)
    documents.sort(key=lambda region: REGION_ORDER.index(region["id"]) if region["id"] in REGION_ORDER else len(REGION_ORDER))
    return documents


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"status": "error", "detail": detail})


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"status": "error", "detail": validation_error_detail(exc)},
    )


@app.exception_handler(PyMongoError)
async def pymongo_exception_handler(_: Request, exc: PyMongoError) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"status": "error", "detail": f"MongoDB query failed: {exc}"},
    )


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/regions", responses=ERROR_RESPONSES)
async def get_regions() -> dict:
    latest_cpo = await latest_document("price_data", {"province": "Riau", "commodity": "cpo"}, "timestamp")
    latest_recommendation = await latest_document("recommendations", {}, "generated_at")
    region_documents = await list_region_documents()
    region_ids = [region["id"] for region in region_documents]
    fresh_region_ids: list[str] = []

    if latest_recommendation and latest_recommendation.get("run_id"):
        fresh_region_ids = await get_collection("recommendations").distinct(
            "region_id",
            {"run_id": latest_recommendation["run_id"]},
        )

    fresh_region_ids = sorted(
        {region_id for region_id in fresh_region_ids if region_id in region_ids},
        key=lambda region_id: region_ids.index(region_id),
    )
    stale_region_ids = [region_id for region_id in region_ids if region_id not in fresh_region_ids]
    regions = []
    last_sync = None

    for region in region_documents:
        recommendation = await latest_document("recommendations", {"region_id": region["id"]}, "generated_at")
        ndvi = await latest_document("ndvi_readings", {"region_id": region["id"]}, "timestamp")
        updated_at = recommendation["generated_at"] if recommendation else ndvi["timestamp"] if ndvi else None

        if updated_at and (last_sync is None or updated_at > last_sync):
            last_sync = updated_at

        if latest_cpo and latest_cpo["timestamp"] and (last_sync is None or latest_cpo["timestamp"] > last_sync):
            last_sync = latest_cpo["timestamp"]

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
            "latestRunId": latest_recommendation["run_id"] if latest_recommendation else None,
            "priceSyncTimestamp": latest_cpo["timestamp"] if latest_cpo else None,
            "signalSyncTimestamp": latest_recommendation["generated_at"] if latest_recommendation else None,
            "expectedRegionCount": len(region_ids),
            "freshRegionCount": len(fresh_region_ids),
            "freshRegionIds": fresh_region_ids,
            "staleRegionIds": stale_region_ids,
            "isPartial": bool(region_ids) and 0 < len(fresh_region_ids) < len(region_ids),
        },
    }


@app.get("/regions/{region_id}/latest", responses=ERROR_RESPONSES)
async def get_region_latest(region_id: str) -> dict:
    region = await get_collection("regions").find_one({"id": region_id}, PROJECTION_NO_ID)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")

    recommendation = await latest_document("recommendations", {"region_id": region_id}, "generated_at")
    ndvi = await latest_document("ndvi_readings", {"region_id": region_id}, "timestamp")
    weather = await latest_document("weather_forecasts", {"region_id": region_id}, "timestamp")
    cpo = await latest_document("price_data", {"province": region["province"], "commodity": "cpo"}, "timestamp")
    ffb = await latest_document("price_data", {"province": region["province"], "commodity": "ffb"}, "timestamp")

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


@app.get("/regions/{region_id}/history", responses=ERROR_RESPONSES)
async def get_region_history(region_id: str) -> dict:
    region = await get_collection("regions").find_one({"id": region_id}, PROJECTION_NO_ID)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")

    ndvi_history = await get_collection("ndvi_readings").find(
        {"region_id": region_id},
        PROJECTION_NO_ID,
    ).sort("timestamp", 1).to_list(length=None)
    weather_history = await get_collection("weather_forecasts").find(
        {"region_id": region_id},
        PROJECTION_NO_ID,
    ).sort("timestamp", 1).to_list(length=None)
    recommendation_history = await get_collection("recommendations").find(
        {"region_id": region_id},
        PROJECTION_NO_ID,
    ).sort("generated_at", -1).limit(10).to_list(length=10)
    cpo_history = await get_collection("price_data").find(
        {"province": region["province"], "commodity": "cpo"},
        PROJECTION_NO_ID,
    ).sort("timestamp", 1).to_list(length=None)
    ffb_history = await get_collection("price_data").find(
        {"province": region["province"], "commodity": "ffb"},
        PROJECTION_NO_ID,
    ).sort("timestamp", 1).to_list(length=None)

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


@app.get("/prices/cpo", responses=ERROR_RESPONSES)
async def get_cpo_prices() -> dict:
    cpo_series = await get_collection("price_data").find(
        {"province": "Riau", "commodity": "cpo"},
        PROJECTION_NO_ID,
    ).sort("timestamp", 1).to_list(length=None)
    ffb_latest = await latest_document("price_data", {"province": "Riau", "commodity": "ffb"}, "timestamp")

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


@ingest_router.post("/ingest", response_model=IngestSuccessResponse, responses=ERROR_RESPONSES)
async def ingest(payload: IngestPayload) -> IngestSuccessResponse:
    generated_at = payload.generated_at_iso
    logger.info(
        "ingest.request %s",
        {
            "run_id": payload.run_id,
            "region_id": payload.region_id,
            "generated_at": generated_at,
        },
    )

    recommendation_document = {
        "region_id": payload.region_id,
        "generated_at": generated_at,
        "crop_health": payload.crop_health,
        "action": payload.action,
        "price_signal": payload.price_signal,
        "confidence": payload.confidence,
        "source": payload.source,
        "prompt_version": payload.prompt_version,
        "run_id": payload.run_id,
    }
    ndvi_document = {
        "region_id": payload.region_id,
        "timestamp": generated_at,
        "ndvi": payload.ndvi,
        "source": "sentinel_hub",
        "run_id": payload.run_id,
    }
    weather_document = {
        "region_id": payload.region_id,
        "timestamp": generated_at,
        "rainfall_probability": payload.rain_probability,
        "temperature_min": None,
        "temperature_max": None,
        "wind_condition": None,
        "source": "bmkg_wrapper",
        "run_id": payload.run_id,
    }
    price_document = {
        "province": "Riau",
        "timestamp": generated_at,
        "commodity": "cpo",
        "price": payload.cpo_price_raw,
        "unit": "IDR/kg",
        "source": "badan_pangan",
        "run_id": payload.run_id,
    }

    try:
        recommendation_result = await get_collection("recommendations").update_one(
            {"region_id": payload.region_id, "run_id": payload.run_id},
            {"$set": recommendation_document},
            upsert=True,
        )
        ndvi_result = await get_collection("ndvi_readings").update_one(
            {"region_id": payload.region_id, "run_id": payload.run_id},
            {"$set": ndvi_document},
            upsert=True,
        )
        weather_result = await get_collection("weather_forecasts").update_one(
            {"region_id": payload.region_id, "run_id": payload.run_id},
            {"$set": weather_document},
            upsert=True,
        )
        price_result = await get_collection("price_data").update_one(
            {"province": "Riau", "commodity": "cpo", "run_id": payload.run_id},
            {"$set": price_document},
            upsert=True,
        )
    except PyMongoError as exc:
        logger.exception(
            "ingest.write_failed %s",
            {
                "run_id": payload.run_id,
                "region_id": payload.region_id,
                "generated_at": generated_at,
            },
        )
        raise HTTPException(status_code=500, detail=f"MongoDB write failed: {exc}") from exc

    logger.info(
        "ingest.write_result %s",
        {
            "run_id": payload.run_id,
            "region_id": payload.region_id,
            "generated_at": generated_at,
            "collections": {
                "recommendations": {
                    "matched": recommendation_result.matched_count,
                    "modified": recommendation_result.modified_count,
                    "upserted": bool(recommendation_result.upserted_id),
                },
                "ndvi_readings": {
                    "matched": ndvi_result.matched_count,
                    "modified": ndvi_result.modified_count,
                    "upserted": bool(ndvi_result.upserted_id),
                },
                "weather_forecasts": {
                    "matched": weather_result.matched_count,
                    "modified": weather_result.modified_count,
                    "upserted": bool(weather_result.upserted_id),
                },
                "price_data": {
                    "matched": price_result.matched_count,
                    "modified": price_result.modified_count,
                    "upserted": bool(price_result.upserted_id),
                },
            },
        },
    )

    return IngestSuccessResponse(status="ok", run_id=payload.run_id)


app.include_router(ingest_router)
