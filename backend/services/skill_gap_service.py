"""
skill_gap_service.py - Analyze skill gaps for students.

Compares student's current skills with required skills for their career goal.
Identifies strengths, weaknesses, and missing skills.
"""

# ----------------------------------------------------------------
# Mapping of career goals to required skills
# ----------------------------------------------------------------
CAREER_SKILLS_MAP = {
    "Data Scientist": [
        "Python", "R", "statistics", "machine learning", "deep learning",
        "data visualization", "SQL", "pandas", "numpy", "scikit-learn",
        "TensorFlow", "NLP", "feature engineering", "hypothesis testing"
    ],
    "Software Engineer": [
        "data structures", "algorithms", "OOP", "system design",
        "version control", "testing", "debugging", "Python", "Java",
        "C++", "databases", "REST APIs", "agile", "clean code"
    ],
    "ML Engineer": [
        "Python", "TensorFlow", "PyTorch", "MLOps", "Docker",
        "machine learning", "deep learning", "model deployment",
        "data pipelines", "cloud computing", "Kubernetes", "CI/CD"
    ],
    "Web Developer": [
        "HTML", "CSS", "JavaScript", "React", "Node.js",
        "REST APIs", "databases", "SQL", "MongoDB", "Git",
        "responsive design", "TypeScript", "web security"
    ],
    "Full Stack Developer": [
        "HTML", "CSS", "JavaScript", "React", "Node.js", "Python",
        "REST APIs", "databases", "SQL", "MongoDB", "Git",
        "Docker", "cloud computing", "TypeScript", "system design"
    ],
    "Cybersecurity Analyst": [
        "network security", "cryptography", "ethical hacking",
        "penetration testing", "firewalls", "SIEM", "incident response",
        "Linux", "Python", "vulnerability assessment", "compliance"
    ],
    "Cloud Engineer": [
        "AWS", "Azure", "GCP", "Docker", "Kubernetes",
        "Terraform", "CI/CD", "Linux", "networking",
        "serverless", "cloud security", "monitoring"
    ],
    "DevOps Engineer": [
        "Docker", "Kubernetes", "CI/CD", "Jenkins", "Terraform",
        "Linux", "scripting", "monitoring", "Git",
        "cloud computing", "infrastructure as code", "ansible"
    ],
    "Data Analyst": [
        "SQL", "Excel", "Python", "R", "data visualization",
        "Tableau", "Power BI", "statistics", "data cleaning",
        "pandas", "reporting", "business intelligence"
    ],
    "AI Researcher": [
        "Python", "deep learning", "TensorFlow", "PyTorch",
        "mathematics", "linear algebra", "probability",
        "research methodology", "NLP", "computer vision",
        "reinforcement learning", "paper writing"
    ],
    "Embedded Systems Engineer": [
        "C", "C++", "microcontrollers", "RTOS", "embedded Linux",
        "PLC", "automation", "control systems", "circuit design",
        "IoT", "ARM", "VHDL", "signal processing"
    ],
    "Mobile App Developer": [
        "Java", "Kotlin", "Swift", "Flutter", "React Native",
        "REST APIs", "UI/UX", "databases", "Git",
        "app deployment", "Firebase", "mobile security"
    ],
    "Blockchain Developer": [
        "Solidity", "Ethereum", "smart contracts", "cryptography",
        "JavaScript", "Web3", "distributed systems", "Node.js",
        "data structures", "security"
    ],
    "Game Developer": [
        "C++", "C#", "Unity", "Unreal Engine", "game physics",
        "3D mathematics", "graphics programming", "OOP",
        "game design", "version control"
    ],
}

# Subject-to-mark field mapping
SUBJECT_FIELDS = {
    "Mathematics": "Mathematics_Marks",
    "Core Branch Subjects": "Core_Branch_Subject_Marks",
    "Programming": "Programming_Marks",
    "Data Structures & Algorithms": "Data_Structures_Algorithms_Marks",
    "Communication": "Communication_Subject_Marks",
}


def analyze_skill_gap(student):
    """
    Analyze skill gaps for a student based on their career goal.

    Args:
        student: Student document from MongoDB

    Returns:
        Dict with current_skills, required_skills, missing_skills,
        strength_areas, improvement_areas, and recommendations
    """
    career_goal = str(student.get("Career_Goal", "")).strip()
    target_skills_str = str(student.get("Target_Skills", ""))
    interests_str = str(student.get("Interests", ""))

    # Parse student's current skills from Target_Skills field
    current_skills = [
        s.strip() for s in target_skills_str.replace(";", ",").split(",")
        if s.strip()
    ]

    # Add interests as "known" areas
    interest_list = [
        s.strip() for s in interests_str.replace(";", ",").split(",")
        if s.strip()
    ]

    # Find required skills for this career goal
    required_skills = CAREER_SKILLS_MAP.get(career_goal, [])

    # If career goal not in map, try partial matching
    if not required_skills:
        for goal, skills in CAREER_SKILLS_MAP.items():
            if career_goal.lower() in goal.lower() or goal.lower() in career_goal.lower():
                required_skills = skills
                career_goal = goal
                break

    # If still no match, use a generic set
    if not required_skills:
        required_skills = [
            "Python", "data structures", "algorithms", "databases",
            "version control", "problem solving", "communication",
            "system design", "testing"
        ]

    # Find missing skills (case-insensitive comparison)
    current_lower = {s.lower() for s in current_skills}
    interest_lower = {s.lower() for s in interest_list}
    all_known = current_lower | interest_lower

    missing_skills = [
        skill for skill in required_skills
        if skill.lower() not in all_known
    ]

    # Analyze subject marks for strengths/weaknesses
    strength_areas = []
    improvement_areas = []

    for subject, field in SUBJECT_FIELDS.items():
        marks = student.get(field)
        if marks is not None:
            try:
                marks = float(marks)
                if marks >= 75:
                    strength_areas.append({
                        "subject": subject,
                        "marks": marks,
                        "level": "Strong" if marks >= 85 else "Good"
                    })
                elif marks < 50:
                    improvement_areas.append({
                        "subject": subject,
                        "marks": marks,
                        "level": "Needs Improvement"
                    })
            except (ValueError, TypeError):
                pass

    # Also check performance metrics
    cgpa = student.get("CGPA")
    if cgpa and float(cgpa) >= 8.0:
        strength_areas.append({"subject": "Overall Academics", "marks": float(cgpa), "level": "Strong CGPA"})

    dsa_solved = student.get("DSA_Problems_Solved", 0)
    if dsa_solved and int(dsa_solved) >= 200:
        strength_areas.append({"subject": "DSA Practice", "marks": int(dsa_solved), "level": "Active Problem Solver"})

    projects = student.get("Projects_Count", 0)
    if projects and int(projects) >= 4:
        strength_areas.append({"subject": "Project Experience", "marks": int(projects), "level": "Good Portfolio"})

    # Generate recommendations
    recommendations = _generate_recommendations(
        missing_skills, strength_areas, improvement_areas, career_goal, student
    )

    return {
        "student_id": student.get("Student_ID"),
        "career_goal": career_goal,
        "current_skills": current_skills,
        "interests": interest_list,
        "required_skills": required_skills,
        "missing_skills": missing_skills,
        "strength_areas": strength_areas,
        "improvement_areas": improvement_areas,
        "recommendations": recommendations,
        "skill_match_percentage": round(
            (1 - len(missing_skills) / max(len(required_skills), 1)) * 100, 1
        )
    }


def _generate_recommendations(missing_skills, strengths, improvements, career_goal, student):
    """Generate actionable recommendations based on skill gap analysis."""
    recs = []

    # Recommendation for missing skills (top priority)
    if missing_skills:
        top_missing = missing_skills[:5]
        recs.append({
            "priority": "high",
            "category": "Skill Development",
            "message": f"Focus on learning: {', '.join(top_missing)}",
            "detail": f"These skills are essential for becoming a {career_goal}."
        })

    # Recommendations for improvement areas
    for area in improvements:
        recs.append({
            "priority": "high",
            "category": "Academic Improvement",
            "message": f"Improve your {area['subject']} (currently {area['marks']} marks)",
            "detail": f"Aim for at least 60+ marks to strengthen your foundation."
        })

    # Leverage strengths
    if strengths:
        strong_subjects = [s["subject"] for s in strengths[:2]]
        recs.append({
            "priority": "medium",
            "category": "Leverage Strengths",
            "message": f"Build on your strengths in: {', '.join(strong_subjects)}",
            "detail": "Use your strong areas to explore advanced topics and projects."
        })

    # Project recommendation
    projects = student.get("Projects_Count", 0) or 0
    if int(projects) < 3:
        recs.append({
            "priority": "medium",
            "category": "Projects",
            "message": f"Build more projects (currently {projects}). Aim for 3-5 portfolio projects.",
            "detail": f"Projects related to {career_goal} will boost your resume."
        })

    # Internship recommendation
    internships = student.get("Internships_Count", 0) or 0
    if int(internships) < 1:
        recs.append({
            "priority": "medium",
            "category": "Internships",
            "message": "Apply for internships to gain practical experience.",
            "detail": "Real-world experience is highly valued by recruiters."
        })

    # Competitive programming
    cp_rating = student.get("Competitive_Programming_Rating", 0) or 0
    if career_goal in ["Software Engineer", "ML Engineer", "Full Stack Developer"] and int(cp_rating) < 1200:
        recs.append({
            "priority": "low",
            "category": "Competitive Programming",
            "message": "Practice competitive programming to improve problem-solving skills.",
            "detail": "Platforms like LeetCode, Codeforces, and HackerRank are great for this."
        })

    return recs
