import uuid

from django.db import models


class ShareLink(models.Model):
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    file_id = models.PositiveIntegerField(db_index=True)
    owner_id = models.PositiveIntegerField(db_index=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
