from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING

from backend.config import DB_NAME, MONGODB_URI

_client: AsyncIOMotorClient | None = None
_database: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global _client, _database

    if _client is None:
        if not MONGODB_URI:
            raise RuntimeError("MONGODB_URI is not configured.")
        _client = AsyncIOMotorClient(MONGODB_URI)
        await _client.admin.command("ping")
        _database = _client[DB_NAME]


async def close_mongo_connection() -> None:
    global _client, _database

    if _client is not None:
        _client.close()

    _client = None
    _database = None


def get_db() -> AsyncIOMotorDatabase:
    if _database is None:
        raise RuntimeError("MongoDB connection has not been initialized.")
    return _database


def get_collection(name: str) -> AsyncIOMotorCollection:
    return get_db()[name]


async def ensure_indexes() -> None:
    await get_collection("regions").create_index([("id", ASCENDING)], unique=True)
    await get_collection("ndvi_readings").create_index([("region_id", ASCENDING), ("timestamp", DESCENDING)])
    await get_collection("weather_forecasts").create_index([("region_id", ASCENDING), ("timestamp", DESCENDING)])
    await get_collection("price_data").create_index([("province", ASCENDING), ("commodity", ASCENDING), ("timestamp", DESCENDING)])
    await get_collection("recommendations").create_index([("region_id", ASCENDING), ("generated_at", DESCENDING)])
