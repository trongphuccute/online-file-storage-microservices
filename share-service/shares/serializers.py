from rest_framework import serializers

from .models import ShareLink


class ShareLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShareLink
        fields = ["id", "token", "file_id", "owner_id", "is_active", "created_at", "expires_at"]
        read_only_fields = ["id", "token", "owner_id", "created_at"]
