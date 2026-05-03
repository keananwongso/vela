from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

# backend foundation for database connection
MONGODB_URI = os.getenv("MONGODB_URI")

client = MongoClient(MONGODB_URI)

db = client["vela"]

districts_collection = db["districts"]
ndvi_collection = db["ndvi_data"]
weather_collection = db["weather_data"]
price_collection = db["price_data"]
recommendations_collection = db["recommendations"]