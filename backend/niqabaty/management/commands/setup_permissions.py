from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType


class Command(BaseCommand):
    help = 'Setup default permission groups'

    def handle(self, *args, **kwargs):
        # Define group permissions
        group_permissions = {
            'Admin': 'all',  # All permissions
            'Manager': [
                'view_user', 'add_user', 'change_user',
                'view_branch', 'add_branch', 'change_branch',
                'view_doctorsmembership', 'add_doctorsmembership', 'change_doctorsmembership',
                'view_membershiptype', 'add_membershiptype', 'change_membershiptype',
                'view_payment', 'add_payment', 'change_payment',
                'view_city', 'add_city', 'change_city',
                'view_certification', 'add_certification', 'change_certification',
                'view_certificationtype', 'add_certificationtype', 'change_certificationtype',
                'view_post', 'add_post', 'change_post',
            ],
            'Doctor': [
                'view_user',
                'view_doctorsmembership',
                'view_certification', 'add_certification', 'change_certification',
                'view_professionaldevelopment', 'add_professionaldevelopment', 'change_professionaldevelopment',
                'view_payment',
                'view_post',
            ],
            'Student': [
                'view_user',
                'view_post',
                'view_certification',
                'view_professionaldevelopment',
            ],
            'Viewer': [
                'view_user', 'view_branch', 'view_doctorsmembership',
                'view_membershiptype', 'view_payment', 'view_certification',
                'view_city', 'view_post', 'view_professionaldevelopment',
                'view_certificationtype',
            ],
            'Advertiser': [
                'view_ad', 'add_ad', 'change_ad', 'delete_ad',
            ],
            'Sales': [
                'view_user', 'add_user',
                'view_doctorsmembership', 'add_doctorsmembership',
                'view_payment', 'add_payment',
                'view_branch',
            ],
            'Reporter': [
                'view_user', 'view_branch', 'view_doctorsmembership',
                'view_membershiptype', 'view_payment', 'view_certification',
                'view_city', 'view_post', 'view_professionaldevelopment',
            ],
        }
        
        # Get all niqabaty permissions
        niqabaty_ct = ContentType.objects.filter(app_label='niqabaty')
        all_permissions = Permission.objects.filter(content_type__in=niqabaty_ct)
        
        self.stdout.write(self.style.WARNING('\n🔧 Setting up permission groups...\n'))
        
        for group_name, perms in group_permissions.items():
            group, created = Group.objects.get_or_create(name=group_name)
            
            if perms == 'all':
                # Admin gets all permissions
                group.permissions.set(all_permissions)
                self.stdout.write(
                    self.style.SUCCESS(f'✓ {group_name}: All {all_permissions.count()} permissions assigned')
                )
            else:
                # Assign specific permissions
                group_perms = Permission.objects.filter(
                    codename__in=perms,
                    content_type__in=niqabaty_ct
                )
                group.permissions.set(group_perms)
                self.stdout.write(
                    self.style.SUCCESS(f'✓ {group_name}: {group_perms.count()} permissions assigned')
                )
            
            if created:
                self.stdout.write(f'  (Group created)')
            else:
                self.stdout.write(f'  (Group updated)')
        
        self.stdout.write(self.style.SUCCESS('\n✅ Permission groups setup complete!\n'))
        self.stdout.write(self.style.WARNING('💡 Run migrations if you haven\'t already: python manage.py migrate\n'))
