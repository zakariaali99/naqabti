import sys
from django.core.management.base import BaseCommand
from django.db import transaction
from niqabaty.models import Branch, User

class Command(BaseCommand):
    help = 'Restructure branches to group all active branches under 3 main syndicates.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Dry run mode (transactions are rolled back)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        if dry_run:
            self.stdout.write(self.style.WARNING("=== DRY RUN MODE ==="))

        with transaction.atomic():
            # 1. Create or get the 3 main syndicates
            syndicates_data = [
                {"name": "نقابة الطب البشري العامة", "prefix": "GEN_MED"},
                {"name": "نقابة الأسنان العامة", "prefix": "GEN_DEN"},
                {"name": "نقابة الصيادلة العامة", "prefix": "GEN_PHA"},
            ]
            
            main_branches = {}
            for data in syndicates_data:
                branch, created = Branch.objects.get_or_create(
                    name=data["name"],
                    defaults={"prefix": data["prefix"], "is_active": True}
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created main syndicate: {branch.name} ({branch.prefix})"))
                else:
                    self.stdout.write(f"Found existing main syndicate: {branch.name} ({branch.prefix})")
                main_branches[data["prefix"]] = branch

            # 2. Map of old main branches to the new ones for merging/deletion
            old_to_new_names = {
                "النقابة العامه للطب البشري": main_branches["GEN_MED"],
                "النقابة العامه للاسنان": main_branches["GEN_DEN"],
                "النقابة العامه للصيادلة": main_branches["GEN_PHA"],
            }

            # Merge users from old main branches and delete them
            for old_name, new_branch in old_to_new_names.items():
                old_branches = Branch.objects.filter(name=old_name)
                for old_b in old_branches:
                    # Find all users in old branch
                    users = User.objects.filter(branches=old_b)
                    self.stdout.write(f"Migrating {users.count()} users from '{old_b.name}' to '{new_branch.name}'")
                    for user in users:
                        if not dry_run:
                            user.branches.add(new_branch)
                            user.branches.remove(old_b)
                    
                    self.stdout.write(self.style.WARNING(f"Soft-deleting old main branch: {old_b.name}"))
                    if not dry_run:
                        old_b.delete()

            # 3. Process all remaining other branches and reparent them
            all_other_branches = Branch.objects.exclude(id__in=[b.id for b in main_branches.values()]).filter(is_deleted=False)
            # Exclude those that are going to be deleted or are already deleted
            all_other_branches = all_other_branches.exclude(name__in=old_to_new_names.keys())
            
            for branch in list(all_other_branches):
                name = branch.name
                
                # Check target syndicate based on name keywords
                if any(kw in name for kw in ["صيدل", "صيدلية", "صيادلة"]):
                    target_main = main_branches["GEN_PHA"]
                elif any(kw in name for kw in ["أسنان", "اسنان"]):
                    target_main = main_branches["GEN_DEN"]
                else:
                    target_main = main_branches["GEN_MED"]

                # If the branch is empty (no users assigned and no children)
                has_users = User.objects.filter(branches=branch).exists()
                has_children = branch.children.exists()

                if not has_users and not has_children:
                    self.stdout.write(self.style.WARNING(f"Soft-deleting empty branch: {branch.name}"))
                    if not dry_run:
                        branch.delete()
                    continue

                # Reparent branch to the main syndicate
                self.stdout.write(f"Reparenting branch '{branch.name}' under '{target_main.name}'")
                branch.parent = target_main
                if not dry_run:
                    branch.save()

            if dry_run:
                self.stdout.write(self.style.WARNING("=== DRY RUN COMPLETE - TRANSACTION ROLLED BACK ==="))
                transaction.set_rollback(True)
            else:
                self.stdout.write(self.style.SUCCESS("=== Restructuring Complete ==="))
