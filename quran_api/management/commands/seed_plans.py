from django.core.management.base import BaseCommand

from quran_api.models import SubscriptionPlan

PLANS = [
    {"name": "free", "price": 0, "daily_request_limit": 5, "features": {"name": "Free"}},
    {"name": "mensuel", "price": 2000, "daily_request_limit": 100, "features": {"name": "Mensuel Premium"}},
    {"name": "max", "price": 10000, "daily_request_limit": -1, "features": {"name": "Max", "advantage": "coming soon"}},
]


class Command(BaseCommand):
    help = "Create the subscription plans (idempotent). Existing quotas edited in the admin are kept."

    def handle(self, *args, **options):
        for plan in PLANS:
            obj, created = SubscriptionPlan.objects.get_or_create(
                name=plan["name"],
                defaults={k: v for k, v in plan.items() if k != "name"},
            )
            if not created:
                obj.price = plan["price"]
                obj.features = plan["features"]
                obj.save(update_fields=["price", "features"])
        self.stdout.write(self.style.SUCCESS("Plans seeded."))
