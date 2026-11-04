from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('niqabaty', '0066_alter_historicaluser_email_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='passport_image',
            field=models.FileField(blank=True, null=True, upload_to='passport_images/'),
        ),
        migrations.AlterField(
            model_name='historicaluser',
            name='passport_image',
            field=models.TextField(blank=True, max_length=100, null=True),
        ),
    ]
