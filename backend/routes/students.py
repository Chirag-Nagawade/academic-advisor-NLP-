"""
students.py - Student management API routes.

CRUD operations for student profiles.
"""

import random
import string
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from database import get_db
from utils import sanitize_json

router = APIRouter(prefix="/api", tags=["Students"])


class StudentCreate(BaseModel):
    """Schema for creating a new student profile."""
    Age: Optional[int] = None
    Gender: Optional[str] = None
    State: Optional[str] = None
    Branch: Optional[str] = None
    College_Tier: Optional[str] = None
    CGPA: Optional[float] = None
    Attendance_Percentage: Optional[float] = None
    DSA_Problems_Solved: Optional[int] = None
    Aptitude_Score: Optional[int] = None
    Communication_Score: Optional[int] = None
    Projects_Count: Optional[int] = None
    Internships_Count: Optional[int] = None
    Certifications_Count: Optional[int] = None
    Open_Source_Contributions: Optional[int] = None
    GitHub_Contributions: Optional[int] = None
    LinkedIn_Activity_Score: Optional[int] = None
    Hackathons_Participated: Optional[int] = None
    Competitive_Programming_Rating: Optional[int] = None
    Study_Hours_Per_Week: Optional[int] = None
    Soft_Skills_Score: Optional[int] = None
    Leadership_Experience: Optional[str] = None
    Extracurricular_Activities: Optional[int] = None
    Placement_Status: Optional[str] = None
    Package_LPA: Optional[float] = None
    Mathematics_Marks: Optional[float] = None
    Core_Branch_Subject_Marks: Optional[float] = None
    Programming_Marks: Optional[float] = None
    Data_Structures_Algorithms_Marks: Optional[float] = None
    Communication_Subject_Marks: Optional[float] = None
    Interests: Optional[str] = None
    Career_Goal: Optional[str] = None
    Target_Skills: Optional[str] = None


@router.get("/students")
def list_students(
    search: str = Query(None, description="Search by Student_ID"),
    branch: str = Query(None, description="Filter by branch"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    List students with optional search, branch filter, and pagination.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        # Build filter query
        query = {}
        if search:
            # Search by Student_ID (partial match)
            query["Student_ID"] = {"$regex": search, "$options": "i"}
        if branch:
            query["Branch"] = {"$regex": f"^{branch}$", "$options": "i"}

        # Get total count for pagination
        total = db.students.count_documents(query)

        # Fetch paginated results
        skip = (page - 1) * limit
        students = list(
            db.students.find(query, {"_id": 0})
            .sort("Student_ID", 1)
            .skip(skip)
            .limit(limit)
        )

        return sanitize_json({
            "students": students,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching students: {str(e)}")


@router.get("/students/{student_id}")
def get_student(student_id: str):
    """Get a single student by Student_ID."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    student = db.students.find_one({"Student_ID": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")

    return sanitize_json(student)


@router.post("/students")
def create_student(student_data: StudentCreate):
    """
    Create a new student profile.
    Auto-generates a unique Student_ID and saves to MongoDB.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        # Generate a unique Student_ID (e.g., ST20001)
        random_num = random.randint(20000, 99999)
        student_id = f"ST{random_num}"

        # Make sure it's unique
        while db.students.find_one({"Student_ID": student_id}):
            random_num = random.randint(20000, 99999)
            student_id = f"ST{random_num}"

        # Convert to dict and add Student_ID
        record = student_data.model_dump(exclude_none=False)
        record["Student_ID"] = student_id

        db.students.insert_one(record)

        # Return without _id
        record.pop("_id", None)

        return {"message": "Student created successfully", "student": record}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating student: {str(e)}")
