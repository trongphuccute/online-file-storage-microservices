from rest_framework import serializers

from .models import ShareLink


class ShareLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShareLink
        fields = ["id", "token", "file_id", "owner_id", "is_active", "created_at", "expires_at"]
        # file_id KHÔNG read_only để POST /shares/create/ nhận được
        read_only_fields = ["id", "token", "owner_id", "created_at"]

    def validate_file_id(self, value):
        """Validate file_id là positive integer"""
        if value <= 0:
            raise serializers.ValidationError("file_id must be a positive integer.")
        return value
