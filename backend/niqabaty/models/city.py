from django.db import models
from .base import BaseModel


class City(BaseModel):
    """Simple City model for regions/cities used in the app."""
    name = models.CharField(max_length=255)
    name_ar = models.CharField(max_length=255, blank=True, null=True)
    region = models.CharField(max_length=255, blank=True, null=True)
    prefix = models.CharField(max_length=32, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def __str__(self):
        if self.prefix:
            return f"{self.prefix} {self.name}"
        return f"{self.name}" if not self.region else f"{self.name}, {self.region}"
