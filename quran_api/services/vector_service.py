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
        
        self.quran_index, self.quran_metadata = self._init_index(
            settings.FAISS_INDEX_PATH, 
            settings.QURAN_INDEX_PATH, 
            "Coran"
        )
        
        self.hadith_index, self.hadith_metadata = self._init_index(
            getattr(settings, 'HADITH_FAISS_INDEX_PATH', settings.BASE_DIR / 'hadith_faiss.index'), 
            getattr(settings, 'HADITH_INDEX_PATH', settings.BASE_DIR / 'hadith_indexed.json'), 
            "Hadith"
        )

    def _init_index(self, index_path, data_path, source_tag):
        if not os.path.exists(data_path):
            logger.warning(f"Data not found for {source_tag} at {data_path}")
            return None, []
        
        index = None
        metadata = []
        
        if os.path.exists(index_path):
            logger.info(f"Loading {source_tag} FAISS index from {index_path}...")
            index = faiss.read_index(str(index_path))
            with open(data_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
        else:
            logger.info(f"Rebuilding {source_tag} FAISS index from {data_path}...")
            with open(data_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            if len(metadata) > 0:
                embeddings = np.array([item['embedding'] for item in metadata]).astype('float32')
                dimension = embeddings.shape[1]
                index = faiss.IndexFlatL2(dimension)
                index.add(embeddings)
                
                faiss.write_index(index, str(index_path))
                logger.info(f"{source_tag} FAISS index built and saved to {index_path}")
            else:
                logger.warning(f"Metadata is empty for {source_tag}, cannot build index.")

        # Ensure we add the source_type to easily distinguish in the frontend/LLM
        for item in metadata:
            item['source_type'] = source_tag
            
        return index, metadata

    def search(self, query: str, top_k: int = 10, source_filter: str = 'both'):
        normalized_query = normalize_text(query)
        logger.debug(f"Original query: '{query}' → Normalized: '{normalized_query}' → Filter: {source_filter}")

        # E5 requires 'query: ' prefix for searching
        query_vector = self.model.encode([f"query: {normalized_query}"]).astype('float32')
        
        results = []
        
        # Search Quran
        if source_filter in ['both', 'quran']:
            if self.quran_index is not None and len(self.quran_metadata) > 0:
                distances, indices = self.quran_index.search(query_vector, top_k)
                for dist, idx in zip(distances[0], indices[0]):
                    if idx < len(self.quran_metadata):
                        item = self.quran_metadata[idx].copy()
                        item['score'] = float(dist)
                        if 'embedding' in item: del item['embedding']
                        results.append(item)
                    
        # Search Hadith
        if source_filter in ['both', 'hadith']:
            if self.hadith_index is not None and len(self.hadith_metadata) > 0:
                distances, indices = self.hadith_index.search(query_vector, top_k)
                for dist, idx in zip(distances[0], indices[0]):
                    if idx < len(self.hadith_metadata):
                        item = self.hadith_metadata[idx].copy()
                        item['score'] = float(dist)
                        if 'embedding' in item: del item['embedding']
                        results.append(item)
        
        # Sort combined results by distance (L2 distance: lower is closer/better)
        results.sort(key=lambda x: x['score'])
        
        # Return top_k overall
        return results[:top_k]

# Singleton instance
_vector_service = None

def get_vector_service():
    global _vector_service
    if _vector_service is None:
        _vector_service = VectorService()
    return _vector_service
