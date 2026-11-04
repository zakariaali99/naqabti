from rest_framework import serializers
from niqabaty.models import CertificationType

class CertificationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificationType
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
