from django.conf import settings
from django.db import models


class Album(models.Model):
    owner_id = models.PositiveIntegerField(db_index=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class StoredFile(models.Model):
    owner_id = models.PositiveIntegerField(db_index=True)
    original_name = models.CharField(max_length=255)
    blob_name = models.CharField(max_length=512, unique=True)
    thumb_name = models.CharField(max_length=512, blank=True, null=True)
    content_type = models.CharField(max_length=120, blank=True)
    size = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    album = models.ForeignKey(
        Album,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="photos",
    )

    class Meta:
        ordering = ["-created_at"]


class UserQuota(models.Model):
    user_id = models.PositiveIntegerField(unique=True)
    limit_bytes = models.BigIntegerField(default=settings.DEFAULT_USER_QUOTA_BYTES)
    used_bytes = models.BigIntegerField(default=0)
