from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from .services import UserService

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'email', 'firstName', 'lastName', 'bio', 'website', 
            'avatar', 'role', 'isVerified', 'createdAt', 'isBlocked', 
            'tokenUsed', 'totalToken'
        )
        read_only_fields = ('id', 'createdAt', 'role', 'tokenUsed', 'totalToken', 'isVerified', 'isBlocked')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'firstName', 'lastName')

    def create(self, validated_data):
        user = UserService.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('firstName', ''),
            last_name=validated_data.get('lastName', '')
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'}, trim_whitespace=False)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'), email=email, password=password)

            if not user:
                msg = 'Unable to log in with provided credentials.'
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = 'Must include "email" and "password".'
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs
