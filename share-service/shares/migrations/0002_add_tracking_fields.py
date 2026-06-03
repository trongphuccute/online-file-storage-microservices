import uuid
from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('shares', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='sharelink',
            name='access_count',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='sharelink',
            name='last_accessed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='sharelink',
            name='is_active',
            field=models.BooleanField(db_index=True, default=True),
        ),
        migrations.AlterField(
            model_name='sharelink',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
        migrations.AlterField(
            model_name='sharelink',
            name='expires_at',
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        migrations.AddIndex(
            model_name='sharelink',
            index=models.Index(fields=['owner_id', '-created_at'], name='shares_shar_owner_i_idx'),
        ),
        migrations.AddIndex(
            model_name='sharelink',
            index=models.Index(fields=['token', 'is_active'], name='shares_shar_token_i_idx'),
        ),
    ]
