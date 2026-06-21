from rest_framework import serializers
from django.urls import reverse

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
    download_url = serializers.SerializerMethodField()

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
            "download_url",
        ]
        read_only_fields = [
            "id",
            "owner_id",
            "blob_name",
            "thumb_name",
            "content_type",
            "size",
            "created_at",
            "url",
            "download_url",
        ]

    def _public_path(self, obj) -> str:
        return reverse("public-file", kwargs={"blob_name": obj.blob_name})

    def get_url(self, obj):
        request = self.context.get("request")
        path = self._public_path(obj)
        if request is not None:
            return request.build_absolute_uri(path)
        return path

    def get_download_url(self, obj):
        request = self.context.get("request")
        path = f"{self._public_path(obj)}?download=1"
        if request is not None:
            return request.build_absolute_uri(path)
        return path
