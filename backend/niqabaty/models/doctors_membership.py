import calendar
from datetime import datetime, date as _date
from decimal import Decimal

from django.apps import apps
from django.db import models
from .base import BaseModel
from .branch import Branch
from .membership_type import MembershipType
from .user import User


class DoctorsMembership(BaseModel):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending', 'Pending'),
        ('canceled', 'Canceled'),
        ('expired', 'Expired'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('partial', 'Partially Paid'),
        ('paid', 'Fully Paid'),
    ]

    doctor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='memberships',
        limit_choices_to={'user_type': 'doctor'},
    )
    membership_type = models.ForeignKey(
        MembershipType, on_delete=models.CASCADE, related_name='memberships'
    )
    branch = models.ForeignKey(
        Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='memberships'
    )
    membership_number = models.CharField(max_length=50, unique=False, blank=True, editable=False)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_active = models.BooleanField(default=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid'
    )
    subscription_count = models.PositiveIntegerField(
        default=1,
        help_text='Number of subscription periods purchased at once',
    )

    def __str__(self):
        return f"{self.doctor} - {self.membership_type}"

    @property
    def remaining_amount(self):
        """Calculate remaining amount to be paid and update payment status"""
        histories = self.renew_history.all()
        if histories.exists():
            remaining = sum((history.remaining_amount for history in histories), Decimal('0.00'))
        else:
            total = Decimal(str(self.total_amount or 0))
            paid = Decimal(str(self.paid_amount or 0))
            remaining = total - paid

        # Determine new payment status
        if remaining <= Decimal('0.00'):
            new_status = 'paid'
        elif Decimal(str(self.paid_amount or 0)) > Decimal('0.00') or any(
            Decimal(str(h.paid_amount or 0)) > Decimal('0.00') for h in histories
        ):
            new_status = 'partial'
        else:
            new_status = 'unpaid'

        # Update and persist if changed — use update() to avoid recursion
        if new_status != self.payment_status:
            DoctorsMembership.objects.filter(pk=self.pk).update(payment_status=new_status)
            self.payment_status = new_status

        return remaining

    def save(self, *args, **kwargs):
        # Auto-generate membership_number if not set
        if not self.membership_number:
            self.membership_number = self._generate_membership_number()

        # Set total_amount from membership_type price if not set
        if not self.total_amount and self.membership_type:
            self.total_amount = self.membership_type.price * (self.subscription_count or 1)

        # Auto-calculate end_date when status becomes active and end_date is missing
        if self.status == 'active' and not self.end_date and self.start_date and self.membership_type:
            duration = (self.membership_type.duration_months or 12) * (self.subscription_count or 1)
            m = self.start_date.month - 1 + duration
            year = self.start_date.year + m // 12
            month = m % 12 + 1
            day = min(self.start_date.day, calendar.monthrange(year, month)[1])
            self.end_date = _date(year, month, day)

        super().save(*args, **kwargs)

    @property
    def _needs_payment_status_update(self):
        """Check if payment status should change based on paid_amount."""
        total = Decimal(str(self.total_amount or 0))
        paid = Decimal(str(self.paid_amount or 0))
        if paid >= total:
            return 'paid'
        elif paid > 0:
            return 'partial'
        return 'unpaid'

    @staticmethod
    def _generate_membership_number():
        """Generate membership number: PREFIX+YY+MM+XXXXXX"""
        now = datetime.now()
        year = now.strftime('%y')
        month = now.strftime('%m')
        year_month_prefix = f"{year}{month}"
        existing_count = DoctorsMembership.objects.filter(
            membership_number__startswith=year_month_prefix
        ).count()
        sequential = str(existing_count + 1).zfill(6)
        return f"{year_month_prefix}{sequential}"


class DoctorsMembershipRenewHistory(BaseModel):
    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('partial', 'Partially Paid'),
        ('paid', 'Fully Paid'),
    ]

    membership = models.ForeignKey(
        DoctorsMembership, on_delete=models.CASCADE, related_name='renew_history'
    )
    renew_date = models.DateField(auto_now_add=True)
    previous_end_date = models.DateField(null=True, blank=True)
    new_end_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid'
    )
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.membership} - {self.renew_date}"

    @property
    def remaining_amount(self):
        """Calculate remaining amount to be paid"""
        total = Decimal(str(self.amount or 0))
        paid = Decimal(str(self.paid_amount or 0))
        return total - paid

    def update_payment_status(self):
        """Update payment status based on paid amount"""
        if self.paid_amount >= self.amount:
            self.payment_status = 'paid'
        elif self.paid_amount > 0:
            self.payment_status = 'partial'
        else:
            self.payment_status = 'unpaid'
        self.save()

    def save(self, *args, **kwargs):
        # Update payment status based on paid amount
        if self.paid_amount >= self.amount:
            self.payment_status = 'paid'
        elif self.paid_amount > 0:
            self.payment_status = 'partial'
        else:
            self.payment_status = 'unpaid'
        super().save(*args, **kwargs)
        # Sync parent membership paid_amount if this is the only history
        if self.membership and not self.membership.renew_history.exclude(pk=self.pk).exists():
            Payment = apps.get_model('niqabaty', 'Payment')
            total_paid = Payment.objects.filter(
                membership_id=self.membership_id
            ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
            DoctorsMembership.objects.filter(pk=self.membership_id).update(
                paid_amount=total_paid
            )
        