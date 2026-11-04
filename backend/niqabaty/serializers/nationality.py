from rest_framework import serializers
from niqabaty.models import Nationality


class NationalitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Nationality
        fields = ['id', 'name', 'name_ar', 'code', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
