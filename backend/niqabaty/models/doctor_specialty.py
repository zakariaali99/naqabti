from django.db import models
from .base import BaseModel


class DoctorSpecialty(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Doctor Specialty'
        verbose_name_plural = 'Doctor Specialties'

    def __str__(self):
        return self.name
