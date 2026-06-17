from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model

from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from .services import UserService
from .permissions import IsAdminRole

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens
        tokens = UserService.get_tokens_for_user(user)
        
        response = Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "message": "Registration successful"
        }, status=status.HTTP_201_CREATED)
        
        response.set_cookie(
            'access',
            tokens['access'],
            httponly=True,
            samesite='Lax'
        )
        response.set_cookie(
            'refresh',
            tokens['refresh'],
            httponly=True,
            samesite='Lax'
        )
        return response


class LoginView(generics.GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Generate tokens
        tokens = UserService.get_tokens_for_user(user)
        
        response = Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "message": "Login successful"
        }, status=status.HTTP_200_OK)
        
        response.set_cookie(
            'access',
            tokens['access'],
            httponly=True,
            samesite='Lax'
        )
        response.set_cookie(
            'refresh',
            tokens['refresh'],
            httponly=True,
            samesite='Lax'
        )
        return response


class UserProfileViewSet(viewsets.ModelViewSet):
    """
    Allows a user to view and edit their own profile.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # A user can only see their own profile
        return User.objects.filter(id=self.request.user.id)
    
    def get_object(self):
        return self.request.user


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Allows admins to manage all users.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
