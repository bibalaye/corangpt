import requests
import json
import logging
from typing import Dict, List
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clean_text(text: str) -> str:
    """Clean HTML tags and extra spaces from text."""
    # Supprimer les balises HTML si présentes
    text = re.sub(r'<[^>]+>', '', text)
    # Remplacer les espaces multiples par un seul
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def download_and_merge_hadiths():
    fra_url = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/fra-bukhari.json'
    ara_url = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari.json'

    logger.info("Téléchargement de Sahih al-Bukhari (Français)...")
    fra_resp = requests.get(fra_url)
    fra_data = fra_resp.json()

    logger.info("Téléchargement de Sahih al-Bukhari (Arabe)...")
    ara_resp = requests.get(ara_url)
    ara_data = ara_resp.json()

    logger.info("Fusion des données (Français + Arabe)...")
    
    # Créer un dictionnaire pour l'arabe par hadithnumber
    ara_dict = {h['hadithnumber']: h['text'] for h in ara_data['hadiths']}

    merged_hadiths = []
    
    for fra_h in fra_data['hadiths']:
        hadith_no = fra_h['hadithnumber']
        
        # Ignorer les hadiths sans texte valide
        text_fr = clean_text(fra_h.get('text', ''))
        text_ar = clean_text(ara_dict.get(hadith_no, ''))

        if not text_fr or not text_ar:
            continue

        book_no = fra_h.get('reference', {}).get('book', 0)
        
        # Tous les Bukhari sont Sahih, on peut affirmer "Sahih" globalement,
        # ou utiliser les `grades` s'ils existent dans fra_h.
        grades = fra_h.get('grades', [])
        grade = "Sahih" 
        for g in grades:
            if g.get('name') == 'Sahih Bukhari':
                grade = g.get('grade', 'Sahih')

        merged_hadith = {
            "collection": "Sahih al-Bukhari",
            "book_number": book_no,
            "hadith_number": hadith_no,
            "grade": grade,
            "text_ar": text_ar,
            "text_fr": text_fr,
            "keywords": [] # Peut être rempli plus tard, ou par extraction Mots-clés
        }
        
        merged_hadiths.append(merged_hadith)

    output_file = 'bukhari_complet.json'
    logger.info(f"Sauvegarde de {len(merged_hadiths)} hadiths dans {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(merged_hadiths, f, ensure_ascii=False, indent=2)

    logger.info("Opération terminée avec succès !")

if __name__ == "__main__":
    download_and_merge_hadiths()
