"""
dashboard.py - Dashboard API routes.

Provides overview statistics for the main dashboard.
"""

from fastapi import APIRouter, HTTPException
from database import get_db
from utils import sanitize_json

router = APIRouter(prefix="/api", tags=["Dashboard"])


@router.get("/dashboard")
def get_dashboard(student_id: str = None):
    """
    Get dashboard overview data.

    Returns total students, courses, averages, distributions, etc.
    Optionally includes recommendations for a specific student.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        # Basic counts
        total_students = db.students.count_documents({})
        total_courses = db.courses.count_documents({})

        # Aggregation pipeline for averages
        avg_pipeline = [
            {
                "$group": {
                    "_id": None,
                    "avg_cgpa": {"$avg": "$CGPA"},
                    "avg_attendance": {"$avg": "$Attendance_Percentage"},
                }
            }
        ]
        avg_result = list(db.students.aggregate(avg_pipeline))
        avg_cgpa = round(avg_result[0]["avg_cgpa"], 2) if avg_result else 0
        avg_attendance = round(avg_result[0]["avg_attendance"], 2) if avg_result else 0

        # Placement percentage
        placed_count = db.students.count_documents({"Placement_Status": "Placed"})
        placement_pct = round((placed_count / max(total_students, 1)) * 100, 1)

        # Branch distribution
        branch_pipeline = [
            {"$group": {"_id": "$Branch", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        branch_dist = {
            doc["_id"]: doc["count"]
            for doc in db.students.aggregate(branch_pipeline)
            if doc["_id"]
        }

        # CGPA distribution (histogram buckets)
        cgpa_buckets = {"<5": 0, "5-6": 0, "6-7": 0, "7-8": 0, "8-9": 0, "9-10": 0}
        cgpa_pipeline = [
            {"$project": {"CGPA": 1}},
        ]
        for doc in db.students.aggregate(cgpa_pipeline):
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

        # Top branches by average CGPA
        top_branch_pipeline = [
            {"$group": {"_id": "$Branch", "avg_cgpa": {"$avg": "$CGPA"}}},
            {"$sort": {"avg_cgpa": -1}},
            {"$limit": 10}
        ]
        top_branches = [
            {"branch": doc["_id"], "avg_cgpa": round(doc["avg_cgpa"], 2)}
            for doc in db.students.aggregate(top_branch_pipeline)
            if doc["_id"]
        ]

        result = {
            "total_students": total_students,
            "total_courses": total_courses,
            "avg_cgpa": avg_cgpa,
            "avg_attendance": avg_attendance,
            "placement_percentage": placement_pct,
            "branch_distribution": branch_dist,
            "cgpa_distribution": cgpa_buckets,
            "top_branches_by_cgpa": top_branches,
        }

        # If student_id provided, include recommended courses
        if student_id:
            student = db.students.find_one({"Student_ID": student_id}, {"_id": 0})
            if student:
                from services.recommendation_engine import recommendation_engine
                recs = recommendation_engine.recommend(
                    interests=student.get("Interests", ""),
                    career_goal=student.get("Career_Goal", ""),
                    skills=student.get("Target_Skills", ""),
                    top_n=5
                )
                result["recommended_courses"] = recs

        return sanitize_json(result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")
