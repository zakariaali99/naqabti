from rest_framework import serializers
from niqabaty.models import AcademicDegree


class AcademicDegreeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicDegree
        fields = ['id', 'name', 'allows_multiple_subscriptions', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
