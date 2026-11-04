from django.db import migrations


def migrate_existing_institutions(apps, schema_editor):
    User = apps.get_model('niqabaty', 'User')
    Institution = apps.get_model('niqabaty', 'Institution')
    for user in User.objects.filter(user_type='institution', is_deleted=False):
        Institution.objects.get_or_create(
            account=user,
            defaults={
                'name': user.full_name or user.username,
                'address': user.address or '',
                'phone': user.phone_number or '',
                'email': user.email or '',
                'is_active': user.is_active,
            }
        )


class Migration(migrations.Migration):

    dependencies = [
        ("niqabaty", "0055_institution_historicalinstitution_user_institutions"),
    ]

    operations = [
        migrations.RunPython(migrate_existing_institutions),
    ]
