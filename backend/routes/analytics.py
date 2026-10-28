"""
analytics.py - Analytics API routes.

Provides data for charts and visualizations.
"""

from fastapi import APIRouter, HTTPException, Query
from database import get_db
from utils import sanitize_json

router = APIRouter(prefix="/api", tags=["Analytics"])


@router.get("/analytics")
def get_analytics(branch: str = Query(None, description="Filter by branch")):
    """
    Get analytics data for charts and visualizations.

    Supports optional branch filter to narrow results.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        # Base filter
        match_filter = {}
        if branch:
            match_filter["Branch"] = {"$regex": f"^{branch}$", "$options": "i"}

        # --- CGPA Distribution ---
        cgpa_buckets = {"<5": 0, "5-6": 0, "6-7": 0, "7-8": 0, "8-9": 0, "9-10": 0}
        for doc in db.students.find(match_filter, {"CGPA": 1}):
            cgpa = doc.get("CGPA")
            if cgpa is None:
                continue
            if cgpa < 5:
                cgpa_buckets["<5"] += 1
            elif cgpa < 6:
                cgpa_buckets["5-6"] += 1
            elif cgpa < 7:
                cgpa_buckets["6-7"] += 1
            elif cgpa < 8:
                cgpa_buckets["7-8"] += 1
            elif cgpa < 9:
                cgpa_buckets["8-9"] += 1
            else:
                cgpa_buckets["9-10"] += 1

        # --- Average CGPA by Branch ---
        branch_cgpa_pipeline = [
            {"$match": match_filter} if match_filter else {"$match": {}},
            {"$group": {"_id": "$Branch", "avg_cgpa": {"$avg": "$CGPA"}, "count": {"$sum": 1}}},
            {"$sort": {"avg_cgpa": -1}}
        ]
        avg_cgpa_by_branch = [
            {"branch": doc["_id"], "avg_cgpa": round(doc["avg_cgpa"], 2), "count": doc["count"]}
            for doc in db.students.aggregate(branch_cgpa_pipeline)
            if doc["_id"]
        ]

        # --- Attendance Distribution ---
        att_buckets = {"<60": 0, "60-70": 0, "70-80": 0, "80-90": 0, "90-100": 0}
        for doc in db.students.find(match_filter, {"Attendance_Percentage": 1}):
            att = doc.get("Attendance_Percentage")
            if att is None:
                continue
            if att < 60:
                att_buckets["<60"] += 1
            elif att < 70:
                att_buckets["60-70"] += 1
            elif att < 80:
                att_buckets["70-80"] += 1
            elif att < 90:
                att_buckets["80-90"] += 1
            else:
                att_buckets["90-100"] += 1

        # --- Attendance vs CGPA (scatter plot data) ---
        # Sample up to 200 points for performance
        att_vs_cgpa_pipeline = [
            {"$match": match_filter} if match_filter else {"$match": {}},
            {"$project": {
                "_id": 0,
                "CGPA": 1,
                "Attendance_Percentage": 1,
                "Student_ID": 1
            }},
            {"$sample": {"size": 200}}
        ]
        attendance_vs_cgpa = list(db.students.aggregate(att_vs_cgpa_pipeline))

        # --- Subject Marks Averages ---
        subject_fields = [
            "Mathematics_Marks",
            "Core_Branch_Subject_Marks",
            "Programming_Marks",
            "Data_Structures_Algorithms_Marks",
            "Communication_Subject_Marks"
        ]
        subject_group = {field: {"$avg": f"${field}"} for field in subject_fields}
        subject_group["_id"] = None

        subject_pipeline = [
            {"$match": match_filter} if match_filter else {"$match": {}},
            {"$group": subject_group}
        ]
        subject_result = list(db.students.aggregate(subject_pipeline))

        subject_averages = {}
        if subject_result:
            for field in subject_fields:
                # Create a readable label
                label = field.replace("_Marks", "").replace("_", " ")
                val = subject_result[0].get(field)
                subject_averages[label] = round(val, 2) if val else 0

        # --- Placement by Branch ---
        placement_pipeline = [
            {"$match": match_filter} if match_filter else {"$match": {}},
            {"$group": {
                "_id": "$Branch",
                "total": {"$sum": 1},
                "placed": {
                    "$sum": {"$cond": [{"$eq": ["$Placement_Status", "Placed"]}, 1, 0]}
                }
            }},
            {"$sort": {"_id": 1}}
        ]
        placement_by_branch = [
            {
                "branch": doc["_id"],
                "total": doc["total"],
                "placed": doc["placed"],
                "percentage": round((doc["placed"] / max(doc["total"], 1)) * 100, 1)
            }
            for doc in db.students.aggregate(placement_pipeline)
            if doc["_id"]
        ]

        # --- Study Hours vs CGPA (scatter data) ---
        study_pipeline = [
            {"$match": match_filter} if match_filter else {"$match": {}},
            {"$project": {
                "_id": 0,
                "CGPA": 1,
                "Study_Hours_Per_Week": 1,
                "Student_ID": 1
            }},
            {"$sample": {"size": 200}}
        ]
        study_vs_cgpa = list(db.students.aggregate(study_pipeline))

        return sanitize_json({
            "cgpa_distribution": cgpa_buckets,
            "avg_cgpa_by_branch": avg_cgpa_by_branch,
            "attendance_distribution": att_buckets,
            "attendance_vs_cgpa": attendance_vs_cgpa,
            "subject_averages": subject_averages,
            "placement_by_branch": placement_by_branch,
            "study_hours_vs_cgpa": study_vs_cgpa,
            "filter_applied": branch or "none"
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")
