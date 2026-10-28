"""
rag_service.py - Retrieval-Augmented Generation service.

Handles PDF document uploads, text chunking, and TF-IDF based retrieval.
Optionally uses Google Gemini API to generate answers from context.
"""

import os
import json
import urllib.request
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# In-memory document store
# Each entry: { "text": str, "metadata": { "filename": str, "page": int, "chunk_index": int } }
document_store = []

# TF-IDF vectorizer for the document store (rebuilt when documents are added)
_vectorizer = None
_tfidf_matrix = None


def process_document(file_path, filename):
    """
    Extract text from a PDF, split into chunks, and add to the document store.

    Args:
        file_path: Path to the PDF file
        filename: Original filename for metadata

    Returns:
        Dict with document info (pages, chunks created)
    """
    import pymupdf  # PyMuPDF

    global _vectorizer, _tfidf_matrix

    doc = pymupdf.open(file_path)
    total_pages = len(doc)
    chunks_created = 0

    for page_num in range(total_pages):
        page = doc.load_page(page_num)
        text = page.get_text()

        if not text.strip():
            continue

        # Split page text into chunks of ~500 chars with 50 char overlap
        page_chunks = _split_text(text, chunk_size=500, overlap=50)

        for i, chunk in enumerate(page_chunks):
            document_store.append({
                "text": chunk,
                "metadata": {
                    "filename": filename,
                    "page": page_num + 1,  # 1-indexed
                    "chunk_index": i
                }
            })
            chunks_created += 1

    doc.close()

    # Rebuild TF-IDF index with updated document store
    _rebuild_index()

    return {
        "filename": filename,
        "total_pages": total_pages,
        "chunks_created": chunks_created,
        "total_chunks_in_store": len(document_store)
    }


def _split_text(text, chunk_size=500, overlap=50):
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    text = text.strip()

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]

        # Try to break at a sentence boundary
        if end < len(text):
            last_period = chunk.rfind(".")
            last_newline = chunk.rfind("\n")
            break_point = max(last_period, last_newline)
            if break_point > chunk_size // 2:
                chunk = chunk[:break_point + 1]
                end = start + break_point + 1

        if chunk.strip():
            chunks.append(chunk.strip())

        start = end - overlap

    return chunks


def _rebuild_index():
    """Rebuild the TF-IDF index from the document store."""
    global _vectorizer, _tfidf_matrix

    if not document_store:
        _vectorizer = None
        _tfidf_matrix = None
        return

    texts = [doc["text"] for doc in document_store]
    _vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)

    try:
        _tfidf_matrix = _vectorizer.fit_transform(texts)
    except ValueError:
        _vectorizer = None
        _tfidf_matrix = None


def search(query, top_k=5):
    """
    Search the document store for chunks relevant to the query.

    Args:
        query: Search query string
        top_k: Number of top results to return

    Returns:
        List of { text, metadata, score } dicts
    """
    if not document_store or _vectorizer is None or _tfidf_matrix is None:
        return []

    try:
        query_vector = _vectorizer.transform([query])
        similarities = cosine_similarity(query_vector, _tfidf_matrix).flatten()
    except Exception:
        return []

    # Get top_k results
    top_indices = similarities.argsort()[::-1][:top_k]

    results = []
    for idx in top_indices:
        score = float(similarities[idx])
        if score <= 0:
            continue
        results.append({
            "text": document_store[idx]["text"],
            "metadata": document_store[idx]["metadata"],
            "score": round(score, 4)
        })

    return results


def generate_answer(question, context_chunks, api_key=None):
    """
    Generate an answer using context chunks.
    If LLM_API_KEY is set, uses Google Gemini API.
    Otherwise, returns the relevant passages directly.

    Args:
        question: User's question
        context_chunks: List of relevant text chunks
        api_key: Optional API key for Gemini

    Returns:
        Dict with answer, sources, and whether AI was used
    """
    # Build context from chunks
    context = "\n\n".join([chunk["text"] for chunk in context_chunks])
    sources = [
        {
            "filename": chunk["metadata"]["filename"],
            "page": chunk["metadata"]["page"],
            "score": chunk.get("score", 0)
        }
        for chunk in context_chunks
    ]

    # If API key is available, use Gemini
    if api_key:
        try:
            answer = _call_gemini(question, context, api_key)
            return {
                "answer": answer,
                "sources": sources,
                "ai_generated": True,
                "model": "gemini"
            }
        except Exception as e:
            # Fall back to returning passages
            return {
                "answer": f"AI generation failed ({str(e)}). Here are the relevant passages:",
                "passages": [chunk["text"] for chunk in context_chunks[:3]],
                "sources": sources,
                "ai_generated": False
            }

    # No API key - return passages directly
    return {
        "answer": "No AI API key configured. Here are the most relevant passages from your documents:",
        "passages": [chunk["text"] for chunk in context_chunks[:3]],
        "sources": sources,
        "ai_generated": False,
        "note": "Set LLM_API_KEY in your .env file to enable AI-powered answers."
    }


def _call_gemini(question, context, api_key):
    """Call Google Gemini API to generate an answer from context."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    prompt = f"""Based on the following context from uploaded documents, answer the question.
If the answer is not in the context, say so clearly.

Context:
{context}

Question: {question}

Answer:"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 1024
        }
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=30) as response:
        result = json.loads(response.read().decode("utf-8"))

    # Extract the generated text
    candidates = result.get("candidates", [])
    if candidates:
        parts = candidates[0].get("content", {}).get("parts", [])
        if parts:
            return parts[0].get("text", "No answer generated.")

    return "Could not generate an answer from the API."


def get_store_info():
    """Return info about the current document store."""
    if not document_store:
        return {"total_chunks": 0, "documents": []}

    # Get unique documents
    filenames = set()
    for doc in document_store:
        filenames.add(doc["metadata"]["filename"])

    return {
        "total_chunks": len(document_store),
        "documents": list(filenames)
    }
