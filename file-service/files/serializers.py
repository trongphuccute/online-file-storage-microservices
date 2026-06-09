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
