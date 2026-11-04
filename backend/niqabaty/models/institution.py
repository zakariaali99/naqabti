from django.db import models
from .base import BaseModel


class Institution(BaseModel):
    name = models.CharField(max_length=255)
    account = models.OneToOneField(
        'User', on_delete=models.CASCADE,
        null=True, blank=True, related_name='institution_profile'
    )
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    logo = models.ImageField(upload_to='institution_logos/', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
