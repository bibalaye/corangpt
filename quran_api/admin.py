from django.contrib import admin
from .models import UserProfile, SubscriptionPlan, ChatHistory

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'daily_request_limit')
    search_fields = ('name',)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'subscription_plan', 'requests_today', 'last_request_date')
    search_fields = ('user__username', 'user__email')
    list_filter = ('subscription_plan',)

@admin.register(ChatHistory)
class ChatHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'query', 'created_at')
    search_fields = ('user__username', 'query', 'response')
    list_filter = ('created_at', 'user')
