from rest_framework import serializers

from .models import Album, StoredFile


class AlbumSerializer(serializers.ModelSerializer):
    photo_count = serializers.SerializerMethodField()

    class Meta:
        model = Album
        fields = ["id", "owner_id", "name", "description", "created_at", "photo_count"]
        read_only_fields = ["id", "owner_id", "created_at", "photo_count"]

    def get_photo_count(self, obj):
        return obj.photos.count()


class StoredFileSerializer(serializers.ModelSerializer):
    album_id = serializers.PrimaryKeyRelatedField(
        source="album",
        queryset=Album.objects.all(),
        required=False,
        allow_null=True,
    )
    url = serializers.SerializerMethodField()

    class Meta:
        model = StoredFile
        fields = [
            "id",
            "owner_id",
            "original_name",
            "blob_name",
            "thumb_name",
            "content_type",
            "size",
            "created_at",
            "album_id",
            "url",
        ]
        read_only_fields = [
            "id",
            "owner_id",
            "blob_name",
            "thumb_name",
            "content_type",
            "size",
            "created_at",
        ]

    def get_url(self, obj):
        from django.conf import settings
        if getattr(settings, "AZURE_STORAGE_CONNECTION_STRING", ""):
            try:
                from azure.storage.blob import generate_blob_sas, BlobSasPermissions
                from datetime import datetime, timedelta, timezone

                conn_params = {}
                for param in settings.AZURE_STORAGE_CONNECTION_STRING.split(';'):
                    if '=' in param:
                        k, v = param.split('=', 1)
                        conn_params[k.strip()] = v.strip()

                account_name = conn_params.get("AccountName")
                account_key = conn_params.get("AccountKey")

                if account_name and account_key:
                    sas_token = generate_blob_sas(
                        account_name=account_name,
                        container_name=settings.AZURE_STORAGE_CONTAINER,
                        blob_name=obj.blob_name,
                        account_key=account_key,
                        permission=BlobSasPermissions(read=True),
                        expiry=datetime.now(timezone.utc) + timedelta(hours=1)
                    )
                    return f"https://{account_name}.blob.core.windows.net/{settings.AZURE_STORAGE_CONTAINER}/{obj.blob_name}?{sas_token}"
            except Exception as e:
                print("Error generating SAS URL:", str(e))

        return f"/api/files/{obj.id}/download/"
