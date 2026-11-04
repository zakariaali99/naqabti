from django.db import models
from .base import BaseModel


class AcademicDegree(BaseModel):
    """Model representing academic degrees."""
    name = models.CharField(max_length=255, unique=True)
    allows_multiple_subscriptions = models.BooleanField(
        default=False,
        help_text='If set, doctors with this degree can subscribe for multiple periods at once',
    )

    class Meta:
        ordering = ['name']
        verbose_name_plural = "Academic Degrees"

    def __str__(self):
        return self.name
