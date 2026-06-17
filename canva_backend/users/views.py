from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model

from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from .services import UserService
from .permissions import IsAdminRole
from common.s3_service import upload_file_to_s3

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


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Allows a user to view and edit their own profile.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Create a mutable copy of request data
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)

        # Handle avatar file upload
        if 'avatar' in request.FILES:
            avatar_file = request.FILES['avatar']
            try:
                s3_url = upload_file_to_s3(avatar_file, folder='avatars')
                data['avatar'] = s3_url
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)


class ChangePasswordView(generics.GenericAPIView):
    """
    Allows a user to change their password.
    """
    permission_classes = [IsAuthenticated]

    def put(self, request, *args, **kwargs):
        user = request.user
        current_password = request.data.get("currentPassword")
        new_password = request.data.get("newPassword")

        if not current_password or not new_password:
            return Response({"error": "currentPassword and newPassword are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(current_password):
            return Response({"error": "Wrong current password."}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Allows admins to manage all users.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
