from django.db import models
from .base import BaseModel


class Nationality(BaseModel):
    """Model representing nationalities."""
    name = models.CharField(max_length=255, unique=True)
    name_ar = models.CharField(max_length=255, blank=True, null=True)
    code = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = "Nationalities"

    def __str__(self):
        return self.name
