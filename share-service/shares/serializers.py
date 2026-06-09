from rest_framework import serializers
from django.utils import timezone

from .models import ShareLink


class ShareLinkSerializer(serializers.ModelSerializer):
    """Serializer cho ShareLink model"""
    
    is_expired = serializers.SerializerMethodField()
    can_access = serializers.SerializerMethodField()
    
    class Meta:
        model = ShareLink
        fields = [
            "id",
            "token",
            "file_id",
            "owner_id",
            "is_active",
            "created_at",
            "expires_at",
            "access_count",
            "last_accessed_at",
            "is_expired",
            "can_access",
        ]
        read_only_fields = [
            "id",
            "token",
            "owner_id",
            "created_at",
            "access_count",
            "last_accessed_at",
            "is_expired",
            "can_access",
        ]
    
    def get_is_expired(self, obj):
        """Kiểm tra link đã hết hạn chưa"""
        return obj.is_expired()
    
    def get_can_access(self, obj):
        """Kiểm tra link có thể truy cập được không"""
        can_access, message = obj.can_access()
        return {
            "allowed": can_access,
            "message": message,
        }


class CreateShareLinkSerializer(serializers.ModelSerializer):
    """Serializer để tạo link chia sẻ mới"""
    
    class Meta:
        model = ShareLink
        fields = ["file_id", "is_active", "expires_at"]
    
    def validate_expires_at(self, value):
        """Xác thực expires_at phải trong tương lai"""
        if value and value <= timezone.now():
            raise serializers.ValidationError(
                "Ngày hết hạn phải là trong tương lai"
            )
        return value
    
    def validate_file_id(self, value):
        """Xác thực file_id phải dương"""
        if value <= 0:
            raise serializers.ValidationError(
                "ID file phải là một số dương"
            )
        return value


class ShareLinkDetailSerializer(serializers.ModelSerializer):
    """Serializer để lấy chi tiết link chia sẻ"""
    
    is_expired = serializers.SerializerMethodField()
    can_access = serializers.SerializerMethodField()
    
    class Meta:
        model = ShareLink
        fields = [
            "token",
            "file_id",
            "is_active",
            "created_at",
            "expires_at",
            "access_count",
            "last_accessed_at",
            "is_expired",
            "can_access",
        ]
        read_only_fields = fields
    
    def get_is_expired(self, obj):
        return obj.is_expired()
    
    def get_can_access(self, obj):
        can_access, message = obj.can_access()
        return {
            "allowed": can_access,
            "message": message,
        }
