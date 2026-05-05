from __future__ import annotations

from pymongo import ASCENDING, DESCENDING, ReplaceOne

from backend.db import get_collection
from backend.sample_data import NDVI_READINGS, PRICE_DATA, RECOMMENDATIONS, REGIONS, WEATHER_FORECASTS


def seed_collection(name: str, documents: list[dict], identity_fields: list[str]) -> None:
    collection = get_collection(name)
    operations = []

    for document in documents:
        identity = {field: document[field] for field in identity_fields}
        operations.append(ReplaceOne(identity, document, upsert=True))

    if operations:
        collection.bulk_write(operations, ordered=False)


def ensure_indexes() -> None:
    get_collection("regions").create_index([("id", ASCENDING)], unique=True)
    get_collection("ndvi_readings").create_index([("region_id", ASCENDING), ("timestamp", DESCENDING)])
    get_collection("weather_forecasts").create_index([("region_id", ASCENDING), ("timestamp", DESCENDING)])
    get_collection("price_data").create_index([("province", ASCENDING), ("commodity", ASCENDING), ("timestamp", DESCENDING)])
    get_collection("recommendations").create_index([("region_id", ASCENDING), ("generated_at", DESCENDING)])


def main() -> None:
    ensure_indexes()
    seed_collection("regions", REGIONS, ["id"])
    seed_collection("ndvi_readings", NDVI_READINGS, ["region_id", "timestamp"])
    seed_collection("weather_forecasts", WEATHER_FORECASTS, ["region_id", "timestamp"])
    seed_collection("price_data", PRICE_DATA, ["province", "commodity", "timestamp"])
    seed_collection("recommendations", RECOMMENDATIONS, ["region_id", "generated_at"])
    print("Seed complete for Vela.")


if __name__ == "__main__":
    main()
