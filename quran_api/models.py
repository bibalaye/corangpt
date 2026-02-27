from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver

class SubscriptionPlan(models.Model):
    PLAN_CHOICES = (
        ('free', 'Free'),
        ('mensuel', 'Mensuel (2000 FCFA)'),
        ('max', 'Max (10000 FCFA)'),
    )

    name = models.CharField(max_length=20, choices=PLAN_CHOICES, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    daily_request_limit = models.IntegerField(default=5, help_text="Set to -1 for unlimited")
    features = models.JSONField(default=dict, blank=True, help_text="JSON mapping for extra features like 'coming_soon'")

    def __str__(self):
        return self.get_name_display()

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    subscription_plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True)
    subscription_end_date = models.DateTimeField(null=True, blank=True)
    requests_today = models.IntegerField(default=0)
    last_request_date = models.DateField(default=timezone.localdate)

    def __str__(self):
        return self.user.username
    
    def can_make_request(self):
        # Reset daily count if the day has changed
        today = timezone.now().date()
        if self.last_request_date != today:
            self.requests_today = 0
            self.last_request_date = today
            self.save()
        
        limit = self.subscription_plan.daily_request_limit if self.subscription_plan else 5
        
        if limit == -1:
            return True
            
        return self.requests_today < limit
        
    def increment_request(self):
        self.requests_today += 1
        self.save()

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Default to free plan if it exists
        free_plan, _ = SubscriptionPlan.objects.get_or_create(
            name='free',
            defaults={'price': 0, 'daily_request_limit': 5}
        )
        UserProfile.objects.create(user=instance, subscription_plan=free_plan)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

class ChatHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_history')
    query = models.TextField()
    response = models.TextField()
    sources = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.query[:50]}"
