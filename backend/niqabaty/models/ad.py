from django.db import models
from django.conf import settings
from .base import BaseModel


class Ad(BaseModel):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    advertiser = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ads',
        help_text="User who requested the advertisement"
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    featured_image = models.ImageField(upload_to='ads/', blank=True, null=True)
    target_branches = models.ManyToManyField('Branch', blank=True, related_name='targeted_ads')
    target_cities = models.ManyToManyField('City', blank=True, related_name='targeted_ads')
    target_specialties = models.ManyToManyField('DoctorSpecialty', blank=True, related_name='targeted_ads')
    expected_audience_count = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
    published_at = models.DateTimeField(blank=True, null=True)
    views_count = models.IntegerField(default=0)

    class Meta:
        verbose_name = 'Ad'
        verbose_name_plural = 'Ads'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.advertiser.username} ({self.get_status_display()})"
