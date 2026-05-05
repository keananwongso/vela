from __future__ import annotations

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

from backend.config import MONGODB_DB, MONGODB_URI

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client

    if _client is None:
        if not MONGODB_URI:
            raise RuntimeError("MONGODB_URI is not configured.")
        _client = MongoClient(MONGODB_URI)

    return _client


def get_db() -> Database:
    return get_client()[MONGODB_DB]


def get_collection(name: str) -> Collection:
    return get_db()[name]
