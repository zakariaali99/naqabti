from django.db import models
from .base import BaseModel
from .user import User as _User

class MembershipType(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    duration_months = models.PositiveIntegerField(help_text="Duration in months")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    # try:
    #     from .user import User as _User  # avoid circular import at module top
    #     USER_TYPE_CHOICES = _User.USER_TYPE_CHOICES
    # except Exception:
    #     # fallback if import fails
    #     USER_TYPE_CHOICES = [
    #         ('doctor', 'Doctor'),
    #         ('manager', 'Manager'),
    #         ('institution', 'Institution'),
    #     ]

    academic_degree = models.ForeignKey(
        'niqabaty.AcademicDegree',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='membership_types',
        help_text='If set, only doctors with this degree can use this type; empty = all degrees',
    )
    applicable_user_type = models.CharField(
        max_length=20,
        choices=_User.USER_TYPE_CHOICES,
        default='doctor',
        help_text='Type of user this membership applies to'
    )
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name