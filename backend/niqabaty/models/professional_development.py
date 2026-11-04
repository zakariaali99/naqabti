from django.db import models
from django.db.models.signals import m2m_changed, post_save, post_delete
from django.dispatch import receiver
from .base import BaseModel
from .user import User

class ProfessionalDevelopmentType(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class ProfessionalDevelopmentCategory(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class ProfessionalDevelopment(BaseModel):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    title = models.CharField(max_length=255)
    type = models.ForeignKey(ProfessionalDevelopmentType, on_delete=models.PROTECT, related_name='developments')
    category = models.ForeignKey(ProfessionalDevelopmentCategory, on_delete=models.PROTECT, related_name='developments')
    content = models.TextField()
    date_from = models.DateTimeField()
    date_to = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    can_register = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    image = models.ImageField(upload_to='professional_development/', blank=True, null=True)

    def __str__(self):
        return self.title

class ProfessionalDevelopmentRegistration(BaseModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
    ]

    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pd_registrations')
    professional_development = models.ForeignKey(ProfessionalDevelopment, on_delete=models.CASCADE, related_name='registrations')
    registration_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_records = models.ManyToManyField('niqabaty.Payment', related_name='registration_payments', blank=True)

    class Meta:
        unique_together = ('doctor', 'professional_development')

    def __str__(self):
        return f"{self.doctor} - {self.professional_development}"

    def update_payment_info(self):
        """Recalculate paid_amount and update payment_status and registration status."""
        total_paid = self.payment_records.aggregate(total=models.Sum('amount'))['total'] or 0
        self.paid_amount = total_paid
        
        if self.paid_amount >= self.professional_development.price:
            self.payment_status = 'paid'
            # Automatically confirm the registration if it's fully paid
            if self.status == 'pending':
                self.status = 'confirmed'
        else:
            self.payment_status = 'pending'
        
        self.save(update_fields=['paid_amount', 'payment_status', 'status'])

@receiver(m2m_changed, sender=ProfessionalDevelopmentRegistration.payment_records.through)
def update_registration_payment_status(sender, instance, action, **kwargs):
    if action in ['post_add', 'post_remove', 'post_clear']:
        instance.update_payment_info()

@receiver([post_save, post_delete], sender='niqabaty.Payment')
def update_registration_on_payment_change(sender, instance, **kwargs):
    """Update registration paid_amount when a linked payment is saved or deleted."""
    # Track which registrations we've updated
    updated_ids = set()

    # 1. Check direct ForeignKey (most reliable for post_delete)
    if instance.professional_development_registration:
        instance.professional_development_registration.update_payment_info()
        updated_ids.add(instance.professional_development_registration.id)
    
    # 2. Check ManyToMany (fallback for post_save/extra links)
    try:
        registrations = instance.registration_payments.all()
        for registration in registrations:
            if registration.id not in updated_ids:
                registration.update_payment_info()
                updated_ids.add(registration.id)
    except:
        # Link records might already be gone during post_delete
        pass
