import uuid
from django.db import models
from .user import User
from .base import BaseModel

class Notification(BaseModel):
    NOTIFICATION_TYPE_CHOICES = [
        ('info', 'Information'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('success', 'Success'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPE_CHOICES,
        default='info'
    )
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    send_to_all_devices = models.BooleanField(default=False, help_text="Whether this notification was sent to all devices")
    batch_id = models.UUIDField(null=True, blank=True, help_text="Groups notifications sent in the same batch")
    source = models.CharField(max_length=20, choices=[('system', 'System'), ('manual', 'Manual')], default='manual')

    # Optional: Link to a related object
    content_type = models.CharField(max_length=255, null=True, blank=True)  # e.g., 'user', 'doctor', 'payment'
    object_id = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]

    def __str__(self):
        return f"{self.title} - {self.user.username}"

    def natural_key(self):
        return (self.user.username, self.created_at)


class SeenNotification(models.Model):
    """
    Tracks when a user sees/views a notification.
    This is separate from is_read to distinguish between seeing and marking as read.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seen_notifications')
    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='seen_by'
    )
    seen_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'notification')
        ordering = ['-seen_at']
        indexes = [
            models.Index(fields=['user', '-seen_at']),
            models.Index(fields=['notification']),
        ]

    def __str__(self):
        return f"{self.user.username} seen {self.notification.id} at {self.seen_at}"


class NotificationActionHistory(models.Model):
    """
    Tracks actions performed on a notification, such as opening, dismissing, etc.
    """
    ACTION_TYPE_CHOICES = [
        ('opened', 'Opened'),
        ('dismissed', 'Dismissed'),
        ('action_button_clicked', 'Action Button Clicked'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notification_actions')
    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='actions'
    )
    action_type = models.CharField(
        max_length=50,
        choices=ACTION_TYPE_CHOICES,
        default='opened'
    )
    action_at = models.DateTimeField(auto_now_add=True)
    
    # Optional: Extra data if needed (e.g., which button was clicked)
    action_metadata = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-action_at']
        indexes = [
            models.Index(fields=['user', '-action_at']),
        ]

    def __str__(self):
        return f"{self.user.username} {self.action_type} {self.notification.id} at {self.action_at}"
