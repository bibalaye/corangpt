#!/usr/bin/env bash
# iaCoran – container startup: migrations, plans, optional superuser, Gunicorn.
set -euo pipefail

echo "▶ Migrations"
python manage.py migrate --noinput

echo "▶ Subscription plans"
python manage.py seed_plans

# The superuser is created only when a password is explicitly provided
# (no default password baked into the image).
if [[ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]]; then
    echo "▶ Superuser"
    python manage.py createsuperuser --noinput \
        --username "${DJANGO_SUPERUSER_USERNAME:-admin}" \
        --email "${DJANGO_SUPERUSER_EMAIL:-admin@example.com}" 2>/dev/null \
        || echo "  superuser already exists"
fi

echo "▶ Gunicorn on port ${PORT:-8000}"
exec gunicorn -c gunicorn.conf.py core.wsgi:application
