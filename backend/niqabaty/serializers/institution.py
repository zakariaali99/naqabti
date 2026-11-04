from rest_framework import serializers
from niqabaty.models import Institution


class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = [
            'id', 'name', 'account', 'address', 'phone', 'email',
            'latitude', 'longitude', 'logo', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
