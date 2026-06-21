from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    ROLE_ADMIN = "admin"
    ROLE_USER = "user"
    ROLE_CHOICES = [
        (ROLE_ADMIN, "admin"),
        (ROLE_USER, "user"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_USER, db_index=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"
