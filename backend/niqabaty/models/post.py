from django.db import models
from django.conf import settings
from .base import BaseModel


class Post(BaseModel):
    """
    Model to store posts and news articles.
    Can be used for announcements, news, articles, etc.
    """
    POST_TYPE_CHOICES = [
        ('news', 'News'),
        ('announcement', 'Announcement'),
        ('article', 'Article'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    title = models.CharField(
        max_length=255,
        help_text="Title of the post"
    )
    content = models.TextField(
        help_text="Main content of the post"
    )
    excerpt = models.TextField(
        blank=True,
        null=True,
        help_text="Short summary or excerpt of the post"
    )
    post_type = models.CharField(
        max_length=20,
        choices=POST_TYPE_CHOICES,
        default='news',
        help_text="Type of the post"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        help_text="Publication status"
    )
    featured_image = models.ImageField(
        upload_to='posts/images/',
        blank=True,
        null=True,
        help_text="Featured image for the post"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='posts',
        help_text="Author of the post"
    )
    published_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Date and time when the post was published"
    )
    views_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of times the post has been viewed"
    )
    is_featured = models.BooleanField(
        default=False,
        help_text="Whether this post should be featured"
    )
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Tags associated with the post"
    )
    meta_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata for the post"
    )
    notification_sent = models.BooleanField(
        default=False,
        help_text="Whether a push notification was sent when this post was published"
    )

    class Meta:
        verbose_name = 'Post'
        verbose_name_plural = 'Posts'
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['-published_at']),
            models.Index(fields=['status', 'post_type']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_post_type_display()})"

    def save(self, *args, **kwargs):
        # Set published_at when status changes to published
        if self.status == 'published' and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()
        
        super().save(*args, **kwargs)
