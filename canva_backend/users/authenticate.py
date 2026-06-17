from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom authentication class that falls back to checking the 'access' cookie 
    if the Authorization header is not provided.
    """
    def authenticate(self, request):
        header = self.get_header(request)
        
        # If the header is missing, try to extract from cookies
        if header is None:
            raw_token = request.COOKIES.get('access') or None
        else:
            raw_token = self.get_raw_token(header)
            
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
