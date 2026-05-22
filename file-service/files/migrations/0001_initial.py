from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="StoredFile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("owner_id", models.PositiveIntegerField(db_index=True)),
                ("original_name", models.CharField(max_length=255)),
                ("blob_name", models.CharField(max_length=512, unique=True)),
                ("content_type", models.CharField(blank=True, max_length=120)),
                ("size", models.BigIntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="UserQuota",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("user_id", models.PositiveIntegerField(unique=True)),
                ("limit_bytes", models.BigIntegerField(default=settings.DEFAULT_USER_QUOTA_BYTES)),
            ],
        ),
    ]
