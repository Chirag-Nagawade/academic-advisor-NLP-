"""
main.py - FastAPI application entry point for Intelligent Academic Advisor.

Run with: uvicorn main:app --reload --port 8000
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import get_db

# Import all route modules
from routes.dashboard import router as dashboard_router
from routes.students import router as students_router
from routes.analytics import router as analytics_router
from routes.recommendations import router as recommendations_router
from routes.skill_gap import router as skill_gap_router
from routes.roadmap import router as roadmap_router
from routes.chatbot import router as chatbot_router
from routes.nlp_features import router as nlp_router

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Intelligent Academic Advisor API",
    description="Backend API for the Intelligent Academic Advisor - "
                "Provides student analytics, course recommendations, "
                "skill gap analysis, career roadmaps, and NLP features.",
    version="1.0.0"
)

# CORS middleware - allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    # Vite dev server
        "http://127.0.0.1:5173",
        "http://localhost:3000",     # Alternate dev port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(dashboard_router)
app.include_router(students_router)
app.include_router(analytics_router)
app.include_router(recommendations_router)
app.include_router(skill_gap_router)
app.include_router(roadmap_router)
app.include_router(chatbot_router)
app.include_router(nlp_router)


@app.on_event("startup")
def startup_event():
    """Run on application startup."""
    # Ensure documents directory exists
    docs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "documents")
    os.makedirs(docs_dir, exist_ok=True)

    # Test database connection
    db = get_db()
    if db is not None:
        print("[OK] Application started successfully")
    else:
        print("[WARN] Application started but database is not connected")


@app.get("/api/health")
def health_check():
    """
    Health check endpoint.
    Returns server status and record counts from MongoDB.
    """
    db = get_db()

    if db is None:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "students": 0,
            "courses": 0,
        }

    try:
        student_count = db.students.count_documents({})
        course_count = db.courses.count_documents({})

        return {
            "status": "healthy",
            "database": "connected",
            "students": student_count,
            "courses": course_count,
        }
    except Exception as e:
        return {
            "status": "degraded",
            "database": f"error: {str(e)}",
            "students": 0,
            "courses": 0,
        }


# Entry point for direct execution
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
