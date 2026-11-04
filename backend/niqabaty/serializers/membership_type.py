from rest_framework import serializers
from niqabaty.models import MembershipType

class MembershipTypeSerializer(serializers.ModelSerializer):
    academic_degree_name = serializers.CharField(
        source='academic_degree.name', read_only=True, default=None
    )

    class Meta:
        model = MembershipType
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by', 'updated_by')