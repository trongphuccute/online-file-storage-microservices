from django.conf import settings
from django.db import models


class StoredFile(models.Model):
    owner_id = models.PositiveIntegerField(db_index=True)
    original_name = models.CharField(max_length=255)
    blob_name = models.CharField(max_length=512, unique=True)
    content_type = models.CharField(max_length=120, blank=True)
    size = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class UserQuota(models.Model):
    user_id = models.PositiveIntegerField(unique=True)
    limit_bytes = models.BigIntegerField(default=settings.DEFAULT_USER_QUOTA_BYTES)
