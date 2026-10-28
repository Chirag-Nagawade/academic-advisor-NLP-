"""
import_data.py - Import CSV data into MongoDB.

Run this script to load student_profiles.csv and courses.csv into MongoDB.
Usage: python import_data.py
"""

import os
import sys
import pandas as pd
import numpy as np
from pymongo import UpdateOne
from database import get_db
from utils import sanitize_json

# Path to data directory (one level up from backend/)
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def import_students(db):
    """Import student profiles from CSV into MongoDB."""
    csv_path = os.path.join(DATA_DIR, "student_profiles.csv")

    if not os.path.exists(csv_path):
        print(f"[ERROR] File not found: {csv_path}")
        return 0

    print(f"[INFO] Reading {csv_path}...")
    df = pd.read_csv(csv_path)

    # Convert DataFrame rows to list of dicts and sanitize any NaN/Inf to None
    raw_records = df.to_dict(orient="records")
    records = [sanitize_json(record) for record in raw_records]

    # Use upsert to avoid duplicates based on Student_ID
    operations = []
    for record in records:
        operations.append(
            UpdateOne(
                {"Student_ID": record["Student_ID"]},  # filter
                {"$set": record},                       # update
                upsert=True                              # insert if not found
            )
        )

    if operations:
        result = db.students.bulk_write(operations)
        inserted = result.upserted_count
        modified = result.modified_count
        print(f"[OK] Students: {inserted} inserted, {modified} updated (total: {len(records)} records)")
        return len(records)

    return 0


def import_courses(db):
    """Import courses from CSV into MongoDB."""
    csv_path = os.path.join(DATA_DIR, "courses.csv")

    if not os.path.exists(csv_path):
        print(f"[ERROR] File not found: {csv_path}")
        return 0

    print(f"[INFO] Reading {csv_path}...")
    df = pd.read_csv(csv_path)
    raw_records = df.to_dict(orient="records")
    records = [sanitize_json(record) for record in raw_records]

    # Use upsert to avoid duplicates based on course_id
    operations = []
    for record in records:
        operations.append(
            UpdateOne(
                {"course_id": record["course_id"]},  # filter
                {"$set": record},                     # update
                upsert=True                            # insert if not found
            )
        )

    if operations:
        result = db.courses.bulk_write(operations)
        inserted = result.upserted_count
        modified = result.modified_count
        print(f"[OK] Courses: {inserted} inserted, {modified} updated (total: {len(records)} records)")
        return len(records)

    return 0


def main():
    """Main entry point for data import."""
    print("=" * 50)
    print("  Intelligent Academic Advisor - Data Import")
    print("=" * 50)

    db = get_db()
    if db is None:
        print("[ERROR] Could not connect to MongoDB. Exiting.")
        sys.exit(1)

    total_students = import_students(db)
    total_courses = import_courses(db)

    print("\n" + "=" * 50)
    print(f"  Import Summary:")
    print(f"    Students: {total_students}")
    print(f"    Courses:  {total_courses}")
    print("=" * 50)


if __name__ == "__main__":
    main()
