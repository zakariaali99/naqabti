from django.db import models
from django.conf import settings
from .base import BaseModel
from .user import User

class MedicalReport(BaseModel):
    DOCUMENT_STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    doctor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='medical_reports',
        limit_choices_to={'user_type': 'doctor'},
    )
    patient_name = models.CharField(max_length=255)
    patient_id = models.CharField(max_length=50, blank=True, null=True, help_text="National ID or Passport")
    report_date = models.DateField(auto_now_add=True)
    diagnosis = models.TextField()
    treatment = models.TextField(blank=True, null=True)
    recommendations = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    document = models.FileField(upload_to='medical_reports/', blank=True, null=True)

    # Approval workflow for uploaded documents
    pending_document = models.FileField(upload_to='medical_reports/pending/', blank=True, null=True)
    document_status = models.CharField(max_length=20, choices=DOCUMENT_STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_medical_reports',
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Report for {self.patient_name} by Dr. {self.doctor.get_full_name()}"

    class Meta:
        ordering = ['-report_date', '-created_at']
