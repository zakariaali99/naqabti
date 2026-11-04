from django.db import models
from .base import BaseModel

class CertificationType(BaseModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
