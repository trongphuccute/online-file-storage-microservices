from rest_framework import serializers
from django.utils import timezone

from .models import ShareLink


class ShareLinkSerializer(serializers.ModelSerializer):
    """Serializer chính cho ShareLink — dùng cho list, detail, update."""

    class Meta:
        model = ShareLink
        fields = [
            "id", "token", "file_id", "owner_id",
            "is_active", "created_at", "expires_at",
            "access_count", "last_accessed_at",
        ]
        read_only_fields = ["id", "token", "owner_id", "created_at",
                            "access_count", "last_accessed_at"]

    def validate_file_id(self, value):
        if value <= 0:
            raise serializers.ValidationError("file_id must be a positive integer.")
        return value


# Alias — views.py import tên này khi tạo share link
CreateShareLinkSerializer = ShareLinkSerializer

# Alias — views.py import tên này cho public/detail response
ShareLinkDetailSerializer = ShareLinkSerializer
