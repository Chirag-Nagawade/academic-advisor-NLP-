"""
roadmap_service.py - Generate career roadmaps for students.

Creates a 3-stage career development plan based on skill gap analysis
and matches courses from the catalog.
"""

from datetime import datetime
from database import get_db
from services.skill_gap_service import analyze_skill_gap


def generate_roadmap(student):
    """
    Generate a 3-stage career roadmap for a student.

    Stages:
        1. Foundation  - Build fundamental missing skills
        2. Development - Intermediate skills + projects
        3. Application - Advanced topics + real-world experience

    Args:
        student: Student document from MongoDB

    Returns:
        Complete roadmap dict
    """
    # First, get skill gap analysis
    skill_gap = analyze_skill_gap(student)

    missing_skills = skill_gap["missing_skills"]
    career_goal = skill_gap["career_goal"]
    current_skills = skill_gap["current_skills"]

    # Split missing skills into stages
    total = len(missing_skills)
    foundation_skills = missing_skills[:max(total // 3, 2)]
    development_skills = missing_skills[max(total // 3, 2):max(2 * total // 3, 4)]
    advanced_skills = missing_skills[max(2 * total // 3, 4):]

    # Get matching courses from the database
    db = get_db()
    all_courses = list(db.courses.find({}, {"_id": 0})) if db is not None else []

    # --- Stage 1: Foundation (Beginner) ---
    stage1_courses = _find_matching_courses(
        all_courses, foundation_skills, career_goal, difficulty="Beginner", limit=4
    )
    stage1 = {
        "stage": 1,
        "title": "Foundation",
        "duration": "1-2 months",
        "description": f"Build core fundamentals for {career_goal}",
        "skills_to_learn": foundation_skills,
        "courses": stage1_courses,
        "tasks": [
            f"Complete beginner courses in: {', '.join(foundation_skills[:3]) if foundation_skills else 'core concepts'}",
            "Set up your development environment and tools",
            "Start a learning journal to track progress",
            "Join online communities related to your field"
        ]
    }

    # --- Stage 2: Development (Intermediate) ---
    stage2_courses = _find_matching_courses(
        all_courses, development_skills, career_goal, difficulty="Intermediate", limit=4
    )
    stage2 = {
        "stage": 2,
        "title": "Skill Development",
        "duration": "2-3 months",
        "description": f"Develop intermediate {career_goal} skills through projects",
        "skills_to_learn": development_skills,
        "courses": stage2_courses,
        "tasks": [
            f"Learn intermediate topics: {', '.join(development_skills[:3]) if development_skills else 'advanced concepts'}",
            f"Build 2-3 projects showcasing your {career_goal} skills",
            "Contribute to open-source projects on GitHub",
            "Start writing technical blogs or documentation"
        ]
    }

    # --- Stage 3: Application (Advanced) ---
    stage3_courses = _find_matching_courses(
        all_courses, advanced_skills, career_goal, difficulty="Advanced", limit=4
    )
    stage3 = {
        "stage": 3,
        "title": "Real-World Application",
        "duration": "2-3 months",
        "description": f"Apply skills in real-world {career_goal} scenarios",
        "skills_to_learn": advanced_skills,
        "courses": stage3_courses,
        "tasks": [
            f"Master advanced topics: {', '.join(advanced_skills[:3]) if advanced_skills else 'specialization areas'}",
            "Apply for internships or freelance projects",
            "Build a capstone project for your portfolio",
            "Prepare for technical interviews and assessments",
            "Network with professionals in the industry"
        ]
    }

    # Build the complete roadmap
    roadmap = {
        "student_id": student.get("Student_ID"),
        "career_goal": career_goal,
        "current_skills": current_skills,
        "skill_match_percentage": skill_gap["skill_match_percentage"],
        "stages": [stage1, stage2, stage3],
        "total_courses": len(stage1_courses) + len(stage2_courses) + len(stage3_courses),
        "estimated_duration": "5-8 months",
        "created_at": datetime.utcnow().isoformat(),
    }

    # Save roadmap to MongoDB
    if db is not None:
        db.career_roadmaps.update_one(
            {"student_id": student.get("Student_ID")},
            {"$set": roadmap},
            upsert=True
        )

    return roadmap


def _find_matching_courses(courses, skills, career_goal, difficulty=None, limit=4):
    """
    Find courses that match given skills and career goal.

    Uses simple keyword matching on course skills, category, and description.
    """
    scored_courses = []

    for course in courses:
        score = 0
        course_skills = str(course.get("skills", "")).lower()
        course_category = str(course.get("category", "")).lower()
        course_desc = str(course.get("description", "")).lower()
        course_recommended = str(course.get("recommended_for", "")).lower()
        course_difficulty = str(course.get("difficulty", "")).lower()

        # Score based on skill matches
        for skill in skills:
            skill_lower = skill.lower()
            if skill_lower in course_skills:
                score += 3  # Direct skill match is worth more
            if skill_lower in course_desc:
                score += 1
            if skill_lower in course_category:
                score += 2

        # Bonus for career goal match
        if career_goal.lower() in course_recommended:
            score += 2
        if career_goal.lower() in course_category:
            score += 1

        # Bonus for matching difficulty
        if difficulty and difficulty.lower() == course_difficulty:
            score += 1

        if score > 0:
            scored_courses.append((score, course))

    # Sort by score (descending) and return top N
    scored_courses.sort(key=lambda x: x[0], reverse=True)

    results = []
    for score, course in scored_courses[:limit]:
        results.append({
            "course_id": course.get("course_id", ""),
            "title": course.get("title", ""),
            "description": course.get("description", ""),
            "category": course.get("category", ""),
            "skills": course.get("skills", ""),
            "difficulty": course.get("difficulty", ""),
            "source_url": course.get("source_url", ""),
            "relevance_score": score
        })

    return results
