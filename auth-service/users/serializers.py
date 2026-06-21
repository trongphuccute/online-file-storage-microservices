from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import UserProfile


def _role_for(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile.role


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value.lower()

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.get_or_create(user=user)
        return user


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "date_joined", "role"]

    def get_role(self, obj):
        return _role_for(obj)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate_new_password(self, value):
        user = self.context["request"].user
        if user.check_password(value):
            raise serializers.ValidationError(
                "New password must be different from old password."
            )
        return value


class CustomTokenObtainSerializer(TokenObtainPairSerializer):
    def get_token(self, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["email"] = user.email
        token["user_id"] = user.id
        token["role"] = _role_for(user)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["username"] = self.user.username
        data["email"] = self.user.email
        data["user_id"] = self.user.id
        data["role"] = _role_for(self.user)
        return data
