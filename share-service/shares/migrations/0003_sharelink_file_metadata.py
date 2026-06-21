from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shares", "0002_add_tracking_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="sharelink",
            name="file_metadata",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
