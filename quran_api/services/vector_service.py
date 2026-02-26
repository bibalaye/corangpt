import faiss
import numpy as np
import json
from sentence_transformers import SentenceTransformer
from django.conf import settings
from .text_utils import normalize_text
import os
import logging

logger = logging.getLogger(__name__)

class VectorService:
    def __init__(self):
        self.model = SentenceTransformer(settings.MODEL_NAME)
        self.index_path = settings.FAISS_INDEX_PATH
        self.data_path = settings.QURAN_INDEX_PATH
        self.index = None
        self.metadata = []
        
        # Load or initialize
        if os.path.exists(self.index_path) and os.path.exists(self.data_path):
            self._load_index()
        else:
            self._rebuild_index()

    def _load_index(self):
        logger.info("Loading FAISS index...")
        self.index = faiss.read_index(str(self.index_path))
        with open(self.data_path, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)

    def _rebuild_index(self):
        """Rebuilds FAISS index from quran_indexed.json if it exists."""
        if not os.path.exists(self.data_path):
            logger.error(f"Quran indexed data not found at {self.data_path}")
            return

        logger.info("Rebuilding FAISS index from metadata...")
        with open(self.data_path, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)

        # Extract embeddings
        embeddings = np.array([item['embedding'] for item in self.metadata]).astype('float32')
        
        # Create FAISS index
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings)
        
        # Save index
        faiss.write_index(self.index, str(self.index_path))
        logger.info(f"FAISS index built and saved to {self.index_path}")

    def search(self, query: str, top_k: int = 5):
        if self.index is None:
            return []

        # Normalize the query the same way we normalized the indexed data
        normalized_query = normalize_text(query)
        logger.debug(f"Original query: '{query}' → Normalized: '{normalized_query}'")

        # E5 requires 'query: ' prefix for searching
        query_vector = self.model.encode([f"query: {normalized_query}"]).astype('float32')
        
        # Search FAISS
        distances, indices = self.index.search(query_vector, top_k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.metadata):
                item = self.metadata[idx].copy()
                item['score'] = float(dist)
                # Remove embedding from result sent to API
                if 'embedding' in item: del item['embedding']
                results.append(item)
        
        return results

# Singleton instance
_vector_service = None

def get_vector_service():
    global _vector_service
    if _vector_service is None:
        _vector_service = VectorService()
    return _vector_service
