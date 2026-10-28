"""
recommendation_engine.py - Course recommendation engine using TF-IDF.

Matches student interests, career goals, and skills with courses
using TF-IDF vectorization and cosine similarity.
Thread-safe and cached for reliable performance.
"""

import threading
import math
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from database import get_db
from utils import sanitize_json


class RecommendationEngine:
    """TF-IDF based course recommendation engine."""

    def __init__(self):
        self.vectorizer = None
        self.course_matrix = None
        self.courses = []
        self._initialized = False
        self._lock = threading.Lock()

    def _load_courses(self):
        """Load courses from MongoDB and build TF-IDF matrix."""
        db = get_db()
        if db is None:
            return

        # Fetch all courses
        courses = list(db.courses.find({}, {"_id": 0}))
        if not courses:
            return

        # Build combined text for each course (title + description + skills + category)
        course_texts = []
        for course in courses:
            combined = " ".join([
                str(course.get("title", "") or ""),
                str(course.get("description", "") or ""),
                str(course.get("skills", "") or "").replace(";", " "),
                str(course.get("category", "") or ""),
                str(course.get("recommended_for", "") or "")
            ])
            course_texts.append(combined)

        # Build TF-IDF matrix
        vectorizer = TfidfVectorizer(
            stop_words="english",
            max_features=5000,
            ngram_range=(1, 2)
        )
        course_matrix = vectorizer.fit_transform(course_texts)

        # Atomically assign
        self.courses = courses
        self.vectorizer = vectorizer
        self.course_matrix = course_matrix
        self._initialized = True

    def _ensure_initialized(self):
        """Ensure courses and TF-IDF matrix are loaded once in a thread-safe manner."""
        if self._initialized and self.courses and self.course_matrix is not None:
            return
        with self._lock:
            if not self._initialized or not self.courses:
                self._load_courses()

    def recommend(self, interests="", career_goal="", skills="", top_n=10):
        """
        Get course recommendations based on student profile.

        Args:
            interests: Student's interests (e.g., "Machine Learning, NLP")
            career_goal: Career goal (e.g., "Data Scientist")
            skills: Target skills (e.g., "Python; TensorFlow; statistics")
            top_n: Number of recommendations to return

        Returns:
            List of recommended courses with scores and reasons
        """
        self._ensure_initialized()

        if not self._initialized or not self.courses or self.vectorizer is None or self.course_matrix is None:
            return []

        # Clean input strings from None / NaN
        def clean_str(val):
            if val is None:
                return ""
            if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
                return ""
            return str(val).strip()

        clean_interests = clean_str(interests)
        clean_goal = clean_str(career_goal)
        clean_skills = clean_str(skills)

        # Build query from student profile
        query_parts = []
        if clean_interests:
            query_parts.append(clean_interests.replace(";", " "))
        if clean_goal:
            query_parts.append(clean_goal)
        if clean_skills:
            query_parts.append(clean_skills.replace(";", " "))

        query = " ".join(query_parts).strip()
        if not query:
            # Fallback to general introductory courses from catalog
            fallback_courses = []
            for course in self.courses[:top_n]:
                fallback_courses.append({
                    "course_id": course.get("course_id", ""),
                    "title": course.get("title", ""),
                    "description": course.get("description", ""),
                    "category": course.get("category", ""),
                    "skills": course.get("skills", ""),
                    "difficulty": course.get("difficulty", "Beginner"),
                    "source_url": course.get("source_url", ""),
                    "match_score": 50,
                    "final_score": 0.5,
                    "recommendation_reason": "Curriculum baseline foundational course",
                    "reasons": ["Curriculum baseline foundational course"]
                })
            return sanitize_json(fallback_courses)

        try:
            # Transform query using the fitted vectorizer
            query_vector = self.vectorizer.transform([query])
            similarities = cosine_similarity(query_vector, self.course_matrix).flatten()
        except Exception:
            return []

        # Add bonus scores for direct skill/category matches
        interest_words = set(clean_interests.lower().replace(";", ",").split(","))
        interest_words = {w.strip() for w in interest_words if w.strip() and w != "nan"}

        skill_words = set(clean_skills.lower().replace(";", ",").split(","))
        skill_words = {w.strip() for w in skill_words if w.strip() and w != "nan"}

        career_lower = clean_goal.lower().strip()
        if career_lower == "nan":
            career_lower = ""

        for i, course in enumerate(self.courses):
            course_skills = str(course.get("skills", "") or "").lower()
            course_category = str(course.get("category", "") or "").lower()
            course_recommended = str(course.get("recommended_for", "") or "").lower()

            bonus = 0.0

            # Bonus for skill matches
            for skill in skill_words:
                if skill and skill in course_skills:
                    bonus += 0.05

            # Bonus for interest matches
            for interest in interest_words:
                if interest and (interest in course_skills or interest in course_category):
                    bonus += 0.03

            # Bonus for career goal match
            if career_lower and (career_lower in course_recommended or career_lower in course_category):
                bonus += 0.08

            similarities[i] += bonus

        # Get top N indices
        top_indices = similarities.argsort()[::-1][:top_n]

        # Build results with explanations
        recommendations = []
        for idx in top_indices:
            score = float(similarities[idx])
            if math.isnan(score) or math.isinf(score) or score <= 0:
                continue

            course = self.courses[idx]

            # Generate reason for recommendation
            reasons = []
            course_skills_str = str(course.get("skills", "") or "").lower()

            for skill in skill_words:
                if skill and skill in course_skills_str:
                    reasons.append(f"Matches target skill: {skill}")

            for interest in interest_words:
                if interest and (interest in course_skills_str or interest in str(course.get("category", "") or "").lower()):
                    reasons.append(f"Aligns with interest: {interest}")

            if career_lower and career_lower in str(course.get("recommended_for", "") or "").lower():
                reasons.append(f"Recommended for: {clean_goal}")

            if not reasons:
                reasons.append("Semantic similarity with your academic profile")

            match_pct = max(10, min(99, int(round(score * 100))))

            recommendations.append({
                "course_id": course.get("course_id", ""),
                "title": course.get("title", ""),
                "description": course.get("description", ""),
                "category": course.get("category", ""),
                "skills": course.get("skills", ""),
                "difficulty": course.get("difficulty", "Beginner"),
                "source_url": course.get("source_url", ""),
                "match_score": match_pct,
                "final_score": round(score, 4),
                "similarity_score": round(score, 4),
                "recommendation_reason": "; ".join(reasons[:2]),
                "reasons": reasons[:3]
            })

        return sanitize_json(recommendations)


# Singleton instance
recommendation_engine = RecommendationEngine()
