import re

from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from .base import BaseModel, SoftDeleteManager


class UserManager(SoftDeleteManager, BaseUserManager):
    use_in_migrations = True

    def _generate_username(self, email=None, phone_number=None):
        """Derive a unique username when the caller doesn't supply one.

        Username stays a required, unique column on the model (Django's
        auth machinery keys off it), so a value must exist even though
        registration no longer asks the user for one.
        """
        base = ''
        if email:
            base = email.split('@')[0]
        elif phone_number:
            base = phone_number
        base = re.sub(r'[^a-zA-Z0-9_]', '', base or '').lower()[:20] or 'user'

        username = base
        suffix = 0
        # Check across all rows (including soft-deleted) since the
        # username column's uniqueness constraint is unconditional.
        while self.model.all_objects.filter(username__iexact=username).exists():
            suffix += 1
            username = f"{base}{suffix}"
        return username

    def _create_user(self, username, email, password, **extra_fields):
        if not username:
            username = self._generate_username(
                email=email, phone_number=extra_fields.get('phone_number'),
            )
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, username=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(username, email, password, **extra_fields)

    def create_superuser(self, username=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(username, email, password, **extra_fields)


class User(BaseModel, AbstractUser):
    USER_TYPE_CHOICES = [
        ('doctor', 'Doctor'),
        ('student', 'Student'),
        ('manager', 'Manager'),
        ('institution', 'Institution'),
        ('viewer', 'Viewer'),
        ('advertiser', 'Advertiser'),
    ]
    
    email = models.EmailField(blank=True, null=True)
    # Replace first_name/last_name with 4 separate name fields
    first_name = None  # type: ignore
    last_name = None   # type: ignore
    full_name = models.CharField(max_length=255, blank=True)
    # Arabic name fields
    first_name_field = models.CharField(max_length=100, blank=True, null=True, verbose_name='First Name (Arabic)')
    father_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='Father Name (Arabic)')
    grandfather_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='Grandfather Name (Arabic)')
    family_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='Family Name (Arabic)')
    # English name fields (optional)
    first_name_en = models.CharField(max_length=100, blank=True, null=True, verbose_name='First Name (English)')
    father_name_en = models.CharField(max_length=100, blank=True, null=True, verbose_name='Father Name (English)')
    grandfather_name_en = models.CharField(max_length=100, blank=True, null=True, verbose_name='Grandfather Name (English)')
    family_name_en = models.CharField(max_length=100, blank=True, null=True, verbose_name='Family Name (English)')
    phone_number = models.CharField(max_length=120, blank=True, null=True)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    # Passport / nationality / personal info used during registration
    birthdate = models.DateField(blank=True, null=True)
    city = models.ForeignKey('niqabaty.City', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    area = models.CharField(max_length=255, blank=True, null=True)
    area_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    area_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    address = models.TextField(blank=True)
    nationality = models.ForeignKey('niqabaty.Nationality', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    passport_image = models.FileField(upload_to='passport_images/', blank=True, null=True)
    fcm_token = models.CharField(max_length=255, blank=True, null=True)

    # Email verification fields
    email_verified = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    verification_code_created = models.DateTimeField(blank=True, null=True)

    # Account approval workflow (currently only meaningful for user_type='doctor';
    # defaults to 'approved' so existing rows and non-doctor accounts are unaffected)
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    approval_status = models.CharField(max_length=10, choices=APPROVAL_STATUS_CHOICES, default='approved')

    # Education / professional fields
    university_name = models.CharField(max_length=255, blank=True, null=True)
    current_degree = models.ForeignKey('niqabaty.AcademicDegree', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    graduation_year = models.IntegerField(blank=True, null=True)  # For students
    membership_number = models.CharField(max_length=120, blank=True, null=True)
    LANGUAGE_CHOICES = [
        ('ar', 'Arabic'),
        ('en', 'English'),
    ]
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='ar')
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='manager')
    specialty = models.CharField(max_length=100, blank=True)  # For doctors
    bio = models.TextField(blank=True)  # For doctors
    doctor_number = models.CharField(max_length=120, blank=True, null=True)  # For doctors - unique per branch
    # Users can belong to multiple branches
    branches = models.ManyToManyField('niqabaty.Branch', related_name='users', blank=True)
    institutions = models.ManyToManyField('niqabaty.Institution', blank=True, related_name='doctors')
    # Customizable fields displayed on public doctor profile (/doctors/<username>)
    # Comma-separated list of field keys, e.g. 'full_name,profile_image,specialty,bio,phone_number,email,city,current_degree,university_name,branches,institutions,certifications'
    public_profile_fields = models.TextField(
        blank=True,
        default='full_name,profile_image,specialty,bio,branches,current_degree',
        help_text="Comma-separated keys of fields visible on public profile",
    )
    objects = UserManager()
    all_objects = BaseUserManager()  # raw manager without soft-delete filtering

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        # Enforce uniqueness only among non-deleted users so a soft-deleted
        # account frees up its email/phone for re-registration. NULL values
        # are excluded so multiple users may have no email/phone.
        constraints = [
            models.UniqueConstraint(
                fields=['email'],
                condition=models.Q(is_deleted=False, email__isnull=False),
                name='unique_active_email',
            ),
            models.UniqueConstraint(
                fields=['phone_number'],
                condition=models.Q(is_deleted=False, phone_number__isnull=False),
                name='unique_active_phone_number',
            ),
        ]

    def get_full_doctor_number(self):
        """Return full doctor number formatted as BRANCH_PREFIX-DOCTOR_NUMBER.
        
        Returns empty string if:
        - User is not a doctor
        - No doctor_number is set
        - No branches are assigned
        """
        if self.user_type != 'doctor' or not self.doctor_number:
            return ''
        
        # Get first branch (doctors should only have one branch)
        first_branch = self.branches.first()
        if not first_branch:
            return ''
        
        return f"{first_branch.prefix}{self.doctor_number}"

    def get_full_name_from_parts(self):
        """Combine 4 name fields into full name.
        
        Returns the full name constructed from:
        first_name + father_name + grandfather_name + family_name
        """
        parts = []
        if self.first_name_field:
            parts.append(self.first_name_field)
        if self.father_name:
            parts.append(self.father_name)
        if self.grandfather_name:
            parts.append(self.grandfather_name)
        if self.family_name:
            parts.append(self.family_name)
        
        if parts:
            return ' '.join(parts)
        return self.full_name or ''

    def get_public_profile_fields_list(self):
        """Return list of lowercase field keys visible to the public."""
        if not self.public_profile_fields:
            return []
        return [f.strip().lower() for f in self.public_profile_fields.split(',') if f.strip()]

    def is_field_public(self, field_key: str) -> bool:
        """Check if a specific field key is allowed to be visible publicly."""
        return field_key.strip().lower() in self.get_public_profile_fields_list()

    def clean(self):
        super().clean()
        if self.email == "":
            self.email = None
        if self.phone_number == "":
            self.phone_number = None

    def save(self, *args, **kwargs):
        # Auto-populate full_name from the 4 name fields
        self.full_name = self.get_full_name_from_parts()
        if self.email == "":
            self.email = None
        if self.phone_number == "":
            self.phone_number = None
        super().save(*args, **kwargs)

    def delete(self, using=None, keep_parents=False):
        """Soft delete the user account while keeping the record in database.

        Marks is_deleted=True, sets is_active=False to revoke access immediately,
        clears FCM push notification token, and removes Device registrations.
        """
        self.is_deleted = True
        self.is_active = False
        self.fcm_token = None
        self.save()

        # Remove push notification devices
        try:
            from niqabaty.models.device import Device
            Device.objects.filter(user=self).delete()
        except Exception:
            pass

    def restore(self):
        """Restore a soft-deleted user account."""
        self.is_deleted = False
        self.is_active = True
        self.save()
