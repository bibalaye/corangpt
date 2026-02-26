# 📖 IA Coran — Assistant Coranique Intelligent

> Moteur de recherche sémantique et assistant RAG (Retrieval-Augmented Generation) basé sur le Saint Coran. Posez vos questions en langage naturel et recevez des réponses sourcées, précises et sans hallucination.

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| **Recherche sémantique** | Trouve des versets par sens, pas par mots-clés exacts |
| **Assistant IA (RAG)** | Répond aux questions complexes en citant les versets appropriés |
| **Anti-hallucination** | L'IA ne répond que si la réponse est présente dans le Coran |
| **Bilingue** | Arabe (Uthmani) + Français (Hamidullah) |
| **Normalisation NLP** | Gestion des accents, harakat arabes et variantes orthographiques |
| **Query Rewriting** | Reformulation automatique des questions longues pour une meilleure recherche |
| **Frontend premium** | Interface chat inspirée de Claude — design crème, élégant et responsive |

---

## 🏗️ Architecture

```
iacoran/
├── core/                          # Configuration Django
│   ├── settings.py                # Variables d'environnement, config centralisée
│   ├── urls.py                    # Routage principal
│   └── wsgi.py                    # Point d'entrée WSGI
│
├── quran_api/                     # Application Django principale
│   ├── views.py                   # Endpoints REST (Search + Ask)
│   ├── urls.py                    # Routes de l'API
│   └── services/                  # Couche de services métier
│       ├── vector_service.py      # Recherche vectorielle FAISS + normalisation
│       ├── llm_service.py         # Gemini LLM + Query Rewriting
│       └── text_utils.py          # Normalisation FR/AR (accents, harakat)
│
├── frontend/                      # Interface utilisateur (Vite + TypeScript)
│   ├── index.html                 # Structure HTML
│   └── src/
│       ├── main.ts                # Logique chat + interactions
│       └── style.css              # Design premium (Claude-inspired)
│
├── index_quran.py                 # Script d'indexation des versets
├── quran_complet.json             # Données brutes (6236 versets AR + FR)
├── quran_indexed.json             # Données indexées + embeddings + texte normalisé
├── quran_faiss.index              # Index binaire FAISS
└── .env                           # Variables d'environnement (non commitées)
```

---

## 🧠 Pipeline RAG

Le cœur du système suit un pipeline d'optimisation en 4 étapes :

```
Question utilisateur
        │
        ▼
┌───────────────────────────────┐
│ 1. QUERY REWRITING (Gemini)   │  Questions longues → mots-clés optimisés
│    "Explique les règles du    │  → "jeûne Ramadan règles sawm صيام"
│     jeûne pendant Ramadan"    │
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│ 2. NORMALISATION              │  Accents FR + Harakat AR supprimés
│    "jeune ramadan regles"     │  → Matching cohérent query ↔ index
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│ 3. VECTOR SEARCH (FAISS)      │  top_k=10, modèle E5 multilingual
│    → 10 versets candidats     │  Préfixe "query: " pour E5
└───────────────────────────────┘
        │
        ▼
┌───────────────────────────────┐
│ 4. LLM GENERATION (Gemini)    │  Réponse naturelle et pédagogique
│    → Réponse + sources        │  basée sur la question ORIGINALE
└───────────────────────────────┘
```

### Normalisation NLP

Le module `text_utils.py` résout les problèmes classiques de matching texte :

| Problème | Avant | Après normalisation |
|----------|-------|---------------------|
| Accents FR | `Ramadān` ≠ `ramadan` | `ramadan` = `ramadan` ✅ |
| Casse | `Jeûne` ≠ `jeune` | `jeune` = `jeune` ✅ |
| Harakat AR | `صِيَامُ` ≠ `صيام` | `صيام` = `صيام` ✅ |
| Variantes Alif | `إِ` / `أَ` / `آ` → `ا` | Unifié ✅ |

---

## 🛠️ Stack Technique

### Backend
- **Django 5** + Django REST Framework
- **FAISS** (Facebook AI Similarity Search) — recherche vectorielle
- **SentenceTransformers** — modèle `intfloat/multilingual-e5-base` (768 dimensions)
- **Google Gemini 3 Flash** — LLM pour le query rewriting et la génération de réponses
- **Python 3.11+**

### Frontend
- **Vite 8** + TypeScript
- Design inspiré de **Claude** — palette crème/beige, typographie Inter/Outfit/Amiri
- Responsive avec sidebar coulissante sur mobile
- Micro-animations (hover, slide-in, pulse)

---

## 📦 Installation & Démarrage

### Pré-requis
- **Python 3.11+**
- **Node.js 18+** (npm inclus)
- **Git**
- Une **clé API Google AI** (Gemini) → [Obtenir ici](https://aistudio.google.com/apikey)

---

### Étape 1 — Cloner le projet

```powershell
git clone <repo-url> iacoran
cd iacoran
```

---

### Étape 2 — Environnement virtuel Python

```powershell
# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement virtuel (Windows PowerShell)
.\venv\Scripts\activate

# Installer toutes les dépendances depuis le fichier gelé
pip install -r requirements.txt
```

> **Note** : Si `requirements.txt` n'existe pas encore, installez manuellement :
> ```powershell
> pip install django djangorestframework faiss-cpu sentence-transformers google-generativeai python-dotenv django-cors-headers
> pip freeze > requirements.txt
> ```

---

### Étape 3 — Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet :

```ini
DJANGO_SECRET_KEY=votre_cle_secrete_django
GEMINI_API_KEY=votre_cle_api_gemini
DJANGO_DEBUG=True
```

---

### Étape 4 — Migrations de la base de données

```powershell
# Créer les tables dans la base de données SQLite
python manage.py makemigrations
python manage.py migrate

# (Optionnel) Créer un superutilisateur pour l'admin Django
python manage.py createsuperuser
```

---

### Étape 5 — Indexation des versets du Coran

```powershell
# Générer les embeddings normalisés à partir de quran_complet.json
# ⚠️ Cette étape peut prendre ~20 minutes selon votre machine
python index_quran.py
```

Cela génère :
- `quran_indexed.json` — données + embeddings + texte normalisé
- `quran_faiss.index` — index binaire FAISS (créé automatiquement au premier lancement du serveur)

---

### Étape 6 — Lancer le serveur backend

```powershell
python manage.py runserver
```

✅ Le backend est accessible sur **http://localhost:8000**
- Admin Django : http://localhost:8000/admin/
- API Search : http://localhost:8000/api/search/?q=patience
- API Ask : http://localhost:8000/api/ask/ (POST)

---

### Étape 7 — Lancer le frontend

```powershell
# Dans un nouveau terminal
cd frontend

# Installer les dépendances Node.js
npm install

# Lancer le serveur de développement Vite
npm run dev
```

✅ Le frontend est accessible sur **http://localhost:5173**

---

### 🚀 Résumé rapide (copier-coller)

Pour démarrer le projet complet en une seule séquence :

```powershell
# Terminal 1 — Backend
cd iacoran
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver

# Terminal 2 — Frontend
cd iacoran/frontend
npm install
npm run dev
```

---

## 🔌 API Endpoints

### 1. Recherche sémantique

Retourne les versets les plus proches sémantiquement de la requête.

- **URL** : `GET /api/search/`
- **Paramètres** : `q` (requête), `limit` (optionnel, défaut: 5)

```bash
GET /api/search/?q=importance de la charité&limit=3
```

### 2. Assistant IA (Questions/Réponses)

Génère une réponse structurée basée sur les versets trouvés.

- **URL** : `POST /api/ask/`
- **Corps (JSON)** :

```json
{
  "q": "Comment le Coran décrit-il la création de l'univers ?",
  "limit": 5
}
```

- **Réponse** :

```json
{
  "question": "Comment le Coran décrit-il la création de l'univers ?",
  "answer": "Le Coran évoque la création de l'univers...",
  "sources": [
    {
      "reference": "Sourate 21 (Al-Anbiya), Verset 30",
      "text_ar": "...",
      "text_fr": "..."
    }
  ]
}
```

---

## 🛡️ Sécurité

- Les clés API ne doivent **jamais** être commitées (utiliser `.env`)
- Le LLM est bridé par un prompt système strict pour éviter les réponses hors contexte
- Les entrées utilisateur sont normalisées et validées côté serveur
- CORS configuré (à restreindre en production)

---

## 📊 Optimisations implémentées

| Technique | Impact | Statut |
|-----------|--------|--------|
| Normalisation FR (accents, casse) | ⭐⭐⭐⭐ | ✅ |
| Normalisation AR (harakat, alif) | ⭐⭐⭐⭐ | ✅ |
| Query Rewriting (Gemini) | ⭐⭐⭐⭐⭐ | ✅ |
| Préfixe E5 (`query:` / `passage:`) | ⭐⭐⭐⭐⭐ | ✅ |
| top_k étendu (10 → LLM filtre) | ⭐⭐⭐ | ✅ |
| Hybrid Search (BM25 + Vector) | ⭐⭐⭐⭐⭐ | 🔜 |
| Re-ranking (Cross-Encoder) | ⭐⭐⭐⭐ | 🔜 |

---

## 👤 Auteur

abibou
