"""
nlp_service.py - NLP utilities using scikit-learn.

Provides text preprocessing, TF-IDF analysis, and cosine similarity.
No spaCy or heavy NLP libraries needed.
"""

import re
import string
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.metrics.pairwise import cosine_similarity

# Common stopwords to remove
STOP_WORDS = set(ENGLISH_STOP_WORDS)


def preprocess_text(text):
    """
    Clean and preprocess text through several NLP steps.
    Returns dict showing each step's output for educational purposes.
    """
    if not text:
        return {
            "original": "",
            "lowercase": "",
            "no_punctuation": "",
            "tokens": [],
            "no_stopwords": [],
            "final": ""
        }

    # Step 1: Original
    original = str(text)

    # Step 2: Lowercase
    lowercase = original.lower()

    # Step 3: Remove punctuation
    no_punctuation = lowercase.translate(str.maketrans("", "", string.punctuation))

    # Step 4: Tokenize (split into words)
    tokens = no_punctuation.split()

    # Step 5: Remove stopwords
    no_stopwords = [word for word in tokens if word not in STOP_WORDS]

    # Step 6: Final cleaned text
    final = " ".join(no_stopwords)

    return {
        "original": original,
        "lowercase": lowercase,
        "no_punctuation": no_punctuation,
        "tokens": tokens,
        "no_stopwords": no_stopwords,
        "final": final
    }


def get_tfidf_terms(texts, top_n=20):
    """
    Get the most important terms from a corpus using TF-IDF.

    Args:
        texts: List of text documents
        top_n: Number of top terms to return

    Returns:
        List of (term, score) tuples sorted by importance
    """
    if not texts:
        return []

    # Clean texts
    clean_texts = [str(t) for t in texts if t]
    if not clean_texts:
        return []

    vectorizer = TfidfVectorizer(
        max_features=1000,
        stop_words="english",
        ngram_range=(1, 2)  # Include bigrams too
    )

    try:
        tfidf_matrix = vectorizer.fit_transform(clean_texts)
    except ValueError:
        return []

    # Get feature names and their average scores
    feature_names = vectorizer.get_feature_names_out()
    avg_scores = tfidf_matrix.mean(axis=0).A1  # Average across all documents

    # Sort by score and return top N
    top_indices = avg_scores.argsort()[::-1][:top_n]
    return [(feature_names[i], round(float(avg_scores[i]), 4)) for i in top_indices]


def compute_similarity(text1, text2):
    """
    Compute cosine similarity between two texts using TF-IDF.

    Returns:
        Float similarity score between 0 and 1
    """
    if not text1 or not text2:
        return 0.0

    vectorizer = TfidfVectorizer(stop_words="english")

    try:
        tfidf_matrix = vectorizer.fit_transform([str(text1), str(text2)])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        return round(float(similarity[0][0]), 4)
    except ValueError:
        return 0.0
