# Generated manually for adding send_to_all_devices field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('niqabaty', '0023_historicaluser_fcm_token_user_fcm_token'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='send_to_all_devices',
            field=models.BooleanField(default=False, help_text='Whether this notification was sent to all devices via'),
        ),
    ]
