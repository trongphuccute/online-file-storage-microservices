from rest_framework import serializers

from .models import StoredFile


class StoredFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoredFile
        fields = [
            "id",
            "owner_id",
            "original_name",
            "blob_name",
            "content_type",
            "size",
            "created_at",
        ]
        read_only_fields = fields
