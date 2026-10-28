"""
skill_gap.py - Skill gap analysis API routes.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db
from utils import sanitize_json
from services.skill_gap_service import analyze_skill_gap

router = APIRouter(prefix="/api", tags=["Skill Gap"])


class SkillGapRequest(BaseModel):
    """Request body for skill gap analysis."""
    student_id: str


@router.post("/skill-gap")
def get_skill_gap(request: SkillGapRequest):
    """
    Analyze skill gaps for a student.

    Compares the student's current skills with what's needed
    for their career goal. Returns missing skills, strengths,
    weaknesses, and actionable recommendations.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    # Find the student
    student = db.students.find_one(
        {"Student_ID": request.student_id}, {"_id": 0}
    )
    if not student:
        raise HTTPException(
            status_code=404,
            detail=f"Student {request.student_id} not found"
        )

    try:
        result = analyze_skill_gap(student)
        return sanitize_json(result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skill gap analysis error: {str(e)}")
