"""
nlp_features.py - NLP feature demonstration API routes.

Exposes TF-IDF analysis, text similarity, and text preprocessing
for educational/demo purposes.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from database import get_db
from services.nlp_service import preprocess_text, get_tfidf_terms, compute_similarity

router = APIRouter(prefix="/api/nlp", tags=["NLP Features"])


class SimilarityRequest(BaseModel):
    """Request body for text similarity comparison."""
    text1: str
    text2: str


class PreprocessRequest(BaseModel):
    """Request body for text preprocessing demo."""
    text: str


@router.get("/tfidf")
def tfidf_analysis(text: str = Query(None, description="Optional text to analyze")):
    """
    Get top TF-IDF terms from the course corpus.

    If text is provided, also shows TF-IDF terms for that text.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        # Get all course texts for the corpus
        courses = list(db.courses.find({}, {"_id": 0, "title": 1, "description": 1, "skills": 1}))
        course_texts = [
            f"{c.get('title', '')} {c.get('description', '')} {c.get('skills', '')}"
            for c in courses
        ]

        # Get top TF-IDF terms from the corpus
        corpus_terms = get_tfidf_terms(course_texts, top_n=30)

        result = {
            "corpus_size": len(course_texts),
            "top_terms": [{"term": t, "score": s} for t, s in corpus_terms],
        }

        # If user provided text, analyze it too
        if text:
            user_terms = get_tfidf_terms([text] + course_texts, top_n=15)
            result["query_text"] = text
            result["query_terms"] = [{"term": t, "score": s} for t, s in user_terms]

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TF-IDF analysis error: {str(e)}")


@router.post("/similarity")
def text_similarity(request: SimilarityRequest):
    """
    Compute cosine similarity between two texts using TF-IDF.

    Returns a score between 0 (completely different) and 1 (identical).
    """
    if not request.text1.strip() or not request.text2.strip():
        raise HTTPException(status_code=400, detail="Both texts are required")

    try:
        score = compute_similarity(request.text1, request.text2)

        # Interpret the score
        if score >= 0.8:
            interpretation = "Very similar"
        elif score >= 0.5:
            interpretation = "Moderately similar"
        elif score >= 0.2:
            interpretation = "Somewhat similar"
        else:
            interpretation = "Not very similar"

        return {
            "text1": request.text1,
            "text2": request.text2,
            "similarity_score": score,
            "interpretation": interpretation
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Similarity error: {str(e)}")


@router.post("/preprocess")
def preprocess(request: PreprocessRequest):
    """
    Show step-by-step text preprocessing.

    Demonstrates: lowercasing, punctuation removal, tokenization,
    stopword removal - useful for understanding NLP pipeline.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")

    try:
        result = preprocess_text(request.text)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing error: {str(e)}")
