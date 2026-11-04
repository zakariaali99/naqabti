from decimal import Decimal

from django.apps import apps
from django.db import models
from .user import User
from .base import BaseModel


class Payment(BaseModel):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('online', 'Online Payment'),
        ('other', 'Other'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    membership = models.ForeignKey('DoctorsMembership', on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    professional_development_registration = models.ForeignKey('ProfessionalDevelopmentRegistration', on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    payment_date = models.DateTimeField(auto_now_add=True)
    reference_number = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    transaction_document = models.FileField(upload_to='payments/documents/', null=True, blank=True)
    invoice_file = models.FileField(upload_to='payment_invoices/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_payments')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-payment_date']
    
    def __str__(self):
        return f"Payment {self.id} - {self.user} - {self.amount}"
    
    def _update_membership_paid_amount(self, membership_id):
        """Recalculate and persist paid_amount for a membership."""
        Membership = apps.get_model('niqabaty', 'DoctorsMembership')
        total_paid = Payment.objects.filter(
            membership_id=membership_id
        ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
        Membership.objects.filter(pk=membership_id).update(
            paid_amount=total_paid
        )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.membership_id:
            self._update_membership_paid_amount(self.membership_id)

    def delete(self, *args, **kwargs):
        membership_id = self.membership_id
        super().delete(*args, **kwargs)
        if membership_id:
            self._update_membership_paid_amount(membership_id)
