from rest_framework import serializers
from django.conf import settings
from .models import StoredFile


class StoredFileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

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
            "url",
        ]
        read_only_fields = fields

    def get_url(self, obj):
        conn_str = getattr(settings, "AZURE_STORAGE_CONNECTION_STRING", "")
        if conn_str:
            account_name = "mystorage"
            for part in conn_str.split(";"):
                if part.lower().startswith("accountname="):
                    account_name = part.split("=")[1]
            container = getattr(settings, "AZURE_STORAGE_CONTAINER", "uploads")
            return f"https://{account_name}.blob.core.windows.net/{container}/{obj.blob_name}"

        request = self.context.get("request")
        media_url = f"{settings.MEDIA_URL}{obj.blob_name}"
        if request:
            return request.build_absolute_uri(media_url)
        return f"http://localhost:8002{media_url}"
