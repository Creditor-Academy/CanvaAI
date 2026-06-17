from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Subscription

User = get_user_model()

class SubscriptionService:
    @staticmethod
    def create_default_subscription(user):
        """
        Creates a default free tier subscription for a newly registered user.
        """
        return Subscription.objects.create(user=user, plan='free')

class UserService:
    @staticmethod
    def create_user(email, password, first_name='', last_name=''):
        """
        Handles the creation of a standard user and triggers necessary side-effects (like subscription).
        """
        user = User.objects.create_user(
            email=email,
            password=password,
            firstName=first_name,
            lastName=last_name
        )
        # Create default subscription directly instead of using signals
        SubscriptionService.create_default_subscription(user)
        return user

    @staticmethod
    def get_tokens_for_user(user):
        """
        Generates JWT tokens for an authenticated user.
        """
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
