from django.db import models
from .base import BaseModel


class Insurance(BaseModel):
    doctor = models.ForeignKey('niqabaty.User', on_delete=models.CASCADE, related_name='insurances')
    name = models.CharField(max_length=255)
    policy_number = models.CharField(max_length=100)
    provider = models.CharField(max_length=255)
    coverage_details = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.policy_number}"
