import json
from sentence_transformers import SentenceTransformer
import os
import sys
import torch

# Add project root to path so we can import from quran_api
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from quran_api.services.text_utils import normalize_text, normalize_arabic, normalize_french


def create_improved_index(input_file="quran_complet.json", output_file="quran_indexed.json"):
    """
    Indexation haute résolution : 1 verset = 1 doc.
    Modèle : Multilingual E5 Base (Performance Top-tier).

    Normalisation appliquée :
    - Français : accents, casse, caractères spéciaux
    - Arabe : harakat, variantes alif, ta marbuta
    """
    if not os.path.exists(input_file):
        print(f"Fichier {input_file} introuvable.")
        return

    print("Chargement du modèle Multilingual E5 Base...")
    model = SentenceTransformer('intfloat/multilingual-e5-base')
    
    with open(input_file, 'r', encoding='utf-8') as f:
        quran_data = json.load(f)

    indexed_docs = []
    total = len(quran_data)
    print(f"Début de l'indexation de {total} versets (avec normalisation)...")

    for i, v in enumerate(quran_data):
        # --- Texte original (pour affichage) ---
        original_fr = v['text_fr']
        original_ar = v['text_ar']

        # --- Texte normalisé (pour recherche & embedding) ---
        normalized_fr = normalize_french(original_fr)
        normalized_ar = normalize_arabic(original_ar)

        # Embedding sur le texte normalisé (FR + AR combinés)
        content_normalized = f"{normalized_fr} {normalized_ar}"
        text_to_embed = f"passage: {content_normalized}"
        
        embedding = model.encode(text_to_embed, convert_to_tensor=False).tolist()
        
        doc = {
            "id": f"v_{v['sourate']}_{v['ayah']}",
            "reference": f"Sourate {v['sourate']} ({v['sourate_name']}), Verset {v['ayah']}",
            "text_fr": original_fr,
            "text_ar": original_ar,
            "normalized_fr": normalized_fr,
            "normalized_ar": normalized_ar,
            "embedding": embedding,
            "metadata": {
                "sourate": v['sourate'],
                "ayah": v['ayah'],
                "sourate_name": v['sourate_name']
            }
        }
        indexed_docs.append(doc)
        
        if i % 200 == 0:
            print(f"Progression : {i}/{total} versets indexés...")

    print(f"Sauvegarde de l'index dans {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(indexed_docs, f, ensure_ascii=False)
    
    print("🚀 Indexation haute résolution terminée (avec normalisation FR + AR) !")

if __name__ == "__main__":
    create_improved_index()

