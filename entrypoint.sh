#!/usr/bin/env bash
# ==============================================================
# entrypoint.sh – iaCoran Django startup script for Render
# ==============================================================
# Steps executed on each container start:
#   1. Apply database migrations
#   2. Collect static files
#   3. Create superuser (if env vars provided)
#   4. Seed subscription plans
#   5. Build FAISS indexes for Quran & Hadith (if missing)
#   6. Start Gunicorn
# ==============================================================
set -e

echo "============================================="
echo "  🚀 iaCoran – Démarrage du conteneur"
echo "============================================="

# ---- 1. Migrations ----
echo ""
echo "📦 [1/5] Application des migrations..."
python manage.py migrate --noinput
echo "✅ Migrations appliquées."

# ---- 2. Collect static files ----
echo ""
echo "📁 [2/5] Collecte des fichiers statiques..."
python manage.py collectstatic --noinput
echo "✅ Fichiers statiques collectés."

# ---- 3. Superuser creation ----
echo ""
echo "👤 [3/5] Création du superuser..."
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    python manage.py createsuperuser --noinput \
        --username "$DJANGO_SUPERUSER_USERNAME" \
        --email "$DJANGO_SUPERUSER_EMAIL" \
        2>/dev/null || echo "ℹ️  Superuser existe déjà ou erreur ignorée."
    echo "✅ Superuser configuré."
else
    echo "⚠️  Variables DJANGO_SUPERUSER_* non définies – superuser ignoré."
fi

# ---- 4. Seed plans ----
echo ""
echo "🌱 [4/5] Seed des plans d'abonnement..."
python seed_plans.py
echo "✅ Plans seedés."

# ---- 5. Build FAISS indexes (Quran + Hadith) ----
echo ""
echo "🔍 [5/5] Vérification et construction des index FAISS..."

if [ ! -f "/app/quran_faiss.index" ]; then
    echo "   ⏳ Construction de l'index Quran FAISS..."
    python index_quran.py
    echo "   ✅ Index Quran FAISS créé."
else
    echo "   ✅ Index Quran FAISS déjà présent."
fi

if [ ! -f "/app/hadith_faiss.index" ]; then
    echo "   ⏳ Construction de l'index Hadith FAISS..."
    python index_hadith.py
    echo "   ✅ Index Hadith FAISS créé."
else
    echo "   ✅ Index Hadith FAISS déjà présent."
fi

# ---- 6. Start Gunicorn ----
echo ""
echo "============================================="
echo "  🟢 Démarrage de Gunicorn sur le port ${PORT:-8000}"
echo "============================================="

exec gunicorn core.wsgi:application \
    --bind "0.0.0.0:${PORT:-8000}" \
    --workers "${GUNICORN_WORKERS:-2}" \
    --threads "${GUNICORN_THREADS:-4}" \
    --timeout "${GUNICORN_TIMEOUT:-120}" \
    --access-logfile - \
    --error-logfile -
