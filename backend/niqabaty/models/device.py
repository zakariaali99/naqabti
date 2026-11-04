from django.db import models
from django.conf import settings
from .base import BaseModel


class Device(BaseModel):
    """
    Model to store device FCM tokens for push notifications.
    Supports both authenticated and anonymous devices.
    """
    fcm_token = models.CharField(
        max_length=255,
        unique=True,
        help_text="Firebase Cloud Messaging token for push notifications"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='devices',
        help_text="User associated with this device (nullable for anonymous devices)"
    )
    extra_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional device information (platform, version, etc.)"
    )

    class Meta:
        verbose_name = 'Device'
        verbose_name_plural = 'Devices'
        ordering = ['-created_at']

    def __str__(self):
        user_info = f"User: {self.user.username}" if self.user else "Anonymous"
        return f"Device {self.id} ({user_info}) - {self.fcm_token[:20]}..."
