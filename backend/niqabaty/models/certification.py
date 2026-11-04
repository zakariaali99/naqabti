from django.db import models
from .user import User
from .certification_type import CertificationType
from .base import BaseModel

class Certification(BaseModel):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certifications')
    certification_type = models.ForeignKey(CertificationType, on_delete=models.CASCADE, related_name='certifications')
    issue_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    issued_from = models.CharField(max_length=255, blank=True)
    document = models.FileField(upload_to='certifications/', blank=True)
