from __future__ import annotations

import asyncio

from pymongo import ReplaceOne

from backend.db import close_mongo_connection, connect_to_mongo, ensure_indexes, get_collection
from backend.sample_data import REGIONS


async def seed_regions() -> None:
    await connect_to_mongo()
    try:
        await ensure_indexes()
        operations = [ReplaceOne({"id": region["id"]}, region, upsert=True) for region in REGIONS]
        if operations:
            await get_collection("regions").bulk_write(operations, ordered=False)
    finally:
        await close_mongo_connection()
    print("Seeded canonical regions.")


def main() -> None:
    asyncio.run(seed_regions())


if __name__ == "__main__":
    main()
