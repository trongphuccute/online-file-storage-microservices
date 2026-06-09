from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("files", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="userquota",
            name="used_bytes",
            field=models.BigIntegerField(default=0),
        ),
    ]
