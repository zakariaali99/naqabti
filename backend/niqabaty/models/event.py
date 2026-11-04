from django.db import models
from django.conf import settings
from .base import BaseModel


class Event(BaseModel):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    title = models.CharField(max_length=255)
    content = models.TextField(blank=True, default="")
    excerpt = models.TextField(blank=True, null=True)
    featured_image = models.ImageField(
        upload_to='events/images/',
        blank=True,
        null=True,
    )
    event_date = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True, default="")
    max_attendees = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='draft'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='events',
    )
    published_at = models.DateTimeField(blank=True, null=True)
    views_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    notification_sent = models.BooleanField(default=False)

    class Meta:
        ordering = ['-event_date', '-created_at']
        verbose_name = 'Event'
        verbose_name_plural = 'Events'

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.status == 'published' and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()
        super().save(*args, **kwargs)
