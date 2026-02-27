from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ChatHistory, UserProfile, SubscriptionPlan

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'price', 'daily_request_limit', 'features']

class UserProfileSerializer(serializers.ModelSerializer):
    subscription_plan = SubscriptionPlanSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['subscription_plan', 'subscription_end_date', 'requests_today', 'last_request_date']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']

class ChatHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatHistory
        fields = ['id', 'user', 'query', 'response', 'sources', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
