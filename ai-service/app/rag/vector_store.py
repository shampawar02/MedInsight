import os
import json
from pathlib import Path
from typing import List, Tuple
import numpy as np
import faiss
from app.config import settings
from app.embeddings.embedder import get_embeddings, get_query_embedding

def chunk_text(text: str, chunk_size: int = 350, overlap: int = 60) -> List[str]:
    """Splits full report text into overlapping sentence/paragraph chunks for RAG."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if not lines:
        return []

    chunks = []
    current_chunk = []
    current_len = 0

    for line in lines:
        current_chunk.append(line)
        current_len += len(line)

        if current_len >= chunk_size:
            chunk_str = " ".join(current_chunk)
            chunks.append(chunk_str)
            # Retain tail for overlap
            overlap_count = max(1, len(current_chunk) // 3)
            current_chunk = current_chunk[-overlap_count:]
            current_len = sum(len(c) for c in current_chunk)

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks

def build_faiss_index(report_id: str, text: str) -> int:
    """
    Chunks document text, generates vector embeddings, and builds a FAISS index.
    Saves index and chunks metadata to disk.
    Returns the number of indexed chunks.
    """
    chunks = chunk_text(text)
    if not chunks:
        chunks = [text] if text.strip() else ["Medical report document."]

    embeddings = get_embeddings(chunks)
    dimension = embeddings.shape[1]

    # Use IndexFlatIP (Inner Product) since embeddings are normalized (Cosine similarity)
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings)

    # Save index and chunks
    index_path = settings.FAISS_INDEX_DIR / f"{report_id}.index"
    chunks_path = settings.FAISS_INDEX_DIR / f"{report_id}_chunks.json"

    faiss.write_index(index, str(index_path))
    with open(chunks_path, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"[FAISS] Built index for report {report_id} with {len(chunks)} chunks.")
    return len(chunks)

def search_faiss_index(report_id: str, query: str, top_k: int = 3) -> List[Tuple[str, float]]:
    """
    Searches the FAISS index for a specific report against a user question.
    Returns list of (chunk_text, similarity_score).
    """
    index_path = settings.FAISS_INDEX_DIR / f"{report_id}.index"
    chunks_path = settings.FAISS_INDEX_DIR / f"{report_id}_chunks.json"

    if not index_path.exists() or not chunks_path.exists():
        print(f"[FAISS] Index not found for {report_id}. Searching empty.")
        return []

    index = faiss.read_index(str(index_path))
    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    query_vec = get_query_embedding(query)
    scores, indices = index.search(query_vec, min(top_k, len(chunks)))

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx != -1 and idx < len(chunks):
            results.append((chunks[idx], float(score)))

    return results

def delete_faiss_index(report_id: str) -> int:
    """Delete report-specific vector and chunk files; return the number removed."""
    removed = 0
    for suffix in (".index", "_chunks.json"):
        index_path = settings.FAISS_INDEX_DIR / f"{report_id}{suffix}"
        if index_path.exists():
            index_path.unlink()
            removed += 1
    return removed
