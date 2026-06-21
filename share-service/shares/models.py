import uuid
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class ShareLink(models.Model):
    """Model để quản lý các link chia sẻ file"""
    
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    file_id = models.PositiveIntegerField(db_index=True)
    owner_id = models.PositiveIntegerField(db_index=True)
    file_metadata = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)
    
    # Trường theo dõi
    access_count = models.PositiveIntegerField(default=0)
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner_id", "-created_at"]),
            models.Index(fields=["token", "is_active"]),
        ]
    
    def __str__(self):
        return f"Chia sẻ {self.token} (File {self.file_id})"
    
    def is_expired(self):
        """Kiểm tra link chia sẻ đã hết hạn chưa"""
        if not self.expires_at:
            return False
        return self.expires_at <= timezone.now()
    
    def can_access(self):
        """Kiểm tra link chia sẻ có thể truy cập được không"""
        if not self.is_active:
            return False, "Link chia sẻ không hoạt động"
        
        if self.is_expired():
            return False, "Link chia sẻ đã hết hạn"
        
        return True, "OK"
    
    def increment_access_count(self):
        """Tăng bộ đếm truy cập và cập nhật thời gian truy cập cuối"""
        self.access_count += 1
        self.last_accessed_at = timezone.now()
        self.save(update_fields=["access_count", "last_accessed_at"])
    
    def clean(self):
        """Xác thực dữ liệu model"""
        super().clean()
        
        if self.expires_at and self.expires_at <= timezone.now():
            raise ValidationError(
                {"expires_at": "Ngày hết hạn phải là trong tương lai"}
            )
        
        if self.file_id <= 0:
            raise ValidationError(
                {"file_id": "ID file phải là một số dương"}
            )
        
        if self.owner_id <= 0:
            raise ValidationError(
                {"owner_id": "ID chủ sở hữu phải là một số dương"}
            )
