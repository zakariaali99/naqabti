from rest_framework import serializers
from django.contrib.auth.models import Group
from niqabaty.models import User, Branch, City, Institution
from niqabaty.models.dynamic_field import BranchDynamicField, UserDynamicFieldValue
from niqabaty.serializers.branch import BranchSerializer, BranchMinimalSerializer
from niqabaty.serializers.city import CitySerializer
from niqabaty.serializers.institution import InstitutionSerializer
from niqabaty.serializers.dynamic_field import UserDynamicFieldValueSerializer
from niqabaty.serializers.academic_degree import AcademicDegreeSerializer


class NationalityField(serializers.Field):
    def to_representation(self, value):
        return value.name if value else None

    def to_internal_value(self, data):
        if not data:
            return None
        from niqabaty.models import Nationality
        if isinstance(data, int) or (isinstance(data, str) and data.isdigit()):
            try:
                return Nationality.objects.get(pk=int(data))
            except Nationality.DoesNotExist:
                raise serializers.ValidationError("Nationality does not exist.")
        else:
            nationality_obj, _ = Nationality.objects.get_or_create(name=data)
            return nationality_obj


class AcademicDegreeField(serializers.Field):
    def to_representation(self, value):
        return value.name if value else None

    def to_internal_value(self, data):
        if not data:
            return None
        from niqabaty.models import AcademicDegree
        if isinstance(data, int) or (isinstance(data, str) and data.isdigit()):
            try:
                return AcademicDegree.objects.get(pk=int(data))
            except AcademicDegree.DoesNotExist:
                raise serializers.ValidationError("Academic degree does not exist.")
        else:
            degree_obj, _ = AcademicDegree.objects.get_or_create(name=data)
            return degree_obj


class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'profile_image']


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # Read-only nested branches; write via `branch_ids`
    branches = BranchSerializer(many=True, read_only=True)
    branch_ids = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all(), many=True, write_only=True, required=False)
    managed_branches = BranchMinimalSerializer(many=True, read_only=True)
    # Read-only nested dynamic field values; write via `dynamic_field_value_inputs`
    dynamic_field_values = UserDynamicFieldValueSerializer(many=True, read_only=True)
    dynamic_field_value_inputs = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False,
    )
    # Read-only nested institutions; write via `institution_ids`
    institutions = InstitutionSerializer(many=True, read_only=True)
    institution_ids = serializers.PrimaryKeyRelatedField(
        queryset=Institution.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )
    # Permission fields
    group_permissions = serializers.SerializerMethodField()
    group_names = serializers.SerializerMethodField()
    groups = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), many=True, required=False)
    managed_branch_ids = serializers.PrimaryKeyRelatedField(
        source='managed_branches',
        queryset=Branch.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )
    # Doctor number fields
    full_doctor_number = serializers.SerializerMethodField()
    # Full name from parts (read-only, auto-generated)
    full_name_from_parts = serializers.SerializerMethodField()
    # City detail for reading
    city_detail = CitySerializer(source='city', read_only=True)
    nationality = NationalityField(required=False, allow_null=True)
    current_degree = AcademicDegreeField(required=False, allow_null=True)
    current_degree_detail = AcademicDegreeSerializer(source='current_degree', read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "email_verified",
            "approval_status",
            "full_name",
            # Arabic name fields
            "first_name_field",
            "father_name",
            "grandfather_name",
            "family_name",
            "full_name_from_parts",
            # English name fields
            "first_name_en",
            "father_name_en",
            "grandfather_name_en",
            "family_name_en",
            "phone_number",
            "profile_image",
            "birthdate",
            "is_active",
            "is_staff",
            "language",
            "user_type",
            "specialty",
            "bio",
            "doctor_number",
            "full_doctor_number",
            "university_name",
            "current_degree",
            "current_degree_detail",
            "graduation_year",
            "membership_number",
            "date_joined",
            "last_login",
            "password",
            "confirm_password",
            "branches",
            "branch_ids",
            "dynamic_field_values",
            "dynamic_field_value_inputs",
            "institutions",
            "institution_ids",
            "managed_branch_ids",
            "managed_branches",
            "city",
            "city_detail",
            "address",
            "nationality",
            "passport_image",
            "groups",
            "group_names",
            "group_permissions",
            "gender",
            "public_profile_fields",
        ]
        read_only_fields = ['email_verified', 'approval_status', 'id', 'date_joined', 'last_login', 'group_permissions', 'group_names', 'full_doctor_number', 'full_name_from_parts', 'city_detail']

    def validate_email(self, value):
        if value:
            query = User.objects.filter(email=value)
            if self.instance:
                query = query.exclude(id=self.instance.id)
            if query.exists():
                raise serializers.ValidationError("Email already registered.")
        return value

    def validate_managed_branch_ids(self, value):
        if value and len(value) > 1:
            raise serializers.ValidationError("A user can manage at most one branch.")
        return value

    def validate_phone_number(self, value):
        if value:
            clean_value = value.strip()
            if clean_value:
                query = User.objects.filter(phone_number=clean_value)
                if self.instance:
                    query = query.exclude(id=self.instance.id)
                if query.exists():
                    raise serializers.ValidationError("Phone number already registered.")
                return clean_value
        return value

    def validate(self, attrs):
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')

        # If password is provided, validate it
        if password:
            if not confirm_password:
                raise serializers.ValidationError({"confirm_password": "Confirm password is required when changing password."})
            if password != confirm_password:
                raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        # Doctor number uniqueness validation
        if attrs.get('user_type') == 'doctor' and attrs.get('doctor_number'):
            branch_ids = attrs.get('branch_ids', [])
            doctor_number = attrs.get('doctor_number')
            
            # Check if any other doctor in the selected branches has this number
            for branch in branch_ids:
                query = User.objects.filter(
                    user_type='doctor',
                    doctor_number=doctor_number,
                    branches=branch
                )
                # Exclude current instance when updating
                if self.instance:
                    query = query.exclude(id=self.instance.id)
                
                if query.exists():
                    raise serializers.ValidationError({
                        "doctor_number": f"This doctor number already exists in the selected branch."
                    })

        self._validate_branch_and_dynamic_fields(attrs)

        return attrs

    def _validate_branch_and_dynamic_fields(self, attrs):
        """Every user must belong to at least one branch, and any dynamic
        field a selected branch marks required must have a value.

        Only enforced when this request actually touches `branch_ids` (or is
        a brand new user) so unrelated partial updates on legacy no-branch
        accounts aren't newly blocked until they touch branches themselves.
        """
        branch_ids_touched = 'branch_ids' in attrs
        if branch_ids_touched:
            if not attrs['branch_ids']:
                raise serializers.ValidationError({'branch_ids': 'At least one branch is required.'})
            effective_branch_ids = [b.id for b in attrs['branch_ids']]
        elif self.instance is None:
            raise serializers.ValidationError({'branch_ids': 'At least one branch is required.'})
        else:
            effective_branch_ids = list(self.instance.branches.values_list('id', flat=True))

        dynamic_inputs = attrs.get('dynamic_field_value_inputs')
        errors = {}
        submitted_ids = set()

        if dynamic_inputs is not None:
            for item in dynamic_inputs:
                field_id = item.get('field_id')
                if field_id is None:
                    continue
                try:
                    field_id = int(field_id)
                except (TypeError, ValueError):
                    continue
                try:
                    field = BranchDynamicField.objects.get(pk=field_id)
                except BranchDynamicField.DoesNotExist:
                    continue

                if field.branch_id not in effective_branch_ids:
                    errors[f'dynamic_field_{field_id}'] = 'This field does not belong to your selected branch.'
                    continue

                if field.field_type == 'boolean':
                    has_value = item.get('value_boolean') is not None
                else:
                    value = item.get('value_text')
                    has_value = bool(value)
                    if has_value and field.field_type == 'select':
                        valid_values = {opt.get('value') for opt in (field.options or [])}
                        if value not in valid_values:
                            errors[f'dynamic_field_{field_id}'] = 'Not a valid option for this field.'
                            continue

                if has_value:
                    submitted_ids.add(field_id)

        should_check_required = branch_ids_touched or dynamic_inputs is not None or self.instance is None

        if should_check_required and effective_branch_ids:
            required_fields = list(BranchDynamicField.objects.filter(
                branch_id__in=effective_branch_ids, is_required=True, is_active=True,
            ))
            if required_fields:
                if self.instance is not None:
                    existing = self.instance.dynamic_field_values.filter(
                        field_id__in=[f.id for f in required_fields],
                    )
                    for v in existing:
                        if v.value_text or v.value_boolean is not None or v.value_file:
                            submitted_ids.add(v.field_id)
                for field in required_fields:
                    if field.id not in submitted_ids:
                        errors.setdefault(
                            f'dynamic_field_{field.id}',
                            f"{field.label_en or field.label_ar} is required.",
                        )

        if errors:
            raise serializers.ValidationError(errors)
    
    def get_group_permissions(self, obj):
        """Return list of permission codenames from user's groups"""
        permissions = set()
        for group in obj.groups.all():
            for perm in group.permissions.all():
                # Format: app_label.codename (e.g., "niqabaty.view_user")
                permissions.add(f"{perm.content_type.app_label}.{perm.codename}")
        return list(permissions)
    
    def get_group_names(self, obj):
        """Return list of group names"""
        return list(obj.groups.values_list('name', flat=True))
    
    def get_full_doctor_number(self, obj):
        """Return formatted doctor number with branch prefix"""
        return obj.get_full_doctor_number()

    def get_full_name_from_parts(self, obj):
        """Return combined full name from 4 name fields"""
        return obj.get_full_name_from_parts()

    def _update_managed_branches(self, user, managed_branch_ids):
        """Update Branch.manager for managed branches."""
        if managed_branch_ids is None:
            return
        # Unset manager on previously managed branches
        Branch.objects.filter(manager=user).update(manager=None)
        # Set manager on selected branches
        if managed_branch_ids:
            Branch.objects.filter(id__in=[b.id for b in managed_branch_ids]).update(manager=user)

    def create(self, validated_data):
        # Handle branch assignment
        branch_values = validated_data.pop('branch_ids', None)
        institution_values = validated_data.pop('institution_ids', None)
        group_values = validated_data.pop('groups', None)
        managed_branch_values = validated_data.pop('managed_branches', None)
        dynamic_field_value_inputs = validated_data.pop('dynamic_field_value_inputs', None)
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password', None)

        user = User.objects.create(**validated_data)

        if user.user_type == 'doctor':
            user.approval_status = 'pending'
            user.save(update_fields=['approval_status'])

        if password:
            user.set_password(password)
            user.save()
        
        if branch_values is not None:
            user.branches.set(branch_values)
        
        if institution_values is not None:
            user.institutions.set(institution_values)
        
        if group_values is not None:
            user.groups.set(group_values)
        else:
            group_name_map = {
                'doctor': 'Doctor',
                'student': 'Student',
                'manager': 'Manager',
                'viewer': 'Viewer',
                'advertiser': 'Advertiser',
            }
            g_name = group_name_map.get(user.user_type)
            if g_name:
                g, _ = Group.objects.get_or_create(name=g_name)
                user.groups.add(g)
        
        self._update_managed_branches(user, managed_branch_values)
        self._sync_dynamic_field_values(user, dynamic_field_value_inputs)

        return user

    def update(self, instance, validated_data):
        # Handle branch assignment (if provided)
        branch_values = validated_data.pop('branch_ids', None)
        institution_values = validated_data.pop('institution_ids', None)
        group_values = validated_data.pop('groups', None)
        managed_branch_values = validated_data.pop('managed_branches', None)
        dynamic_field_value_inputs = validated_data.pop('dynamic_field_value_inputs', None)
        validated_data.pop('confirm_password', None)
        password = validated_data.pop('password', None)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Update password if provided
        if password:
            instance.set_password(password)

        instance.save()

        if branch_values is not None:
            instance.branches.set(branch_values)
        
        if institution_values is not None:
            instance.institutions.set(institution_values)
        
        if group_values is not None:
            instance.groups.set(group_values)
        else:
            group_name_map = {
                'doctor': 'Doctor',
                'student': 'Student',
                'manager': 'Manager',
                'viewer': 'Viewer',
                'advertiser': 'Advertiser',
            }
            g_name = group_name_map.get(instance.user_type)
            if g_name:
                other_groups = list(group_name_map.values())
                instance.groups.remove(*Group.objects.filter(name__in=other_groups))
                g, _ = Group.objects.get_or_create(name=g_name)
                instance.groups.add(g)

        self._update_managed_branches(instance, managed_branch_values)
        self._sync_dynamic_field_values(instance, dynamic_field_value_inputs)

        return instance

    def _sync_dynamic_field_values(self, user, dynamic_field_value_inputs):
        """Upsert UserDynamicFieldValue rows from validated `dynamic_field_value_inputs`.

        File values are excluded here — those are set via the dedicated
        upload endpoint, mirroring how profile_image/passport_image work.
        """
        if dynamic_field_value_inputs is None:
            return

        for item in dynamic_field_value_inputs:
            field_id = item.get('field_id')
            if field_id is None:
                continue
            try:
                field = BranchDynamicField.objects.get(pk=int(field_id))
            except (BranchDynamicField.DoesNotExist, TypeError, ValueError):
                continue

            if field.field_type == 'boolean':
                defaults = {'value_boolean': item.get('value_boolean'), 'value_text': None}
            else:
                defaults = {'value_text': item.get('value_text'), 'value_boolean': None}

            UserDynamicFieldValue.objects.update_or_create(
                user=user, field=field, defaults=defaults,
            )
