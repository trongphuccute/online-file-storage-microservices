"""
Management command: recalculate_quota
Recomputes used_bytes for all users (or a specific user) by doing a
full SUM over StoredFile. Use this if quota cache gets out of sync.

Usage:
    python manage.py recalculate_quota            # all users
    python manage.py recalculate_quota --user 42  # single user
"""
from django.core.management.base import BaseCommand
from django.db.models import Sum

from files.models import StoredFile, UserQuota


class Command(BaseCommand):
    help = "Recalculate used_bytes quota cache for all users (or a specific user)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--user",
            type=int,
            default=None,
            help="User ID to recalculate (omit to recalculate all users).",
        )

    def handle(self, *args, **options):
        user_id = options["user"]

        if user_id:
            user_ids = [user_id]
        else:
            # collect all distinct owner_ids from StoredFile + existing UserQuota rows
            file_ids = set(
                StoredFile.objects.values_list("owner_id", flat=True).distinct()
            )
            quota_ids = set(
                UserQuota.objects.values_list("user_id", flat=True)
            )
            user_ids = list(file_ids | quota_ids)

        updated = 0
        for uid in user_ids:
            total = (
                StoredFile.objects.filter(owner_id=uid)
                .aggregate(total=Sum("size"))["total"]
                or 0
            )
            quota, created = UserQuota.objects.get_or_create(user_id=uid)
            old = quota.used_bytes
            quota.used_bytes = total
            quota.save(update_fields=["used_bytes"])
            updated += 1
            self.stdout.write(
                f"  user {uid}: {old} → {total} bytes"
                + (" (created)" if created else "")
            )

        self.stdout.write(
            self.style.SUCCESS(f"\nDone. Updated quota for {updated} user(s).")
        )
