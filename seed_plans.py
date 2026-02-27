import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from quran_api.models import SubscriptionPlan

# Set up Free
plan, created = SubscriptionPlan.objects.get_or_create(
    name='free',
    defaults={
        'price': 0.00,
        'daily_request_limit': 5,
        'features': {'name': 'Free'}
    }
)

# Set up Mensuel
plan, created = SubscriptionPlan.objects.get_or_create(
    name='mensuel',
    defaults={
        'price': 2000.00,
        'daily_request_limit': 100, # arbitrarily set to 100
        'features': {'name': 'Mensuel Premium'}
    }
)
if not created:
    plan.price = 2000.00
    plan.save()

# Set up Max
plan, created = SubscriptionPlan.objects.get_or_create(
    name='max',
    defaults={
        'price': 10000.00,
        'daily_request_limit': -1, # unlimited
        'features': {'name': 'Max', 'advantage': 'coming soon'}
    }
)
if not created:
    plan.price = 10000.00
    plan.features = {'name': 'Max', 'advantage': 'coming soon'}
    plan.save()

print("Plans seeded successfully.")
