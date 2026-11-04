from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('niqabaty', '0061_notification_batch_id'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='medicalreport',
            name='pending_document',
            field=models.FileField(blank=True, null=True, upload_to='medical_reports/pending/'),
        ),
        migrations.AddField(
            model_name='medicalreport',
            name='document_status',
            field=models.CharField(
                choices=[
                    ('none', 'None'),
                    ('pending', 'Pending Approval'),
                    ('approved', 'Approved'),
                    ('rejected', 'Rejected'),
                ],
                default='none',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='medicalreport',
            name='approved_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='approved_medical_reports',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='medicalreport',
            name='approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
