from rest_framework import serializers
from niqabaty.models import Insurance


class InsuranceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insurance
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
