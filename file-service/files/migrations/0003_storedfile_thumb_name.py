from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("files", "0002_userquota_used_bytes"),
    ]

    operations = [
        migrations.AddField(
            model_name="storedfile",
            name="thumb_name",
            field=models.CharField(max_length=512, blank=True, null=True),
        ),
    ]
