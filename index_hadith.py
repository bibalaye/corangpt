import json
from sentence_transformers import SentenceTransformer
import os
import sys

# Add project root to path so we can import from quran_api
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from quran_api.services.text_utils import normalize_text, normalize_arabic, normalize_french

def create_hadith_index(input_file="bukhari_complet.json", output_file="hadith_indexed.json"):
    """
    Indexation pour les Hadiths.
    Modèle : Multilingual E5 Base (Performance Top-tier).
    """
    if not os.path.exists(input_file):
        print(f"Fichier {input_file} introuvable.")
        return

    print("Chargement du modèle Multilingual E5 Base...")
    model = SentenceTransformer('intfloat/multilingual-e5-base')
    
    with open(input_file, 'r', encoding='utf-8') as f:
        hadith_data = json.load(f)

    indexed_docs = []
    total = len(hadith_data)
    print(f"Début de l'indexation de {total} hadiths...")

    for i, v in enumerate(hadith_data):
        # --- Texte original ---
        original_fr = v['text_fr']
        original_ar = v['text_ar']

        # --- Texte normalisé ---
        normalized_fr = normalize_french(original_fr)
        normalized_ar = normalize_arabic(original_ar)

        # Embedding sur le texte normalisé (FR + AR combinés)
        content_normalized = f"{normalized_fr} {normalized_ar}"
        # using the 'passage: ' prefix required by multilingual-e5
        text_to_embed = f"passage: {content_normalized}"
        
        embedding = model.encode(text_to_embed, convert_to_tensor=False).tolist()
        
        doc = {
            "id": f"h_{v['collection']}_{v['book_number']}_{v['hadith_number']}",
            "reference": f"{v['collection']}, Livre {v['book_number']}, Hadith {v['hadith_number']} ({v['grade']})",
            "text_fr": original_fr,
            "text_ar": original_ar,
            "normalized_fr": normalized_fr,
            "normalized_ar": normalized_ar,
            "embedding": embedding,
            "metadata": {
                "collection": v['collection'],
                "book_number": v['book_number'],
                "hadith_number": v['hadith_number'],
                "grade": v['grade']
            }
        }
        indexed_docs.append(doc)
        
        if i % 200 == 0:
            print(f"Progression : {i}/{total} hadiths indexés...")

    print(f"Sauvegarde de l'index dans {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(indexed_docs, f, ensure_ascii=False)
    
    print("🚀 Indexation des hadiths terminée !")

if __name__ == "__main__":
    create_hadith_index()
