from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.apps import apps
from rest_framework.serializers import (
    Serializer,
    CharField,
    EmailField,
    ValidationError,
    DateField,
    FileField,
    IntegerField,
)

_ALLOWED_PASSPORT_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'pdf'}
_ALLOWED_PASSPORT_CONTENT_TYPES = {
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf',
}

def _validate_passport_file(value):
    content_type = getattr(value, 'content_type', None)
    if content_type and content_type not in _ALLOWED_PASSPORT_CONTENT_TYPES:
        raise ValidationError('Only JPEG, PNG, WebP images and PDF files are accepted.')
    if hasattr(value, 'name'):
        ext = value.name.rsplit('.', 1)[-1].lower() if '.' in value.name else ''
        if ext not in _ALLOWED_PASSPORT_EXTENSIONS:
            raise ValidationError('Only JPEG, PNG, WebP images and PDF files are accepted.')
    return value
from niqabaty.models import Nationality, AcademicDegree, Notification

User = get_user_model()

class LoginSerializer(Serializer):
    username = CharField()
    password = CharField(write_only=True)
    fcm_token = CharField(required=False, allow_null=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate
        from django.db.models import Q
        username = attrs.get('username')
        password = attrs.get('password')
        
        if not username or not password:
            raise ValidationError('Provide username and password')
            
        # Try to resolve user by username, email, or phone number
        try:
            user_obj = User.objects.get(
                Q(username__iexact=username) |
                Q(email__iexact=username) |
                Q(phone_number=username)
            )
        except User.DoesNotExist:
            raise ValidationError('Invalid credentials')
        except User.MultipleObjectsReturned:
            # If multiple match, prioritize exact username, then email, then phone number
            user_obj = (
                User.objects.filter(username__iexact=username).first() or
                User.objects.filter(email__iexact=username).first() or
                User.objects.filter(phone_number=username).first()
            )
            if not user_obj:
                raise ValidationError('Invalid credentials')
                
        user = authenticate(username=user_obj.username, password=password)
        
        # If authenticate fails (e.g. user is inactive), check password manually
        if not user:
            if user_obj.check_password(password):
                user = user_obj
            else:
                raise ValidationError('Invalid credentials')

        if not user:
             raise ValidationError('Invalid credentials')

        if user.deletion_requested_at:
            raise ValidationError({
                'deletion_requested': [
                    'This account is scheduled for deletion. Contact the '
                    'syndicate within 30 days to cancel the request.'
                ]
            })

        # Logic for unverified email
        if not user.is_active and not user.email_verified:
            # Allow to proceed so view can handle the 403
            pass
        elif not user.is_active:
            raise ValidationError('User is not active right now')
            
        attrs['user'] = user
        return attrs

class RegisterSerializer(Serializer):
    username = CharField(required=False, allow_blank=True)
    email = EmailField(required=False, allow_blank=True)
    password = CharField(write_only=True)
    full_name = CharField(required=False, allow_blank=True)

    # 4 separate name fields (Arabic)
    first_name = CharField()
    father_name = CharField(required=False, allow_blank=True)
    grandfather_name = CharField(required=False, allow_blank=True)
    family_name = CharField()
    
    # 4 separate name fields (English)
    first_name_en = CharField(required=False, allow_blank=True)
    father_name_en = CharField(required=False, allow_blank=True)
    grandfather_name_en = CharField(required=False, allow_blank=True)
    family_name_en = CharField(required=False, allow_blank=True)

    # Additional registration fields
    user_type = CharField(required=False, allow_blank=True)
    birthdate = DateField(required=False, allow_null=True)
    city = CharField(required=False, allow_blank=True)
    address = CharField(required=False, allow_blank=True)
    nationality = CharField(required=False, allow_blank=True)
    university_name = CharField(required=False, allow_blank=True)
    current_degree = CharField(required=False, allow_blank=True)
    membership_number = CharField(required=False, allow_blank=True)
    branch_id = IntegerField(required=False, allow_null=True)
    phone_number = CharField(required=False, allow_blank=True)
    gender = CharField(required=False, allow_blank=True)
    # passport_image accepted as image (JPEG/PNG/WebP) or PDF
    passport_image = FileField(required=False, allow_null=True, validators=[_validate_passport_file])

    # Uniqueness is enforced among active users only (a soft-deleted account
    # releases its email/phone). User.objects already excludes soft-deleted
    # rows; lookups are case-insensitive to match email normalization.
    def validate_username(self, value):
        if value and User.objects.filter(username__iexact=value).exists():
            raise ValidationError('Username already taken')
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise ValidationError('Email already registered')
        return value

    def validate_phone_number(self, value):
        if value:
            clean_value = value.strip()
            if clean_value and User.objects.filter(phone_number=clean_value).exists():
                raise ValidationError('Phone number already registered')
            return clean_value
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        email = (attrs.get('email') or '').strip()
        phone_number = (attrs.get('phone_number') or '').strip()
        if not email and not phone_number:
            msg = 'Provide an email address or a phone number.'
            raise ValidationError({'email': msg, 'phone_number': msg})
        return attrs

    def create(self, validated_data):
        # Extract and remove fields not required by create_user
        full_name = validated_data.pop('full_name', '')
        first_name = validated_data.pop('first_name', '')
        father_name = validated_data.pop('father_name', '')
        grandfather_name = validated_data.pop('grandfather_name', '')
        family_name = validated_data.pop('family_name', '')
        
        first_name_en = validated_data.pop('first_name_en', '')
        father_name_en = validated_data.pop('father_name_en', '')
        grandfather_name_en = validated_data.pop('grandfather_name_en', '')
        family_name_en = validated_data.pop('family_name_en', '')
        user_type = validated_data.pop('user_type', None)
        birthdate = validated_data.pop('birthdate', None)
        city = validated_data.pop('city', None)
        address = validated_data.pop('address', None)
        nationality = validated_data.pop('nationality', None)
        university_name = validated_data.pop('university_name', None)
        current_degree = validated_data.pop('current_degree', None)
        membership_number = validated_data.pop('membership_number', None)
        branch_id = validated_data.pop('branch_id', None)
        phone_number = validated_data.pop('phone_number', None)
        gender = validated_data.pop('gender', None)

        # Create basic user (username auto-generated by UserManager if omitted)
        user = User.objects.create_user(
            username=validated_data.get('username') or None,
            email=validated_data.get('email'),
            password=validated_data['password']
        )

        # Set additional fields
        changed = []
        
        # New accounts should be inactive until verified/activated
        user.is_active = False
        changed.append('is_active')

        # Handle 4 name fields - combine into full_name if individual
        if first_name or father_name or grandfather_name or family_name:
            user.first_name_field = first_name
            user.father_name = father_name
            user.grandfather_name = grandfather_name
            user.family_name = family_name
            # Handle English names
            user.first_name_en = first_name_en
            user.father_name_en = father_name_en
            user.grandfather_name_en = grandfather_name_en
            user.family_name_en = family_name_en
            
            # Auto-generate full_name from parts
            user.full_name = user.get_full_name_from_parts()
            changed.extend([
                'first_name_field', 'father_name', 'grandfather_name', 'family_name',
                'first_name_en', 'father_name_en', 'grandfather_name_en', 'family_name_en',
                'full_name'
            ])
        elif full_name:
            user.full_name = full_name
            changed.append('full_name')
        
        if user_type:
            user.user_type = user_type
            changed.append('user_type')
            if user_type == 'doctor':
                user.approval_status = 'pending'
                changed.append('approval_status')
        if gender:
            user.gender = gender
            changed.append('gender')
        if birthdate:
            user.birthdate = birthdate
            changed.append('birthdate')
        if city:
            from niqabaty.models import City
            city_str = str(city).strip()
            if city_str.isdigit():
                try:
                    user.city = City.objects.get(pk=int(city_str))
                    changed.append('city')
                except City.DoesNotExist:
                    pass
            else:
                try:
                    user.city = City.objects.get(name__iexact=city_str)
                    changed.append('city')
                except City.DoesNotExist:
                    pass
        if address:
            user.address = address
            changed.append('address')
            
        if nationality:
            nat_str = str(nationality).strip()
            if nat_str.isdigit():
                try:
                    user.nationality = Nationality.objects.get(pk=int(nat_str))
                    changed.append('nationality')
                except Nationality.DoesNotExist:
                    pass
            else:
                try:
                    user.nationality = Nationality.objects.get(name__iexact=nat_str)
                    changed.append('nationality')
                except Nationality.DoesNotExist:
                    pass
        if university_name:
            user.university_name = university_name
            changed.append('university_name')
        if current_degree:
            deg_str = str(current_degree).strip()
            if deg_str.isdigit():
                try:
                    user.current_degree = AcademicDegree.objects.get(pk=int(deg_str))
                    changed.append('current_degree')
                except AcademicDegree.DoesNotExist:
                    pass
            else:
                user.current_degree, _ = AcademicDegree.objects.get_or_create(name=deg_str)
                changed.append('current_degree')
        if membership_number:
            user.membership_number = membership_number
            changed.append('membership_number')
        if phone_number:
            user.phone_number = phone_number
            changed.append('phone_number')

        # Handle uploaded passport image (if provided via request FILES)
        request = self.context.get('request')
        if request is not None:
            passport_file = request.FILES.get('passport_image')
            if passport_file:
                user.passport_image = passport_file
                changed.append('passport_image')

        # Save user with updated fields
        if changed:
            user.save()

        # Associate branch if provided
        if branch_id:
            try:
                Branch = apps.get_model('niqabaty', 'Branch')
                branch = Branch.objects.get(pk=branch_id)
                user.branches.add(branch)
            except Branch.DoesNotExist:
                pass

        # Create welcome notification
        Notification.objects.create(
            user=user,
            title="مرحباً بك في نقابتي",
            message="تم إنشاء حسابك بنجاح. أهلاً بك!",
            notification_type="success",
        )

        return user

class ResetPasswordSerializer(Serializer):
    email = EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise ValidationError('Email not found')
        return value
