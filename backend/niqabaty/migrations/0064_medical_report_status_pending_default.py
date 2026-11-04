from django.db import migrations, models


def none_to_pending(apps, schema_editor):
    MedicalReport = apps.get_model('niqabaty', 'MedicalReport')
    MedicalReport.objects.filter(document_status='none').update(document_status='pending')


class Migration(migrations.Migration):

    dependencies = [
        ('niqabaty', '0063_historicalmedicalreport_approved_at_and_more'),
    ]

    operations = [
        migrations.RunPython(none_to_pending, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='medicalreport',
            name='document_status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending Approval'),
                    ('approved', 'Approved'),
                    ('rejected', 'Rejected'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
    ]
