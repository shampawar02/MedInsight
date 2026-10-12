from typing import List
import numpy as np

_embedder_model = None

def get_embedding_model():
    global _embedder_model
    if _embedder_model is None:
        print("[Embedder] Loading sentence-transformers model (all-MiniLM-L6-v2)...")
        from sentence_transformers import SentenceTransformer
        _embedder_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder_model

def get_embeddings(texts: List[str]) -> np.ndarray:
    """Generates normalized vector embeddings for a list of string chunks."""
    if not texts:
        return np.empty((0, 384), dtype=np.float32)
    model = get_embedding_model()
    embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    return embeddings.astype(np.float32)

def get_query_embedding(query: str) -> np.ndarray:
    """Generates a 1D normalized vector embedding for a single search question."""
    model = get_embedding_model()
    embedding = model.encode([query], convert_to_numpy=True, normalize_embeddings=True)
    return embedding.astype(np.float32)
