from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from django.contrib.auth.hashers import make_password

def seed_admin(apps, schema_editor):
    User = apps.get_model("auth", "User")
    UserProfile = apps.get_model("users", "UserProfile")
    admin_user, _ = User.objects.get_or_create(username="admin", defaults={"email": "admin@example.com"})
    admin_user.email = "admin@example.com"
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.password = make_password("123456789")
    admin_user.save()
    UserProfile.objects.update_or_create(user=admin_user, defaults={"role": "admin"})


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("admin", "admin"), ("user", "user")], db_index=True, default="user", max_length=10)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="profile", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.RunPython(seed_admin, migrations.RunPython.noop),
    ]
