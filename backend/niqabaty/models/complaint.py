from django.db import models
from django.conf import settings
from .base import BaseModel

class Complaint(BaseModel):
    """
    Model for user complaints and suggestions.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='complaints',
        help_text="User who submitted the complaint"
    )
    subject = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    category = models.CharField(max_length=100, blank=True, null=True)
    admin_response = models.TextField(blank=True, null=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    
    # Attachments could be a separate model if multiple are needed, 
    # but for now let's keep it simple with one image/file.
    attachment = models.FileField(upload_to='complaints/attachments/', blank=True, null=True)
    sent_to_branch = models.ForeignKey(
        'Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='complaints',
        help_text="Branch this complaint is sent to"
    )

    class Meta:
        verbose_name = 'Complaint'
        verbose_name_plural = 'Complaints'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.subject} - {self.user.username} ({self.get_status_display()})"
