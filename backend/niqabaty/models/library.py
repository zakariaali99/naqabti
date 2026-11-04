import uuid
from django.db import models
from django.conf import settings
from .base import BaseModel

class LibraryItem(BaseModel):
    """
    Model for electronic library items (Books, PDFs, Videos, etc.)
    """
    ITEM_TYPE_CHOICES = [
        ('pdf', 'PDF Document'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('link', 'External Link'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    item_type = models.CharField(
        max_length=20,
        choices=ITEM_TYPE_CHOICES,
        default='pdf'
    )
    
    # Files/Links
    file = models.FileField(upload_to='library/files/', blank=True, null=True)
    external_link = models.URLField(blank=True, null=True)
    thumbnail = models.ImageField(upload_to='library/thumbnails/', blank=True, null=True)
    
    # Metadata
    author_name = models.CharField(max_length=255, blank=True, null=True)
    publication_year = models.IntegerField(blank=True, null=True)
    download_count = models.PositiveIntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)
    is_public = models.BooleanField(default=True)

    # Branch scoping
    branch = models.ForeignKey(
        'niqabaty.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='library_items',
    )

    # Specialty
    specialty = models.ForeignKey(
        'niqabaty.DoctorSpecialty',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='library_items',
    )

    class Meta:
        verbose_name = 'Library Item'
        verbose_name_plural = 'Library Items'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_item_type_display()})"


class LibraryUploadSession(BaseModel):
    upload_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    file_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    total_chunks = models.IntegerField()
    received_chunks = models.IntegerField(default=0)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    author_name = models.CharField(max_length=255, blank=True, null=True)
    publication_year = models.IntegerField(blank=True, null=True)
    is_public = models.BooleanField(default=True)
    specialty = models.ForeignKey(
        'niqabaty.DoctorSpecialty',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    completed = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Library Upload Session'
        verbose_name_plural = 'Library Upload Sessions'

    def __str__(self):
        return f"Upload {self.upload_id} - {self.file_name} ({self.received_chunks}/{self.total_chunks})"
