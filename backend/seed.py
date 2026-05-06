from __future__ import annotations

import asyncio

from pymongo import ReplaceOne

from backend.db import close_mongo_connection, connect_to_mongo, ensure_indexes, get_collection
from backend.sample_data import NDVI_READINGS, PRICE_DATA, RECOMMENDATIONS, REGIONS, WEATHER_FORECASTS


async def seed_collection(name: str, documents: list[dict], identity_fields: list[str]) -> None:
    collection = get_collection(name)
    operations = []

    for document in documents:
        identity = {field: document[field] for field in identity_fields}
        operations.append(ReplaceOne(identity, document, upsert=True))

    if operations:
        await collection.bulk_write(operations, ordered=False)


async def seed() -> None:
    await connect_to_mongo()
    try:
        await ensure_indexes()
        await seed_collection("regions", REGIONS, ["id"])
        await seed_collection("ndvi_readings", NDVI_READINGS, ["region_id", "timestamp"])
        await seed_collection("weather_forecasts", WEATHER_FORECASTS, ["region_id", "timestamp"])
        await seed_collection("price_data", PRICE_DATA, ["province", "commodity", "timestamp"])
        await seed_collection("recommendations", RECOMMENDATIONS, ["region_id", "generated_at"])
    finally:
        await close_mongo_connection()
    print("Seed complete for Vela.")


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
