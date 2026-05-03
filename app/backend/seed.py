from database import recommendations_collection

sample = {
    "district_id": "dumai",
    "date": "2026-05-03",
    "confidence_score": 82,
    "recommended_action": "Dispatch early this week",
    "reason": "High NDVI + rain expected Friday + rising CPO price"
}

result = recommendations_collection.insert_one(sample)

print("Inserted ID:", result.inserted_id)