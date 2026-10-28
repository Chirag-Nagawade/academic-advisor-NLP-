"""
database.py - MongoDB connection manager for the Intelligent Academic Advisor.

Connects to MongoDB using environment variables and provides a get_db() helper.
"""

import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MongoDB connection settings from environment
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "intelligent_academic_advisor")

# Create a single MongoDB client (connection pooling is handled automatically)
client = None
db = None


def connect_to_mongo():
    """Initialize the MongoDB connection."""
    global client, db
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Test the connection
        client.admin.command("ping")
        db = client[DATABASE_NAME]
        print(f"[OK] Connected to MongoDB: {DATABASE_NAME}")
        return db
    except ConnectionFailure as e:
        print(f"[ERROR] MongoDB connection failed: {e}")
        print("Make sure MongoDB is running on", MONGODB_URI)
        return None


def get_db():
    """
    Get the MongoDB database instance.
    Creates connection if not already connected.
    """
    global db
    if db is None:
        connect_to_mongo()
    return db


def close_connection():
    """Close the MongoDB connection gracefully."""
    global client, db
    if client:
        client.close()
        client = None
        db = None
        print("MongoDB connection closed.")
