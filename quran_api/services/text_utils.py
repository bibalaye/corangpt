"""
Text normalization utilities for Quran search.

Ensures consistent matching between indexed content and user queries
by normalizing French (accents, casing) and Arabic (harakat, alif variants).
"""

import re
import unicodedata


def normalize_french(text: str) -> str:
    """
    Normalize French text for search:
    - lowercase
    - strip diacritics / accents  (é→e, â→a, ū→u, ā→a …)
    - collapse whitespace
    """
    text = text.lower()

    # Decompose unicode, then remove combining marks (accents)
    text = ''.join(
        c for c in unicodedata.normalize('NFD', text)
        if unicodedata.category(c) != 'Mn'
    )

    # Collapse multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def normalize_arabic(text: str) -> str:
    """
    Normalize Arabic text for search:
    - Unify alif variants  (أ إ آ → ا)
    - Unify alif maqsura   (ى → ي)
    - Unify hamza carriers  (ؤ → و , ئ → ي)
    - ta marbuta → ha       (ة → ه)
    - Remove harakat / tashkeel (fatha, damma, kasra, shadda, sukun …)
    """
    # Alif variants
    text = re.sub('[إأآٱ]', 'ا', text)

    # Alif maqsura → ya
    text = re.sub('ى', 'ي', text)

    # Hamza carriers
    text = re.sub('ؤ', 'و', text)
    text = re.sub('ئ', 'ي', text)

    # Ta marbuta → ha
    text = re.sub('ة', 'ه', text)

    # Remove harakat (U+064B – U+065F) and tatweel (U+0640)
    text = re.sub(r'[\u064B-\u065F\u0640]', '', text)

    return text


def normalize_text(text: str) -> str:
    """
    Full normalization pipeline for mixed FR/AR text.

    Applies both French and Arabic normalization, making the text
    suitable for embedding or keyword search.
    """
    text = normalize_french(text)
    text = normalize_arabic(text)
    return text
