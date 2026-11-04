from rest_framework import serializers
from niqabaty.models import Certification, CertificationType
from .user import UserSerializer, User
from .certification_type import CertificationTypeSerializer

class CertificationSerializer(serializers.ModelSerializer):
    doctor = UserSerializer(read_only=True)
    doctor_id = serializers.PrimaryKeyRelatedField(source='doctor', queryset=User.objects.all(), write_only=True)
    certification_type = CertificationTypeSerializer(read_only=True)
    certification_type_id = serializers.PrimaryKeyRelatedField(source='certification_type', queryset=CertificationType.objects.all(), write_only=True)

    class Meta:
        model = Certification
        fields = [
            'id', 'doctor', 'doctor_id', 'certification_type', 'certification_type_id',
            'issue_date', 'expiry_date', 'issued_from', 'document', 'created_at', 'updated_at'
        ]
