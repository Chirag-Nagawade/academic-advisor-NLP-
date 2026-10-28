"""
recommendations.py - Course recommendation API routes.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db
from utils import sanitize_json
from services.recommendation_engine import recommendation_engine

router = APIRouter(prefix="/api", tags=["Recommendations"])


class RecommendationRequest(BaseModel):
    """Request body for course recommendations."""
    student_id: Optional[str] = None
    interests: Optional[str] = None
    career_goal: Optional[str] = None
    skills: Optional[str] = None


@router.post("/recommendations")
def get_recommendations(request: RecommendationRequest):
    """
    Get personalized course recommendations.

    Can provide either a student_id (to look up their profile)
    or direct interests/career_goal/skills.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    interests = request.interests or ""
    career_goal = request.career_goal or ""
    skills = request.skills or ""

    # If student_id provided, fetch their profile
    if request.student_id:
        student = db.students.find_one(
            {"Student_ID": request.student_id}, {"_id": 0}
        )
        if not student:
            raise HTTPException(
                status_code=404,
                detail=f"Student {request.student_id} not found"
            )
        interests = student.get("Interests", "") or interests
        career_goal = student.get("Career_Goal", "") or career_goal
        skills = student.get("Target_Skills", "") or skills

    if not interests and not career_goal and not skills:
        raise HTTPException(
            status_code=400,
            detail="Provide student_id or at least one of: interests, career_goal, skills"
        )

    try:
        recommendations = recommendation_engine.recommend(
            interests=interests,
            career_goal=career_goal,
            skills=skills,
            top_n=10
        )

        return sanitize_json({
            "student_id": request.student_id,
            "query": {
                "interests": str(interests or ""),
                "career_goal": str(career_goal or ""),
                "skills": str(skills or "")
            },
            "total_recommendations": len(recommendations),
            "recommendations": recommendations
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")
