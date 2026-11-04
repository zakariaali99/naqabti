from rest_framework import serializers
from niqabaty.models import User, Certification


ALLOWED_PUBLIC_KEYS = {
    'full_name',
    'profile_image',
    'specialty',
    'bio',
    'phone_number',
    'email',
    'city',
    'current_degree',
    'university_name',
    'branches',
    'institutions',
    'certifications',
    'doctor_number',
}


class PublicCertificationSerializer(serializers.ModelSerializer):
    type_name = serializers.CharField(source='certification_type.name', read_only=True)
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = Certification
        fields = [
            'id',
            'type_name',
            'issue_date',
            'expiry_date',
            'issued_from',
            'document_url',
        ]

    def get_document_url(self, obj):
        if not obj.document:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.document.url)
        return obj.document.url


class PublicDoctorProfileSerializer(serializers.ModelSerializer):
    """
    Strictly sanitized, read-only serializer for public doctor profiles.
    Only returns fields that are enabled by the doctor in `public_profile_fields`.
    """
    branches = serializers.SerializerMethodField()
    institutions = serializers.SerializerMethodField()
    certifications = serializers.SerializerMethodField()
    profile_image_url = serializers.SerializerMethodField()
    city_name = serializers.SerializerMethodField()
    degree_name = serializers.SerializerMethodField()
    full_doctor_number = serializers.SerializerMethodField()
    visible_fields = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'username',
            'full_doctor_number',
            'full_name',
            'profile_image_url',
            'specialty',
            'bio',
            'phone_number',
            'email',
            'city_name',
            'area',
            'current_degree',
            'degree_name',
            'university_name',
            'branches',
            'institutions',
            'certifications',
            'visible_fields',
        ]

    def get_full_doctor_number(self, obj):
        return obj.get_full_doctor_number() or obj.doctor_number or ''

    def get_profile_image_url(self, obj):
        if not obj.profile_image:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.profile_image.url)
        return obj.profile_image.url

    def get_city_name(self, obj):
        return obj.city.name if obj.city else None

    def get_degree_name(self, obj):
        return obj.current_degree.name if obj.current_degree else None

    def get_branches(self, obj):
        return [
            {
                'id': b.id,
                'name': b.name,
                'prefix': b.prefix,
                'city': b.city,
            }
            for b in obj.branches.filter(is_deleted=False, is_active=True)
        ]

    def get_institutions(self, obj):
        request = self.context.get('request')
        result = []
        for inst in obj.institutions.filter(is_deleted=False, is_active=True):
            logo_url = None
            if inst.logo:
                logo_url = request.build_absolute_uri(inst.logo.url) if request else inst.logo.url
            result.append({
                'id': inst.id,
                'name': inst.name,
                'address': inst.address,
                'phone': inst.phone,
                'logo': logo_url,
            })
        return result

    def get_certifications(self, obj):
        certs = Certification.objects.filter(
            doctor=obj,
            is_deleted=False,
        ).select_related('certification_type')
        return PublicCertificationSerializer(
            certs,
            many=True,
            context=self.context,
        ).data

    def get_visible_fields(self, obj):
        return [k for k in obj.get_public_profile_fields_list() if k in ALLOWED_PUBLIC_KEYS]

    def to_representation(self, instance):
        """
        Dynamically filter output fields based on doctor's public_profile_fields.
        Always retains 'username' and 'visible_fields' for client-side structure.
        """
        data = super().to_representation(instance)
        visible = set(instance.get_public_profile_fields_list())

        key_mappings = {
            'full_name': ['full_name'],
            'profile_image': ['profile_image_url'],
            'specialty': ['specialty'],
            'bio': ['bio'],
            'phone_number': ['phone_number'],
            'email': ['email'],
            'city': ['city_name', 'area'],
            'current_degree': ['degree_name', 'current_degree'],
            'university_name': ['university_name'],
            'branches': ['branches', 'full_doctor_number'],
            'institutions': ['institutions'],
            'certifications': ['certifications'],
            'doctor_number': ['full_doctor_number'],
        }

        filtered = {'username': data.get('username'), 'visible_fields': data.get('visible_fields')}
        for key, output_fields in key_mappings.items():
            if key in visible:
                for field in output_fields:
                    if field in data and data[field] is not None:
                        filtered[field] = data[field]

        return filtered
